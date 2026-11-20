import type { Metadata } from "next";
import { PiArrowRight, PiHouse, PiPlanet, PiUsersThree } from "react-icons/pi";
import ChartOutline from "@/components/ChartOutline";
import Link from "@/i18n/Link";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";

const text = defineMessages({
  hi: {
    title: "यह पेज नहीं मिला",
    body: "जो पता खोला गया वह यहां मौजूद नहीं है। हो सकता है link पुराना हो या उसमें कोई अक्षर छूट गया हो।",
    home: "होम पर जाएं",
    kundli: "कुंडली बनाएं",
    astrologers: "Astrologers देखें",
  },
  en: {
    title: "This page was not found",
    body: "The address you opened does not exist here. The link may be old, or a letter may be missing from it.",
    home: "Go to home",
    kundli: "Make a Kundli",
    astrologers: "See astrologers",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: `${t.title} · AstroShrine` };
}

/** Branded 404 (B10): says what happened and offers a way back, in the visitor's language. */
export default async function NotFound() {
  const t = await getT(text);
  const links = [
    { href: "/kundli", label: t.kundli, icon: PiPlanet },
    { href: "/astrologers", label: t.astrologers, icon: PiUsersThree },
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 md:px-8 lg:grid-cols-2 lg:py-24">
      <section aria-labelledby="not-found-title">
        <p className="caption-3 text-brand-strong">404</p>
        <h1 id="not-found-title" className="heading-4 md:heading-3 mt-3 max-w-[680px] text-ink">
          {t.title}
        </h1>
        <p className="body-3 mt-4 max-w-[680px] text-ink-soft">{t.body}</p>
        <Link
          href="/"
          className="button-md mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98"
        >
          <PiHouse className="h-5 w-5" aria-hidden />
          {t.home}
        </Link>
        <ul className="mt-8 flex flex-wrap gap-4">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="button-sm inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken motion-safe:active:scale-98"
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
