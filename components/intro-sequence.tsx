"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FuelLockup } from "./fuel-logo";

gsap.registerPlugin(useGSAP);

/**
 * The burger sits at x=127 in a 344-wide mark, i.e. 36.92% across.
 * Scaling the stage around that point keeps the burger pinned while it
 * grows, and nudging the stage right by the remaining 13.08% parks the
 * burger dead centre of the screen until the letters arrive.
 */
const BURGER_ORIGIN = "36.92% 50%";
const BURGER_OFFSET = 13.08;

const LIQUID = "var(--color-fuel-maroon)";
const LIQUID_DEEP = "var(--color-fuel-maroon-deep)";

/* ---- liquid geometry ------------------------------------------------
   The transition is one wide band of liquid sweeping across the screen.
   Its leading edge covers the logo and its trailing edge uncovers the
   landing page, so the whole thing is a single throw rather than two
   separate moves. Both edges are sheared by TILT so the bottom leads and
   it reads as thrown from the lower left.

   Geometry lives in a 100x100 viewBox stretched over the viewport
   (preserveAspectRatio="none"), so x units are percentages of width.
--------------------------------------------------------------------- */
const BAND = 230; // band width — wide enough to blanket the screen mid-sweep
const TILT = 26; // shear across the height
const START_L = -280; // band fully off the left
const END_L = 140; // band fully off the right

type Pt = [number, number];

function edgePoints(x: number, amp: number, phase: number): Pt[] {
  const N = 5;
  const pts: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // overshoot top and bottom so the wave never opens a corner gap
    const y = -4 + t * 108;
    const wave =
      Math.sin(phase + t * Math.PI * 2.3) * amp +
      Math.sin(phase * 1.7 + t * Math.PI * 4.1) * amp * 0.3;
    pts.push([x + wave + (t - 0.5) * TILT, y]);
  }
  return pts;
}

