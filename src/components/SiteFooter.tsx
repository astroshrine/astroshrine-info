"use client";

import type { IconType } from "react-icons";
import {
  PiArrowUpRight,
  PiBookOpenText,
  PiFlowerLotus,
  PiGooglePlayLogo,
  PiInstagramLogo,
  PiLinkedinLogo,
  PiXLogo,
  PiYoutubeLogo,
} from "react-icons/pi";
import AstroGemsMark from "@/components/AstroGemsMark";
import BrandMark from "@/components/BrandMark";
import { LanguageSwitchHere } from "@/i18n/LanguageSwitch";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ASTROGEMS_URL, BLOG_URL, PLAY_STORE_URL, PRIVACY_URL, PUJA_BOOKING_URL, SITE_TEXT, TERMS_URL, type NavKey } from "@/lib/site";

/**
 * AstroShrine's own social profiles, as listed in the footer of shrimahakaldham.com, each checked to load.
 * The Facebook share link from that list answers 400, so it is left out until a working profile URL is known.
 */
const SOCIAL_LINKS: { label: string; href: string; icon: IconType }[] = [
  { label: "Instagram", href: "https://instagram.com/astroshrine_", icon: PiInstagramLogo },
  { label: "YouTube", href: "https://youtube.com/@astroshrine", icon: PiYoutubeLogo },
  { label: "X", href: "https://x.com/astroshrine_", icon: PiXLogo },
  { label: "LinkedIn", href: "https://linkedin.com/in/astro-shrine-1b5150402", icon: PiLinkedinLogo },
];

/**
 * The year in the copyright line. Fixed on purpose: the footer is prerendered (Cache Components), where reading
 * the clock is not allowed. Update it each January.
 */
const COPYRIGHT_YEAR = 2026;

const PAGES: { href: string; key: NavKey }[] = [
  { href: "/kundli", key: "kundli" },
  { href: "/astrologers", key: "astrologers" },
  { href: "/chat", key: "chat" },
  { href: "/wallet", key: "wallet" },
];

type SisterKey = "puja" | "astrogems" | "blog";

/** Each site's badge: an icon in a gold tile, or the site's own logo (AstroGems), which needs no tile. */
const SISTER_SITES: { key: SisterKey; href: string; icon?: IconType }[] = [
  { key: "puja", href: PUJA_BOOKING_URL, icon: PiFlowerLotus },
  { key: "astrogems", href: ASTROGEMS_URL },
  { key: "blog", href: BLOG_URL, icon: PiBookOpenText },
];

const text = defineMessages({
  hi: {
    sisterSites: "AstroShrine की दूसरी वेबसाइटें",
    sister: {
      puja: { kicker: "श्री महाकाल धाम", title: "पूजा बुकिंग", detail: "मंदिर में पूजा और अनुष्ठान बुक करें" },
      astrogems: { kicker: "AstroGems स्टोर", title: "रत्न और रुद्राक्ष", detail: "प्रमाणित रत्न, रुद्राक्ष और माला" },
      blog: { kicker: "Future For You पत्रिका", title: "ब्लॉग", detail: "ज्योतिष और धर्म पर लेख पढ़ें" },
    },
    newTab: "(नए टैब में खुलेगा)",
    about: "कुंडली, astrologers से chat और wallet, उसी account से जो AstroShrine ऐप में है।",
    follow: "हमसे जुड़ें",
    social: (network: string) => `AstroShrine ${network} पर (नए टैब में खुलेगा)`,
    pagesNav: "वेबसाइट के पेज",
    pages: "वेबसाइट",
    app: "ऐप डाउनलोड करें",
    android: "Android ऐप",
    googlePlay: "Google Play पर पाएं",
    sameAccount: "ऐप और वेबसाइट पर एक ही account और wallet।",
    privacy: "Privacy policy",
    terms: "Terms of service",
  },
  en: {
    sisterSites: "Other AstroShrine websites",
    sister: {
      puja: { kicker: "Shri Mahakal Dham", title: "Puja booking", detail: "Book puja and rituals at the temple" },
      astrogems: { kicker: "AstroGems store", title: "Gemstones and rudraksha", detail: "Certified gemstones, rudraksha and malas" },
      blog: { kicker: "Future For You magazine", title: "Blog", detail: "Read articles on astrology and dharma" },
    },
    newTab: "(opens in a new tab)",
    about: "Kundli, chat with astrologers and your wallet, with the same account as the AstroShrine app.",
    follow: "Follow us",
    social: (network) => `AstroShrine on ${network} (opens in a new tab)`,
    pagesNav: "Website pages",
    pages: "Website",
    app: "Get the app",
    android: "Android app",
    googlePlay: "Get it on Google Play",
    sameAccount: "One account and wallet on the app and the website.",
    privacy: "Privacy policy",
    terms: "Terms of service",
  },
});

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Text links: 36px tall on phones (comfortable to tap), tighter on wider screens. */
const textLink = "caption-2 inline-flex items-center gap-1 rounded-sm py-2 text-ink-inverse-soft transition hover:text-ink-inverse md:py-1";
const heading = "title-5 text-ink-inverse";

