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

/**
 * How wide the centre burger ends up once it has come forward. It is the only
 * thing on screen by then, so this — not the resting size — is what the frames
 * have to hold up at. hero.tsx derives its forward scale from the same number,
 * so the two cannot drift apart.
 */
export const shownWidth = (viewportW: number) => Math.min(viewportW * 0.98, 620);

/**
 * Frame widths available on disk, ascending. FRAME_W is the source set in
 * public/build/; every other entry is a generated variant in
 * public/build/<width>/ — re-run `npm run build:frames` after re-cutting them.
 *
 * Why a smaller set exists: the scrub can jump to any frame, so the whole
 * sequence is held decoded, and that is what caps the resolution. 40 frames of
 * 768x788 RGBA is 92MB, which is past the point where iOS Safari starts
 * throwing decoded frames away and re-decoding them mid-scrub. The 480 set is
 * 36MB, and it costs nothing visible: the canvas is upscaled to reach the size
 * above either way (2.15x on a 390px phone), so the extra source pixels were
 * being thrown away before they ever reached the screen.
 */
export const FRAME_WIDTHS = [480, FRAME_W] as const;

/** Decoded-bitmap budget for the whole sequence, by device class. */
const MEMORY_BUDGET = { coarse: 40 * 1024 * 1024, fine: 96 * 1024 * 1024 };

/**
 * Decodes to run at once — enough to keep the pipe full, few enough that the
 * main thread still gets a look in while they land.
 */
const DECODE_BATCH = 4;

export const frameUrl = (i: number, width: number = FRAME_W) => {
  const name = `${String(i).padStart(2, "0")}.webp`;
  return width === FRAME_W ? `/build/${name}` : `/build/${width}/${name}`;
};

/** The largest set that fits both the screen and the memory budget. */
function pickWidth(shownCss: number): number {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const budget = coarse ? MEMORY_BUDGET.coarse : MEMORY_BUDGET.fine;
  // bytes -> pixels per frame -> width, given the frame's aspect ratio
  const byBudget = Math.sqrt(((budget / FRAME_COUNT / 4) * FRAME_W) / FRAME_H);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const target = Math.min(shownCss * dpr, byBudget, FRAME_W);
  // Never step up past the target just because the budget would allow it.
  return [...FRAME_WIDTHS].reverse().find((w) => w <= target) ?? FRAME_WIDTHS[0];
}

export type FrameSequence = {
  /** Paints frame `i`. Returns false if that frame has not decoded yet. */
  draw(i: number): boolean;
  /** Starts the download. Call it while the intro still covers the screen —
   *  that is ~3s of otherwise idle network. */
  fetchAll(): void;
  /** Decodes what `fetchAll` pulled down, a few at a time. Held separate from
   *  the download so 40 decodes do not land on top of the intro's animation. */
  decodeAll(): Promise<void>;
  dispose(): void;
};

export function createFrameSequence(
  el: HTMLCanvasElement,
  shownCss: number,
): FrameSequence | null {
  const ctx = el.getContext("2d");
  if (!ctx) return null;

  const width = pickWidth(shownCss);
  const height = Math.round((width * FRAME_H) / FRAME_W);

  // The backing store is the decoded frame size, so drawImage is a straight
  // blit rather than a resample on every scrub tick; the CSS box scales it up.
  //
  // Deliberately never re-sized afterwards. Reallocating the backing store
  // mid-scroll is a stutter of its own, and on iOS a resize fires every time
  // the URL bar collapses. An orientation change leaves the frames scaled by
  // the browser instead of triggering 40 re-decodes — the right trade at 480px.
  el.width = width;
  el.height = height;
  // Frames are transparent and each one replaces the last whole, so "copy"
  // clears and paints in a single pass rather than clearRect + drawImage.
  ctx.globalCompositeOperation = "copy";

  // Two ways to get a frame onto the canvas. createImageBitmap decodes off the
  // main thread, sizes to the backing store as it goes, and can be released
  // outright with close(). The <img> fallback still decodes at the file's own
  // size — which is the size we picked — so the memory works out the same.
  const useBitmap = typeof createImageBitmap === "function";

  const frames: (ImageBitmap | HTMLImageElement)[] = [];
  let blobs: Promise<Blob | null>[] | null = null;
  let imgs: HTMLImageElement[] | null = null;
  let current = -1;
  let cancelled = false;
  // Guards against a second pass being kicked off if the caller re-runs its
  // effect — decoding twice would strand the first set of bitmaps.
  let decoding: Promise<void> | null = null;

  const draw = (i: number) => {
    const idx = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(i)));
    const img = frames[idx];
    if (!img) return false;
    if (idx === current) return true;
    current = idx;
    ctx.drawImage(img, 0, 0, width, height);
    return true;
  };

  const put = (i: number, img: ImageBitmap | HTMLImageElement) => {
    if (cancelled) {
      if ("close" in img) img.close();
      return;
    }
    const old = frames[i];
    if (old && "close" in old) old.close();
    frames[i] = img;
    // Frame 0 paints the moment it lands. The hero is showing the poster <img>
    // until then, so this only ever sharpens what is already on screen.
    if (i === 0) draw(0);
  };

  const fetchAll = () => {
    if (blobs || imgs) return;
    if (useBitmap) {
      blobs = Array.from({ length: FRAME_COUNT }, (_, i) =>
        fetch(frameUrl(i, width))
          .then((r) => (r.ok ? r.blob() : null))
          .catch(() => null),
      );
    } else {
      imgs = Array.from({ length: FRAME_COUNT }, (_, i) => {
        const img = new Image();
        img.decoding = "async";
        img.src = frameUrl(i, width);
        return img;
      });
    }
  };

  const decodeOne = async (i: number) => {
    if (cancelled) return;
    try {
      if (blobs) {
        const blob = await blobs[i];
        if (!blob || cancelled) return;
        put(
          i,
          await createImageBitmap(blob, {
            resizeWidth: width,
            resizeHeight: height,
            resizeQuality: "high",
          }),
        );
      } else if (imgs) {
        const img = imgs[i];
        await img.decode();
        put(i, img);
      }
    } catch {
      // A frame that will not decode is left as a hole rather than stored
      // broken: drawImage on a broken image throws, and inside a scrub callback
      // that would kill the scrub instead of degrading it.
    }
  };

  const decodeAll = async () => {
    if (decoding) return decoding;
    return (decoding = runDecode());
  };

  const runDecode = async () => {
    fetchAll();
    // Frame 0 first — it is the handover point from the poster <img>.
    await decodeOne(0);
    for (let i = 1; i < FRAME_COUNT && !cancelled; i += DECODE_BATCH) {
      const n = Math.min(DECODE_BATCH, FRAME_COUNT - i);
      await Promise.all(Array.from({ length: n }, (_, k) => decodeOne(i + k)));
    }
  };

  const dispose = () => {
    cancelled = true;
    for (const f of frames) if (f && "close" in f) f.close();
    frames.length = 0;
  };

  return { draw, fetchAll, decodeAll, dispose };
}
