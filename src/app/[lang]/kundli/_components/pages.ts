import type { IconType } from "react-icons";
import { PiCalendarDots, PiCirclesThreePlus, PiCompass, PiGridFour, PiHeart, PiPlanet, PiScroll } from "react-icons/pi";
import { defineMessages } from "@/i18n/messages";

/** The section's page names, in every language. Read with useT(KUNDLI_PAGE_TEXT) or getT(KUNDLI_PAGE_TEXT). */
export const KUNDLI_PAGE_TEXT = defineMessages({
  hi: {
    list: "मेरी कुंडलियाँ",
    chart: "कुंडली",
    gochar: "गोचर",
    panchang: "पंचांग",
    kp: "KP प्रश्न",
    milan: "कुंडली मिलान",
    sheet: "मेरी विस्तृत कुंडली",
  },
  en: {
    list: "My kundlis",
    chart: "Kundli",
    gochar: "Transits",
    panchang: "Panchang",
    kp: "KP Prashna",
    milan: "Kundli matching",
    sheet: "My detailed kundli",
  },
});

export type KundliPageKey = keyof (typeof KUNDLI_PAGE_TEXT)["hi"];

export type KundliPage = {
  href: string;
  /** Its name in KUNDLI_PAGE_TEXT. */
  key: KundliPageKey;
  icon: IconType;
  /** The page shows the birth profile carried in the URL hash. */
  carriesProfile?: boolean;
};

/** Every page of the Jyotish section, in navigation order. Paths have no language: render them with @/i18n/Link. */
export const KUNDLI_PAGES: KundliPage[] = [
  { href: "/kundli", key: "list", icon: PiGridFour },
  { href: "/kundli/chart", key: "chart", icon: PiPlanet, carriesProfile: true },
  { href: "/kundli/gochar", key: "gochar", icon: PiCirclesThreePlus, carriesProfile: true },
  { href: "/kundli/panchang", key: "panchang", icon: PiCalendarDots },
  { href: "/kundli/kp", key: "kp", icon: PiCompass },
  { href: "/kundli/milan", key: "milan", icon: PiHeart },
  { href: "/kundli/sheet", key: "sheet", icon: PiScroll },
];
