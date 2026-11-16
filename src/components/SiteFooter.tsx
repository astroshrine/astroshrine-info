"use client";

import type { IconType } from "react-icons";
import {
  PiArrowRight,
  PiBell,
  PiBookOpenText,
  PiChatCircleDots,
  PiFlowerLotus,
  PiGooglePlayLogo,
  PiInstagramLogo,
  PiLockKey,
  PiPlanet,
  PiShieldCheck,
  PiCreditCard,
  PiLinkedinLogo,
  PiXLogo,
  PiYoutubeLogo,
} from "react-icons/pi";
import AstroGemsMark from "@/components/AstroGemsMark";
import BrandMark from "@/components/BrandMark";
import FooterPhone from "@/components/FooterPhone";
import { LanguageSwitchHere } from "@/i18n/LanguageSwitch";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ASTROGEMS_URL, BLOG_URL, PLAY_STORE_URL, PRIVACY_URL, PUJA_BOOKING_URL, TERMS_URL } from "@/lib/site";

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

type SisterKey = "puja" | "astrogems" | "blog";

/** Each site's badge: an icon in a gold tile, or the site's own logo (AstroGems), which needs no tile. */
const SISTER_SITES: { key: SisterKey; href: string; icon?: IconType }[] = [
  { key: "puja", href: PUJA_BOOKING_URL, icon: PiFlowerLotus },
  { key: "astrogems", href: ASTROGEMS_URL },
  { key: "blog", href: BLOG_URL, icon: PiBookOpenText },
];

const text = defineMessages({
  hi: {
    familyEyebrow: "हमारा परिवार",
    family: "AstroShrine परिवार",
    sister: {
      puja: { title: "श्री महाकाल धाम", detail: "पूजा बुकिंग और अनुष्ठान" },
      astrogems: { title: "AstroGems स्टोर", detail: "रत्न, रुद्राक्ष और माला" },
      blog: { title: "Future For You", detail: "ज्योतिष और धर्म पर लेख" },
    },
    newTab: "(नए टैब में खुलेगा)",
    tagline: "प्राचीन ज्ञान, आधुनिक मार्गदर्शन",
    about: "कुंडली, astrologers से chat और wallet, उसी account से जो AstroShrine ऐप में है।",
    social: (network: string) => `AstroShrine ${network} पर (नए टैब में खुलेगा)`,
    columns: {
      consult: "परामर्श",
      kundli: "कुंडली",
      tools: "और सेवाएँ",
      company: "कंपनी",
    },
    links: {
      astrologers: "Astrologer से chat",
      chat: "मेरी chats",
      wallet: "Wallet",
      puja: "पूजा बुक करें",
      kundli: "कुंडली",
      milan: "कुंडली मिलान",
      panchang: "पंचांग",
      chart: "चार्ट देखें",
      kp: "KP कुंडली",
      gochar: "गोचर",
      sheet: "कुंडली रिपोर्ट",
      blog: "ब्लॉग",
      astrogems: "AstroGems स्टोर",
      privacy: "Privacy policy",
      terms: "Terms of service",
    },
    pagesNav: "वेबसाइट के पेज",
    appEyebrow: "ऐप डाउनलोड करें",
    appTitle: "आपका ज्योतिषी, आपकी जेब में",
    appBody: "AstroShrine ऐप पर chat, call और रोज़ का राशिफल पाइए।",
    appPoints: ["तुरंत chat और call", "रोज़ राशिफल अलर्ट", "कुंडली हमेशा साथ"],
    getItOn: "GET IT ON",
    googlePlay: "Google Play",
    googlePlayLabel: "Google Play पर पाएं (नए टैब में खुलेगा)",
    trust: ["निजी और गोपनीय", "जाँचे हुए astrologers", "सुरक्षित भुगतान"],
    copyright: "सर्वाधिकार सुरक्षित।",
  },
  en: {
    familyEyebrow: "Our family",
    family: "The AstroShrine family",
    sister: {
      puja: { title: "Shri Mahakal Dham", detail: "Puja booking and rituals" },
      astrogems: { title: "AstroGems Store", detail: "Gemstones, rudraksha and malas" },
      blog: { title: "Future For You", detail: "Astrology and dharma articles" },
    },
    newTab: "(opens in a new tab)",
    tagline: "Ancient wisdom, modern guidance",
    about: "Kundli, chat with astrologers and your wallet, with the same account as the AstroShrine app.",
    social: (network) => `AstroShrine on ${network} (opens in a new tab)`,
    columns: {
      consult: "Consult",
      kundli: "Kundli",
      tools: "More tools",
      company: "Company",
    },
    links: {
      astrologers: "Chat with astrologer",
      chat: "My chats",
      wallet: "Wallet",
      puja: "Book a puja",
      kundli: "Kundli",
      milan: "Kundli milan",
      panchang: "Panchang",
      chart: "View chart",
      kp: "KP Kundli",
      gochar: "Gochar (transits)",
      sheet: "Kundli report",
      blog: "Blog",
      astrogems: "AstroGems store",
      privacy: "Privacy policy",
      terms: "Terms of service",
    },
    pagesNav: "Website pages",
    appEyebrow: "Download the app",
    appTitle: "Your astrologer, in your pocket",
    appBody: "Chat, call and get your daily rashifal on the AstroShrine app.",
    appPoints: ["Instant chat and call", "Daily rashifal alerts", "Kundli always with you"],
    getItOn: "GET IT ON",
    googlePlay: "Google Play",
    googlePlayLabel: "Get it on Google Play (opens in a new tab)",
    trust: ["Private and confidential", "Verified astrologers", "Secure payments"],
    copyright: "All rights reserved.",
  },
});

