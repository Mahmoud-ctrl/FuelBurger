# FuelBurger

Landing page for FUEL, a burger joint. Next.js 16 + GSAP.

```bash
npm install
npm run dev     # http://localhost:3000
```

## The hero

An intro sequence hands over to a lineup of three burgers that fly in. Then the
hero **pins**: as you scroll, the centre burger comes forward to fill the screen
and its layers separate under your finger.

The separation is a 40-frame image sequence drawn to a `<canvas>` and scrubbed by
a pinned `ScrollTrigger` — a `<video>` scrubbed via `currentTime` is unreliable
on iOS Safari.

Two details that are easy to undo by accident, both commented in the code:

- **The frames are spaced by motion, not by time.** The source video eases in and
  out; sampling it evenly would spend a quarter of the budget on a dead zone
  where nothing moves. Re-sampling uniformly reintroduces that.
- **The hero's centre burger and frame 0 are the same render** (alpha IoU 0.977),
  so the canvas just starts painting over what is already on screen — there is no
  crossfade. `POSTER_W` / `POSTER_TOP` are the measured alignment, not free
  parameters.

## Where things live

| | |
|---|---|
| `components/hero.tsx` | the lineup, the pinned scroll timeline, all the tuning knobs |
| `components/burger-frames.ts` | frame constants + canvas plumbing |
| `components/intro-sequence.tsx` | the opening overlay |
| `public/build/` | the 40 scrubbed frames (RGBA WebP, ~2.5 MB) |
| `docs/gen/` | how those frames were made, and the scripts to remake them |

## Regenerating the frames

`docs/gen/build-section-video-prompt.md` is the source of truth: the prompt the
video was generated from, what the delivered take actually did versus what was
asked for, and every decision made from it.

The source video had two problems that the scripts in `docs/gen/` fix — a baked
red backdrop (`remove-background.py`) and a bun crown clipped at the top of every
frame (`restore-crown.py`). `selected-frames.json` holds the 40 chosen source
indices; without it the motion-uniform spacing cannot be reproduced.
