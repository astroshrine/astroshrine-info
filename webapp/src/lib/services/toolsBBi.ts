import type { Locale } from "@/i18n/config";

// The muhurat engines and the app's tool screens carry text as [English, Hindi] pairs and pick one by the
// app's language (React-native-app/src/features/tools/bi.ts). The same here, by the page's language.

export type Pair = readonly [string, string];
export type Bi = {
  (pair: Pair): string;
  (en: string, hi: string): string;
};

export function makeBi(locale: Locale): Bi {
  return ((a: Pair | string, b?: string) => {
    const [en, hi] = Array.isArray(a) ? (a as Pair) : [a as string, b ?? (a as string)];
    return locale === "hi" ? hi : en;
  }) as Bi;
}

/** 'YYYY-MM-DD' as 'DD/MM/YYYY'. */
export const dmy = (s: string) => s.split("-").reverse().join("/");
export const pad2 = (n: number) => (n < 10 ? "0" : "") + n;
export const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);

/** Adds months to a YYYY-MM-DD date (UTC arithmetic). */
export const addMonths = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, d)).toISOString().slice(0, 10);
};
/** The UTC midnight of a YYYY-MM-DD date. */
export const utcDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** The engines' lagna-table rows (UM.lagnaDay, E.upanayanLagnaDay): an array with the formatting helpers in `.o`. */
export type LagnaRows = Array<{
  s: number;
  e: number;
  sign: number;
  cls: "shreshth" | "madhyam" | "varjit";
  why: string[];
  kaal: { name: string; s: number; e: number }[];
  full: { s: number; e: number }[];
  inSpans: { s: number; e: number }[];
  out?: boolean;
  outWhy?: string;
}> & { o: { fmt: (t: number) => string; rashi: (i: number) => string; allowed?: boolean } };
