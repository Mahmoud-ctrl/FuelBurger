// Exports the printed menu board (/menu-board) to a vector PDF and a
// high-res PNG, using the Chrome or Edge already on this machine.
//
//   npm run build && npm run start      (in another terminal)
//   npm run export:board
//   npm run export:board -- --out "C:/Users/me/Downloads" --scale 4
//
// Use a production server, not `next dev`: the dev indicator would print
// onto the board. The PDF is the print master; the PNG is for previews and
// for printers that want an image.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Must match W and H in app/menu-board/page.tsx.
const W = 1200;
const H = 1600;

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const url = opt("url", "http://localhost:3000/menu-board");
const out = resolve(opt("out", "exports"));
// 6x the 1200px canvas is 7200 x 9600: ~300 dpi on a 60 x 80 cm board.
const scale = Number(opt("scale", "6"));

const browser = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => p && existsSync(p));
if (!browser) {
  console.error("No Chrome or Edge found. Set CHROME_PATH.");
  process.exit(1);
}

mkdirSync(out, { recursive: true });
// A throwaway profile, so it never collides with a Chrome that's open.
const profile = mkdtempSync(join(tmpdir(), "fuel-board-"));

const run = (extra) =>
  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      `--user-data-dir=${profile}`,
      // Lets the self-hosted fonts land before the capture.
      "--virtual-time-budget=5000",
      ...extra,
      url,
    ],
    { stdio: "inherit" },
  );

try {
  const pdf = join(out, "fuel-menu-board.pdf");
  run(["--no-pdf-header-footer", `--print-to-pdf=${pdf}`]);

  const png = join(out, "fuel-menu-board.png");
  run([
    `--window-size=${W},${H}`,
    `--force-device-scale-factor=${scale}`,
    `--screenshot=${png}`,
  ]);

  console.log(`\n${pdf}\n${png} (${W * scale} x ${H * scale})`);
} finally {
  rmSync(profile, { recursive: true, force: true });
}
