import type { ComponentType } from "react";
import type { IconType } from "react-icons";
import {
  PiBookOpenText,
  PiCalendarCheck,
  PiChatCircleDots,
  PiClockCounterClockwise,
  PiDiamond,
  PiFlowerLotus,
  PiHouse,
  PiPlanet,
  PiRobot,
  PiShoppingBag,
  PiSparkle,
  PiTag,
  PiUsersThree,
  PiWallet,
} from "react-icons/pi";
import AstroGemsMark from "@/components/AstroGemsMark";
import { defineMessages } from "@/i18n/messages";

// Site-wide links and the service catalogue. Livestream and on-demand calls are not part of the website (calls are booked).
// Paths here have no language: render them with @/i18n/Link (or useRouter from @/i18n/navigation), which adds it.

/** Names of the main pages and the services, in every language. Read with useT(SITE_TEXT) or getT(SITE_TEXT). */
export const SITE_TEXT = defineMessages({
  hi: {
    nav: { home: "होम", kundli: "कुंडली", astrologers: "Astrologers", tools: "टूल", chat: "Chat", wallet: "Wallet" },
    more: {
      title: "और भी",
      bookings: "मेरी अपॉइंटमेंट",
      history: "पुराने सेशन",
      aiAstrologers: "AI ज्योतिषी",
      store: "स्टोर",
      offers: "ऑफ़र",
    },
    services: {
      kundli: { title: "कुंडली", subtitle: "लग्न, नवांश, ग्रह स्थिति और दशा" },
      chat: { title: "Astrologer से chat", subtitle: "Rating और शुल्क देखकर चुनें" },
      wallet: { title: "Wallet", subtitle: "Balance और लेनदेन" },
      tools: { title: "ज्योतिष टूल", subtitle: "अंक ज्योतिष, टैरो, वास्तु, मुहूर्त और भी" },
      aiAstrologers: { title: "AI ज्योतिषी", subtitle: "कभी भी सवाल पूछें, तुरंत जवाब" },
      store: { title: "स्टोर", subtitle: "पूजा, रत्न और रुद्राक्ष" },
      offers: { title: "ऑफ़र", subtitle: "Recharge पर चल रहे promo code" },
      puja: { title: "पूजा बुकिंग", subtitle: "श्री महाकाल धाम में पूजा और अनुष्ठान" },
      blog: { title: "ब्लॉग", subtitle: "Future For You पत्रिका के लेख" },
      astrogems: { title: "AstroGems", subtitle: "प्रमाणित रत्न, रुद्राक्ष और माला" },
    },
  },
  en: {
    nav: { home: "Home", kundli: "Kundli", astrologers: "Astrologers", tools: "Tools", chat: "Chat", wallet: "Wallet" },
    more: {
      title: "More",
      bookings: "My appointments",
      history: "Past sessions",
      aiAstrologers: "AI astrologers",
      store: "Store",
      offers: "Offers",
    },
    services: {
      kundli: { title: "Kundli", subtitle: "Ascendant, Navamsha, planet positions and Dasha" },
      chat: { title: "Chat with an astrologer", subtitle: "Choose by rating and price" },
      wallet: { title: "Wallet", subtitle: "Balance and transactions" },
      tools: { title: "Astrology tools", subtitle: "Numerology, tarot, vastu, muhurat and more" },
      aiAstrologers: { title: "AI astrologers", subtitle: "Ask any time, answers in seconds" },
      store: { title: "Store", subtitle: "Pujas, gemstones and rudraksha" },
      offers: { title: "Offers", subtitle: "Promo codes running on recharges" },
      puja: { title: "Puja booking", subtitle: "Puja and rituals at Shri Mahakal Dham" },
      blog: { title: "Blog", subtitle: "Articles from the Future For You magazine" },
      astrogems: { title: "AstroGems", subtitle: "Certified gemstones, rudraksha and malas" },
    },
  },
});

type SiteText = (typeof SITE_TEXT)["hi"];
export type NavKey = keyof SiteText["nav"];
export type ServiceKey = keyof SiteText["services"];
export type MoreKey = Exclude<keyof SiteText["more"], "title">;

export type NavLink = { href: string; key: NavKey; icon: IconType };

/** Public landing page and the signed-in app home. */
export const LANDING_PATH = "/";
export const APP_HOME_PATH = "/home";

const HOME: NavLink = { href: APP_HOME_PATH, key: "home", icon: PiHouse };
const KUNDLI: NavLink = { href: "/kundli", key: "kundli", icon: PiPlanet };
const ASTROLOGERS: NavLink = { href: "/astrologers", key: "astrologers", icon: PiUsersThree };
const CHAT: NavLink = { href: "/chat", key: "chat", icon: PiChatCircleDots };
const WALLET: NavLink = { href: "/wallet", key: "wallet", icon: PiWallet };
const TOOLS: NavLink = { href: "/tools", key: "tools", icon: PiSparkle };

/** Main navigation. Chat and Wallet need an account, so visitors see the public pages only. */
export function navLinks(signedIn: boolean): NavLink[] {
  return signedIn ? [HOME, KUNDLI, ASTROLOGERS, TOOLS, CHAT, WALLET] : [{ ...HOME, href: LANDING_PATH }, KUNDLI, ASTROLOGERS, TOOLS];
}

export type MoreLink = { href: string; key: MoreKey; icon: IconType };

/**
 * The rest of the website, as the app's tabs and drawer reach it: the phone menu's "More" group and the profile page
 * list these. Appointments, past sessions, AI astrologers and offers need an account; the store is open to all.
 */
export function moreLinks(signedIn: boolean): MoreLink[] {
  const store: MoreLink = { href: "/store", key: "store", icon: PiShoppingBag };
  return signedIn
    ? [
        { href: "/bookings", key: "bookings", icon: PiCalendarCheck },
        { href: "/history", key: "history", icon: PiClockCounterClockwise },
        { href: "/ai-astrologers", key: "aiAstrologers", icon: PiRobot },
        store,
        { href: "/offers", key: "offers", icon: PiTag },
      ]
    : [store];
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

/** What the website offers (the signed-in home's grid), plus the sister sites for puja booking, articles and gemstones. */
export const SERVICES: Service[] = [
  { key: "kundli", icon: PiPlanet, href: "/kundli" },
  { key: "chat", icon: PiChatCircleDots, href: "/astrologers" },
  { key: "wallet", icon: PiWallet, href: "/wallet" },
  { key: "tools", icon: PiSparkle, href: "/tools" },
  { key: "aiAstrologers", icon: PiRobot, href: "/ai-astrologers" },
  { key: "store", icon: PiShoppingBag, href: "/store" },
  { key: "offers", icon: PiTag, href: "/offers" },
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
