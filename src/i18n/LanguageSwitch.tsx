"use client";

import { Suspense } from "react";
import { PiTranslate } from "react-icons/pi";
import { LOCALE_COOKIE, LOCALE_NAMES, type Locale } from "./config";
import { useLocale } from "./LocaleProvider";
import { usePathname } from "./navigation";
import { localizeHref, switchLocale } from "./paths";

const ONE_YEAR = 60 * 60 * 24 * 365;

type Props = { className?: string; onSwitch?: () => void };

/**
 * Opens the current page in the other language. It is a real link to that page, so a new tab or a copied link
 * works too. A plain click also keeps the page's query and hash (an open kundli, a filter) and remembers the
 * choice in the cookie the proxy reads for links without a language. The cookie is written only when the page
 * actually unloads, so a navigation the visitor cancels (a "leave this page?" prompt) leaves it unchanged.
 *
 * `pathname` is the current path, with or without its language. Without it (a prerendered fallback) the link
 * points to the other language's home page, and a click still opens the current page.
 */
export default function LanguageSwitch({ className, onSwitch, pathname }: Props & { pathname?: string }) {
  const locale = useLocale();
  const other: Locale = locale === "hi" ? "en" : "hi";

  return (
    <a
      href={pathname ? switchLocale(pathname, other) : localizeHref(other, "/")}
      hrefLang={other}
      lang={other}
      onClick={(event) => {
        // A new tab, a new window or a download: the browser follows the link as it is.
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onSwitch?.();
        window.addEventListener(
          "pagehide",
          () => {
            document.cookie = `${LOCALE_COOKIE}=${other}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
          },
          { once: true },
        );
        const { pathname: current, search, hash } = window.location;
        window.location.assign(switchLocale(current, other) + search + hash);
      }}
      className={className}
    >
      <PiTranslate className="h-4 w-4 shrink-0" aria-hidden />
      {LOCALE_NAMES[other]}
    </a>
  );
}

/**
 * The switch for parts of the page outside a <Suspense> boundary (the footer): it reads the current path itself,
 * which suspends on routes with request-time params, so it renders the home-page fallback until then.
 */
export function LanguageSwitchHere(props: Props) {
  return (
    <Suspense fallback={<LanguageSwitch {...props} />}>
      <WithCurrentPath {...props} />
    </Suspense>
  );
}

function WithCurrentPath(props: Props) {
  return <LanguageSwitch {...props} pathname={usePathname()} />;
}
