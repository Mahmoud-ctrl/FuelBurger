# The Build — scroll-scrubbed exploded burger

Source of truth for generating the video behind the "signature burger" section.
Conditioning frame: `docs/gen/first-frame-9x16.png` (1080×1920, burger low, headroom above).

## Why the prompt reads the way it does

This video is never *played*. Scroll position maps to frame index, so the viewer
**holds on a single frame** for as long as they stop scrolling. That inverts the
usual priorities:

- Camera drift that is invisible at 24fps becomes a wobble when scrubbed.
- Temporal flicker (crawling sesame seeds, cheese that re-melts, a patty that
  grows a second crust) becomes the *only* thing they see on a held frame.
- Labels ("Aged cheddar", "80/20 smash") get hand-placed per progress range by
  eyeballing frames. Lateral drift or rotation in a layer makes its label
  impossible to anchor.

So: **locked camera, straight-up separation, temporally stable textures.**
Appetizing adjectives are worth far less than those three.

---

## Primary — image-to-video

Upload `docs/gen/first-frame-9x16.png` as the first frame / conditioning image.

```
A locked-off, perfectly static product shot of the burger from the input image.
The camera never moves — no push in, no pull out, no pan, no tilt, no handheld
drift, no parallax, no depth-of-field change. Tripod-locked, fixed focal length.

Over the full duration the burger performs a slow, clean exploded-view
separation: each layer lifts straight up the vertical axis in smooth, even,
continuous motion, opening generous equal gaps between them. Bottom to top the
layers are: golden brioche bun heel, creamy herb-flecked sauce, thick seared
beef patty with dark charred crust, draped melted white cheese, green frilly
lettuce and arugula, thin purple red-onion rings, glossy sesame-seed brioche
bun crown.

The bun heel stays fixed at the bottom. Every layer above it rises vertically by
a progressively larger amount, so the stack fans open upward like a ladder and
the bun crown travels furthest. Layers stay perfectly horizontal, perfectly
level, and perfectly centered on the same vertical axis — no rotation, no
tilting, no spinning, no lateral sliding, no swaying, no wobble. Each layer
holds its exact shape and identity throughout; nothing morphs, melts further,
deforms, merges, splits, or changes.

Motion is one single continuous direction the whole time — always separating,
never pausing mid-way, never reversing, never bouncing, never settling back
down. For the final half second the fully separated layers come to a complete
stop and hold, frozen and motionless.

Lighting is constant and identical in every frame: a single soft key light from
the upper left, warm, with soft shadows cast down onto the layer below. No
lighting changes, no flicker, no shimmer, no exposure shift, no color shift.
Textures are completely stable and fixed — the sesame seeds stay in exactly the
same positions on the bun, the char marks on the patty never move or change,
the lettuce leaves keep the same shape.

Background is a flat, solid, uniform dark maroon (#3a0d12), completely empty and
unchanging. Studio food photography, sharp focus throughout, photorealistic.
```

### Negative prompt

```
camera movement, camera pan, camera zoom, camera tilt, dolly, push in, pull out,
handheld, shaky, parallax, rack focus, depth of field change, rotation, spinning,
tumbling, layers tilting, layers swaying, lateral drift, wobble, bouncing,
reversing, re-assembling, layers coming back together, morphing, melting,
deforming, warping, dissolving, layers merging, duplicate layers, extra patty,
extra bun, flicker, shimmer, strobing, texture crawl, moving sesame seeds,
lighting change, exposure shift, color shift, hands, fingers, people, cutlery,
plate, table, text, logo, watermark, captions, steam, smoke, falling crumbs,
dripping sauce, particles, background objects, gradient background, vignette,
blurry, low quality
```

### Settings

| Setting | Value | Why |
|---|---|---|
| Mode | image-to-video (first-frame) | guarantees it is *our* burger, continuous with the hero |
| Aspect | 9:16 portrait | site is mobile-first (`max-w-[520px]`); exploded stack is tall |
| Resolution | highest available (>= 1080x1920) | frames get downscaled, never upscaled |
| Duration | 4-5s | at 24-30fps -> 96-150 frames, ideal scrub density |
| FPS | 24 or 30, fixed | avoid interpolated / variable framerate |
| Camera preset | **none / static** | if the tool has a camera-motion control, set it to zero |
| Motion strength | low-medium | high strength is what causes morphing |
| Seed | **record it** | you will want to re-roll variations of a take that nearly worked |

