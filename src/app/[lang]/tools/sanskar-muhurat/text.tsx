"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import type { Locale } from "@/i18n/config";
import type { Bi } from "./_logic/kb";
import { muhuratEngine } from "./_logic/engine";

const DEVA = /[ऀ-ॿ]/;

/** Engine and rule text of the app is Hindi in places that have no English twin: it is marked so on /en. */
export function Txt({ text }: { text: string }) {
  const locale = useLocale();
  return locale === "en" && DEVA.test(text) ? <span lang="hi">{text}</span> : <>{text}</>;
}

/** A Hindi / English pair in the page's language. */
export function Tx({ b }: { b: Bi | undefined }) {
  const locale = useLocale();
  return <Txt text={b ? b[locale] : ""} />;
}

export const bs = (b: Bi | undefined, locale: Locale) => (b ? b[locale] : "");

/** Every displayed time on the 12 hour clock (the engine's own helper); the data stays 24 hour. */
export function hm(text: string): string {
  try {
    return muhuratEngine().hm12All(text) as string;
  } catch {
    return text;
  }
}

const MONTH_HI = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितम्बर", "अक्टूबर", "नवम्बर", "दिसम्बर"];
const MONTH_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const fmtDate = (d: string, locale: Locale) => `${+d.slice(8, 10)} ${(locale === "hi" ? MONTH_HI : MONTH_EN)[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;
const VAAR_HI = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
const VAAR_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const vaarName = (i: number, locale: Locale) => (locale === "hi" ? VAAR_HI : VAAR_EN)[i];
