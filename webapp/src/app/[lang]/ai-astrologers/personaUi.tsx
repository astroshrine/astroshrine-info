import type { IconType } from "react-icons";
import { PiBookOpen, PiBriefcase, PiClockCountdown, PiHandsPraying, PiHash, PiHeart, PiHouse, PiStar, PiTarget, PiCopy } from "react-icons/pi";
import type { Locale } from "@/i18n/config";
import type { Persona } from "@/lib/services/aiAstrologers";

/** The app names its icons after FontAwesome; these are the matching ones here. */
const ICONS: Record<string, IconType> = {
  "book-open": PiBookOpen,
  bullseye: PiTarget,
  heart: PiHeart,
  briefcase: PiBriefcase,
  house: PiHouse,
  hashtag: PiHash,
  clone: PiCopy,
  "hands-praying": PiHandsPraying,
  clock: PiClockCountdown,
};

/** A persona's icon (a component of its own, so a list can draw a different icon per row). */
export function PersonaIcon({ persona, className }: { persona: Pick<Persona, "icon">; className?: string }) {
  const Icon = ICONS[persona.icon] ?? PiStar;
  return <Icon className={className} aria-hidden />;
}

export const personaName = (p: Persona, locale: Locale) => (locale === "hi" ? p.name_hi || p.name_en : p.name_en || p.name_hi);
export const personaTopic = (p: Persona, locale: Locale) => (locale === "hi" ? p.topic_hi || p.topic_en : p.topic_en || p.topic_hi);
