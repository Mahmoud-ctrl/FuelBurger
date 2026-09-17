/**
 * The scroll-scrubbed exploded burger — frame data and canvas plumbing.
 *
 * Frames were cut from a generated video and had their backdrop keyed out; see
 * docs/gen/build-section-video-prompt.md for the whole pipeline and why the
 * source take only yields a usable arc between frames 0 and 80.
 *
 * They are drawn to a <canvas>; a <video> scrubbed via currentTime is
 * unreliable on iOS Safari.
 *
 * The 40 frames are NOT evenly spaced in time — they are spaced by how much the
 * image actually changes, which strips out the source's own ease-in/ease-out so
 * the burger tracks the scroll at a constant rate. Frame index maps linearly to
 * scroll progress; re-sampling these uniformly would reintroduce a dead zone at
 * the start where nothing moves for the first ~15% of the scrub.
 */
export const FRAME_COUNT = 40;
export const FRAME_W = 768;
export const FRAME_H = 788;

/**
 * Where public/burgers/signature.webp sits inside the frame box.
 *
 * The hero's centre burger and frame 0 are the *same render*, so the canvas can
 * simply start painting over what is already on screen with no crossfade.
 *
 * POSTER_TOP is positive because the frames now carry 178px of headroom above
 * the burger: the source video clipped the bun crown at row 0 of every frame
 * (up to 163px of dome gone once the layers separate), so the crown is
 * reconstructed from signature.webp — see docs/gen/restore-crown.py.
 *
 * Percentages are of the frame box, which is why the stage element carries the
 * frame's aspect ratio and the image is positioned inside it. Recompute both if
 * the crop or signature.webp ever changes.
 */
export const POSTER_W = 99.709;
export const POSTER_TOP = 12.112;

/**
 * A small fade on the bottom edge only, where the base of the bun heel is
 * clipped by the frame.
 *
 * There is deliberately NO top fade. The crown is whole now and the frames have
 * headroom above it, so there is nothing up there to soften — and a fade band
 * at the top is exactly what made the bun look veiled in red as it rose into
 * it. Do not add one back.
 */
export const EDGE_FADE =
  "linear-gradient(to bottom, #000 0%, #000 97%, transparent 100%)";

export const frameUrl = (i: number) =>
  `/build/${String(i).padStart(2, "0")}.webp`;

export type FrameSequence = {
  /** Paints frame `i`. Returns false if that frame has not decoded yet. */
  draw(i: number): boolean;
  /** Re-sizes the backing store to the CSS box and repaints. */
  resize(): void;
  /** Decodes every frame. Resolves once the sequence is scrubbable. */
  load(): Promise<void>;
  dispose(): void;
};

export function createFrameSequence(
  el: HTMLCanvasElement,
): FrameSequence | null {
  const ctx = el.getContext("2d");
  if (!ctx) return null;

  const frames: HTMLImageElement[] = [];
  let current = -1;
  let cancelled = false;

  const draw = (i: number) => {
    const idx = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(i)));
    const img = frames[idx];
    if (!img) return false;
    if (idx === current) return true;
    current = idx;
    // The frames are transparent, so each one has to be cleared away rather
    // than painted over — otherwise every frame composites on top of the last
    // and the burger smears.
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.drawImage(img, 0, 0, el.width, el.height);
    return true;
  };

  // Backing store follows the CSS box so the burger is not soft on a phone.
  // Capped at 2x — 3x triples the fill cost for no visible gain.
  const resize = () => {
    const w = el.clientWidth;
    if (!w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = Math.round(w * dpr);
    el.height = Math.round(((w * FRAME_H) / FRAME_W) * dpr);
    // Setting .width clears the canvas, so force a repaint of the same frame.
    const last = current < 0 ? 0 : current;
    current = -1;
    draw(last);
  };

  const load = async () => {
    // Paint frame 0 as soon as it lands rather than waiting for all 40 — though
    // in the hero the burger is already on screen as an <img>, so this is only
    // a head start.
    const first = new Image();
    first.src = frameUrl(0);
    try {
      await first.decode();
      if (cancelled) return;
      frames[0] = first;
      resize();
    } catch {
      // No poster frame; the rest of the sequence can still come up.
    }

    // A frame that fails to decode is left as a hole rather than stored broken:
    // drawImage on a broken image throws, and inside a scrub callback that would
    // kill the scrub instead of degrading it.
    const rest = await Promise.all(
      Array.from({ length: FRAME_COUNT - 1 }, (_, n) => {
        const i = n + 1;
        const img = new Image();
        img.src = frameUrl(i);
        return img
          .decode()
          .then(() => ({ i, img }))
          .catch(() => null);
      }),
    );
    if (cancelled) return;
    for (const entry of rest) {
      if (entry) frames[entry.i] = entry.img;
    }
  };

  return { draw, resize, load, dispose: () => void (cancelled = true) };
}
