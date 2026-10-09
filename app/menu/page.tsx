import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import NextImage, { type StaticImageData } from "next/image";
import { FuelLogo, FuelTagline } from "@/components/fuel-logo";

export const metadata: Metadata = {
  title: "Menu — FUEL",
  description:
    "Chicken, Nashville and smashed beef burgers, loaded fries, crispy, wings and hot dogs.",
};

type Item = {
  name: string;
  body: string;
  /** In US dollars. Left out where the price isn't set yet. */
  price?: number;
  /** One pick the guest makes, e.g. the sauce the tenders are dipped in. */
  choice?: { label: string; options: string[] };
  /** Same dish by the piece, each size with its own price. */
  sizes?: Size[];
  /**
   * The client's own photo, once it's shot. Until then the row shows a
   * placeholder tile, so adding a photo is this one field.
   */
  photo?: { src: StaticImageData; alt: string };
};

type Size = { pieces: number; price: number; note?: string };

/** Whole dollars stay whole, the rest get cents: 6 -> "$6", 6.5 -> "$6.50". */
const usd = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

const TENDER_SAUCES = ["BBQ", "Buffalo", "Honey Mustard", "Sweet Chili"];

const CHICKEN: Item[] = [
  {
    name: "Crunchy Zinger",
    body: "Fried chicken breast, smoked turkey, BBQ, cheddar, cocktail sauce, iceberg, pickles and nachos.",
    price: 6,
  },
  {
    name: "Escalop Burger",
    body: "Chicken, garlic sauce, coleslaw, french fries and pickles.",
    price: 5,
  },
  {
    name: "Sweet Chili Burger",
    body: "Fried chicken breast dipped in sweet chili, ranch, two jalapeño bites, chips and pickles.",
    price: 6.5,
  },
  {
    name: "BBQ Bomb",
    body: "Fried chicken breast dipped in BBQ, a mozzarella patty, chips, iceberg, pickles and special sauce.",
    price: 6.5,
  },
  {
    name: "Fuel Burger",
    body: "Double fried chicken breast, pickles, mighty sauce, mayo pepper sauce, iceberg and cheddar.",
    price: 6.5,
  },
  {
    name: "Octane 95",
    body: "Fried chicken breast dipped in honey mustard, a mozzarella patty, chips, iceberg, pickles and special sauce.",
    price: 7,
  },
];

const NASHVILLE: Item[] = [
  {
    name: "Nashville Burger",
    body: "Nashville fried chicken breast, coleslaw, dill pickles, fuel sauce and Nashville sauce.",
    price: 6.5,
  },
  {
    name: "Hot Nashville Burger",
    body: "Nashville fried chicken breast with hot spices, coleslaw, honey, dill pickles, fuel sauce and Nashville sauce.",
    price: 6.5,
  },
];

const BEEF: Item[] = [
  {
    name: "Lebanese Burger",
    body: "130g beef patty, mayo salad, fries, pickles and ketchup.",
    price: 5,
  },
  {
    name: "Double Smash Burger",
    body: "150g of smashed beef patties, two slices of cheddar, iceberg, smash sauce, caramelized onion and pickles.",
    price: 6.5,
  },
  {
    name: "Mushroom Burger",
    body: "Beef patty, mushroom sauce, swiss cheese and special sauce.",
    price: 7.5,
  },
  {
    name: "Octane 98",
    body: "Three smashed beef patties, sweet jalapeños, bacon, fried onion, smash sauce and three slices of cheddar.",
    price: 8.5,
  },
];

const LOADED: Item[] = [
  {
    name: "Honey Loaded",
    body: "French fries, jalapeños and tenders dipped in honey mustard.",
    price: 5.5,
  },
  {
    name: "BBQ Loaded",
    body: "French fries, jalapeños and tenders dipped in BBQ.",
    price: 5.5,
  },
  {
    name: "Buffalo Loaded",
    body: "French fries, jalapeños and tenders dipped in buffalo.",
    price: 5.5,
  },
  {
    name: "Mac Attack",
    body: "Fries, mac and cheese, Nashville tenders and special sauce.",
    price: 5.5,
  },
];

const HOT_DOGS: Item[] = [
  {
    name: "Classic Hot Dog",
    body: "Hot dog, ketchup, mayo and mustard.",
  },
  {
    name: "Fuel Signature Hot Dog",
    body: "Hot dog, cheddar sauce, BBQ sauce, pickles and chips.",
  },
];

