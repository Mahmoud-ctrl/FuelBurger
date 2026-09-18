"use client";

import { useCallback, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { About } from "./about";
import { Hero } from "./hero";
import { IntroSequence } from "./intro-sequence";
import { Fries } from "./fries";
import { NavMenu } from "./nav-menu";
import { Starters } from "./starters";

gsap.registerPlugin(ScrollTrigger);

export function Site() {
  const [introDone, setIntroDone] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  // Stable, because the menu's open effect depends on it: a new function
  // every render would tear the scroll lock down and put it back.
  const closeNav = useCallback(() => setNavOpen(false), []);

  return (
    <>
      <Hero
        play={introDone}
        navOpen={navOpen}
        onOpenNav={() => setNavOpen(true)}
      />
      <Starters play={introDone} />
      <Fries play={introDone} />
      <About play={introDone} />

      <NavMenu open={navOpen} onClose={closeNav} />

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