### Direction: generate the explode, play it forward

Do **not** generate the assembly and reverse it. Played forward, the section
opens on the pristine conditioned first frame — continuous with the assembled
burger the hero just handed off — and separates as you scroll. Reversed, the
section would open on the model's most-degraded frames, at the exact moment the
user arrives.

---

## Fallback — text-to-video (no first-frame conditioning)

Prepend this, then use the same body, negative prompt and settings:

```
A gourmet cheeseburger centered on a flat solid dark maroon background: a glossy
golden sesame-seed brioche bun crown, thin purple red-onion rings, green frilly
lettuce and arugula, draped melted white cheese, a thick seared beef patty with
a dark charred crust, creamy herb-flecked sauce, and a golden brioche bun heel.
Shot straight on at eye level, ...
```

Expect a burger that does not match `signature.webp`. Only use this if
image-to-video is unavailable.

---

## Plan B — 7 stills + GSAP (run this in parallel)

Image models are far more reliable than video models at holding a subject still.
If takes keep flickering or morphing, generate **seven separate stills** on a
transparent background, same lighting, same camera:

1. bun crown (sesame, glossy) · 2. red onion rings · 3. lettuce + arugula
4. melted cheese · 5. beef patty · 6. sauce layer · 7. bun heel

Then animate the separation in GSAP with a `ScrollTrigger` scrub.

| | Video frames | 7 stills + GSAP |
|---|---|---|
| Flicker | the main risk | impossible |
| Label anchoring | eyeball per frame range | exact — labels ride the layer |
| Re-tuning spacing | regenerate the video | change a number |
| Regenerating | invalidates every label coord | swap one PNG |
| Payload | ~120 frames | 7 images |
| Look | photoreal motion blur, real drape | slightly "cut-out" |

This is the safer build, and the one that keeps the section editable. The video
is the better *look* if a take lands clean.

---

## Background decision (make it before generating)

Baking onto flat `#3a0d12` means the video composites into the section with no
keying — but anything you add can then only sit *on top* of the burger. The hero
puts two radial gradients **behind** its lineup (`components/hero.tsx`, the warm
pool of light); a flat-baked video cannot have that.

- **Flat backdrop in this section** — simplest, looks deliberate. Default.
- **Recover alpha** — batch `rembg` over the extracted frames (~120, scriptable)
  to get transparency back and keep full compositing freedom. Do this if you
  want the hero's warm glow to continue into the Build section.

## Pipeline once a take lands

```bash
# Extract to a numbered sequence. Do NOT scrub a <video> via currentTime —
# it is unreliable on iOS Safari; draw frames to a canvas instead.
ffmpeg -i build.mp4 -vf "scale=1080:-1" -q:v 82 frames/%03d.webp
```

Then preload, draw to `<canvas>`, and drive `frameIndex` from a pinned
`ScrollTrigger` with `scrub`. Respect `prefers-reduced-motion` the way
`hero.tsx` already does — jump straight to the final separated frame.

---

## What actually shipped

The delivered take (`Cheeseburger_layers_separating_…_20260917142413.mp4`,
1280×720, 24fps, 240 frames) did **not** follow the brief, so the pipeline above
was adapted rather than followed literally. What it gave us:

| Asked for | Got |
|---|---|
| 1080×1920 portrait | 1280×720 landscape |
| 7-layer ladder | two groups: crown+lettuce+tomato lifts off cheese+patty+heel |
| separation only | separates to a peak, then **re-assembles** |
| locked camera | slow pull-back (~7% over the arc) |
| headroom above the burger | burger bleeds off the top *and* bottom of every frame |

Frame 0 **does** match `public/burgers/signature.webp`, so the hero→Build
handoff is genuine continuity, not a morph.

**Decisions made from that:**

1. **Range `f0`–`f80` only** (t 0–3.33s). Separation rises monotonically to a
   peak at f80, dips ~58px around f88–f104 as a second patty emerges, recovers
   to a higher peak at f160, then re-assembles to the end. f80 is within ~6% of
   f160's total separation, is the cleaner read, and is fully monotonic.
