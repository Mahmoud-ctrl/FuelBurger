"use client";

import { useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { About } from "./about";
import { Hero } from "./hero";
import { IntroSequence } from "./intro-sequence";
import { Fries } from "./fries";
import { Starters } from "./starters";

gsap.registerPlugin(ScrollTrigger);

export function Site() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <>
      <Hero play={introDone} />
      <Starters play={introDone} />
      <Fries play={introDone} />
      <About play={introDone} />

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
