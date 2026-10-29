import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { FuelLogo, FuelTagline } from "@/components/fuel-logo";
import {
  APPETIZERS,
  BEEF,
  CHICKEN,
  CRISPY,
  DIP_PRICE,
  DIPS,
  DRINKS_PRICE,
  EXTRA_PRICE,
  HOT_DOGS,
  type Item,
  LOADED,
  LOADED_NOTE,
  NASHVILLE,
  usd,
  WINGS,
} from "@/components/menu-data";

export const metadata: Metadata = {
  title: "Menu board — FUEL",
  robots: { index: false, follow: false },
};

/*
 * The printed light-box menu, as a page so it uses the real logo, fonts and
 * prices. Open it and print to PDF (or run the export script): the page box
 * is the board, so it comes out as exactly one page at any print size.
 *
 * Fixed canvas, 3:4. Everything inside is in CSS px of this canvas.
 */
const W = 1200;
const H = 1600;

const PRINT_CSS = `
@page { size: ${W}px ${H}px; margin: 0; }
html, body { margin: 0; padding: 0; background: var(--color-fuel-cream); }
`;

function Heading({ children, price }: { children: string; price?: number }) {
  return (
    <div className="flex items-baseline">
      <h2 className="font-display text-[46px] font-extrabold uppercase leading-none tracking-[-0.01em] text-fuel-gold">
        {children}
      </h2>
      {price !== undefined && (
        <>
          <Leader />
          <Price value={price} />
        </>
      )}
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 text-balance font-display text-[19px] font-medium leading-snug text-fuel-ink/75">
      {children}
    </p>
  );
}

/** Dotted line from the name to the price, sitting on the text baseline. */
function Leader() {
  return (
    <span
      aria-hidden
      className="mx-4 min-w-6 flex-1 translate-y-[-0.28em] border-b-[3px] border-dotted border-fuel-ink/35"
    />
  );
}

function Price({ value }: { value: number }) {
  return (
    <span className="shrink-0 font-display text-[29px] font-bold leading-none text-fuel-maroon">
      {usd(value)}
    </span>
  );
}

function Row({ name, price }: { name: string; price: number }) {
  return (
    <li className="flex items-baseline">
      <span className="font-display text-[27px] font-semibold leading-none text-fuel-ink">
        {name}
      </span>
      <Leader />
      <Price value={price} />
    </li>
  );
}

function Rows({ children }: { children: ReactNode }) {
  return <ul className="mt-6 flex flex-col gap-[18px]">{children}</ul>;
}

function ItemRows({ items }: { items: Item[] }) {
  return (
    <Rows>
      {items.map((item) =>
        item.price === undefined ? null : (
          <Row
            key={item.name}
            name={item.count ? `${item.name} (${item.count})` : item.name}
            price={item.price}
          />
        ),
      )}
    </Rows>
  );
}

function SizeRows({ item }: { item: Item }) {
  return (
    <Rows>
      {item.sizes?.map((s) => (
        <Row key={s.pieces} name={`${s.pieces} pcs`} price={s.price} />
      ))}
    </Rows>
  );
}

export default function MenuBoardPage() {
  const crispy = CRISPY[0];
  const wings = WINGS[0];

  return (
    <>
      <style>{PRINT_CSS}</style>
      <main
        className="relative mx-auto flex flex-col overflow-hidden bg-fuel-cream px-[72px] pb-[64px] pt-[56px]"
        style={
          {
            width: W,
            height: H,
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
            // The burger's cut-outs read as holes, so they take the board's colour.
            "--logo-cream": "var(--color-fuel-cream)",
          } as CSSProperties
        }
      >
        <header className="relative">
          <p className="absolute left-0 top-[14px] font-display text-[24px] font-extrabold uppercase leading-[1.15] text-fuel-maroon">
            Smashed.
            <br />
            Fried.
            <br />
            Loaded.
          </p>
          <div className="mx-auto w-[600px]">
            <FuelLogo aria-hidden className="h-auto w-full" />
            <FuelTagline className="mt-6" style={{ fontSize: "26px" }} />
          </div>
        </header>

        <div className="mt-16 grid flex-1 grid-cols-2">
          <div className="flex flex-col justify-between pr-[52px]">
            <section>
              <Heading>Chicken burgers</Heading>
              <ItemRows items={CHICKEN} />
            </section>
            <section>
              <Heading>Nashville</Heading>
              <ItemRows items={NASHVILLE} />
            </section>
            <section>
              <Heading>Beef burgers</Heading>
              <ItemRows items={BEEF} />
            </section>
            <section>
              <Heading>Loaded</Heading>
              <Note>{LOADED_NOTE}</Note>
              <ItemRows items={LOADED} />
            </section>
          </div>

          <div className="flex flex-col justify-between pl-[52px]">
            <section>
              <Heading>Hot dogs</Heading>
              <ItemRows items={HOT_DOGS} />
            </section>
            <section>
              <Heading>{crispy.name}</Heading>
              <Note>{crispy.body}</Note>
              <SizeRows item={crispy} />
            </section>
            <section>
              <Heading>{wings.name}</Heading>
              <Note>{wings.choice?.options.join(" / ")}</Note>
              <SizeRows item={wings} />
            </section>
            <section>
              <Heading>Appetizers</Heading>
              <ItemRows items={APPETIZERS} />
            </section>
            <section>
              <Heading price={DIP_PRICE}>Dips</Heading>
              {/* Two even lines, so no line starts or ends on a dot. */}
              <Note>
                {DIPS.slice(0, Math.ceil(DIPS.length / 2)).join(" · ")}
                <br />
                {DIPS.slice(Math.ceil(DIPS.length / 2)).join(" · ")}
              </Note>
            </section>
            <section>
              <Heading price={DRINKS_PRICE}>Soft drinks</Heading>
            </section>
            <section>
              <Heading price={EXTRA_PRICE}>Extras</Heading>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
