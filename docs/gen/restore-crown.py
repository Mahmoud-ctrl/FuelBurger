"""Put the bun crown back on.

The source video has no headroom: the burger touches row 0 of every frame, so
the dome is clipped — by up to 163px once the layers separate. Nothing in CSS
can uncover it.

Pasting just the missing cap from signature.webp leaves a visible seam (the
video drifts texturally, so the sesame seeds do not line up). Replacing the
WHOLE crown instead moves the boundary to the bun's own silhouette against
empty space, where nothing has to match.

Reads keyed/NN.png, writes restored/NN.png, and prints the layout constants.
"""
import numpy as np, glob, os
from PIL import Image

PUB = r"C:\Users\mahmo\OneDrive\Desktop\FuelBurger\fuelburger\public\burgers"
CROWN_BOTTOM = 300          # signature.webp row where the bun ends / lettuce starts
MARGIN = 14                 # headroom above the dome at its highest

sigI = Image.open(f"{PUB}/signature.webp").convert("RGBA")
sa0 = np.asarray(sigI); sm0 = sa0[..., 3] > 128
SXS = np.where(sm0.max(0))[0]; SYS = np.where(sm0.max(1))[0]
SW = SXS.max() - SXS.min(); STOP = SYS.min()
files = sorted(glob.glob("keyed/*.png"))

def solve(i):
    """Per-frame scale + where signature's crown has to sit."""
    fr = np.asarray(Image.open(files[i]).convert("RGBA")).astype(float)
    a = fr[..., 3] > 128
    xs = np.where(a.max(0))[0]
    sc = (xs.max() - xs.min()) / SW           # camera pulls back ~7% over the arc
    w0 = a[0].sum()                           # burger width at the clipped top row
    prof = sm0.sum(1) * sc
    r = STOP
    while r < SYS.max() and prof[r] < w0:     # which dome row is this wide?
        r += 1
    nw = int(round(sigI.width * sc))
    ss = np.asarray(sigI.resize((nw, nw), Image.LANCZOS)).astype(float)
    sxs2 = np.where((ss[..., 3] > 128).max(0))[0]
    dx = int(round((xs.min() + xs.max()) / 2 - (sxs2.min() + sxs2.max()) / 2))
    return fr, ss, sc, r, dx

# PAD must clear the dome on the worst frame
solved = [solve(i) for i in range(len(files))]
PAD = int(np.ceil(max((r - STOP) * sc for _, _, sc, r, _ in solved))) + MARGIN

os.makedirs("restored", exist_ok=True)
for i, (fr, ss, sc, r, dx) in enumerate(solved):
    H, W, _ = fr.shape
    dy = int(round(PAD - r * sc))             # ss row n lands at padded row n+dy
    out = np.zeros((H + PAD, W, 4)); out[PAD:] = fr
    cut = int(round(dy + CROWN_BOTTOM * sc))
    out[:max(0, cut)] = 0                     # drop the video's clipped crown
    top = int(round(dy + STOP * sc))
    ys0, ys1 = max(0, top), min(H + PAD, cut)
    xs0, xs1 = max(0, dx), min(W, dx + ss.shape[1])
    if ys1 > ys0 and xs1 > xs0:
        crown = ss[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
        al = crown[..., 3:4] / 255.
        sub = out[ys0:ys1, xs0:xs1]
        sub[..., :3] = crown[..., :3] * al + sub[..., :3] * (1 - al)
        sub[..., 3] = np.maximum(sub[..., 3], crown[..., 3])
    Image.fromarray(out.astype(np.uint8), "RGBA").save(f"restored/{i:02d}.png")

H0, W0, _ = solved[0][0].shape
NH = H0 + PAD
_, _, sc0, r0, dx0 = solved[0]
dy0 = PAD - r0 * sc0
print(f"PAD={PAD}  frame {W0}x{NH}  (was {W0}x{H0})")
print(f"POSTER_W   = {820*sc0/W0*100:.3f}   # % of frame width")
print(f"POSTER_TOP = {dy0/NH*100:.3f}   # % of frame height")
print(f"FRAME aspect {W0}/{NH}")
