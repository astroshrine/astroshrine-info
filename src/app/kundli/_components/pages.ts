import type { IconType } from "react-icons";
import { PiCalendarDots, PiCirclesThreePlus, PiCompass, PiGridFour, PiHeart, PiPlanet, PiScroll } from "react-icons/pi";

export type KundliPage = {
  href: string;
  label: string;
  icon: IconType;
  /** The page shows the birth profile carried in the URL hash. */
  carriesProfile?: boolean;
};

/** Every page of the Jyotish section, in navigation order. */
export const KUNDLI_PAGES: KundliPage[] = [
  { href: "/kundli", label: "मेरी कुंडलियाँ", icon: PiGridFour },
  { href: "/kundli/chart", label: "कुंडली", icon: PiPlanet, carriesProfile: true },
  { href: "/kundli/gochar", label: "गोचर", icon: PiCirclesThreePlus, carriesProfile: true },
  { href: "/kundli/panchang", label: "पंचांग", icon: PiCalendarDots },
  { href: "/kundli/kp", label: "KP प्रश्न", icon: PiCompass },
  { href: "/kundli/milan", label: "कुंडली मिलान", icon: PiHeart },
  { href: "/kundli/sheet", label: "मेरी विस्तृत कुंडली", icon: PiScroll },
];
