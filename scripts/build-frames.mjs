/**
 * Generates the small frame variants used by the scroll-scrubbed burger.
 *
 * The whole sequence is held decoded so a scrub can jump to any frame, so the
 * source resolution is what caps memory: 40 frames of 768x788 RGBA is 92MB,
 * which is enough to make a phone start discarding decoded frames mid-scrub.
 *
 * The frames are never shown at 768 anyway — see the note on FRAME_WIDTHS in
 * components/burger-frames.ts for the measurements. This just writes the
 * smaller sets next to the originals.
 *
 *   node scripts/build-frames.mjs     (or: npm run build:frames)
 */
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BUILD = path.join(ROOT, "public", "build");

/** Source frame geometry. Must match components/burger-frames.ts. */
const FRAME_W = 768;
const FRAME_H = 788;

/** Widths to emit, each into public/build/<w>/. The source set stays put. */
const VARIANTS = [480];

/** Matches the WebP settings the source frames were written with. */
const WEBP = { quality: 68, alphaQuality: 90, effort: 6 };

const frames = (await readdir(BUILD))
  .filter((f) => /^\d\d\.webp$/.test(f))
  .sort();

if (!frames.length) {
  console.error(`No frames found in ${BUILD}`);
  process.exit(1);
}

for (const width of VARIANTS) {
  const height = Math.round((width * FRAME_H) / FRAME_W);
  const dir = path.join(BUILD, String(width));
  await mkdir(dir, { recursive: true });

  let bytes = 0;
  for (const name of frames) {
    const out = path.join(dir, name);
    const buf = await sharp(path.join(BUILD, name))
      // Frames are keyed out, so the alpha edge is the thing to protect.
      .resize(width, height, { fit: "fill", kernel: "lanczos3" })
      .webp(WEBP)
      .toBuffer();
    await writeFile(out, buf);
    bytes += buf.length;
  }
  console.log(
    `${width}x${height}  ${frames.length} frames  ${(bytes / 1024).toFixed(0)}KB` +
      `  (decoded ${((width * height * 4 * frames.length) / 1048576).toFixed(1)}MB)`,
  );
}

const src = (await Promise.all(frames.map((f) => stat(path.join(BUILD, f)))))
  .reduce((n, s) => n + s.size, 0);
console.log(
  `${FRAME_W}x${FRAME_H}  ${frames.length} frames  ${(src / 1024).toFixed(0)}KB` +
    `  (decoded ${((FRAME_W * FRAME_H * 4 * frames.length) / 1048576).toFixed(1)}MB)`,
);