type Links = (typeof text)["hi"]["links"];
type Column = { title: "consult" | "kundli" | "tools" | "company"; items: { key: keyof Links; href: string; external?: boolean }[] };

/** Only pages that exist on the website; sister sites and legal pages open in a new tab. */
const COLUMNS: Column[] = [
  {
    title: "consult",
    items: [
      { key: "astrologers", href: "/astrologers" },
      { key: "chat", href: "/chat" },
      { key: "wallet", href: "/wallet" },
      { key: "puja", href: PUJA_BOOKING_URL, external: true },
    ],
  },
  {
    title: "kundli",
    items: [
      { key: "kundli", href: "/kundli" },
      { key: "milan", href: "/kundli/milan" },
      { key: "panchang", href: "/kundli/panchang" },
      { key: "chart", href: "/kundli/chart" },
    ],
  },
  {
    title: "tools",
    items: [
      { key: "kp", href: "/kundli/kp" },
      { key: "gochar", href: "/kundli/gochar" },
      { key: "sheet", href: "/kundli/sheet" },
    ],
  },
  {
    title: "company",
    items: [
      { key: "blog", href: BLOG_URL, external: true },
      { key: "astrogems", href: ASTROGEMS_URL, external: true },
      { key: "privacy", href: PRIVACY_URL, external: true },
      { key: "terms", href: TERMS_URL, external: true },
    ],
  },
];

const APP_POINT_ICONS: IconType[] = [PiChatCircleDots, PiBell, PiPlanet];
const TRUST_ICONS: IconType[] = [PiLockKey, PiShieldCheck, PiCreditCard];

const external = { target: "_blank", rel: "noopener noreferrer" } as const;
const textLink = "inline-block rounded-sm py-1 leading-[1.4] text-ink-soft transition hover:text-ink";
const colHeading = "font-display text-[15px] leading-[1.4] font-semibold tracking-[-0.01em] text-ink";
const eyebrow = "font-display text-[13px] font-medium tracking-[.02em]";

/**
 * Site footer, as in the design: the sister sites in a navy "family" strip; then the app picture with the Google
 * Play badge beside the brand, link columns, the app promo and trust bar; then the bottom bar with the copyright,
 * language switch and legal links. Only existing website routes are linked.
 */
