"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import NextImage, { type StaticImageData } from "next/image";
import { FuelLogo } from "./fuel-logo";
import {
  createFrameSequence,
  EDGE_FADE,
  FRAME_COUNT,
  FRAME_H,
  FRAME_W,
  POSTER_TOP,
  POSTER_W,
} from "./burger-frames";
import classic from "@/public/burgers/classic.webp";
import signature from "@/public/burgers/signature.webp";
import loaded from "@/public/burgers/loaded.webp";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Three burgers converge into a lineup: the centre one slams down from
 * above, then the flanks sweep in from either side.
 *
 * The copy is never animated — it is on screen the instant the intro's
 * liquid hands over, so the page is readable immediately and only the
 * burgers arrive.
 */
function Photo({
  className,
  src,
  alt,
  depth = "back",
  priority,
}: {
  className: string;
  src: StaticImageData;
  alt: string;
  depth?: "front" | "back";
  priority?: boolean;
}) {
  // Depth is carried by three things at once: size, a softer shadow, and a
  // little less light on the ones set back.
  const filter =
    depth === "front"
      ? "drop-shadow(0 20px 28px rgba(24,3,6,.6))"
      : "drop-shadow(0 12px 18px rgba(24,3,6,.45)) brightness(0.86)";
  return (
    <div className={`burger absolute ${className}`} style={{ filter }}>
      <div className="burger-inner">
        <NextImage
          src={src}
          alt={alt}
          sizes="(max-width: 520px) 60vw, 320px"
          priority={priority}
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}

export function Hero({ play }: { play: boolean }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  // Park the burgers off-screen before first paint. They sit under the
  // intro overlay until `play` flips, so nothing is ever seen out of place.
  useGSAP(
    () => {
      gsap.set(".burger", { transformOrigin: "50% 100%" });
      gsap.set(".burger-centre", { y: "-75vh", rotate: -5 });
      gsap.set(".burger-left", { x: "-90vw", rotate: -22 });
      gsap.set(".burger-right", { x: "90vw", rotate: 22 });
      // Both belong to the scroll effect; nothing should see them at rest.
      gsap.set([".build-word", ".build-cta"], { opacity: 0 });
    },
    { scope: root, dependencies: [] },
  );

  useGSAP(
    () => {
      if (!play) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduced) {
        gsap.set(".burger-centre", { y: 0, rotate: 0 });
        gsap.set([".burger-left", ".burger-right"], { x: 0, rotate: 0 });
        return;
      }

      const tl = gsap.timeline();

      tl
        // centre drops under gravity and lands hard
        .to(
          ".burger-centre",
          { y: 0, rotate: 0, duration: 0.5, ease: "power2.in" },
          0,
        )
        .to(
          ".burger-centre",
          { scaleY: 0.86, scaleX: 1.08, duration: 0.09, ease: "power2.out" },
          0.5,
        )
        .to(
          ".burger-centre",
          {
            scaleY: 1,
            scaleX: 1,
            duration: 0.75,
            ease: "elastic.out(1, 0.42)",
          },
          0.59,
        )
        // the impact ripples up through its own layers
        .to(
          ".burger-centre [data-layer]",
          {
            y: -9,
            duration: 0.13,
            ease: "power2.out",
            stagger: { each: 0.028, from: "end" },
            yoyo: true,
            repeat: 1,
          },
          0.53,
        )

        // flanks sweep in to either side
        .to(
          ".burger-left",
          { x: 0, rotate: 0, duration: 0.8, ease: "back.out(1.35)" },
          0.46,
        )
        .to(
          ".burger-right",
          { x: 0, rotate: 0, duration: 0.8, ease: "back.out(1.35)" },
          0.58,
        );

      // Idle drift, once everyone has landed. Each layer on its own phase
      // so the burgers read as assembled rather than printed.
      tl.call(
        () => {
          gsap.to(".burger [data-float]", {
            y: "+=7",
            duration: 2.5,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            stagger: { each: 0.14, from: "random" },
          });
        },
        undefined,
        1.35,
      );

      // ---- scroll: the centre burger comes to the front, then comes apart ----
      //
      // The hero pins for this. The forward move lives on `.burger-inner` so it
      // never fights the entrance timeline above, which owns `.burger-centre`.
      // The flanks keep a plain parallax drift until they clear the screen.
      const drift = { left: -70, right: -96 } as const;
      (["left", "right"] as const).forEach((side) => {
        gsap.to(`.burger-${side} .burger-inner`, {
          y: drift[side],
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=60%",
            scrub: 0.5,
          },
        });
      });

      const seq = canvas.current ? createFrameSequence(canvas.current) : null;
      void seq?.load();

      // Where the burger has to travel to sit dead centre, at the size it
      // should be once it is the only thing on screen. Measured from layout
      // (offset*, which transforms do not affect) and recomputed on refresh.
      const forward = { scale: 1, x: 0, y: 0 };
      const measure = () => {
        const el = stage.current;
        const sec = root.current;
        if (!el || !sec) return;
        let x = 0;
        let y = 0;
        let node: HTMLElement | null = el;
        while (node && node !== sec) {
          x += node.offsetLeft;
          y += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (!w || !h) return;
        forward.scale = Math.min(sec.clientWidth * 0.98, 620) / w;
        forward.x = sec.clientWidth / 2 - (x + w / 2);
        // 0.45, not 0.5: the CTA sits at the bottom of the section, and on a
        // tall viewport a dead-centred burger grows down into it.
        forward.y = sec.clientHeight * 0.45 - (y + h / 2);
      };
      measure();

      const playhead = { frame: 0 };
      const SEPARATE_AT = 0.3;

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=260%",
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: measure,
        },
      });

      scrollTl
        // 1 — everything else clears out and the centre burger comes forward.
        .to(
          [".hero-copy", ".hero-actions"],
          { opacity: 0, y: -28, ease: "power1.in", duration: 0.22 },
          0,
        )
        // Deliberately no `rotate` here. The flanks are parked at rotate -22/+22
        // on mount and the entrance lands them at 0, but this timeline is built
        // in the same synchronous pass and first renders before the entrance
        // has run — so it would record the PARKED tilt as its start value and
        // scrolling back up would restore it instead of 0. xPercent and opacity
        // are safe: nothing else touches them.
        .to(
          ".burger-left",
          { xPercent: -52, opacity: 0, ease: "power2.in", duration: 0.24 },
          0,
        )
        .to(
          ".burger-right",
          { xPercent: 52, opacity: 0, ease: "power2.in", duration: 0.24 },
          0,
        )
        .to(
          ".burger-centre .burger-inner",
          {
            scale: () => forward.scale,
            x: () => forward.x,
            y: () => forward.y,
            ease: "power2.inOut",
            duration: SEPARATE_AT,
          },
          0,
        )

        // The word and the CTA arrive as the hero's own copy leaves.
        .fromTo(
          ".build-word",
          { opacity: 0, scale: 0.82 },
          { opacity: 1, scale: 1, ease: "power2.out", duration: 0.3 },
          0.04,
        )
        .fromTo(
          ".build-cta",
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, ease: "power2.out", duration: 0.22 },
          0.14,
        )

        // 2 — and it comes apart. The word drifts up behind it so the
        // composition keeps moving while the layers separate.
        .to(
          ".build-word",
          { yPercent: -5, ease: "none", duration: 1 - SEPARATE_AT },
          SEPARATE_AT,
        )
        .to(
          playhead,
          { frame: FRAME_COUNT - 1, ease: "none", duration: 1 - SEPARATE_AT },
          SEPARATE_AT,
        );

      // Paint from one place, both directions. The photo stays on top until the
      // canvas can actually paint, so a slow connection degrades to a burger
      // that comes forward and simply does not separate — never to a blank box.
      scrollTl.eventCallback("onUpdate", () => {
        const separating = scrollTl.progress() >= SEPARATE_AT;
        const painted = seq?.draw(separating ? playhead.frame : 0) ?? false;
        gsap.set(".burger-photo", {
          autoAlpha: painted && separating ? 0 : 1,
        });
      });

      const onResize = () => seq?.resize();
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        seq?.dispose();
      };
    },
    { scope: root, dependencies: [play] },
  );

  return (
    <section
      ref={root}
      // 100vh, not 100dvh: this section is pinned, and dvh is remeasured when
      // the iOS URL bar collapses, which moves the pin mid-scroll.
      className="fuel-grain relative isolate min-h-[100vh] overflow-hidden bg-fuel-maroon"
    >
      {/* warm pool of light behind the lineup */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(66% 40% at 50% 58%, rgba(237,174,63,.17) 0%, transparent 72%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 78% at 50% 50%, transparent 40%, rgba(37,6,10,.55) 100%)",
        }}
      />

      {/* Big word behind the burger. z-[1] puts it over the background wash but
          under the content column (z-10), so the bun rises in front of it.

          Sat high rather than dead centre: the burger ends up nearly as wide as
          the viewport, so a centred word would be entirely hidden behind it and
          one wide enough to escape would be cut off by both screen edges. Up
          here the whole word reads and the dome overlaps its lower half. */}
      <div
        aria-hidden
        className="build-word pointer-events-none absolute inset-x-0 top-[8%] z-[1] flex justify-center px-2"
      >
        {/* Stretched vertically rather than scaled up: width is what is scarce
            here (7 letters across a phone), height is free. transform-origin is
            the top so it grows down into the burger instead of off-screen, and
            the container must NOT clip — the glyphs overflow their line box. */}
        <span
          className="block font-display text-[clamp(2.4rem,18.5vw,7rem)] font-black uppercase leading-[0.8] tracking-[-0.055em] text-fuel-gold"
          style={{ transform: "scaleY(2.2)", transformOrigin: "top center" }}
        >
          Classic
        </span>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100vh] w-full max-w-[520px] flex-col px-5 pb-8 pt-5">
        {/* ---- nav ---- */}
        <header className="flex items-center justify-between">
          <FuelLogo className="logo-on-maroon h-auto w-[92px]" />
          <button
            type="button"
            aria-label="Open menu"
            className="flex h-9 w-9 flex-col items-end justify-center gap-[5px]"
          >
            <span className="block h-px w-6 bg-fuel-cream/70" />
            <span className="block h-px w-4 bg-fuel-cream/70" />
          </button>
        </header>
        <div className="mt-4 h-px w-full bg-fuel-gold/20" />

        {/* ---- copy ---- */}
        <div className="hero-copy mt-9">
          <div className="flex items-center gap-3">
            <span className="block h-px w-8 bg-fuel-gold" />
            <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-fuel-gold">
              Smashed to order
            </span>
          </div>
          <h1 className="mt-4 font-display text-[2.9rem] font-bold leading-[0.95] tracking-[-0.02em] text-fuel-cream">
            Three ways
            <br />
            to <span className="text-fuel-gold">refuel.</span>
          </h1>
          <p className="mt-4 max-w-[18rem] text-[0.92rem] leading-relaxed text-fuel-cream/60">
            One flat top, three builds, and absolutely no patience for bland.
          </p>
        </div>

        {/* ---- the trio ----
             A lineup, with the centre burger forward: it is the largest,
             it overlaps both flanks, and the two behind sit slightly
             higher and dimmer so they read as set back on the same plane. */}
        <div className="-mx-5 my-auto flex justify-center">
          <div className="relative aspect-[100/70] w-full max-w-[560px]">
            <Photo
              className="burger-left left-[-4%] top-[17%] z-10 w-[50%]"
              src={classic}
              alt="Double cheeseburger with lettuce and tomato"
            />
            <Photo
              className="burger-right left-[54%] top-[17%] z-10 w-[50%]"
              src={loaded}
              alt="Bacon burger with crispy onion rings"
            />
            {/* The centre burger is the one that comes forward and comes
                apart, so it is not a plain <Photo>: it is the frame box, with
                signature.webp positioned inside it and the canvas on top.
                top-[-5%] keeps the burger itself exactly where the square
                photo used to sit: the box is the frame's aspect and the frames
                carry headroom above the bun, so the box starts above the
                lineup. Recompute it if the crop or frame height changes.

                No drop shadow, unlike the flanks. The crop box would clip one
                into a hard horizontal edge, and the keyed frames carry no
                shadow anyway — so it would have to vanish at handover. Without
                it the burger is consistent the whole way through, and it still
                reads as nearest: it is larger, it overlaps both flanks, and it
                is not dimmed the way they are. */}
            <div className="burger burger-centre absolute left-[19%] top-[-5%] z-20 w-[62%]">
              <div className="burger-inner">
                <div
                  ref={stage}
                  className="relative overflow-hidden"
                  style={{
                    aspectRatio: `${FRAME_W} / ${FRAME_H}`,
                    maskImage: EDGE_FADE,
                    WebkitMaskImage: EDGE_FADE,
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                  }}
                >
                  <NextImage
                    src={signature}
                    alt="Signature burger with lettuce, tomato and melted cheddar"
                    sizes="(max-width: 560px) 100vw, 560px"
                    priority
                    className="burger-photo absolute left-0"
                    style={{
                      top: `${POSTER_TOP}%`,
                      width: `${POSTER_W}%`,
                      height: "auto",
                    }}
                  />
                  <canvas
                    ref={canvas}
                    aria-hidden
                    className="absolute inset-0 block h-full w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---- actions ---- */}
        <div className="hero-actions mt-auto flex flex-col items-center gap-4 pt-8">
          <a
            href="#menu"
            className="w-full max-w-[20rem] rounded-full bg-fuel-gold px-8 py-4 text-center font-display text-[0.78rem] font-bold uppercase tracking-[0.2em] text-fuel-maroon"
          >
            See the menu
          </a>
          <a
            href="#find-us"
            className="font-display text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-fuel-cream/65 underline decoration-fuel-gold/50 underline-offset-[6px]"
          >
            Find the truck
          </a>
        </div>
      </div>
      {/* Comes back once the burger owns the screen — the hero's own copy and
          CTA have faded out by then. The wrapper ignores pointer events so it
          never sits on top of the burger; only the link itself is clickable. */}
      <div className="build-cta pointer-events-none absolute inset-x-0 bottom-[7%] z-20 flex flex-col items-center gap-4 px-5">
        <p className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-fuel-cream/55">
          Brioche · aged cheddar · smashed 80/20
        </p>
        <a
          href="#menu"
          className="pointer-events-auto rounded-full bg-fuel-gold px-9 py-4 font-display text-[0.75rem] font-bold uppercase tracking-[0.2em] text-fuel-maroon"
        >
          Order yours
        </a>
      </div>
    </section>
  );
}
