import { useMemo } from "react";
import { usePathname as useNextPathname, useRouter as useNextRouter } from "next/navigation";
import { useLocale } from "./LocaleProvider";
import { localizeHref, stripLocale } from "./paths";

type NavigateOptions = Parameters<ReturnType<typeof useNextRouter>["push"]>[1];
type PrefetchOptions = Parameters<ReturnType<typeof useNextRouter>["prefetch"]>[1];

/**
 * next/navigation's useRouter, but push, replace and prefetch keep the visitor's language: "/wallet" goes
 * to "/en/wallet" on English pages. Paths that already start with a language are used as they are.
 */
export function useRouter() {
  const router = useNextRouter();
  const locale = useLocale();
  return useMemo(
    () => ({
      // Everything else (back, forward, refresh, bfcacheId) as next/navigation's router has it.
      ...router,
      push: (href: string, options?: NavigateOptions) => router.push(localizeHref(locale, href), options),
      replace: (href: string, options?: NavigateOptions) => router.replace(localizeHref(locale, href), options),
      prefetch: (href: string, options?: PrefetchOptions) => router.prefetch(localizeHref(locale, href), options),
    }),
    [router, locale],
  );
}

/**
 * The current path without its language ("/en/kundli/chart" gives "/kundli/chart"), for active links and for
 * building URLs that go through Link or useRouter above. Like next/navigation's usePathname, it suspends on
 * routes with request-time params, so render its users inside <Suspense>.
 */
export function usePathname(): string {
  return stripLocale(useNextPathname());
}
