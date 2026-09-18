"use client";

import { type CSSProperties, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import NextImage from "next/image";
import { FuelLogo } from "./fuel-logo";
import boxBack from "@/public/fries/box-back.webp";
import boxFront from "@/public/fries/box-front.webp";
import fry1 from "@/public/fries/fry-1.webp";
import fry2 from "@/public/fries/fry-2.webp";
import fry3 from "@/public/fries/fry-3.webp";
import fry4 from "@/public/fries/fry-4.webp";
import fry5 from "@/public/fries/fry-5.webp";
import fry6 from "@/public/fries/fry-6.webp";
import fry7 from "@/public/fries/fry-7.webp";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FRY_IMAGES = [fry1, fry2, fry3, fry4, fry5, fry6, fry7];

/* ---- stage geometry ------------------------------------------------
   Everything is laid out in units of the stage's width (W), so the whole
   composition scales as one. The stage is ASPECT times taller than wide:
   the burst needs the headroom above the box.

   The box is two layers of the same render: box-back is the whole box,
   box-front is only the front panel, cut along the scoop. Fries stacked
   between them sit in front of the back wall and disappear behind the front
   panel, so they read as inside the box without any masking at runtime.
--------------------------------------------------------------------- */
const ASPECT = 1.3;
const BOX = { left: 0.25, width: 0.5 };
/** Width over height of the box render. */
const BOX_RATIO = 710 / 864;
const BOX_H = BOX.width / BOX_RATIO;
/** Middle of the maroon band, as a share of the box's height from its foot. */
const BAND_MID = 0.355;
const LOGO = { width: BOX.width * 0.6, ratio: 344 / 57 };
/** Fry length before per-fry scale. */
const FRY_LEN = 0.46;
/**
 * Transparent margin at each end of a fry image, in the image's own pixels.
 * The shadow is baked into that margin rather than drawn with a CSS
 * drop-shadow: a live filter on twelve moving layers is re-blurred every
 * frame, which is exactly what a phone GPU cannot afford mid-scroll.
 */
const FRY_PAD = 64;

type Pose = { x: number; y: number; rotate: number };
type Fry = Pose & {
  /** Which of the seven fry images. */
  img: number;
  scale?: number;
  /**
   * Where it ends up once the burst is done, and any extra spin on the way.
   * Fries without one stay in the box. `order` staggers the launch: 0 goes
   * first.
   */
  fly?: Pose & { spin: number; order: number };
};

/**
 * Resting positions are the fry centres in the box, back row first so the
 * front rows paint over them. Seven of the twelve fly; the other five keep
 * the box looking full once the burst is over. The fan is a loose crown
 * around the box mouth, widest fries lowest so the outer tips stay on screen.
 */
const FRIES: Fry[] = [
  // back row
  { img: 1, x: 0.4, y: 0.8, rotate: -12, fly: { x: 0.26, y: 0.384, rotate: -27, spin: 0, order: 2 } },
  { img: 4, x: 0.47, y: 0.77, rotate: -5, fly: { x: 0.517, y: 0.3, rotate: 5, spin: 0, order: 0 } },
  { img: 0, x: 0.54, y: 0.78, rotate: 6 },
  { img: 5, x: 0.61, y: 0.81, rotate: 14, fly: { x: 0.742, y: 0.397, rotate: 35, spin: 0, order: 2 } },
  // middle row
  { img: 2, x: 0.39, y: 0.85, rotate: -14, scale: 0.96, fly: { x: 0.198, y: 0.508, rotate: -50, spin: -360, order: 3 } },
  { img: 6, x: 0.45, y: 0.83, rotate: -8, fly: { x: 0.374, y: 0.295, rotate: -17, spin: -180, order: 1 } },
  { img: 3, x: 0.51, y: 0.82, rotate: 2, scale: 1.04 },
  { img: 1, x: 0.57, y: 0.84, rotate: 10, fly: { x: 0.646, y: 0.291, rotate: 13, spin: 180, order: 1 } },
  { img: 4, x: 0.62, y: 0.87, rotate: 16, scale: 0.96, fly: { x: 0.8, y: 0.52, rotate: 50, spin: 360, order: 3 } },
  // front row
  { img: 0, x: 0.43, y: 0.89, rotate: -11, scale: 0.94 },
  { img: 5, x: 0.5, y: 0.88, rotate: -1 },
  { img: 2, x: 0.57, y: 0.9, rotate: 12, scale: 0.94 },
];

const pct = (n: number) => `${n * 100}%`;

/** Resting pose as inline styles, so no-JS and reduced motion get a full box. */
function restStyle(f: Fry): CSSProperties {
  return {
    left: pct(f.x),
    top: pct(f.y / ASPECT),
    // Sized by the fry itself, not the padded image around it.
    height: pct(
      (FRY_LEN * (f.scale ?? 1) * FRY_IMAGES[f.img].height) /
        (FRY_IMAGES[f.img].height - 2 * FRY_PAD) /
        ASPECT,
    ),
    transform: `translate(-50%, -50%) rotate(${f.rotate}deg)`,
  };
}

/**
 * The side: a full box of fries that bursts as you scroll past it. The
 * section holds for a screen while it happens, so the fries fly out in front
 * of you rather than off the top of the screen.
 */
export function Fries({ play }: { play: boolean }) {
  const root = useRef<HTMLElement>(null);
  const pinned = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.set(".fr-line", { autoAlpha: 0 });
    },
    { scope: root, dependencies: [] },
  );

  // Created on `play`, after the hero and the starters: a pin measured before
  // the hero's pin spacer exists would start ~2.6 screens early, and pins must
  // be created top to bottom so each one accounts for the spacing above it.
  useGSAP(
    () => {
      if (!play) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        ".fr-line",
        { autoAlpha: 0, y: 26 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root.current, start: "top 72%", once: true },
        },
      );

      const W = () => stage.current?.offsetWidth ?? 0;
      const pieces = gsap.utils.toArray<HTMLElement>(".fr-fry");

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: pinned.current,
          start: "top top",
          end: "+=100%",
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          // x/y are in pixels of the stage width, so remeasure on refresh.
          invalidateOnRefresh: true,
        },
      });

      FRIES.forEach((f, i) => {
        const el = pieces[i];
        gsap.set(el, { xPercent: -50, yPercent: -50 });

        if (!f.fly) {
          // The ones left behind get jostled up and settle back.
          tl.to(el, { y: () => -0.03 * W(), duration: 0.14, ease: "power2.out" }, 0.02)
            .to(el, { y: 0, duration: 0.22, ease: "power2.inOut" }, 0.16);
          return;
        }

        const { fly } = f;
        const at = 0.04 + fly.order * 0.05;
        const FLIGHT = 0.58;
        // Separate eases on x and y bend the path: it shoots up first and
        // drifts outward after, so each fry arcs rather than sliding.
        tl.fromTo(
          el,
          { x: 0 },
          { x: () => (fly.x - f.x) * W(), duration: FLIGHT, ease: "power1.inOut" },
          at,
        )
          .fromTo(
            el,
            { y: 0 },
            { y: () => (fly.y - f.y) * W(), duration: FLIGHT, ease: "power3.out" },
            at,
          )
          .fromTo(
            el,
            { rotate: f.rotate },
            {
              rotate: fly.rotate + fly.spin,
              duration: FLIGHT,
              ease: "power2.out",
            },
            at,
          );
      });

      // The word lands behind the burst, then the copy.
      // Rises rather than grows: scaling a word this size makes the browser
      // re-rasterise it every frame. On a mid-range phone those were 25-30ms
      // raster tasks mid-burst; moving it instead left none.
      tl.fromTo(
        ".fr-word",
        { autoAlpha: 0, yPercent: 12 },
        { autoAlpha: 1, yPercent: 0, duration: 0.45, ease: "power2.out" },
        0.12,
      ).fromTo(
        ".fr-copy",
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" },
        0.6,
      );
    },
    { scope: root, dependencies: [play] },
  );

  return (
    <section
      ref={root}
      id="fries"
      aria-labelledby="fries-title"
      // Same sheet-over-the-last-section move as the starters, and for the
      // same reason only when motion is on. The bottom padding is room for the
      // next sheet to ride up over without landing on the copy.
      className="fuel-grain relative isolate z-20 overflow-hidden rounded-t-[28px] bg-fuel-maroon pb-12 motion-safe:-mt-7"
    >
      {/* 100vh, not 100dvh: this is pinned, and dvh is remeasured when the iOS
          URL bar collapses, which would move the pin mid-scroll. */}
      <div
        ref={pinned}
        className="relative flex h-[100vh] min-h-[36rem] flex-col items-center px-5 pb-8 pt-14"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 42% at 50% 56%, rgba(237,174,63,.18) 0%, transparent 72%), radial-gradient(120% 78% at 50% 50%, transparent 40%, rgba(37,6,10,.55) 100%)",
          }}
        />

        <div className="relative w-full max-w-[520px]">
          <div className="fr-line flex items-center gap-3">
            <span className="block h-px w-8 bg-fuel-gold" />
            <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-fuel-gold">
              The side
            </span>
          </div>
          <h2
            id="fries-title"
            className="fr-line mt-4 font-display text-[2.5rem] font-bold leading-[0.95] tracking-[-0.02em] text-fuel-cream"
          >
            Twice-fried.
            <br />
            Never <span className="text-fuel-gold">limp.</span>
          </h2>
        </div>

        {/* The stage takes whatever height is left, capped so the burst and
            the copy both fit on a short phone. */}
        <div className="relative flex w-full flex-1 items-center justify-center">
          <div
            ref={stage}
            className="relative"
            style={{
              width: `min(100%, 460px, calc((100vh - 19rem) / ${ASPECT}))`,
              aspectRatio: `1 / ${ASPECT}`,
            }}
          >
            {/* Stretched vertically like the hero's word. Tone-on-tone, not
                gold like the hero's: the fries are gold, and they vanish into
                a gold word. The stretch is on the inner span so the burst's
                transform on the outer one cannot overwrite it. */}
            <div
              aria-hidden
              className="fr-word pointer-events-none absolute inset-x-0 top-[6%] flex justify-center"
            >
              <span
                className="block font-display text-[clamp(4.5rem,34vw,10rem)] font-black uppercase leading-[0.8] tracking-[-0.055em] text-fuel-maroon-deep"
                style={{ transform: "scaleY(1.7)", transformOrigin: "top center" }}
              >
                Fries
              </span>
            </div>

            <NextImage
              src={boxBack}
              alt=""
              sizes="(max-width: 520px) 50vw, 230px"
              className="absolute bottom-0 h-auto"
              style={{ left: pct(BOX.left), width: pct(BOX.width) }}
            />

            {FRIES.map((f, i) => (
              <NextImage
                key={i}
                src={FRY_IMAGES[f.img]}
                alt=""
                sizes="(max-width: 520px) 8vw, 40px"
                className="fr-fry absolute w-auto max-w-none"
                style={restStyle(f)}
              />
            ))}

            <NextImage
              src={boxFront}
              alt="A fry box full of golden fries"
              sizes="(max-width: 520px) 50vw, 230px"
              className="absolute bottom-0 h-auto"
              style={{ left: pct(BOX.left), width: pct(BOX.width) }}
            />
            {/* The mark on the box's band. The band is darker than the
                page maroon, so the logo's cut-outs are matched to it. */}
            <FuelLogo
              aria-hidden
              className="logo-on-maroon absolute h-auto"
              style={
                {
                  left: pct(0.5 - LOGO.width / 2),
                  width: pct(LOGO.width),
                  bottom: pct(
                    (BAND_MID * BOX_H - LOGO.width / LOGO.ratio / 2) / ASPECT,
                  ),
                  "--logo-cream": "#672526",
                } as CSSProperties
              }
            />
          </div>
        </div>

        <div className="fr-copy relative w-full max-w-[520px] text-center">
          <p className="mx-auto max-w-[19rem] text-[0.92rem] leading-relaxed text-fuel-cream/65">
            Hand-cut, fried twice, and salted the second they leave the oil.
          </p>
        </div>
      </div>
    </section>
  );
}
