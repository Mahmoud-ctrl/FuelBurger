"use client";

import { type CSSProperties, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import NextImage, { type StaticImageData } from "next/image";
import bowlClassic from "@/public/starters/bowl-classic.webp";
import bowlJalapeno from "@/public/starters/bowl-jalapeno.webp";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Starter = {
  side: "left" | "right";
  label: string;
  name: string;
  blurb: string;
  heat: number;
  heatLabel: string;
  bowl: StaticImageData;
  alt: string;
  /** Giant word drifting behind the bowl. */
  word: string;
  accent: string;
};

const STARTERS: Starter[] = [
  {
    side: "left",
    label: "01 — Classic",
    name: "Cheese Bombs",
    blurb:
      "Mozzarella packed in a seasoned crumb and fried until it shatters. Pull slow.",
    heat: 0,
    heatLabel: "No heat",
    bowl: bowlClassic,
    alt: "A bowl of crumb-fried mozzarella cheese balls, one pulled open",
    word: "Cheese",
    accent: "var(--color-fuel-gold)",
  },
  {
    side: "right",
    label: "02 — Jalapeño",
    name: "Jalapeño Bombs",
    blurb:
      "Same molten middle, loaded with fresh-cut jalapeño. Brings a kick, not a fire.",
    heat: 2,
    heatLabel: "Medium kick",
    bowl: bowlJalapeno,
    alt: "A bowl of jalapeño cheese balls topped with fresh jalapeño slices",
    word: "Jalapeño",
    accent: "var(--color-fuel-jalapeno)",
  },
];

const HEAT_MAX = 3;

function Chili({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} style={style}>
      <path
        fill="currentColor"
        d="M16.6 7.4c2.9.9 3.6 4.4 1.4 7.9-2.3 3.7-7.1 6.3-13.4 6.5-.8 0-1-1-.3-1.3 4.4-1.9 6.9-4.9 7.9-8.9.8-3.2 2.1-4.9 4.4-4.2z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        d="M11.9 9.2c1.2-1.9 3.6-2.6 5.9-1.6M16.4 7.5c-.2-2 .6-3.7 2.4-4.7"
      />
    </svg>
  );
}

/**
 * Starters: two bowls, one from each side, following the scroll in. Quieter
 * than the hero on purpose — nothing pins, and the only scrubbed motion is
 * the slide itself.
 *
 * Without JS, or with reduced motion, everything simply sits where it lands.
 */
