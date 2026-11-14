import type { IconType } from "react-icons";
import { PiChatCircleDots, PiHouse, PiPlanet, PiUsersThree, PiWallet } from "react-icons/pi";

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

export type Service = { title: string; subtitle: string; icon: IconType; href: string };

/** What the website itself offers. App-only services (AI astrology, puja, store) are not listed here. */
export const SERVICES: Service[] = [
  { title: "कुंडली", subtitle: "लग्न, नवांश, ग्रह स्थिति और दशा", icon: PiPlanet, href: "/kundli" },
  { title: "Astrologer से chat", subtitle: "Rating और शुल्क देखकर चुनें", icon: PiChatCircleDots, href: "/astrologers" },
  { title: "Wallet", subtitle: "Balance और लेनदेन", icon: PiWallet, href: "/wallet" },
];

/** Verified on astroshrine.in (linked from its home page). */
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.astroshrine";
export const PRIVACY_URL = "https://www.astroshrine.in/privacy-policy";
export const TERMS_URL = "https://www.astroshrine.in/terms-of-service";

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
