import type { Metadata } from "next";
import { lang } from "next/root-params";
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "./config";
import type { Messages } from "./messages";
import { localizeHref } from "./paths";

/**
 * The page's language in a Server Component, generateMetadata or a 'use cache' function, read from the URL
 * (the [lang] root segment). Inside 'use cache' it becomes part of the cache key on its own.
 */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** A component's text (from defineMessages) in the page's language, for Server Components. */
export async function getT<T>(messages: Messages<T>): Promise<T> {
  return messages[await getLocale()];
}

/**
 * Metadata `alternates` for a page that exists in every language: its canonical URL in this language and the
 * hreflang links to the other languages. `path` is the page's path without a language, such as "/kundli".
 */
export async function languageAlternates(path: string): Promise<NonNullable<Metadata["alternates"]>> {
  const locale = await getLocale();
  return {
    canonical: localizeHref(locale, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, localizeHref(l, path)])),
      "x-default": localizeHref(DEFAULT_LOCALE, path),
    },
  };
}
