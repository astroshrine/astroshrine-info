/**
 * The website's languages: the same two as the AstroShrine app. Every page lives under its language
 * (/hi/kundli, /en/kundli). Hindi is the default: a link without a language opens in Hindi unless the visitor
 * picked English with the language switch before.
 */
export const LOCALES = ["hi", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "hi";

/** The visitor's own choice from the language switch. The proxy reads it for links without a language. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

/** Each language's name in its own script, as the language switch shows it. */
// i18n-ok: language names are always shown in their own script.
export const LOCALE_NAMES: Record<Locale, string> = { hi: "हिंदी", en: "English" };

/** For dates with Intl: Hindi month names in Hindi, Indian conventions and Latin digits in both. */
export const INTL_LOCALE: Record<Locale, string> = { hi: "hi-IN", en: "en-IN" };

/** Open Graph locale of each language. */
export const OG_LOCALE: Record<Locale, string> = { hi: "hi_IN", en: "en_IN" };
