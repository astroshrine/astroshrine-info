import type { IconType } from "react-icons";
import { PiBookOpenText, PiChatCircleDots, PiDiamond, PiFlowerLotus, PiHouse, PiPlanet, PiUsersThree, PiWallet } from "react-icons/pi";

// Site-wide links and the service catalogue. Livestream and audio / video calls are not part of the website.

export type NavLink = { href: string; label: string; icon: IconType };

/** Public landing page and the signed-in app home. */
export const LANDING_PATH = "/";
export const APP_HOME_PATH = "/home";

const HOME: NavLink = { href: APP_HOME_PATH, label: "होम", icon: PiHouse };
const KUNDLI: NavLink = { href: "/kundli", label: "कुंडली", icon: PiPlanet };
const ASTROLOGERS: NavLink = { href: "/astrologers", label: "Astrologers", icon: PiUsersThree };
const CHAT: NavLink = { href: "/chat", label: "Chat", icon: PiChatCircleDots };
const WALLET: NavLink = { href: "/wallet", label: "Wallet", icon: PiWallet };

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

/** `external`: another AstroShrine site, opened in a new tab and marked with an outward arrow. */
export type Service = { title: string; subtitle: string; icon: IconType; href: string; external?: boolean };

/** What the website offers, plus the sister sites for puja booking and articles. AI astrology and the store stay app-only. */
export const SERVICES: Service[] = [
  { title: "कुंडली", subtitle: "लग्न, नवांश, ग्रह स्थिति और दशा", icon: PiPlanet, href: "/kundli" },
  { title: "Astrologer से chat", subtitle: "Rating और शुल्क देखकर चुनें", icon: PiChatCircleDots, href: "/astrologers" },
  { title: "Wallet", subtitle: "Balance और लेनदेन", icon: PiWallet, href: "/wallet" },
  { title: "पूजा बुकिंग", subtitle: "श्री महाकाल धाम में पूजा और अनुष्ठान", icon: PiFlowerLotus, href: PUJA_BOOKING_URL, external: true },
  { title: "ब्लॉग", subtitle: "Future For You पत्रिका के लेख", icon: PiBookOpenText, href: BLOG_URL, external: true },
  { title: "AstroGems", subtitle: "प्रमाणित रत्न, रुद्राक्ष और माला", icon: PiDiamond, href: ASTROGEMS_URL, external: true },
];

/** Verified on astroshrine.in (linked from its home page). */
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.astroshrine";
export const PRIVACY_URL = "https://www.astroshrine.in/privacy-policy";
export const TERMS_URL = "https://www.astroshrine.in/terms-of-service";

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