const CRISPY: Item[] = [
  {
    name: "Crispy",
    body: "Served with french fries, coleslaw, garlic sauce and cocktail sauce.",
    sizes: [
      { pieces: 3, price: 7 },
      { pieces: 5, price: 9 },
      { pieces: 7, price: 12 },
      { pieces: 10, price: 14 },
    ],
  },
];

const WINGS: Item[] = [
  {
    name: "Wings",
    body: "Tossed in one sauce of your choice.",
    choice: { label: "Pick one sauce", options: TENDER_SAUCES },
    sizes: [
      { pieces: 6, price: 3, note: "Half portion" },
      { pieces: 12, price: 5.5 },
    ],
  },
];

const APPETIZERS: Item[] = [
  {
    name: "French Fries",
    body: "A pack of fries.",
    price: 2,
  },
  {
    name: "Mozzarella Sticks",
    body: "Four sticks, served with cocktail sauce.",
    price: 4,
  },
  {
    name: "Jalapeño Bites",
    body: "Four bites.",
    price: 4,
  },
  {
    name: "Tenders",
    body: "Four tenders, dipped in one sauce of your choice.",
    price: 5,
    choice: { label: "Pick one sauce", options: TENDER_SAUCES },
  },
];

const DIPS = [
  "BBQ",
  "Mighty Sauce",
  "Honey Mustard",
  "Cheddar",
  "Cocktail",
  "Fuel Sauce",
  "Ranch",
  "Sweet Chili",
];
const DIP_PRICE = 0.35;

const DRINKS_PRICE = 1;

const SECTIONS = [
  { id: "chicken", label: "Chicken" },
  { id: "nashville", label: "Nashville" },
  { id: "beef", label: "Beef" },
  { id: "loaded", label: "Loaded" },
  { id: "hot-dogs", label: "Hot dogs" },
  { id: "crispy", label: "Crispy" },
  { id: "wings", label: "Wings" },
  { id: "appetizers", label: "Appetizers" },
  { id: "dips", label: "Dips" },
  { id: "drinks", label: "Drinks" },
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

/** A line under the eyebrow, for anything the whole section shares. */
function SectionNote({ children }: { children: string }) {
  return (
    <p className="mt-3 max-w-[22rem] text-[0.88rem] leading-relaxed text-fuel-ink/65">
      {children}
    </p>
  );
}

function Section({
  id,
  title,
  first = false,
  children,
}: {
  id: string;
  title: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`scroll-mt-6 ${first ? "" : "mt-14"}`}
    >
      <Eyebrow id={`${id}-title`}>{title}</Eyebrow>
      {children}
    </section>
  );
}

/** Small pill, for sauce picks and dips. */
function Tag({ children }: { children: string }) {
  return (
    <li className="rounded-full border border-fuel-maroon/25 px-3 py-1.5 font-display text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-fuel-maroon">
      {children}
    </li>
  );
}

function Tags({ items, label }: { items: string[]; label?: string }) {
  return (
    <div className="mt-3">
      {label && (
        <p className="font-display text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-fuel-ink/60">
          {label}
        </p>
      )}
      <ul className={`flex flex-wrap gap-1.5 ${label ? "mt-2" : ""}`}>
        {items.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </ul>
    </div>
  );
}

/**
 * Stands in for the photo until the client's are shot: the dish's initial on
 * the brand maroon. Plain type, no image, so it costs nothing to load.
 */
function PhotoTile({ item }: { item: Item }) {
  return (
    <div className="relative aspect-square w-[26%] max-w-[7.5rem] shrink-0 self-start">
      {item.photo ? (
        <NextImage
          src={item.photo.src}
          alt={item.photo.alt}
          sizes="(max-width: 520px) 26vw, 120px"
          className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_10px_12px_rgba(42,20,16,.22)]"
        />
      ) : (
        <div
          aria-hidden
          className="fuel-grain absolute inset-0 isolate flex items-center justify-center overflow-hidden rounded-[18px] bg-fuel-maroon"
        >
          <span className="font-display text-[clamp(2rem,9vw,2.9rem)] font-black leading-none text-fuel-gold">
            {item.name[0]}
          </span>
        </div>
      )}
    </div>
  );
}

