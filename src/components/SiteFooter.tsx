import Link from "next/link";
import type { IconType } from "react-icons";
import {
  PiArrowUpRight,
  PiBookOpenText,
  PiDiamond,
  PiFlowerLotus,
  PiGooglePlayLogo,
  PiInstagramLogo,
  PiLinkedinLogo,
  PiXLogo,
  PiYoutubeLogo,
} from "react-icons/pi";
import BrandMark from "@/components/BrandMark";
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

const PAGES = [
  { href: "/kundli", label: "कुंडली" },
  { href: "/astrologers", label: "Astrologers" },
  { href: "/chat", label: "Chat" },
  { href: "/wallet", label: "Wallet" },
];

const SISTER_SITES: { href: string; kicker: string; title: string; detail: string; icon: IconType }[] = [
  { href: PUJA_BOOKING_URL, kicker: "श्री महाकाल धाम", title: "पूजा बुकिंग", detail: "मंदिर में पूजा और अनुष्ठान बुक करें", icon: PiFlowerLotus },
  { href: ASTROGEMS_URL, kicker: "AstroGems स्टोर", title: "रत्न और रुद्राक्ष", detail: "प्रमाणित रत्न, रुद्राक्ष और माला", icon: PiDiamond },
  { href: BLOG_URL, kicker: "Future For You पत्रिका", title: "ब्लॉग", detail: "ज्योतिष और धर्म पर लेख पढ़ें", icon: PiBookOpenText },
];

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Text links: 36px tall on phones (comfortable to tap), tighter on wider screens. */
const textLink = "caption-2 inline-flex items-center gap-1 rounded-sm py-2 text-ink-inverse-soft transition hover:text-ink-inverse md:py-1";
const heading = "title-5 text-ink-inverse";

/**
 * Site footer, on the navy brand surface, in three bands:
 * 1. the sister sites (puja booking, the AstroGems store, blog) as a highlighted strip, each opening in a new tab;
 * 2. the brand with social profiles, the website's pages, and the app download;
 * 3. a bottom bar with the copyright and the legal links.
 */
export default function SiteFooter() {
  return (
    <footer className="on-inverse mt-16 bg-surface-inverse text-ink-inverse">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        {/* 1. Sister sites */}
        <ul aria-label="AstroShrine की दूसरी वेबसाइटें" className="grid grid-cols-1 gap-3 pt-12 md:grid-cols-3">
          {SISTER_SITES.map(({ href, kicker, title, detail, icon: Icon }) => (
            <li key={href}>
              <a
                href={href}
                {...external}
                className="group flex items-center gap-4 rounded-2xl border border-line-inverse bg-surface-inverse-raised p-4 transition hover:border-brand-on-inverse"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="caption-4 block text-brand-on-inverse">{kicker}</span>
                  <span className="title-3 block text-ink-inverse">{title}</span>
                  <span className="caption-5 block text-ink-inverse-soft">{detail}</span>
                </span>
                <PiArrowUpRight
                  className="h-5 w-5 shrink-0 text-ink-inverse-soft transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink-inverse"
                  aria-hidden
                />
                <span className="sr-only">(नए टैब में खुलेगा)</span>
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
            <p className="caption-2 mt-4 max-w-sm text-ink-inverse-soft">
              कुंडली, astrologers से chat और wallet, उसी account से जो AstroShrine ऐप में है।
            </p>

            <p className={`${heading} mt-8`}>हमसे जुड़ें</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <a
                    href={href}
                    {...external}
                    aria-label={`AstroShrine ${label} पर (नए टैब में खुलेगा)`}
                    className="grid h-10 w-10 place-items-center rounded-full border border-line-inverse text-ink-inverse-soft transition hover:border-brand-on-inverse hover:text-ink-inverse"
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="वेबसाइट के पेज" className="md:col-span-3 lg:col-span-3 lg:col-start-7">
            <p className={heading}>वेबसाइट</p>
            {/* Two columns on phones keep the list short; one column beside the brand on wider screens. */}
            <ul className="mt-2 grid grid-cols-2 gap-x-6 md:grid-cols-1">
              {PAGES.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={textLink}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3 lg:col-span-3">
            <p className={heading}>ऐप डाउनलोड करें</p>
            <a
              href={PLAY_STORE_URL}
              {...external}
              className="mt-3 inline-flex items-center gap-3 rounded-2xl border border-line-inverse bg-surface-inverse-raised px-4 py-3 transition hover:border-brand-on-inverse"
            >
              <PiGooglePlayLogo className="h-6 w-6 shrink-0 text-ink-inverse" aria-hidden />
              <span>
                <span className="caption-5 block text-ink-inverse-soft">Android ऐप</span>
                <span className="title-4 block text-ink-inverse">Google Play पर पाएं</span>
              </span>
              <span className="sr-only">(नए टैब में खुलेगा)</span>
            </a>
            <p className="caption-5 mt-3 max-w-xs text-ink-inverse-soft">ऐप और वेबसाइट पर एक ही account और wallet।</p>
          </div>
        </div>

        {/* A divider line, not a one-sided card border. */}
        <div aria-hidden className="h-px bg-line-inverse" />

        {/* 3. Copyright and legal */}
        <div className="flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="caption-5 text-ink-inverse-soft">© {COPYRIGHT_YEAR} AstroShrine</p>
          <ul className="flex flex-wrap gap-x-6">
            <li>
              <a href={PRIVACY_URL} className={textLink}>
                Privacy policy
              </a>
            </li>
            <li>
              <a href={TERMS_URL} className={textLink}>
                Terms of service
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
