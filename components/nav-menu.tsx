"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { INSTAGRAM_URL, WHATSAPP_URL } from "./contact";
import { FuelLogo } from "./fuel-logo";

/** The hero's menu button, so focus can go back to it on close. */
export const NAV_TOGGLE_ID = "nav-toggle";
export const NAV_PANEL_ID = "site-nav";

const ITEMS: { href: string; label: string; external?: boolean }[] = [
  { href: "/menu", label: "Menu" },
  { href: WHATSAPP_URL, label: "WhatsApp", external: true },
  { href: INSTAGRAM_URL, label: "Instagram", external: true },
  // An id on the home page, which is the only page this menu is on.
  { href: "#about", label: "About us" },
];

/**
 * The site menu: a full-screen panel over the home page.
 *
 * Rendered by Site rather than inside the hero, where the button lives: the
 * hero is overflow-hidden, and it is its own stacking context, so the
 * sections after it would paint over anything it contains. z-40 clears the
 * last of them (about, z-30) and stays under the intro (z-50).
 *
 * It stays in the DOM when closed, hidden with `invisible`, so the button's
 * aria-controls always points at something and the fade can run both ways.
 */
export function NavMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  /** Set when closing by Escape or the close button, not by a link. */
  const returnFocus = useRef(false);

  useEffect(() => {
    const el = panel.current;
    if (!open || !el) return;
    const html = document.documentElement;

    // Its own attribute, not the intro's: the intro clears that one when it
    // finishes and again on unmount, and would unlock the menu with it.
    html.setAttribute("data-nav-open", "true");
    // The rest of the page drops out of the tab order and the a11y tree.
    const behind = Array.from(el.parentElement?.children ?? []).filter(
      (c): c is HTMLElement => c !== el && c instanceof HTMLElement,
    );
    behind.forEach((c) => {
      c.inert = true;
    });
    closeButton.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      returnFocus.current = true;
      onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      html.removeAttribute("data-nav-open");
      behind.forEach((c) => {
        c.inert = false;
      });
      if (returnFocus.current) {
        returnFocus.current = false;
        // preventScroll: the button is in the hero, and the page may not be.
        document
          .getElementById(NAV_TOGGLE_ID)
          ?.focus({ preventScroll: true });
      }
    };
  }, [open, onClose]);

  // A link has to unlock the scroll before its own navigation runs, not on
  // the next render: the anchor jump happens straight after this handler.
  const leave = () => {
    document.documentElement.removeAttribute("data-nav-open");
    onClose();
  };

  return (
    <div
      ref={panel}
      id={NAV_PANEL_ID}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      // Visibility flips at once on open, so the close button can take focus
      // straight away, and is held to the end of the fade on close.
      className={`fuel-grain fixed inset-0 z-40 overflow-y-auto bg-fuel-maroon duration-300 motion-reduce:transition-none ${
        open
          ? "visible opacity-100 transition-opacity"
          : "invisible opacity-0 transition-[opacity,visibility]"
      }`}
    >
      {/* Same column and header as the hero, so the close button lands
          exactly on top of the menu button. */}
      <div className="relative mx-auto flex min-h-full w-full max-w-[520px] flex-col px-5 pb-10 pt-5">
        <div className="flex items-center justify-between">
          <FuelLogo aria-hidden className="logo-on-maroon h-auto w-[92px]" />
          <button
            ref={closeButton}
            type="button"
            aria-label="Close menu"
            onClick={() => {
              returnFocus.current = true;
              onClose();
            }}
            className="relative flex h-9 w-9 items-center justify-center"
          >
            <span className="absolute block h-px w-6 rotate-45 bg-fuel-cream/80" />
            <span className="absolute block h-px w-6 -rotate-45 bg-fuel-cream/80" />
          </button>
        </div>
        <div className="mt-4 h-px w-full bg-fuel-gold/20" />

        <nav aria-label="Main" className="mt-12">
          <ol className="border-t border-fuel-cream/10">
            {ITEMS.map((item, i) => {
              const className =
                "flex items-baseline gap-5 py-5 font-display text-fuel-cream";
              const body = (
                <>
                  <span className="text-[0.7rem] font-bold tracking-[0.2em] text-fuel-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[2.3rem] font-bold leading-none tracking-[-0.02em]">
                    {item.label}
                    {item.external && (
                      <>
                        <svg
                          viewBox="0 0 12 12"
                          aria-hidden
                          className="ml-3 inline-block h-3.5 w-3.5 align-middle text-fuel-gold"
                        >
                          <path
                            d="M3 9 9 3M4 3h5v5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="sr-only"> (opens in a new tab)</span>
                      </>
                    )}
                  </span>
                </>
              );
              return (
                <li
                  key={item.label}
                  className={`border-b border-fuel-cream/10 transition-[opacity,translate] duration-500 ease-out motion-reduce:transition-none ${
                    open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                  }`}
                  // Staggered in on open; all together on the way out.
                  style={{ transitionDelay: open ? `${90 + i * 55}ms` : "0ms" }}
                >
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={leave}
                      className={className}
                    >
                      {body}
                    </a>
                  ) : item.href.startsWith("#") ? (
                    <a href={item.href} onClick={leave} className={className}>
                      {body}
                    </a>
                  ) : (
                    <Link href={item.href} onClick={leave} className={className}>
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <p className="mt-auto pt-12 font-display text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-fuel-gold">
          Smashed to order
        </p>
      </div>
    </div>
  );
}