/** Smooth cubics through the points, with vertical control handles. */
function curvesFrom(pts: Pt[]): string {
  let d = "";
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const h = (y1 - y0) / 3;
    d +=
      ` C${x0.toFixed(2)} ${(y0 + h).toFixed(2)}` +
      ` ${x1.toFixed(2)} ${(y1 - h).toFixed(2)}` +
      ` ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }
  return d;
}

function liquidPath(p: number, amp: number, phase: number, lead: number) {
  const L = START_L + p * (END_L - START_L) + lead;
  const left = edgePoints(L, amp, phase);
  const right = edgePoints(L + BAND, amp * 0.75, phase + 1.9);
  const foot = right[right.length - 1];
  return (
    `M${left[0][0].toFixed(2)} ${left[0][1].toFixed(2)}` +
    curvesFrom(left) +
    ` L${foot[0].toFixed(2)} ${foot[1].toFixed(2)}` +
    curvesFrom([...right].reverse()) +
    " Z"
  );
}

/** Spatter thrown ahead of the mass. Fixed values — no hydration drift. */
const DROPS = [
  { top: 18, size: 9 },
  { top: 34, size: 15 },
  { top: 47, size: 7 },
  { top: 55, size: 21 },
  { top: 63, size: 11 },
  { top: 71, size: 27 },
  { top: 78, size: 8 },
  { top: 86, size: 17 },
  { top: 92, size: 12 },
];

/** When the liquid phase begins, in timeline seconds. */
const THROW = 2.55;
/**
 * The band blankets the viewport at THROW+0.29 (see the coverage maths in
 * liquidPath — it is aspect-independent because preserveAspectRatio is
 * "none"). Everything after that instant happens off-screen, so this is
 * where we hand over: a small margin past cover, and not a frame later.
 */
const HANDOFF = THROW + 0.38;

export function IntroSequence({ onFinish }: { onFinish?: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const back = useRef<SVGPathElement>(null);
  const front = useRef<SVGPathElement>(null);
  const [gone, setGone] = useState(false);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      let handedOver = false;
      const finish = () => {
        if (handedOver) return;
        handedOver = true;
        document.documentElement.removeAttribute("data-intro-locked");
        onFinish?.();
        setGone(true);
      };

      // Plays on every load, including a refresh. The only thing that skips
      // it is an explicit reduced-motion preference.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(el, { display: "none" });
        finish();
        return;
      }

      document.documentElement.setAttribute("data-intro-locked", "true");

      // ---- resting state -------------------------------------------------
      gsap.set(".fuel-stage", {
        transformOrigin: BURGER_ORIGIN,
        xPercent: BURGER_OFFSET,
        scale: 0.12,
        rotate: -14,
        autoAlpha: 0,
      });
      gsap.set('[data-part="letter-f"]', { x: -430, autoAlpha: 0, scaleX: 2.2 });
      gsap.set('[data-part="letter-e"]', { x: 430, autoAlpha: 0, scaleX: 2.2 });
      gsap.set('[data-part="letter-l"]', { x: 540, autoAlpha: 0, scaleX: 2.2 });
      gsap.set(".fuel-tagline", { autoAlpha: 0 });
      gsap.set('[data-part="tagline-word"]', { yPercent: 120, autoAlpha: 0 });

      const liquid = { p: 0, amp: 18, phase: 0 };
      const draw = () => {
        back.current?.setAttribute(
          "d",
          liquidPath(liquid.p, liquid.amp, liquid.phase, 9),
        );
        front.current?.setAttribute(
          "d",
          liquidPath(liquid.p, liquid.amp, liquid.phase + 0.7, 0),
        );
      };
      draw();

      const tl = gsap.timeline({ onComplete: finish });

      tl
        // ---- 1. the burger swells up and unwinds into place ---------------
        .to(".fuel-stage", { autoAlpha: 1, duration: 0.28 }, 0)
        .to(
          ".fuel-stage",
          { scale: 1, rotate: 0, duration: 1, ease: "back.out(1.5)" },
          0,
        )

        // ---- 2. recentre before the letters land --------------------------
        .to(
          ".fuel-stage",
          { xPercent: 0, duration: 0.7, ease: "power2.inOut" },
          0.55,
        )

        // ---- 3. F, E and L snap in from off-screen ------------------------
        .to(
          '[data-part="letter-f"]',
          { x: 0, scaleX: 1, autoAlpha: 1, duration: 0.7, ease: "power4.out" },
          0.62,
        )
        .to(
          '[data-part="letter-e"]',
          { x: 0, scaleX: 1, autoAlpha: 1, duration: 0.7, ease: "power4.out" },
          0.69,
        )
        .to(
          '[data-part="letter-l"]',
          { x: 0, scaleX: 1, autoAlpha: 1, duration: 0.7, ease: "power4.out" },
          0.76,
        )

        // ---- 4. tagline wipes up, word by word ----------------------------
        .set(".fuel-tagline", { autoAlpha: 1 }, 1.55)
        .to(
          '[data-part="tagline-word"]',
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.07,
          },
          1.55,
        )

        // ---- 5. the throw -------------------------------------------------
        // spatter leads the mass across
        .fromTo(
          ".fuel-drop",
          { x: "-18vw", y: 0, scale: 0.5, autoAlpha: 0 },
          {
            x: "116vw",
            y: "-8vh",
            scale: 1,
            autoAlpha: 1,
            duration: 0.6,
            ease: "power2.out",
            stagger: { each: 0.03, from: "random" },
          },
          THROW - 0.14,
        )
        .to(".fuel-drop", { autoAlpha: 0, duration: 0.2 }, THROW + 0.34)

        // the mass lands and blankets the screen
        .to(
          liquid,
          { p: 0.52, duration: 0.65, ease: "power3.out", onUpdate: draw },
          THROW,
        )
        // the surface keeps moving as it arrives. Once the band covers the
        // viewport both its edges are off-screen, so there is nothing left
        // to animate — the timeline ends on a short beat of flat colour.
        .to(
          liquid,
          { phase: "+=0.9", duration: 0.65, ease: "none", onUpdate: draw },
          THROW,
        )
        // Under full cover the whole overlay drops at once. The liquid and
        // the landing page are the same red, so there is nothing to fade —
        // the page is simply there.
        .call(finish, undefined, HANDOFF);

      // Never strand the page with a locked scroll if we unmount mid-flight.
      return () =>
        document.documentElement.removeAttribute("data-intro-locked");
    },
    { scope: root, dependencies: [] },
  );

  if (gone) return null;

  return (
    <div
      ref={root}
      className="fuel-intro pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {/* the logo screen the liquid covers */}
      <div className="fuel-screen absolute inset-0 grid place-items-center bg-white">
        {/* Hidden in the server-rendered markup: between first paint and
            hydration the overlay must be plain white, or the finished mark
            flashes for a moment and then restarts as a speck. */}
        <FuelLockup className="fuel-stage invisible" />
      </div>

      {/* spatter thrown ahead of the mass */}
      <div className="absolute inset-0 overflow-hidden">
        {DROPS.map((drop, i) => (
          <span
            key={i}
            className="fuel-drop absolute left-0 block rounded-full"
            style={{
              top: `${drop.top}%`,
              width: drop.size,
              height: drop.size,
              background: LIQUID,
            }}
          />
        ))}
      </div>

      {/* the liquid itself */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path ref={back} fill={LIQUID_DEEP} />
        <path ref={front} fill={LIQUID} />
      </svg>
    </div>
  );
}
