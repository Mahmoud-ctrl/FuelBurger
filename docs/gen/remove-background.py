"""Batch background removal for the Build-section frames.

    python -m venv --system-site-packages .venv
    .venv/Scripts/python -m pip install rembg onnxruntime scipy
    .venv/Scripts/python docs/gen/remove-background.py

Reads src_png/NN.png (cropped source frames), writes keyed/NN.png (RGBA).
First run downloads the isnet-general-use model (~180MB) to ~/.u2net.

rembg alone is not enough here, for two reasons this script fixes:

  1. It keeps the cast shadow at partial alpha, which bridges the gap between
     the two burger halves with a grey smear - invisible on the original red
     backdrop, obvious on anything else.
  2. Its edge pixels still carry that red backdrop, so they fringe against any
     other background.

Both are fixed by fitting a model of the backdrop itself (a quadratic, because
the backdrop is vignetted) and using it to (a) score how backdrop-like each
pixel is and (b) un-mix the backdrop out of partial-alpha pixels.

The gate has two guards, and both are load-bearing - the charred patty crust is
colorimetrically INSIDE the backdrop, so an ungated version punches holes clean
through the patty:
  - it only acts where rembg is UNSURE (cast shadow ~0.67; shadowed lettuce
    ~0.96; char ~0.996), and
  - anything it removes that is enclosed by silhouette is refilled, since a
    real shadow always joins the background outside the burger.
"""
import numpy as np, glob, os
from PIL import Image
from scipy import ndimage
from rembg import new_session, remove

GATE_LO, GATE_HI = 18.0, 40.0   # residual-from-backdrop -> shadow gate

def fit_plate(im, bgmask):
    """Quadratic per-channel fit of the (vignetted) backdrop."""
    h,w,_ = im.shape
    yy,xx = np.mgrid[0:h,0:w].astype(np.float64)
    X=(xx/w-.5); Y=(yy/h-.5)
    T=[np.ones_like(X),X,Y,X*X,X*Y,Y*Y]
    A=np.stack([t[bgmask] for t in T],1); Af=np.stack([t.ravel() for t in T],1)
    P=np.zeros_like(im)
    for c in range(3):
        coef,*_=np.linalg.lstsq(A,im[...,c][bgmask],rcond=None)
        P[...,c]=(Af@coef).reshape(h,w)
    return P

def smoothstep(x,lo,hi):
    t=np.clip((x-lo)/(hi-lo),0,1)
    return t*t*(3-2*t)

sess=new_session("isnet-general-use")
os.makedirs("keyed",exist_ok=True)
files=sorted(glob.glob("src_png/*.png"))
report=[]
for f in files:
    name=os.path.basename(f)[:2]
    src=Image.open(f).convert("RGB")
    I=np.asarray(src).astype(np.float64)
    a=np.asarray(remove(src,session=sess).convert("RGBA")).astype(np.float64)[...,3]/255.

    bgm=a<0.02
    if bgm.sum()<5000:            # degenerate frame; skip refinement
        P=np.full_like(I,[89.,5.,9.])
    else:
        P=fit_plate(I,bgm)

    # --- shadow gate: how unlike a (scaled) backdrop is this pixel? ---
    den=(P*P).sum(2)+1e-6
    k=(I*P).sum(2)/den
    resid=np.linalg.norm(I-np.clip(k,0,None)[...,None]*P,axis=2)
    gate=smoothstep(resid,GATE_LO,GATE_HI)

    # Only let the gate act where rembg is UNSURE. Deeply shadowed lettuce and
    # the char crust are both backdrop-coloured, but rembg calls them
    # foreground with high confidence (0.96/0.996) while it is genuinely
    # uncertain about cast shadow (0.67). Confident foreground is left alone.
    conf=smoothstep(a,0.75,0.93)
    a2=a*(conf+gate*(1-conf))

    # The char crust is colorimetrically INSIDE the backdrop, so the gate above
    # punches holes straight through the patty. A shadow, though, always joins
    # the background outside the burger; an interior hole does not. So refill
    # anything the gate removed that is enclosed by silhouette, and keep only
    # the removals that reach the outside.
    solid=a2>0.5
    filled=ndimage.binary_fill_holes(solid)
    holes=filled&~solid
    a2=np.where(holes,a,a2)

    # --- despill: undo the backdrop bleeding into partial-alpha pixels ---
    safe=np.clip(a2,0.12,1.0)[...,None]
    F=(I-(1-np.clip(a2,0,1)[...,None])*P)/safe
    F=np.where(a2[...,None]>0.985, I, F)       # fully opaque -> untouched
    F=np.clip(F,0,255)

    out=np.dstack([F,np.clip(a2,0,1)*255]).astype(np.uint8)
    out[...,:3][a2<0.004]=0
    Image.fromarray(out,"RGBA").save(f"keyed/{name}.png")
    report.append((name,(a>0.02).mean(),(a2>0.02).mean(),((a2>0.05)&(a2<0.95)).mean()))

print(f"{'f':>3} {'cover_raw':>9} {'cover_gated':>11} {'edgeband':>9}")
for n,c1,c2,eb in report:
    print(f"{n:>3} {c1*100:8.2f}% {c2*100:10.2f}% {eb*100:8.2f}%")
print("shadow removed on average: %.2f pp of frame"%(100*np.mean([c1-c2 for _,c1,c2,_ in report])))
