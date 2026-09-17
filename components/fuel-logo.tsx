import type { SVGProps } from "react";

/**
 * FUEL wordmark, rebuilt as vector from the source artwork.
 *
 * Coordinate system: viewBox 0 0 344 57.
 *   - cap height 37 (y 19 -> 56), stroke weight 9, letter advance 88
 *   - the "U" is the burger: dome (y 0-22), cream gap, body (y 25-56)
 *   - burger centre sits at x 127, i.e. 13.08% left of the mark's centre
 *
 * Every animatable piece carries a `data-part` hook so the loader can drive
 * it without importing refs. Colours come from CSS custom properties so the
 * whole mark can be recoloured with one tween.
 */

/** [cx, cy, rotation] — sesame seeds scattered inside the dome ellipse. */
const SEEDS: ReadonlyArray<readonly [number, number, number]> = [
  [100, 17, -18],
  [108, 11, 12],
  [116, 16, -8],
  [113, 6, 24],
  [124, 10, -14],
  [131, 16, 8],
  [128, 4, -6],
  [139, 7, 18],
  [143, 14, -20],
  [151, 10, 6],
  [156, 16, -12],
  [149, 18, 14],
  [121, 19, 20],
];

export function FuelLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 344 57"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="FUEL"
      className={className}
      {...props}
    >
      {/* ---- F E L ------------------------------------------------ */}
      <g data-part="letters" fill="var(--logo-letter)">
        <path
          data-part="letter-f"
          d="M81 19 H9 A9 9 0 0 0 0 28 V56 H10 V42 H79 V33 H10 V28 H81 Z"
        />
        <path
          data-part="letter-e"
          d="M256 19 H183 A9 9 0 0 0 174 28 V56 H256 V47 H185 V42 H254 V33 H185 V28 H256 Z"
        />
        <path data-part="letter-l" d="M262 19 H272 V47 H343 V56 H262 Z" />
      </g>

      {/* ---- U, as a burger --------------------------------------- */}
      <g data-part="burger">
        {/* top bun */}
        <path
          data-part="bun-top"
          fill="var(--logo-gold)"
          d="M86 22 A41 22 0 0 1 168 22 Z"
        />
        <g data-part="seeds" fill="var(--logo-cream)">
          {SEEDS.map(([cx, cy, rot]) => (
            <ellipse
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              rx={1.45}
              ry={0.9}
              transform={`rotate(${rot} ${cx} ${cy})`}
            />
          ))}
        </g>

        {/* bottom bun */}
        <path
          data-part="bun-body"
          fill="var(--logo-gold)"
          d="M89 25 H165 A3 3 0 0 1 168 28 V40 A16 16 0 0 1 152 56 H102 A16 16 0 0 1 86 40 V28 A3 3 0 0 1 89 25 Z"
        />

        {/* cheese band + patty, sitting just under the crown */}
        <rect
          data-part="fillings"
          fill="var(--logo-cream)"
          x="97"
          y="25"
          width="61"
          height="8.5"
        />
        <rect
          data-part="patty"
          fill="var(--logo-patty)"
          x="97"
          y="28"
          width="60"
          height="3.2"
        />

        {/* lettuce fold — wide wings with a V dropping through the bun */}
        <path
          data-part="napkin"
          fill="var(--logo-cream)"
          d="M98 42 H156 L153 45 L149 46 L141 56 H138 L124 46 L101 45 Z"
        />
      </g>
    </svg>
  );
}

const TAGLINE_WORDS = [
  { text: "Recharge", tone: "text-fuel-maroon", weight: "font-bold" },
  { text: "Your", tone: "text-fuel-gold", weight: "font-medium" },
  { text: "Stomach", tone: "text-fuel-maroon", weight: "font-bold" },
] as const;

/**
 * Each word sits in its own overflow mask so the loader can wipe them up
 * from below. The inner span must be inline-block — transforms are ignored
 * on inline elements.
 */
export function FuelTagline({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <p
      data-part="tagline"
      style={style}
      className={`flex justify-center gap-[0.5em] font-display uppercase leading-none tracking-[0.2em] ${className}`}
    >
      {TAGLINE_WORDS.map((word) => (
        <span
          key={word.text}
          className="inline-block overflow-hidden pb-[0.15em]"
        >
          <span
            data-part="tagline-word"
            className={`inline-block ${word.tone} ${word.weight}`}
          >
            {word.text}
          </span>
        </span>
      ))}
    </p>
  );
}

/**
 * The full lockup — mark plus tagline. The intro loader and the hero both
 * render this inside a centred grid cell, so the mark occupies the exact
 * same pixels in both and the handoff crossfade is seamless. Change the
 * sizing here, never at a call site.
 */
export function FuelLockup({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-[78vw] max-w-[340px] ${className}`}>
      <FuelLogo className="w-full overflow-visible" />
      <div className="fuel-tagline absolute left-0 top-full w-full pt-[5%]">
        <FuelTagline style={{ fontSize: "min(3.2vw, 13px)" }} />
      </div>
    </div>
  );
}
