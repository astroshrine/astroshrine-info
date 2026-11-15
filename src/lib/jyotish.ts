// Types, names and pure helpers for the backend Jyotish engine (/v1/jyotish, Swiss Ephemeris, Lahiri).
// Every number comes from the server; this file only names and lays out what it sends, the way the app does
// (features/jyotish/jyotishApi.ts + jyotishData.ts, features/kundliSheet/*). Engine times are ISO strings
// already in the place's own zone, so they are sliced, never converted through this device's clock.

import type { Locale } from "@/i18n/config";
import { defineMessages } from "@/i18n/messages";

// ─── Engine types ───────────────────────────────────────────────────────────────

export type Graha = "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn" | "Rahu" | "Ketu";
export const GRAHAS: Graha[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
/** The slow grahas the app's Gochar screen follows. */
export const SLOW_GRAHAS: Graha[] = ["Jupiter", "Saturn", "Rahu", "Ketu"];

export type Dignity = "exalted" | "moolatrikona" | "own" | "friend" | "neutral" | "enemy" | "debilitated";

/** A sidereal point; rashi 1..12, nakshatra 1..27, pada 1..4. */
export type Point = {
  lon: number;
  rashi: number;
  rashi_name: string;
  deg_in_rashi: number;
  dms: string;
  nakshatra: number;
  nakshatra_name: string;
  pada: number;
  nak_lord: Graha;
  star_lord: Graha;
  sub_lord: Graha;
};
export type Planet = Point & { name: Graha; retro: boolean; combust: boolean; dignity: Dignity; house: number };
export type DashaLevel = "maha" | "antar" | "pratyantar" | "sookshma";
export type DashaPeriod = { level: DashaLevel; lord: string; start: string; end: string };
export type YogaHit = {
  id: string;
  type: "yoga" | "dosha";
  name_en: string;
  name_hi: string;
  bindings: Record<string, string | number>;
  cancelled: boolean;
  cancelled_by: string[];
};

/** POST /v1/jyotish/chart (the parts the website shows). */
export type Chart = {
  meta: {
    local: string;
    tz: string;
    ayanamsha: string;
    ayanamsha_deg: number;
    warnings: string[];
    time_unknown?: { assumed_time: string; moon_sign_stable: boolean; moon_nakshatra_stable: boolean };
  };
  lagna: Point;
  planets: Record<Graha, Planet>;
  vargas: Record<string, { lagna: number; planets: Record<Graha, number> }>;
  jaimini: { karakas: Record<string, Graha> };
  yogas: YogaHit[];
  doshas: { list: YogaHit[]; kaal_sarp: "full" | "partial" | "none" };
  dasha: {
    vimshottari: { balance: { lord: string; years: number }; running: DashaPeriod[]; next: DashaPeriod[] };
    yogini: { balance: { lord: string; years: number }; running: DashaPeriod[] };
  };
};

/** Request body `birth` (backend birthErrors): date YYYY-MM-DD, time HH:MM unless time_unknown, IANA tz. */
export type BirthInput = { date: string; time?: string; time_unknown?: boolean; tz: string; lat: number; lon: number };

/** POST /v1/jyotish/transits. */
export type Transits = {
  from: string;
  to: string;
  stations: { planet: Graha; kind: "retrograde" | "direct"; at: string }[];
  segments: {
    planet: Graha;
    rashi: number;
    start: string;
    end: string;
    house_from_lagna: number;
    house_from_moon: number;
  }[];
  saturn_cycles: { kind: string; start: string; end: string; phases: { phase: string; start: string; end: string }[] }[];
};

export type Span = { start: string; end: string };
export type Anga = { index: number; name: string; end: string };
export type Chogh = Span & { name: string; nature: "shubh" | "madhyam" | "ashubh" };
/** POST /v1/jyotish/panchang. */
export type Panchang = {
  date: string;
  tz: string;
  warnings: string[];
  vaar: { index: number; name: string; lord: Graha };
  sunrise: string;
  sunset: string;
  moonrise: string | null;
  moonset: string | null;
  paksha: "shukla" | "krishna";
  tithi: Anga[];
  nakshatra: (Anga & { lord: Graha })[];
  yoga: Anga[];
  karana: Anga[];
  rahu_kaal: Span;
  yamaganda: Span;
  gulika: Span;
  abhijit: Span | null;
  choghadiya: { day: Chogh[]; night: Chogh[] };
  month: { amanta: string; purnimanta: string; adhika: boolean };
};

/** POST /v1/jyotish/kp/horary. */
export type Horary = {
  number: number;
  warnings: string[];
  ascendant: Point;
  cusps: (Point & { house: number })[];
  significators: { houses: { house: number; level1: Graha[]; level2: Graha[]; level3: Graha[]; level4: Graha[] }[] };
  ruling_planets: Record<
    "day_lord" | "moon_sign_lord" | "moon_star_lord" | "moon_sub_lord" | "lagna_sign_lord" | "lagna_star_lord" | "lagna_sub_lord",
    Graha
  >;
};

/** GET /v1/jyotish/sheet/:userId: the one page kundli sheet of the account's own saved birth details. */
export type SheetRow = {
  graha: Graha | "Lagna";
  retro: boolean;
  combust: boolean;
  dms: string;
  rashi: number;
  nakshatra: number;
  pada: number;
  nak_lord: Graha;
  sub_lord: Graha;
  ansh_lord: Graha;
  dignity: Dignity | null;
  shadbala: { ratio: number; rupas: number } | null;
  chara_karaka: string | null;
  sthira_karaka: string | null;
  tara: number;
};
export type SheetChart = { houses: number[]; planets: { graha: Graha; house: number; retro: boolean }[] };
export type DashaNode = { lord: string; graha?: string; start: string; end: string; sub?: DashaNode[] };
export type DashaTree = { balance: { lord: string; years: number }; periods: DashaNode[] };
export type Gochar = {
  at: string;
  planets: { graha: Graha; rashi: number; dms: string; nakshatra: number; pada: number; retro: boolean; house_from_lagna: number | null; house_from_moon: number }[];
};
export type Sheet = {
  profile: { name: string; place: string };
  birth: { date: string; time: string; tz: string; lat: number; lon: number };
  ayanamsha: { name: string; deg: number };
  vaar: number;
  warnings: string[];
  rows: SheetRow[];
  charts: { lagna_chalit: SheetChart; chandra: SheetChart; navamsha: SheetChart };
  sav: number[];
  sav_total: number;
  dasha: { vimshottari: DashaTree; yogini: DashaTree };
  gochar?: Gochar;
};

// ─── Names, in every language ────────────────────────────────────────────────────────
// Hindi is the app's own lists; English follows the app's en.json (deliveryMuhurat.graha / nakshatra / grahaShort,
// kundliSheet.karaka) and the site's glossary (Aries ... Pisces). Read them with the helpers below, which take the
// page's locale (useLocale() in Client Components, await getLocale() on the server).

const GRAHA_NAMES = defineMessages<Record<Graha, string>>({
  hi: { Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु" },
  en: { Sun: "Sun", Moon: "Moon", Mars: "Mars", Mercury: "Mercury", Jupiter: "Jupiter", Venus: "Venus", Saturn: "Saturn", Rahu: "Rahu", Ketu: "Ketu" },
});

/** Chart labels: the app's KundliChart in Hindi, its two letter short names in English. */
const GRAHA_ABBRS = defineMessages<Record<Graha, string>>({
  hi: { Sun: "सू", Moon: "चं", Mars: "मं", Mercury: "बु", Jupiter: "गु", Venus: "शु", Saturn: "श", Rahu: "रा", Ketu: "के" },
  en: { Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke" },
});

/** Rashi 1..12. */
const RASHI_NAMES = defineMessages({
  hi: ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन"],
  en: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
});

/** Nakshatra 1..27. */
const NAKSHATRA_NAMES = defineMessages({
  hi: [
    "अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा", "पुनर्वसु", "पुष्य", "आश्लेषा",
    "मघा", "पूर्वाफाल्गुनी", "उत्तराफाल्गुनी", "हस्त", "चित्रा", "स्वाति", "विशाखा", "अनुराधा", "ज्येष्ठा",
    "मूल", "पूर्वाषाढ़ा", "उत्तराषाढ़ा", "श्रवण", "धनिष्ठा", "शतभिषा", "पूर्वाभाद्रपद", "उत्तराभाद्रपद", "रेवती",
  ],
  en: [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
    "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
  ],
});

const DIGNITY_NAMES = defineMessages<Record<Dignity, string>>({
  hi: {
    exalted: "उच्च",
    moolatrikona: "मूलत्रिकोण",
    own: "स्वराशि",
    friend: "मित्र राशि",
    neutral: "सम राशि",
    enemy: "शत्रु राशि",
    debilitated: "नीच",
  },
  en: {
    exalted: "Exalted",
    moolatrikona: "Moolatrikona",
    own: "Own sign",
    friend: "Friendly sign",
    neutral: "Neutral sign",
    enemy: "Enemy sign",
    debilitated: "Debilitated",
  },
});

const LEVEL_NAMES = defineMessages<Record<DashaLevel, string>>({
  hi: { maha: "महादशा", antar: "अंतर्दशा", pratyantar: "प्रत्यंतर", sookshma: "सूक्ष्म" },
  en: { maha: "Mahadasha", antar: "Antardasha", pratyantar: "Pratyantar", sookshma: "Sookshma" },
});

/**
 * Tithi, yoga, karana, vaar, choghadiya, lunar month and yogini names (the app's termName). The engine sends
 * them transliterated, which is also how English shows them; English lists only the names it words differently.
 */
const TERM_NAMES = defineMessages<Record<string, string>>({
  hi: {
    Pratipada: "प्रतिपदा", Dwitiya: "द्वितीया", Tritiya: "तृतीया", Chaturthi: "चतुर्थी", Panchami: "पंचमी",
    Shashthi: "षष्ठी", Saptami: "सप्तमी", Ashtami: "अष्टमी", Navami: "नवमी", Dashami: "दशमी",
    Ekadashi: "एकादशी", Dwadashi: "द्वादशी", Trayodashi: "त्रयोदशी", Chaturdashi: "चतुर्दशी",
    Purnima: "पूर्णिमा", Amavasya: "अमावस्या",
    Vishkambha: "विष्कुम्भ", Priti: "प्रीति", Ayushman: "आयुष्मान", Saubhagya: "सौभाग्य", Shobhana: "शोभन",
    Atiganda: "अतिगण्ड", Sukarma: "सुकर्मा", Dhriti: "धृति", Shula: "शूल", Ganda: "गण्ड", Vriddhi: "वृद्धि",
    Dhruva: "ध्रुव", Vyaghata: "व्याघात", Harshana: "हर्षण", Vajra: "वज्र", Siddhi: "सिद्धि",
    Vyatipata: "व्यतीपात", Variyan: "वरीयान", Parigha: "परिघ", Shiva: "शिव", Siddha: "सिद्ध",
    Sadhya: "साध्य", Shubha: "शुभ", Shukla: "शुक्ल", Brahma: "ब्रह्म", Indra: "ऐन्द्र", Vaidhriti: "वैधृति",
    Bava: "बव", Balava: "बालव", Kaulava: "कौलव", Taitila: "तैतिल", Gara: "गर", Vanija: "वणिज",
    Vishti: "विष्टि (भद्रा)", Shakuni: "शकुनि", Chatushpada: "चतुष्पद", Naga: "नाग", Kimstughna: "किंस्तुघ्न",
    Ravivar: "रविवार", Somvar: "सोमवार", Mangalvar: "मंगलवार", Budhvar: "बुधवार", Guruvar: "गुरुवार",
    Shukravar: "शुक्रवार", Shanivar: "शनिवार",
    Udveg: "उद्वेग", Char: "चर", Labh: "लाभ", Amrit: "अमृत", Kaal: "काल", Shubh: "शुभ", Rog: "रोग",
    Chaitra: "चैत्र", Vaishakha: "वैशाख", Jyeshtha: "ज्येष्ठ", Ashadha: "आषाढ़", Shravana: "श्रावण",
    Bhadrapada: "भाद्रपद", Ashwin: "आश्विन", Kartika: "कार्तिक", Margashirsha: "मार्गशीर्ष", Pausha: "पौष",
    Magha: "माघ", Phalguna: "फाल्गुन",
    Mangala: "मंगला", Pingala: "पिंगला", Dhanya: "धान्या", Bhramari: "भ्रामरी", Bhadrika: "भद्रिका",
    Ulka: "उल्का", Sankata: "संकटा",
  },
  en: {
    Vishti: "Vishti (Bhadra)",
    Ravivar: "Sunday", Somvar: "Monday", Mangalvar: "Tuesday", Budhvar: "Wednesday", Guruvar: "Thursday",
    Shukravar: "Friday", Shanivar: "Saturday",
  },
});

/** Sade Sati and Dhaiya, and the phases of Sade Sati. */
const SATURN_NAMES = defineMessages<Record<string, string>>({
  hi: {
    sade_sati: "साढ़ेसाती",
    sade_sati_rising: "आरोही चरण",
    sade_sati_peak: "मध्य चरण",
    sade_sati_setting: "अवरोही चरण",
    dhaiya_kantaka: "ढैय्या (चंद्र से चतुर्थ)",
    dhaiya_ashtama: "ढैय्या (चंद्र से अष्टम)",
  },
  en: {
    sade_sati: "Sade Sati",
    sade_sati_rising: "Rising phase",
    sade_sati_peak: "Peak phase",
    sade_sati_setting: "Setting phase",
    dhaiya_kantaka: "Dhaiya (4th from the Moon)",
    dhaiya_ashtama: "Dhaiya (8th from the Moon)",
  },
});

/** Why a yoga or dosha is cancelled (bhang), as the app words it. */
const CANCEL_NAMES = defineMessages({
  hi: {
    lord_in_dusthana: "कोई स्वामी 6, 8 या 12 भाव में",
    lord_debilitated: "कोई स्वामी नीच का",
    lord_combust: "कोई स्वामी अस्त",
    jupiter_debilitated: "गुरु नीच के",
    jupiter_combust: "गुरु अस्त",
    jupiter_enemy_sign: "गुरु शत्रु राशि में",
    combust: "ग्रह अस्त",
    planet_in_kendra_from_moon: "चंद्र से केंद्र में ग्रह",
    planet_in_kendra_from_lagna: "लग्न से केंद्र में ग्रह",
    jupiter_aspects_moon: "चंद्र पर गुरु की दृष्टि",
    jupiter_strong: "गुरु बलवान (स्व या उच्च)",
    jupiter_aspect: "गुरु की दृष्टि",
    mars_dignified: "मंगल स्व या उच्च राशि में",
    jupiter_with_or_aspecting_mars: "मंगल के साथ या उस पर गुरु की दृष्टि",
    mars_in_leo_aquarius: "मंगल सिंह या कुंभ में",
    house_sign_exemption: "भाव राशि अपवाद",
    // The engine's other cancellation ids (data/yogas.json), which the app shows as raw ids.
    moon_strong: "चंद्र बलवान",
    jupiter_aspects_house: "भाव पर गुरु की दृष्टि",
    jupiter_with_7th_lord: "सप्तमेश के साथ गुरु",
    "7th_lord_strong": "सप्तमेश बलवान",
    venus_strong: "शुक्र बलवान",
    benefic_with_ref: "संबंधित भाव या ग्रह के साथ शुभ ग्रह",
    jupiter_on_node: "राहु या केतु पर गुरु की युति या दृष्टि",
    jupiter_on_9th_lord: "नवमेश पर गुरु की युति या दृष्टि",
    jupiter_on_saturn: "शनि पर गुरु की युति या दृष्टि",
    saturn_strong: "शनि बलवान",
    jupiter_on_mars: "मंगल पर गुरु की युति या दृष्टि",
    moon_in_kendra: "चंद्र केंद्र में",
    "11th_lord_strong": "एकादशेश बलवान",
    jupiter_on_11th_lord: "एकादशेश पर गुरु की युति या दृष्टि",
    jupiter_on_6th_lord: "षष्ठेश पर गुरु की युति या दृष्टि",
    jupiter_with_9th_lord: "नवमेश के साथ गुरु",
    "5th_lord_strong": "पंचमेश बलवान",
  },
  en: {
    lord_in_dusthana: "a lord in the 6th, 8th or 12th house",
    lord_debilitated: "a lord is debilitated",
    lord_combust: "a lord is combust",
    jupiter_debilitated: "Jupiter is debilitated",
    jupiter_combust: "Jupiter is combust",
    jupiter_enemy_sign: "Jupiter in an enemy sign",
    combust: "the planet is combust",
    planet_in_kendra_from_moon: "a planet in a kendra from the Moon",
    planet_in_kendra_from_lagna: "a planet in a kendra from the Ascendant",
    jupiter_aspects_moon: "Jupiter aspects the Moon",
    jupiter_strong: "Jupiter is strong (own or exalted sign)",
    jupiter_aspect: "Jupiter's aspect",
    mars_dignified: "Mars in its own or exalted sign",
    jupiter_with_or_aspecting_mars: "Jupiter with Mars or aspecting it",
    mars_in_leo_aquarius: "Mars in Leo or Aquarius",
    house_sign_exemption: "house and sign exemption",
    moon_strong: "the Moon is strong",
    jupiter_aspects_house: "Jupiter aspects the house",
    jupiter_with_7th_lord: "Jupiter with the 7th lord",
    "7th_lord_strong": "the 7th lord is strong",
    venus_strong: "Venus is strong",
    benefic_with_ref: "a benefic with the house or planet concerned",
    jupiter_on_node: "Jupiter conjoins or aspects Rahu or Ketu",
    jupiter_on_9th_lord: "Jupiter conjoins or aspects the 9th lord",
    jupiter_on_saturn: "Jupiter conjoins or aspects Saturn",
    saturn_strong: "Saturn is strong",
    jupiter_on_mars: "Jupiter conjoins or aspects Mars",
    moon_in_kendra: "the Moon in a kendra",
    "11th_lord_strong": "the 11th lord is strong",
    jupiter_on_11th_lord: "Jupiter conjoins or aspects the 11th lord",
    jupiter_on_6th_lord: "Jupiter conjoins or aspects the 6th lord",
    jupiter_with_9th_lord: "Jupiter with the 9th lord",
    "5th_lord_strong": "the 5th lord is strong",
  },
});

/** Jaimini chara karaka codes. */
const CHARA_NAMES = defineMessages<Record<string, string>>({
  hi: {
    AK: "आत्मकारक",
    AmK: "अमात्यकारक",
    BK: "भ्रातृकारक",
    MK: "मातृकारक",
    PiK: "पितृकारक",
    PK: "पुत्रकारक",
    GK: "ज्ञातिकारक",
    DK: "दाराकारक",
  },
  en: {
    AK: "Atmakaraka",
    AmK: "Amatyakaraka",
    BK: "Bhratrikaraka",
    MK: "Matrikaraka",
    PiK: "Pitrikaraka",
    PK: "Putrakaraka",
    GK: "Gnatikaraka",
    DK: "Darakaraka",
  },
});

/** Sthira karakas: the relative each graha signifies. */
const STHIRA_NAMES = defineMessages<Record<string, string>>({
  hi: {
    father: "पिता",
    mother: "माता",
    siblings: "भाई बहन",
    maternal_relatives: "मातृ पक्ष",
    children: "संतान",
    spouse: "जीवनसाथी",
    elder_siblings: "बड़े भाई बहन",
  },
  en: {
    father: "Father",
    mother: "Mother",
    siblings: "Siblings",
    maternal_relatives: "Maternal relatives",
    children: "Children",
    spouse: "Spouse",
    elder_siblings: "Elder siblings",
  },
});

/** Tara from the janma nakshatra, 1..9. */
const TARA_NAMES = defineMessages({
  hi: ["जन्म", "संपत", "विपत", "क्षेम", "प्रत्यरि", "साधक", "वध", "मित्र", "अति मित्र"],
  en: ["Janma", "Sampat", "Vipat", "Kshema", "Pratyari", "Sadhaka", "Vadha", "Mitra", "Ati mitra"],
});

/** Weekday 0..6, Sunday first. */
const VAAR_NAMES = defineMessages({
  hi: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
});

export const grahaName = (g: string, locale: Locale) => GRAHA_NAMES[locale][g as Graha] ?? g;
/** The planet's short label on a chart. */
export const grahaAbbr = (g: Graha, locale: Locale) => GRAHA_ABBRS[locale][g];
export const rashiName = (n: number, locale: Locale) => RASHI_NAMES[locale][n - 1] ?? String(n);
export const nakshatraName = (n: number, locale: Locale, fallback = "") => NAKSHATRA_NAMES[locale][n - 1] ?? fallback;
export const dignityName = (d: Dignity, locale: Locale) => DIGNITY_NAMES[locale][d] ?? d;
export const levelName = (level: DashaLevel, locale: Locale) => LEVEL_NAMES[locale][level] ?? level;
/** Tithi, yoga, karana, vaar, choghadiya, lunar month or yogini name, from the engine's transliteration. */
export const termName = (en: string, locale: Locale) => TERM_NAMES[locale][en] ?? en;
export const saturnName = (kind: string, locale: Locale) => SATURN_NAMES[locale][kind] ?? kind;
export const cancelName = (id: string, locale: Locale) =>
  (CANCEL_NAMES[locale] as Record<string, string>)[id] ?? id.replace(/_/g, " ");
export const charaName = (code: string, locale: Locale) => CHARA_NAMES[locale][code] ?? code;
export const sthiraName = (relative: string, locale: Locale) => STHIRA_NAMES[locale][relative] ?? relative;
/** Tara 1..9. */
export const taraName = (n: number, locale: Locale) => TARA_NAMES[locale][n - 1] ?? String(n);
/** Weekday 0..6, Sunday first. */
export const vaarName = (i: number, locale: Locale) => VAAR_NAMES[locale][i] ?? "";
/** A dasha lord: a graha for Vimshottari, a yogini name for Yogini. */
export const lordName = (lord: string, locale: Locale) => GRAHA_NAMES[locale][lord as Graha] ?? termName(lord, locale);

// ─── The 16 vargas (Shodashavarga), names and meanings as the backend's varga.ts gives them ──────

/** `hi` and `en`: the varga's name in each language; `meaning`: what it is read for, in Hindi (see vargaMeaning). */
export type Varga = { key: string; div: number; hi: string; en: string; meaning: string };

const VARGA_TEXT = defineMessages({
  hi: {
    D1: { name: "राशि", meaning: "समग्र स्वभाव और जीवन की दिशा" },
    D2: { name: "होरा", meaning: "धन और संसाधन" },
    D3: { name: "द्रेष्काण", meaning: "भाई बहन और साहस" },
    D4: { name: "चतुर्थांश", meaning: "घर, संपत्ति और भाग्य" },
    D7: { name: "सप्तांश", meaning: "संतान और वंश" },
    D9: { name: "नवांश", meaning: "जीवनसाथी, धर्म और ग्रहों का आंतरिक बल" },
    D10: { name: "दशमांश", meaning: "कर्म, व्यवसाय और उपलब्धियाँ" },
    D12: { name: "द्वादशांश", meaning: "माता पिता" },
    D16: { name: "षोडशांश", meaning: "वाहन और सुख सुविधाएँ" },
    D20: { name: "विंशांश", meaning: "उपासना और आध्यात्मिक प्रगति" },
    D24: { name: "चतुर्विंशांश", meaning: "विद्या और शिक्षा" },
    D27: { name: "भांश", meaning: "आंतरिक शक्तियाँ और कमज़ोरियाँ" },
    D30: { name: "त्रिंशांश", meaning: "चुनौतियाँ और उनसे निपटने का ढंग" },
    D40: { name: "खवेदांश", meaning: "मातृ पक्ष से मिलने वाली शुभ प्रवृत्तियाँ" },
    D45: { name: "अक्षवेदांश", meaning: "चरित्र और आचरण (पितृ पक्ष)" },
    D60: { name: "षष्ट्यंश", meaning: "पूर्व कर्मों का सामान्य फल" },
  },
  en: {
    D1: { name: "Rashi", meaning: "Overall nature and the direction of life" },
    D2: { name: "Hora", meaning: "Wealth and resources" },
    D3: { name: "Drekkana", meaning: "Siblings and courage" },
    D4: { name: "Chaturthamsha", meaning: "Home, property and fortune" },
    D7: { name: "Saptamsha", meaning: "Children and lineage" },
    D9: { name: "Navamsha", meaning: "Spouse, dharma and the inner strength of the planets" },
    D10: { name: "Dashamsha", meaning: "Work, career and achievements" },
    D12: { name: "Dwadashamsha", meaning: "Parents" },
    D16: { name: "Shodashamsha", meaning: "Vehicles and comforts" },
    D20: { name: "Vimshamsha", meaning: "Worship and spiritual progress" },
    D24: { name: "Chaturvimshamsha", meaning: "Learning and education" },
    D27: { name: "Bhamsha", meaning: "Inner strengths and weaknesses" },
    D30: { name: "Trimshamsha", meaning: "Challenges and how they are met" },
    D40: { name: "Khavedamsha", meaning: "Good tendencies from the mother's side" },
    D45: { name: "Akshavedamsha", meaning: "Character and conduct (father's side)" },
    D60: { name: "Shashtiamsha", meaning: "General results of past karma" },
  },
});
type VargaKey = keyof (typeof VARGA_TEXT)["hi"];

export const VARGAS: Varga[] = (Object.keys(VARGA_TEXT.hi) as VargaKey[]).map((key) => ({
  key,
  div: Number(key.slice(1)),
  hi: VARGA_TEXT.hi[key].name,
  en: VARGA_TEXT.en[key].name,
  meaning: VARGA_TEXT.hi[key].meaning,
}));

export const vargaName = (v: Varga, locale: Locale) => VARGA_TEXT[locale][v.key as VargaKey]?.name ?? v.en;
/** What the varga is read for, in the given language. */
export const vargaMeaning = (v: Varga, locale: Locale) => VARGA_TEXT[locale][v.key as VargaKey]?.meaning ?? v.meaning;

// ─── Dates ─────────────────────────────────────────────────────────────────────

/** "2026-11-12T00:00:25+05:30" or "2026-11-12" -> "12/11/2026" */
export const day = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
/** "2026-11-12T00:00:25+05:30" -> "00:00" */
export const hm = (iso?: string | null) => (iso ? iso.slice(11, 16) : "");
/** "12/11/2026, 00:00" */
export const when = (iso: string) => `${day(iso)}, ${hm(iso)}`;

/** The period running now in a [start, end) list (the app's runningIndex). */
export const runningIndex = (periods: { start: string; end: string }[], now = Date.now()) =>
  periods.findIndex((p) => Date.parse(p.start) <= now && now < Date.parse(p.end));

// ─── North Indian chart data ────────────────────────────────────────────────────────

export type ChartHouse = { house: number; rashi: number; planets: { graha: Graha; retro: boolean }[] };

/** Whole sign houses of any varga: house 1 holds that varga's lagna rashi (the app's kundliChartData). */
export function vargaHouses(chart: Chart, key: string): ChartHouse[] {
  const v = chart.vargas[key] ?? chart.vargas.D1;
  const lagna = key === "D1" ? chart.lagna.rashi : v.lagna;
  const signOf = (g: Graha) => (key === "D1" ? chart.planets[g].rashi : v.planets[g]);
  const houseOf = (rashi: number) => ((rashi - lagna + 12) % 12) + 1;
  return Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    rashi: ((lagna - 1 + i) % 12) + 1,
    planets: GRAHAS.filter((g) => houseOf(signOf(g)) === i + 1).map((g) => ({ graha: g, retro: chart.planets[g].retro })),
  }));
}

