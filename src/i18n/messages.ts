import type { Locale } from "./config";

/** A piece of UI text in every language. */
export type Messages<T> = { readonly [L in Locale]: T };

/**
 * Declares text in every language. Hindi defines the shape and English must match it key for key: TypeScript
 * reports a missing or extra key. Values are strings, lists, or functions for text with numbers or names in it.
 *
 *   const text = defineMessages({
 *     hi: { title: "चैट", minutes: (n: number) => `${n} मिनट` },
 *     en: { title: "Chat", minutes: (n) => `${n} min` },
 *   });
 *
 * Read it with useT(text) in Client Components (@/i18n/LocaleProvider) and await getT(text) in Server
 * Components (@/i18n/server). Keep each component's text next to it, so a page only ships its own strings.
 */
export function defineMessages<T>(messages: { hi: T; en: NoInfer<T> }): Messages<T> {
  return messages;
}
