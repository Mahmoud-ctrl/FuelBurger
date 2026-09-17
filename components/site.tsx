"use client";

import { useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hero } from "./hero";
import { IntroSequence } from "./intro-sequence";

gsap.registerPlugin(ScrollTrigger);

export function Site() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <>
      <Hero play={introDone} />

      {/* Next section — placeholder. The framed block is a photo-shaped
          slot, sized so a real image drops straight in. */}
      <section
        id="menu"
        className="fuel-grain relative isolate min-h-[100dvh] bg-fuel-char px-5 py-20"
      >
        <div className="mx-auto w-full max-w-[26rem]">
          <div className="flex items-center gap-3">
            <span className="block h-px w-8 bg-fuel-gold" />
            <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-fuel-gold">
              The menu
            </span>
          </div>
          <h2 className="mt-4 font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.02em] text-fuel-cream">
            Sections go here.
          </h2>
          <div className="mt-8 aspect-[4/5] w-full rounded-2xl border border-fuel-gold/20 bg-fuel-maroon/30">
            <div className="flex h-full items-center justify-center">
              <span className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-fuel-cream/35">
                Image slot
              </span>
            </div>
          </div>
        </div>
      </section>

      <IntroSequence
        onFinish={() => {
          setIntroDone(true);
          // The scroll lock lifts with the overlay — remeasure so the
          // parallax triggers are accurate.
          ScrollTrigger.refresh();
        }}
      />
    </>
  );
}
