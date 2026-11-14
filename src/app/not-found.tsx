import type { Metadata } from "next";
import Link from "next/link";
import { PiArrowRight, PiHouse, PiPlanet, PiUsersThree } from "react-icons/pi";
import ChartOutline from "@/components/ChartOutline";

export const metadata: Metadata = {
  title: "पेज नहीं मिला · AstroShrine",
};

const LINKS = [
  { href: "/kundli", label: "कुंडली बनाएं", icon: PiPlanet },
  { href: "/astrologers", label: "Astrologers देखें", icon: PiUsersThree },
];

/** Branded 404 (B10): says what happened and offers a way back. */
export default function NotFound() {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 md:px-8 lg:grid-cols-2 lg:py-24">
      <section aria-labelledby="not-found-title">
        <p className="caption-3 text-brand-strong">404</p>
        <h1 id="not-found-title" className="heading-4 md:heading-3 mt-3 max-w-[680px] text-ink">
          यह पेज नहीं मिला
        </h1>
        <p className="body-3 mt-4 max-w-[680px] text-ink-soft">
          जो पता खोला गया वह यहां मौजूद नहीं है। हो सकता है link पुराना हो या उसमें कोई अक्षर छूट गया हो।
        </p>
        <Link
          href="/"
          className="button-md mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98"
        >
          <PiHouse className="h-5 w-5" aria-hidden />
          होम पर जाएं
        </Link>
        <ul className="mt-8 flex flex-wrap gap-4">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="button-sm inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken motion-safe:active:scale-98"
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
                <PiArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <div className="mx-auto hidden w-full max-w-sm lg:block">
        <ChartOutline />
      </div>
    </div>
  );
}
