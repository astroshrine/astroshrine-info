import type { Locale } from "@/i18n/config";

/** An [English, Hindi] pair, as the app's tool engines carry their content text. */
export type Bi = readonly string[];
export type BiFn = {
  (pair: Bi): string;
  (en: string, hi: string): string;
};

/** Picks English or Hindi text by the page's language (the app picks by its own language the same way). */
export function makeBi(locale: Locale): BiFn {
  const i = locale === "hi" ? 1 : 0;
  return ((a: Bi | string, b?: string) => (Array.isArray(a) ? (a as Bi)[i] : [a as string, b ?? (a as string)][i])) as BiFn;
}

const MONTHS: Bi[] = [
  ["Jan", "जनवरी"], ["Feb", "फ़रवरी"], ["Mar", "मार्च"], ["Apr", "अप्रैल"], ["May", "मई"], ["Jun", "जून"],
  ["Jul", "जुलाई"], ["Aug", "अगस्त"], ["Sep", "सितंबर"], ["Oct", "अक्टूबर"], ["Nov", "नवंबर"], ["Dec", "दिसंबर"],
];

/** 'YYYY-MM' as "Apr 2027"; a bare 'YYYY' as is. */
export const ymText = (bi: BiFn, s: string | number) => {
  const p = String(s).split("-");
  return p.length > 1 ? `${bi(MONTHS[+p[1] - 1])} ${p[0]}` : p[0];
};
/** 'YYYY-MM-DD' as 'DD/MM/YYYY'. */
export const dmy = (s: string) => s.split("-").reverse().join("/");
export const pad2 = (n: number) => (n < 10 ? "0" : "") + n;

export const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