export function Starters({ play }: { play: boolean }) {
  const root = useRef<HTMLElement>(null);

  // Hide the heading before first paint so it can rise in. The section is
  // off-screen under the intro until `play`, so this state is never seen.
  // Done here rather than as classes so a no-JS page still shows everything.
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.set(".st-line", { autoAlpha: 0 });
    },
    { scope: root, dependencies: [] },
  );

  // Built once the hero hands over, not on mount: the hero's pin is created on
  // that same flip, and a trigger measured before its spacer exists would fire
  // ~2.6 screens early. Sibling layout effects run in order, so the hero's pin
  // is in place by the time this runs.
  useGSAP(
    () => {
      if (!play) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        ".st-line",
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

      gsap.utils.toArray<HTMLElement>(".st-row").forEach((row, r) => {
        const cfg = STARTERS[r];
        const q = gsap.utils.selector(row);
        // +1 when the bowl comes in from the left.
        const dir = cfg.side === "left" ? 1 : -1;

        // The bowl follows the scroll in from its own side. Linear, spread
        // over most of a screen: an eased slide spends its travel before the
        // bowl is even in view, and the scrub's own lag already softens it.
        gsap.fromTo(
          q(".st-bowl"),
          { xPercent: -115 * dir, rotate: -26 * dir },
          {
            xPercent: 0,
            rotate: -4 * dir,
            ease: "none",
            scrollTrigger: {
              trigger: row,
              start: "top 95%",
              end: "top 25%",
              scrub: 0.8,
            },
          },
        );

        // The word behind drifts against the bowl.
        gsap.fromTo(
          q(".st-word"),
          { xPercent: 12 * dir },
          {
            xPercent: -30 * dir,
            ease: "none",
            scrollTrigger: {
              trigger: row,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );

        gsap.fromTo(
          q(".st-copy > *"),
          { autoAlpha: 0, x: -34 * dir },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.07,
            scrollTrigger: {
              trigger: row,
              start: "top 42%",
              toggleActions: "play none none reverse",
            },
          },
        );

        // A slow bob once it has landed. On its own wrapper so it never
        // fights the slide.
        gsap.to(q(".st-bob"), {
          y: -7,
          duration: 2.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: r * 0.9,
        });
      });
    },
    { scope: root, dependencies: [play] },
  );

  return (
    <section
      ref={root}
      id="starters"
      aria-labelledby="starters-title"
      // Pulled up over the hero's last few pixels so the rounded top reads as
      // a sheet sliding over it once the pin lets go. Only when motion is on:
      // without the pin the hero's links are still there and would be covered.
      className="fuel-grain relative isolate z-10 overflow-hidden rounded-t-[28px] bg-fuel-cream pb-24 pt-14 motion-safe:-mt-7"
    >
      <div className="mx-auto w-full max-w-[520px] px-5">
        <div className="st-line flex items-center gap-3">
          <span className="block h-px w-8 bg-fuel-maroon" />
          <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-fuel-maroon">
            Starters
          </span>
        </div>
        <h2
          id="starters-title"
          className="st-line mt-4 font-display text-[2.5rem] font-bold leading-[0.95] tracking-[-0.02em] text-fuel-ink"
        >
          Crack one <span className="text-fuel-maroon">open.</span>
        </h2>
        <p className="st-line mt-3 max-w-[18rem] text-[0.92rem] leading-relaxed text-fuel-ink/60">
          Two ways in, one molten middle. Pick your heat.
        </p>
      </div>

      {STARTERS.map((s) => {
        const right = s.side === "right";
        return (
          <article
            key={s.name}
            aria-label={s.name}
            className="st-row relative mx-auto mt-10 w-full max-w-[520px]"
          >
            {/* Stretched vertically like the hero's word: width is what is
                scarce on a phone, height is free. */}
            <span
              aria-hidden
              className={`st-word pointer-events-none absolute top-[4%] block whitespace-nowrap font-display text-[clamp(4.5rem,30vw,9rem)] font-black uppercase leading-[0.8] tracking-[-0.055em] text-fuel-maroon/[0.07] ${
                right ? "right-0" : "left-0"
              }`}
              style={{ transform: "scaleY(1.6)", transformOrigin: "top" }}
            >
              {s.word}
            </span>

            <div
              className={`relative w-[86%] ${right ? "-mr-[3%] ml-auto" : "-ml-[3%]"}`}
            >
              <div className="st-bowl relative aspect-square">
                {/* Contact shadow. The bowl's foot sits at the very bottom of
                    the render, so this hangs just below the box. */}
                <div
                  aria-hidden
                  className="absolute inset-x-[24%] bottom-[-3%] h-[8%] rounded-[50%] bg-fuel-maroon/30 blur-xl"
                />
                <div className="st-bob absolute inset-0">
                  <NextImage
                    src={s.bowl}
                    alt={s.alt}
                    // Asks for ~2x density, not the phone's full 3x. The bowl
                    // is decoded the frame it slides into view, and at 1024px
                    // that took 47ms on a mid-range Android phone — a visible
                    // hitch mid-slide. At 2x it is about half the pixels, and
                    // a photo this size looks no different.
                    sizes="(max-width: 520px) 58vw, 300px"
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              </div>
            </div>

            <div
              className={`st-copy relative px-5 ${right ? "text-right" : ""}`}
            >
              <p className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-fuel-maroon">
                {s.label}
              </p>
              <h3 className="mt-2 font-display text-[1.7rem] font-bold leading-none tracking-[-0.01em] text-fuel-ink">
                {s.name}
              </h3>
              <p
                className={`mt-3 max-w-[17rem] text-[0.92rem] leading-relaxed text-fuel-ink/65 ${
                  right ? "ml-auto" : ""
                }`}
              >
                {s.blurb}
              </p>
              <div
                className={`mt-4 flex items-center gap-3 ${right ? "justify-end" : ""}`}
              >
                <div className="flex gap-1">
                  {Array.from({ length: HEAT_MAX }, (_, i) => (
                    <Chili
                      key={i}
                      className="h-[1.1rem] w-[1.1rem]"
                      // Filled up to the heat, the rest a ghost of the ink.
                      style={{
                        color: i < s.heat ? s.accent : "rgba(42,20,16,.13)",
                      }}
                    />
                  ))}
                </div>
                <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-fuel-ink/60">
                  {s.heatLabel}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
