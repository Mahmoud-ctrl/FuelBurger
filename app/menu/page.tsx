import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import NextImage, { type StaticImageData } from "next/image";
import { FuelLogo, FuelTagline } from "@/components/fuel-logo";
import classic from "@/public/burgers/classic.webp";
import signature from "@/public/burgers/signature.webp";
import loaded from "@/public/burgers/loaded.webp";
import bowlClassic from "@/public/starters/bowl-classic.webp";
import bowlJalapeno from "@/public/starters/bowl-jalapeno.webp";

export const metadata: Metadata = {
  title: "Menu — FUEL",
  description:
    "Three smashed builds, two cheese bombs and fries that are fried twice.",
};

type Item = {
  name: string;
  body: string;
  image: StaticImageData;
  alt: string;
  /** In US dollars. */
  price: number;
  /** Small line under the description, e.g. the heat. */
  note?: string;
};

/** Whole dollars, so no cents: 9 -> "$9". */
const usd = (n: number) => `$${n}`;

/* Copy is the home page's, so the two never disagree. */
const BURGERS: Item[] = [
  {
    name: "Classic",
    body: "Double cheeseburger with lettuce and tomato.",
    image: classic,
    alt: "Double cheeseburger with lettuce and tomato",
    price: 9,
  },
  {
    name: "Signature",
    body: "Brioche, aged cheddar and smashed 80/20 beef, with lettuce and tomato.",
    image: signature,
    alt: "Signature burger with lettuce, tomato and melted cheddar",
    price: 11,
  },
  {
    name: "Loaded",
    body: "Smashed beef, bacon and crispy onion rings.",
    image: loaded,
    alt: "Bacon burger with crispy onion rings",
    price: 10,
  },
];

const STARTERS: Item[] = [
  {
    name: "Cheese Bombs",
    body: "Mozzarella packed in a seasoned crumb and fried until it shatters. Pull slow.",
    image: bowlClassic,
    alt: "A bowl of crumb-fried mozzarella cheese balls, one pulled open",
    price: 7,
    note: "No heat",
  },
  {
    name: "Jalapeño Bombs",
    body: "Same molten middle, loaded with fresh-cut jalapeño. Brings a kick, not a fire.",
    image: bowlJalapeno,
    alt: "A bowl of jalapeño cheese balls topped with fresh jalapeño slices",
    price: 7,
    note: "Medium kick",
  },
];

const FRIES_PRICE = 4;

const SECTIONS = [
  { id: "burgers", label: "Burgers" },
  { id: "starters", label: "Starters" },
  { id: "fries", label: "Fries" },
];

function Eyebrow({ id, children }: { id: string; children: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="block h-px w-8 bg-fuel-maroon" />
      <h2
        id={id}
        className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-fuel-maroon"
      >
        {children}
      </h2>
    </div>
  );
}

/**
 * `eager` for the list that sits above the fold: its first photo is the LCP,
 * so only that one loads eagerly (and gets React's preload link). The rest
 * are lazy, but near enough the viewport that they start straight away.
 */