2. **40 frames spaced by motion, not by time.** Motion is very unevenly
   distributed — f0–f12 barely moves. Sampling uniformly in time would spend a
   quarter of the budget on a dead zone and make the first ~15% of the scrub
   feel broken. Frames were picked at equal increments of cumulative
   frame-to-frame difference, so index maps linearly to scroll and the burger
   tracks the finger at a constant rate. **Do not resample these uniformly.**
3. **Backdrop removed** (`docs/gen/remove-background.py`). Originally baked;
   now keyed out so the hero's warm pool of light carries through behind the
   burger and the section can bridge hero-maroon to menu-char. The burger still
   bleeds off the top and bottom of every frame, so the canvas is masked at
   those two edges rather than feathered into a solid colour.

   `rembg` alone was not sufficient. Two defects needed the backdrop modelled
   explicitly (quadratic fit — it is vignetted):

   - **Shadow bridge.** The cast shadow is kept at ~0.67 alpha, smearing across
     the gap between the two halves. Invisible on the original red, obvious on
     anything else.
   - **Red fringe.** Edge pixels still carried the backdrop; edge-band mean went
     from `[90,32,14]` (backdrop red) to `[132,89,21]` (burger) after un-mixing.

   The shadow gate needs **both** its guards. The charred patty crust sits at
   distance ~15 from the backdrop while backdrop noise reaches ~50 — it is
   colorimetrically *inside* the backdrop, so an ungated pass punches holes
   straight through the patty. The gate therefore only acts where rembg is
   unsure (shadow ~0.67 vs shadowed lettuce ~0.96, char ~0.996), and anything it
   removes that is enclosed by silhouette is refilled.

```bash
# crop side margins (burger spans x 229–1046), keep full height
ffmpeg -y -i <src>.mp4 -vf "crop=876:720:202:0,scale=768:-2" \
  -c:v libwebp -quality 68 -compression_level 6 out/%02d.webp
```

Then keyed, and re-encoded as RGBA at `quality=64, alpha_quality=70` (alpha at
100 costs 27% more for a max error of 12/255 — invisible).

Result: 40 × 768×632 RGBA WebP, **2.25 MB** total → `public/build/`.
(The opaque, backdrop-baked version was 1.81 MB; alpha costs ~0.44 MB.)
Driven by `components/burger-frames.ts` (frame data + canvas plumbing), which
must `clearRect` between frames now that they are transparent.

## This runs in the hero — there is no separate section

The scrub is not its own section. The hero **pins**, and the centre burger of
the lineup comes forward and comes apart in place (`components/hero.tsx`).

`public/burgers/signature.webp` and frame 0 are the **same render**: scaled to
717/769 and offset -53px they agree to an alpha IoU of **0.977** at real display
size. So the hero's centre burger *is* frame 0, and there is **no crossfade** —
the canvas simply starts painting what is already on screen.

For that to hold, the centre burger carries the frame's geometry from the start:
its box is the frame's aspect ratio with `signature.webp` positioned inside it
(`POSTER_W` / `POSTER_TOP` in `components/burger-frames.ts`), and it sits at
`top-[12.11%]` instead of `top-[6%]` so the burger itself lands exactly where
the old square photo did. The frame crop is nearly invisible at lineup size — it
mostly removes signature.webp's empty margin.

Load-bearing details:

- The photo's drop shadow **fades out during the forward move**. The keyed
  frames carry no shadow, so if it were still there at handover it would pop.
- The shadow lives on the photo, not on a wrapper, so the canvas never pays for
  a filter pass on every scrubbed frame.
- The photo stays on top until the canvas can actually paint (the draw call
  reports whether the frame had decoded), so a slow connection degrades to a
  burger that comes forward and does not separate — never to a blank box.
- The hero is `100vh`, not `100dvh`: it is pinned now, and `dvh` is remeasured
  when the iOS URL bar collapses, which moves the pin mid-scroll.
- `prefers-reduced-motion` skips the pin entirely, so those users get the static
  lineup and never download the 2.25MB of frames.
