import type { ComponentType } from "react";
import type { IconType } from "react-icons";
import { PiBookOpenText, PiChatCircleDots, PiDiamond, PiFlowerLotus, PiHouse, PiPlanet, PiUsersThree, PiWallet } from "react-icons/pi";
import AstroGemsMark from "@/components/AstroGemsMark";
import { defineMessages } from "@/i18n/messages";

// Site-wide links and the service catalogue. Livestream and audio / video calls are not part of the website.
// Paths here have no language: render them with @/i18n/Link (or useRouter from @/i18n/navigation), which adds it.

/** Names of the main pages and the services, in every language. Read with useT(SITE_TEXT) or getT(SITE_TEXT). */
export const SITE_TEXT = defineMessages({
  hi: {
    nav: { home: "होम", kundli: "कुंडली", astrologers: "Astrologers", chat: "Chat", wallet: "Wallet" },
    services: {
      kundli: { title: "कुंडली", subtitle: "लग्न, नवांश, ग्रह स्थिति और दशा" },
      chat: { title: "Astrologer से chat", subtitle: "Rating और शुल्क देखकर चुनें" },
      wallet: { title: "Wallet", subtitle: "Balance और लेनदेन" },
      puja: { title: "पूजा बुकिंग", subtitle: "श्री महाकाल धाम में पूजा और अनुष्ठान" },
      blog: { title: "ब्लॉग", subtitle: "Future For You पत्रिका के लेख" },
      astrogems: { title: "AstroGems", subtitle: "प्रमाणित रत्न, रुद्राक्ष और माला" },
    },
  },
  en: {
    nav: { home: "Home", kundli: "Kundli", astrologers: "Astrologers", chat: "Chat", wallet: "Wallet" },
    services: {
      kundli: { title: "Kundli", subtitle: "Ascendant, Navamsha, planet positions and Dasha" },
      chat: { title: "Chat with an astrologer", subtitle: "Choose by rating and price" },
      wallet: { title: "Wallet", subtitle: "Balance and transactions" },
      puja: { title: "Puja booking", subtitle: "Puja and rituals at Shri Mahakal Dham" },
      blog: { title: "Blog", subtitle: "Articles from the Future For You magazine" },
      astrogems: { title: "AstroGems", subtitle: "Certified gemstones, rudraksha and malas" },
    },
  },
});

type SiteText = (typeof SITE_TEXT)["hi"];
export type NavKey = keyof SiteText["nav"];
export type ServiceKey = keyof SiteText["services"];

export type NavLink = { href: string; key: NavKey; icon: IconType };

/** Public landing page and the signed-in app home. */
export const LANDING_PATH = "/";
export const APP_HOME_PATH = "/home";

const HOME: NavLink = { href: APP_HOME_PATH, key: "home", icon: PiHouse };
const KUNDLI: NavLink = { href: "/kundli", key: "kundli", icon: PiPlanet };
const ASTROLOGERS: NavLink = { href: "/astrologers", key: "astrologers", icon: PiUsersThree };
const CHAT: NavLink = { href: "/chat", key: "chat", icon: PiChatCircleDots };
const WALLET: NavLink = { href: "/wallet", key: "wallet", icon: PiWallet };

/** Main navigation. Chat and Wallet need an account, so visitors see the public pages only. */
export function navLinks(signedIn: boolean): NavLink[] {
  return signedIn ? [HOME, KUNDLI, ASTROLOGERS, CHAT, WALLET] : [{ ...HOME, href: LANDING_PATH }, KUNDLI, ASTROLOGERS];
}

/** AstroShrine's temple site: puja booking happens there (Shri Mahakal Dham). */
export const PUJA_BOOKING_URL = "https://shrimahakaldham.com/";
/** AstroShrine's monthly magazine, Future For You (WordPress): the website's blog. */
export const BLOG_URL = "https://futureforyou.co/";
/** AstroShrine's store, AstroGems: certified gemstones, Rudraksha, malas and vastu items. */
export const ASTROGEMS_URL = "https://astrogems.astroshrine.in/";

/**
 * `external`: another AstroShrine site, opened in a new tab and marked with an outward arrow.
 * `mark`: the service's own logo, shown instead of the icon in its gold tile (AstroGems).
 */
export type Service = {
  key: ServiceKey;
  icon: IconType;
  href: string;
  external?: boolean;
  mark?: ComponentType<{ size?: number; className?: string }>;
};

/** What the website offers, plus the sister sites for puja booking, articles and the store. AI astrology stays app-only. */
export const SERVICES: Service[] = [
  { key: "kundli", icon: PiPlanet, href: "/kundli" },
  { key: "chat", icon: PiChatCircleDots, href: "/astrologers" },
  { key: "wallet", icon: PiWallet, href: "/wallet" },
  { key: "puja", icon: PiFlowerLotus, href: PUJA_BOOKING_URL, external: true },
  { key: "blog", icon: PiBookOpenText, href: BLOG_URL, external: true },
  { key: "astrogems", icon: PiDiamond, href: ASTROGEMS_URL, external: true, mark: AstroGemsMark },
];

/** Verified on astroshrine.in (linked from its home page). */
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.astroshrine";
export const PRIVACY_URL = "https://www.astroshrine.in/privacy-policy";
export const TERMS_URL = "https://www.astroshrine.in/terms-of-service";

/** Whether `href` is the current page or one of its sub-pages. Both paths are without a language. */
export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