function Items({ items }: { items: Item[] }) {
  return (
    <ol className="mt-6 border-t border-fuel-ink/10">
      {items.map((item, i) => (
        <li
          key={item.name}
          className="flex items-center gap-5 border-b border-fuel-ink/10 py-5"
        >
          <PhotoTile item={item} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[0.62rem] font-bold tracking-[0.2em] text-fuel-maroon">
              {String(i + 1).padStart(2, "0")}
            </p>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <h3 className="min-w-0 font-display text-[1.2rem] font-bold leading-tight text-fuel-ink">
                {item.name}
              </h3>
              {item.price !== undefined && (
                <p className="shrink-0 font-display text-[1.1rem] font-bold text-fuel-maroon">
                  {usd(item.price)}
                </p>
              )}
            </div>
            <p className="mt-2 text-[0.85rem] leading-relaxed text-fuel-ink/65">
              {item.body}
            </p>
            {item.choice && (
              <Tags label={item.choice.label} items={item.choice.options} />
            )}
            {item.sizes && <Sizes sizes={item.sizes} />}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** One line per size, priced like the rows themselves. */
function Sizes({ sizes }: { sizes: Size[] }) {
  return (
    <ul className="mt-3 border-t border-dashed border-fuel-ink/15">
      {sizes.map((s) => (
        <li
          key={s.pieces}
          className="flex items-baseline justify-between gap-3 border-b border-dashed border-fuel-ink/15 py-2"
        >
          <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-fuel-ink/70">
            {s.pieces} pcs
            {s.note && <span className="text-fuel-ink/45"> · {s.note}</span>}
          </span>
          <span className="shrink-0 font-display text-[0.95rem] font-bold text-fuel-maroon">
            {usd(s.price)}
          </span>
        </li>
      ))}
    </ul>
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
              Made to order
            </span>
          </div>
          <h1 className="mt-4 font-display text-[2.9rem] font-bold leading-[0.95] tracking-[-0.02em] text-fuel-cream">
            The <span className="text-fuel-gold">menu.</span>
          </h1>
          <p className="mt-4 max-w-[18rem] text-[0.92rem] leading-relaxed text-fuel-cream/60">
            Crunchy chicken, smashed beef, and absolutely no patience for bland.
          </p>

          {/* One swipeable row instead of four wrapped ones. It runs to the
              screen edges so the cut-off pill shows there is more. */}
          <nav
            aria-label="Menu sections"
            className="-mx-5 mt-8 flex gap-2 overflow-x-auto overscroll-x-contain px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="shrink-0 whitespace-nowrap rounded-full border border-fuel-gold/40 px-4 py-2.5 font-display text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-fuel-cream/80"
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
          <Section id="chicken" title="Chicken burgers" first>
            <Items items={CHICKEN} />
          </Section>

          <Section id="nashville" title="Nashville burgers">
            <Items items={NASHVILLE} />
          </Section>

          <Section id="beef" title="Beef burgers">
            <Items items={BEEF} />
          </Section>

          <Section id="loaded" title="Loaded">
            <SectionNote>
              Every Loaded box comes with your choice of dipping sauce.
            </SectionNote>
            <Items items={LOADED} />
          </Section>

          <Section id="hot-dogs" title="Hot dogs">
            <Items items={HOT_DOGS} />
          </Section>

          <Section id="crispy" title="Crispy">
            <Items items={CRISPY} />
          </Section>

          <Section id="wings" title="Wings">
            <Items items={WINGS} />
          </Section>

          <Section id="appetizers" title="Appetizers">
            <Items items={APPETIZERS} />
          </Section>

          <Section id="dips" title="Dips">
            <div className="mt-6 flex items-baseline justify-between gap-3 border-t border-fuel-ink/10 pt-5">
              <p className="font-display text-[1.2rem] font-bold leading-tight text-fuel-ink">
                Cup of sauce
              </p>
              <p className="shrink-0 font-display text-[1.1rem] font-bold text-fuel-maroon">
                {usd(DIP_PRICE)}
              </p>
            </div>
            <Tags items={DIPS} />
          </Section>

          <Section id="drinks" title="Drinks">
            <div className="mt-6 flex items-baseline justify-between gap-3 border-y border-fuel-ink/10 py-5">
              <p className="font-display text-[1.2rem] font-bold leading-tight text-fuel-ink">
                Soft drinks
              </p>
              <p className="shrink-0 font-display text-[1.1rem] font-bold text-fuel-maroon">
                {usd(DRINKS_PRICE)}
              </p>
            </div>
          </Section>

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
