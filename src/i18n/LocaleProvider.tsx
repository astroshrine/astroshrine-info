"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import type { Messages } from "./messages";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Gives Client Components the page's language. The root layout sets it from the URL. */
export default function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

/** The page's language in a Client Component. */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** A component's text (from defineMessages) in the page's language. */
export function useT<T>(messages: Messages<T>): T {
  return messages[useLocale()];
}