/** A chart the kundli sheet sends ready made (lagna chalit, chandra, navamsha). */
export function sheetChartHouses(c: SheetChart): ChartHouse[] {
  return c.houses.map((rashi, i) => ({
    house: i + 1,
    rashi,
    planets: c.planets.filter((p) => p.house === i + 1).map((p) => ({ graha: p.graha, retro: p.retro })),
  }));
}

/** The lagna (D1) chart of a kundli sheet, from its rows. */
export function sheetLagnaHouses(sheet: Sheet): ChartHouse[] {
  const lagna = sheet.rows.find((r) => r.graha === "Lagna")!.rashi;
  return Array.from({ length: 12 }, (_, i) => {
    const rashi = ((lagna - 1 + i) % 12) + 1;
    return {
      house: i + 1,
      rashi,
      planets: sheet.rows
        .filter((r): r is SheetRow & { graha: Graha } => r.graha !== "Lagna" && r.rashi === rashi)
        .map((r) => ({ graha: r.graha, retro: r.retro })),
    };
  });
}

// ─── Birth profile (kept in this browser, like the app keeps it on the device) ─────────

export type BirthPlace = { name: string; lat: number; lon: number; tz: string };
export type BirthProfile = { name: string; dob: string; tob: string; timeUnknown: boolean; place: BirthPlace };