function Items({ items, eager = false }: { items: Item[]; eager?: boolean }) {
  return (
    <ol className="mt-6 border-t border-fuel-ink/10">
      {items.map((item, i) => (
        <li
          key={item.name}
          className="flex items-center gap-5 border-b border-fuel-ink/10 py-5"
        >
          <div className="relative aspect-square w-[34%] max-w-[9.5rem] shrink-0">
            <NextImage
              src={item.image}
              alt={item.alt}
              sizes="(max-width: 520px) 34vw, 152px"
              loading={eager && i === 0 ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_10px_12px_rgba(42,20,16,.22)]"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[0.62rem] font-bold tracking-[0.2em] text-fuel-maroon">
              {String(i + 1).padStart(2, "0")}
            </p>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <h3 className="min-w-0 font-display text-[1.35rem] font-bold leading-tight text-fuel-ink">
                {item.name}
              </h3>
              <p className="shrink-0 font-display text-[1.2rem] font-bold text-fuel-maroon">
                {usd(item.price)}
              </p>
            </div>
            <p className="mt-2 text-[0.88rem] leading-relaxed text-fuel-ink/65">
              {item.body}
            </p>
            {item.note && (
              <p className="mt-3 font-display text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-fuel-ink/60">
                {item.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * The full menu on one static page. No motion and no client JS: this is the
 * page people come back to when they already know what they want.
 */
export default function MenuPage() {
  return (
    <main className="flex min-h-screen flex-col bg-fuel-maroon">
      <section className="fuel-grain relative isolate bg-fuel-maroon pb-16">
        <div className="mx-auto w-full max-w-[520px] px-5 pt-5">
          <header className="flex items-center justify-between">
            <Link href="/" aria-label="FUEL home">
              <FuelLogo aria-hidden className="logo-on-maroon h-auto w-[92px]" />
            </Link>
            <Link
              href="/"
              className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-fuel-cream/65 underline decoration-fuel-gold/50 underline-offset-[6px]"
            >
              Back home
            </Link>
          </header>
          <div className="mt-4 h-px w-full bg-fuel-gold/20" />

          <div className="mt-9 flex items-center gap-3">
            <span className="block h-px w-8 bg-fuel-gold" />
            <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-fuel-gold">
              Smashed to order
            </span>
          </div>
          <h1 className="mt-4 font-display text-[2.9rem] font-bold leading-[0.95] tracking-[-0.02em] text-fuel-cream">
            The <span className="text-fuel-gold">menu.</span>
          </h1>
          <p className="mt-4 max-w-[18rem] text-[0.92rem] leading-relaxed text-fuel-cream/60">
            One flat top, three builds, and absolutely no patience for bland.
          </p>

          <nav aria-label="Menu sections" className="mt-8 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-fuel-gold/40 px-4 py-2.5 font-display text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-fuel-cream/80"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* The same cream sheet over maroon as the home page's sections. */}
      <div className="fuel-grain relative isolate z-10 -mt-7 flex-1 overflow-hidden rounded-t-[28px] bg-fuel-cream pb-16 pt-14">
        <div className="mx-auto w-full max-w-[520px] px-5">
          <section id="burgers" aria-labelledby="burgers-title" className="scroll-mt-6">
            <Eyebrow id="burgers-title">Burgers</Eyebrow>
            <Items items={BURGERS} eager />
          </section>

          <section
            id="starters"
            aria-labelledby="starters-title"
            className="mt-14 scroll-mt-6"
          >
            <Eyebrow id="starters-title">Starters</Eyebrow>
            <Items items={STARTERS} />
          </section>

          <section
            id="fries"
            aria-labelledby="fries-title"
            className="mt-14 scroll-mt-6"
          >
            <Eyebrow id="fries-title">Fries</Eyebrow>
            <div className="fuel-grain relative isolate mt-6 overflow-hidden rounded-[22px] bg-fuel-maroon px-6 py-8">
              <p className="font-display text-[1.9rem] font-bold leading-[0.95] tracking-[-0.02em] text-fuel-cream">
                Twice-fried.
                <br />
                Never <span className="text-fuel-gold">limp.</span>
              </p>
              <p className="mt-3 max-w-[17rem] text-[0.92rem] leading-relaxed text-fuel-cream/65">
                Hand-cut, fried twice, and salted the second they leave the oil.
              </p>
            </div>
          </section>

          {/* Sign-off, as on the home page. The mark's cut-outs take the
              surface colour so they still read as holes on cream. */}
          <div
            className="mx-auto mt-16 w-[52%] max-w-[220px]"
            style={{ "--logo-cream": "var(--color-fuel-cream)" } as CSSProperties}
          >
            <Link href="/" aria-label="FUEL home" className="block">
              <FuelLogo aria-hidden className="h-auto w-full" />
            </Link>
            <FuelTagline className="mt-4" style={{ fontSize: "0.62rem" }} />
          </div>
        </div>
      </div>
    </main>
  );
}
