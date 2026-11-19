// The twelve rashis as the rashifal wheel draws them (facts, not sample copy). The readings come from the
// backend: see @/lib/services/horoscope.

import type { Locale } from "@/i18n/config";

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