/**
 * Site footer, on the navy brand surface, in three bands:
 * 1. the sister sites (puja booking, the AstroGems store, blog) as a highlighted strip, each opening in a new tab;
 * 2. the brand with social profiles, the website's pages, and the app download;
 * 3. a bottom bar with the copyright, the language switch and the legal links.
 */
export default function SiteFooter() {
  const t = useT(text);
  const site = useT(SITE_TEXT);

  return (
    <footer className="on-inverse mt-16 bg-surface-inverse text-ink-inverse">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        {/* 1. Sister sites */}
        <ul aria-label={t.sisterSites} className="grid grid-cols-1 gap-3 pt-12 md:grid-cols-3">
          {SISTER_SITES.map(({ key, href, icon: Icon }) => (
            <li key={href}>
              <a
                href={href}
                {...external}
                className="group flex items-center gap-4 rounded-2xl border border-line-inverse bg-surface-inverse-raised p-4 transition hover:border-brand-on-inverse"
              >
                {Icon ? (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                ) : (
                  <AstroGemsMark size={40} />
                )}
                <span className="min-w-0 flex-1">
                  <span className="caption-4 block text-brand-on-inverse">{t.sister[key].kicker}</span>
                  <span className="title-3 block text-ink-inverse">{t.sister[key].title}</span>
                  <span className="caption-5 block text-ink-inverse-soft">{t.sister[key].detail}</span>
                </span>
                <PiArrowUpRight
                  className="h-5 w-5 shrink-0 text-ink-inverse-soft transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink-inverse"
                  aria-hidden
                />
                <span className="sr-only">{t.newTab}</span>
              </a>
            </li>
          ))}
        </ul>

        {/* 2. Brand, pages, app */}
        <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-6 lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3 rounded-full pr-3">
              <BrandMark size={40} />
              <span className="title-2 text-ink-inverse">AstroShrine</span>
            </Link>
            <p className="caption-2 mt-4 max-w-sm text-ink-inverse-soft">{t.about}</p>

            <p className={`${heading} mt-8`}>{t.follow}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <a
                    href={href}
                    {...external}
                    aria-label={t.social(label)}
                    className="grid h-10 w-10 place-items-center rounded-full border border-line-inverse text-ink-inverse-soft transition hover:border-brand-on-inverse hover:text-ink-inverse"
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label={t.pagesNav} className="md:col-span-3 lg:col-span-3 lg:col-start-7">
            <p className={heading}>{t.pages}</p>
            {/* Two columns on phones keep the list short; one column beside the brand on wider screens. */}
            <ul className="mt-2 grid grid-cols-2 gap-x-6 md:grid-cols-1">
              {PAGES.map(({ href, key }) => (
                <li key={href}>
                  <Link href={href} className={textLink}>
                    {site.nav[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3 lg:col-span-3">
            <p className={heading}>{t.app}</p>
            <a
              href={PLAY_STORE_URL}
              {...external}
              className="mt-3 inline-flex items-center gap-3 rounded-2xl border border-line-inverse bg-surface-inverse-raised px-4 py-3 transition hover:border-brand-on-inverse"
            >
              <PiGooglePlayLogo className="h-6 w-6 shrink-0 text-ink-inverse" aria-hidden />
              <span>
                <span className="caption-5 block text-ink-inverse-soft">{t.android}</span>
                <span className="title-4 block text-ink-inverse">{t.googlePlay}</span>
              </span>
              <span className="sr-only">{t.newTab}</span>
            </a>
            <p className="caption-5 mt-3 max-w-xs text-ink-inverse-soft">{t.sameAccount}</p>
          </div>
        </div>

        {/* A divider line, not a one-sided card border. */}
        <div aria-hidden className="h-px bg-line-inverse" />

        {/* 3. Copyright, language and legal */}
        <div className="flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="caption-5 text-ink-inverse-soft">© {COPYRIGHT_YEAR} AstroShrine</p>
          <ul className="flex flex-wrap items-center gap-x-6">
            <li>
              <LanguageSwitchHere className={textLink} />
            </li>
            <li>
              <a href={PRIVACY_URL} className={textLink}>
                {t.privacy}
              </a>
            </li>
            <li>
              <a href={TERMS_URL} className={textLink}>
                {t.terms}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
