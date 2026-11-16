// SAMPLE COPY taken from the design file. Replace with real data before launch.
//
// The design builds every reading from eight stock sentences, picked per sign and period with a seeded
// pseudo-random function (rnd below). Nothing here comes from a real horoscope source.

import type { Locale } from "@/i18n/config";

export type PeriodKey = "today" | "tomorrow" | "week" | "month";
export const PERIODS: PeriodKey[] = ["today", "tomorrow", "week", "month"];

export type Sign = {
  /** Zodiac symbol code point (the glyph is drawn as text, with the text variation selector). */
  glyph: number;
  /** Latin transliteration shown on the wheel (Mesh, Vrishabh, ...). */
  short: string;
  name: Record<Locale, string>;
  dates: Record<Locale, string>;
  lord: Record<Locale, string>;
};

export const SIGNS: Sign[] = [
  { glyph: 9800, short: "Mesh", name: { hi: "मेष", en: "Aries" }, dates: { hi: "21 मार्च – 19 अप्रैल", en: "21 Mar – 19 Apr" }, lord: { hi: "मंगल", en: "Mars" } },
  { glyph: 9801, short: "Vrishabh", name: { hi: "वृषभ", en: "Taurus" }, dates: { hi: "20 अप्रैल – 20 मई", en: "20 Apr – 20 May" }, lord: { hi: "शुक्र", en: "Venus" } },
  { glyph: 9802, short: "Mithun", name: { hi: "मिथुन", en: "Gemini" }, dates: { hi: "21 मई – 20 जून", en: "21 May – 20 Jun" }, lord: { hi: "बुध", en: "Mercury" } },
  { glyph: 9803, short: "Kark", name: { hi: "कर्क", en: "Cancer" }, dates: { hi: "21 जून – 22 जुलाई", en: "21 Jun – 22 Jul" }, lord: { hi: "चंद्र", en: "Moon" } },
  { glyph: 9804, short: "Singh", name: { hi: "सिंह", en: "Leo" }, dates: { hi: "23 जुलाई – 22 अगस्त", en: "23 Jul – 22 Aug" }, lord: { hi: "सूर्य", en: "Sun" } },
  { glyph: 9805, short: "Kanya", name: { hi: "कन्या", en: "Virgo" }, dates: { hi: "23 अगस्त – 22 सितंबर", en: "23 Aug – 22 Sep" }, lord: { hi: "बुध", en: "Mercury" } },
  { glyph: 9806, short: "Tula", name: { hi: "तुला", en: "Libra" }, dates: { hi: "23 सितंबर – 22 अक्तूबर", en: "23 Sep – 22 Oct" }, lord: { hi: "शुक्र", en: "Venus" } },
  { glyph: 9807, short: "Vrishchik", name: { hi: "वृश्चिक", en: "Scorpio" }, dates: { hi: "23 अक्तूबर – 21 नवंबर", en: "23 Oct – 21 Nov" }, lord: { hi: "मंगल", en: "Mars" } },
  { glyph: 9808, short: "Dhanu", name: { hi: "धनु", en: "Sagittarius" }, dates: { hi: "22 नवंबर – 21 दिसंबर", en: "22 Nov – 21 Dec" }, lord: { hi: "गुरु", en: "Jupiter" } },
  { glyph: 9809, short: "Makar", name: { hi: "मकर", en: "Capricorn" }, dates: { hi: "22 दिसंबर – 19 जनवरी", en: "22 Dec – 19 Jan" }, lord: { hi: "शनि", en: "Saturn" } },
  { glyph: 9810, short: "Kumbh", name: { hi: "कुंभ", en: "Aquarius" }, dates: { hi: "20 जनवरी – 18 फ़रवरी", en: "20 Jan – 18 Feb" }, lord: { hi: "शनि", en: "Saturn" } },
  { glyph: 9811, short: "Meen", name: { hi: "मीन", en: "Pisces" }, dates: { hi: "19 फ़रवरी – 20 मार्च", en: "19 Feb – 20 Mar" }, lord: { hi: "गुरु", en: "Jupiter" } },
];