export default function SiteFooter() {
  const t = useT(text);

  return (
    <footer className="border-t border-line bg-surface-card text-ink">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        {/* 1. Sister sites */}
        <div className="mt-12 flex flex-col gap-[18px] rounded-3xl bg-surface-inverse p-5 shadow-[0_18px_40px_rgba(20,33,61,.16),inset_0_0_0_1px_rgba(255,174,0,.2)] md:mt-14 md:p-6">
          <div className="flex flex-wrap items-baseline gap-x-3 px-1 text-ink-inverse">
            <span className={`${eyebrow} text-brand`}>{t.familyEyebrow}</span>
            <b className="font-display text-lg leading-[1.3] font-semibold tracking-[-0.01em]">{t.family}</b>
          </div>
          <ul aria-label={t.family} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {SISTER_SITES.map(({ key, href, icon: Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  {...external}
                  className="group flex min-h-[78px] items-center gap-3.5 rounded-2xl border border-brand/20 bg-white/5 px-[18px] py-4 text-ink-inverse transition hover:border-brand hover:bg-brand/10"
                >
                  {Icon ? (
                    <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] bg-brand/10 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:-rotate-6">
                      <Icon className="h-6 w-6 text-brand" aria-hidden />
                    </span>
                  ) : (
                    <AstroGemsMark size={46} />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <b className="truncate font-display text-[15px] leading-[1.3] font-semibold">{t.sister[key].title}</b>
                    <small className="truncate text-[13px] leading-[1.35] text-ink-inverse-soft">{t.sister[key].detail}</small>
                  </span>
                  <PiArrowRight className="h-[18px] w-[18px] shrink-0 text-brand transition-transform group-hover:translate-x-[3px]" aria-hidden />
                  <span className="sr-only">{t.newTab}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. App picture, brand, columns, app promo, trust bar */}
        <div className="grid grid-cols-1 items-stretch gap-10 pt-12 pb-10 lg:grid-cols-[280px_1fr] lg:gap-14">
          <div className="flex flex-col items-center justify-between gap-5">
            <div className="hidden lg:block">
              <FooterPhone />
            </div>
            <div className="flex w-full justify-center border-t border-line pt-[18px] lg:mt-1">
              <a
                href={PLAY_STORE_URL}
                {...external}
                aria-label={t.googlePlayLabel}
                className="flex h-[46px] w-full max-w-[240px] items-center justify-center gap-[9px] rounded-[10px] border border-[#444] bg-black px-2.5 text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,.2)]"
              >
                <PiGooglePlayLogo className="h-6 w-6" aria-hidden />
                <span className="flex flex-col leading-[1.05]">
                  <small className="text-[9px] font-medium tracking-[.02em]">{t.getItOn}</small>
                  <b className="text-[15px] font-semibold tracking-[-0.01em]">{t.googlePlay}</b>
                </span>
              </a>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-7">
            <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-[minmax(200px,1fr)_repeat(4,max-content)] lg:gap-x-6 xl:gap-x-8">
              <div className="col-span-2 lg:col-span-1">
                <Link href="/" className="inline-flex items-center gap-3 rounded-full pr-3">
                  <BrandMark size={48} />
                  <span>
                    <b className="block font-display text-[22px] leading-none font-bold tracking-[-0.02em]">AstroShrine</b>
                    <small className="mt-0.5 block text-xs text-ink-soft">{t.tagline}</small>
                  </span>
                </Link>
                <p className="mt-[18px] max-w-xs text-sm text-ink-soft">{t.about}</p>
                <ul className="mt-[22px] flex flex-wrap gap-2.5">
                  {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                    <li key={href}>
                      <a
                        href={href}
                        {...external}
                        aria-label={t.social(label)}
                        className="grid h-11 w-11 place-items-center rounded-xl border border-line text-ink transition hover:bg-surface-inverse hover:text-brand"
                      >
                        <Icon className="h-[18px] w-[18px]" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              {COLUMNS.map((col) => (
                <nav key={col.title} aria-label={t.columns[col.title]} className="lg:pt-1.5">
                  <p className={`${colHeading} mb-3 md:mb-4`}>{t.columns[col.title]}</p>
                  <ul className="flex flex-col gap-1 text-sm">
                    {col.items.map((item) => (
                      <li key={item.key}>
                        {item.external ? (
                          <a href={item.href} {...external} className={textLink}>
                            {t.links[item.key]}
                            <span className="sr-only">{t.newTab}</span>
                          </a>
                        ) : (
                          <Link href={item.href} className={textLink}>
                            {t.links[item.key]}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            <div className="flex flex-col justify-between gap-5 rounded-[20px] bg-surface-inverse px-5 py-5 text-ink-inverse shadow-[inset_0_0_0_1px_rgba(255,174,0,.22)] md:flex-row md:items-center md:gap-7 md:px-[26px] md:py-[22px]">
              <div className="flex min-w-0 flex-col gap-1">
                <span className={`${eyebrow} text-brand`}>{t.appEyebrow}</span>
                <b className="font-display text-xl leading-tight font-semibold tracking-[-0.01em]">{t.appTitle}</b>
                <small className="text-sm text-ink-inverse-soft">{t.appBody}</small>
              </div>
              <ul className="flex flex-none flex-col gap-2.5">
                {t.appPoints.map((label, i) => {
                  const Icon = APP_POINT_ICONS[i];
                  return (
                    <li key={label} className="flex items-center gap-2.5 text-sm font-medium text-ink-inverse">
                      <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] border border-brand/25 bg-brand/10">
                        <Icon className="h-4 w-4 text-brand" aria-hidden />
                      </span>
                      {label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <ul className="mt-auto flex flex-col justify-between gap-4 pt-1 sm:flex-row sm:items-center">
              {t.trust.map((label, i) => {
                const Icon = TRUST_ICONS[i];
                return (
                  <li key={label} className="flex items-center gap-2.5 text-sm font-semibold">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-sunken">
                      <Icon className="h-5 w-5 text-ink" aria-hidden />
                    </span>
                    {label}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* 3. Copyright, language and legal */}
        <div className="flex flex-col gap-2 border-t border-line py-[22px] text-[13px] text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {COPYRIGHT_YEAR} AstroShrine. {t.copyright}
          </p>
          <div className="flex flex-wrap items-center gap-x-6">
            <LanguageSwitchHere className="inline-flex items-center gap-1 rounded-sm py-1 text-ink-soft transition hover:text-ink" />
            <span lang="hi" className="font-display">
              शुभमस्तु
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
