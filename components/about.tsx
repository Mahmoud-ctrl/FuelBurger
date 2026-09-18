"use client";

import { type CSSProperties, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { FuelLogo, FuelTagline } from "./fuel-logo";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Words wrapped in *asterisks* take the accent colour. */
const STATEMENT =
  "FUEL started with one flat top and a simple rule: a burger should be *loud.* Smashed hard, seasoned properly, and served hot enough that you wait a second before the first *bite.*";

const WORDS = STATEMENT.split(" ").map((w) => {
  const accent = w.startsWith("*");
  return { text: accent ? w.replaceAll("*", "") : w, accent };
});

const PILLARS = [
  {
    title: "Smashed to order",
    body: "Every patty hits the flat top when you order it. Not a minute before.",
  },
  {
    title: "Toasted in the fat",
    body: "Buns go face-down on the griddle until they crunch. Non-negotiable.",
  },
  {
    title: "Made in-house",
    body: "The fries are cut here and the cheese bombs are rolled here. If we can make it, we do.",
  },
];

/**
 * About: the closing section. The statement lights up word by word as you
 * read down it, the rest simply arrives. No pin — the fries just had one.
 */
export function About({ play }: { play: boolean }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.set([".ab-line", ".ab-pillar", ".ab-sign"], { autoAlpha: 0 });
    },
    { scope: root, dependencies: [] },
  );

  // Created on `play`, after every pin above it exists — see starters.tsx.
  useGSAP(
    () => {
      if (!play) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        ".ab-line",
        { autoAlpha: 0, y: 26 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 72%", once: true },
        },
      );

      // Dim to lit, one word after another, tied to the scroll so it keeps
      // pace with reading.
      gsap.fromTo(
        ".ab-word",
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".ab-statement",
            start: "top 80%",
            end: "bottom 45%",
            scrub: true,
          },
        },
      );

      gsap.utils.toArray<HTMLElement>(".ab-pillar").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 30 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      gsap.fromTo(
        ".ab-sign",
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".ab-sign",
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: root, dependencies: [play] },
  );

  return (
    <section
      ref={root}
      id="about"
      aria-labelledby="about-title"
      // The same sheet-over-the-last-section move as the others.
      className="fuel-grain relative isolate z-30 overflow-hidden rounded-t-[28px] bg-fuel-cream px-5 pb-16 pt-14 motion-safe:-mt-7"
    >
      <div className="mx-auto w-full max-w-[520px]">
        <div className="ab-line flex items-center gap-3">
          <span className="block h-px w-8 bg-fuel-maroon" />
          <h2
            id="about-title"
            className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-fuel-maroon"
          >
            About us
          </h2>
        </div>

        <p className="ab-statement mt-6 font-display text-[1.85rem] font-bold leading-[1.12] tracking-[-0.02em] text-fuel-ink">
          {WORDS.map((w, i) => (
            <span key={i}>
              {/* Each word on its own layer, so lighting it is a compositor
                  opacity change. Animating opacity on plain inline text makes
                  the browser repaint the whole paragraph every frame. */}
              <span
                className={`ab-word inline-block ${w.accent ? "text-fuel-maroon" : ""}`}
                style={{ willChange: "opacity" }}
              >
                {w.text}
              </span>{" "}
            </span>
          ))}
        </p>

        <ol className="mt-14 border-t border-fuel-ink/10">
          {PILLARS.map((p, i) => (
            <li
              key={p.title}
              className="ab-pillar flex gap-5 border-b border-fuel-ink/10 py-6"
            >
              <span className="pt-1 font-display text-[0.7rem] font-bold tracking-[0.2em] text-fuel-maroon">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-[1.25rem] font-bold leading-tight text-fuel-ink">
                  {p.title}
                </h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-fuel-ink/65">
                  {p.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Sign-off. The mark's cut-outs take the surface colour so they
            still read as holes on cream. */}
        <div
          className="ab-sign mx-auto mt-16 w-[62%] max-w-[260px]"
          style={{ "--logo-cream": "var(--color-fuel-cream)" } as CSSProperties}
        >
          <FuelLogo className="h-auto w-full" aria-label="FUEL" />
          <FuelTagline className="mt-4" style={{ fontSize: "0.62rem" }} />
        </div>
      </div>
    </section>
  );
}