/** Element of sign i is ELEMENTS[i % 4]. */
export const ELEMENTS = [
  { hi: "अग्नि", en: "Fire" },
  { hi: "पृथ्वी", en: "Earth" },
  { hi: "वायु", en: "Air" },
  { hi: "जल", en: "Water" },
] as const;

export const LINES: Record<Locale, string[]> = {
  en: [
    "Speak openly with someone you trust; it will ease your mind.",
    "Work that was stuck starts moving, so keep your focus.",
    "Think twice before a large purchase.",
    "Time with family brings comfort and good news.",
    "Your confidence is high, a good moment for important talks.",
    "Rest well; small daily habits protect your health.",
    "An old contact may bring a helpful opening.",
    "Patience in love helps you understand your partner better.",
  ],
  hi: [
    "किसी भरोसेमंद व्यक्ति से खुलकर बात करें; मन हल्का होगा।",
    "रुका हुआ काम आगे बढ़ने लगेगा, इसलिए ध्यान बनाए रखें।",
    "बड़ी खरीदारी से पहले दो बार सोचें।",
    "परिवार के साथ समय सुकून और अच्छी खबर लाएगा।",
    "आत्मविश्वास ऊँचा है, ज़रूरी बातचीत के लिए अच्छा समय।",
    "ठीक से आराम करें; रोज़ की छोटी आदतें सेहत बचाती हैं।",
    "कोई पुराना परिचित काम का मौका दिला सकता है।",
    "रिश्ते में धैर्य रखने से साथी को बेहतर समझ पाएँगे।",
  ],
};

export const COLOURS: Record<Locale, string[]> = {
  en: ["Golden", "Navy blue", "Cream", "Saffron", "White", "Green", "Maroon", "Sky blue"],
  hi: ["सुनहरा", "गहरा नीला", "क्रीम", "केसरिया", "सफ़ेद", "हरा", "गहरा लाल", "आसमानी"],
};

export const TIMES: Record<Locale, string[]> = {
  en: ["6–8 AM", "9–11 AM", "12–2 PM", "4–6 PM", "7–9 PM"],
  hi: ["सुबह 6–8", "सुबह 9–11", "दोपहर 12–2", "शाम 4–6", "रात 7–9"],
};

/** Life areas, in the order the design shows them. */
export const AREAS: Record<Locale, string[]> = {
  en: ["Love", "Career", "Health", "Money"],
  hi: ["प्रेम", "करियर", "सेहत", "धन"],
};

/** Index = score 2..5 (the design never shows 0 or 1). */
export const SCORE_WORDS: Record<Locale, string[]> = {
  en: ["", "", "Steady", "Good", "Strong", "Excellent"],
  hi: ["", "", "स्थिर", "अच्छा", "मज़बूत", "उत्कृष्ट"],
};

/** The design's seeded pseudo-random generator: same sign and period always give the same reading. */
export const rnd = (n: number) => {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
};

export type Reading = {
  text: string;
  areas: { label: string; word: string; score: number }[];
  number: number;
  colour: string;
  time: string;
};

/** The reading for a sign (0..11) and period, built exactly as the design does it. */
export function readingFor(locale: Locale, sign: number, period: PeriodKey): Reading {
  const k = sign * 7 + PERIODS.indexOf(period) * 31 + 3;
  const lines = LINES[locale];
  const idx: number[] = [];
  for (let j = 1; idx.length < 3 && j < 40; j++) {
    const x = Math.floor(rnd(k + j) * lines.length);
    if (!idx.includes(x)) idx.push(x);
  }
  return {
    text: idx.map((x) => lines[x]).join(" "),
    areas: AREAS[locale].map((label, j) => {
      const score = 2 + Math.floor(rnd(k + 10 + j) * 4);
      return { label, word: SCORE_WORDS[locale][score], score };
    }),
    number: 1 + Math.floor(rnd(k + 4) * 9),
    colour: COLOURS[locale][Math.floor(rnd(k + 5) * COLOURS[locale].length)],
    time: TIMES[locale][Math.floor(rnd(k + 6) * TIMES[locale].length)],
  };
}