export const profileReady = (p: Partial<BirthProfile> | null | undefined): p is BirthProfile =>
  !!p && !!p.name?.trim() && !!p.dob && !!p.place && (!!p.timeUnknown || !!p.tob);

/** Request body `birth` for the engine (the app's toBirth). */
export const toBirth = (p: BirthProfile): BirthInput => ({
  date: p.dob,
  ...(p.timeUnknown ? { time_unknown: true } : { time: p.tob }),
  tz: p.place.tz,
  lat: p.place.lat,
  lon: p.place.lon,
});

/** "23.18°N 75.79°E" */
export const coords = (lat: number, lon: number) =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;

// ─── Birth time <-> epoch (the account profile stores the birth moment as epoch ms) ─────

function wallParts(ms: number, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), s: get("second") };
}

/** Offset of `tz` from UTC at instant `ms`, in ms. */
function offsetAt(ms: number, tz: string) {
  const p = wallParts(ms, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
}

/** The instant of a wall clock time in `tz` (date "YYYY-MM-DD", time "HH:MM"). */
export function wallToEpoch(date: string, time: string, tz: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const first = guess - offsetAt(guess, tz);
  return guess - offsetAt(first, tz);
}

/** The wall clock of instant `ms` in `tz`: { date: "YYYY-MM-DD", time: "HH:MM" } (the backend's sheetProfile rule). */
export function epochToWall(ms: number, tz: string): { date: string; time: string } {
  const p = wallParts(ms, tz);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${p.y}-${pad(p.m)}-${pad(p.d)}`, time: `${pad(p.h)}:${pad(p.mi)}` };
}

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Today on this device's calendar (toISOString would give yesterday before 05:30 IST). */
export function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
