import type { Locale } from "@/i18n/config";

// The app picks [en, hi] pairs by its language at call time. On the web the language is the page's: the view sets
// it (setLang) before it calls the engine, which keeps the engine itself the app's own code.

export type Bi = [string, string];
let lang: Locale = "hi";
export const setLang = (l: Locale) => {
  lang = l;
};
export const isHi = () => lang === "hi";

export function bi(pair: Bi): string;
export function bi(en: string, hi: string): string;
export function bi(a: Bi | string, b?: string): string {
  const [en, hi] = Array.isArray(a) ? a : [a, b ?? a];
  return isHi() ? hi : en;
}
