import { isLocale, type Locale } from "./config";

/**
 * Whether a root-relative path is a page, and so lives under a language. The API proxy, Next's own files,
 * /.well-known and files with an extension (icons, robots.txt, the share image) are not. The proxy's matcher
 * (src/proxy.ts) skips the same paths.
 */
export function isPagePath(path: string): boolean {
  const pathname = path.split(/[?#]/, 1)[0];
  if (/^\/(api|_next|\.well-known)(\/|$)/.test(pathname)) return false;
  return !pathname.slice(pathname.lastIndexOf("/") + 1).includes(".");
}

/** The language a path starts with, if any. */
export function localeOf(path: string): Locale | null {
  const first = path.split(/[/?#]/, 2)[1];
  return isLocale(first) ? first : null;
}

/**
 * An internal link in the given language: "/kundli?k=1" becomes "/en/kundli?k=1" and "/" becomes "/en".
 * External links, "#hash" links, paths that already start with a language and paths that are not pages
 * (/api, files) are returned unchanged.
 */
export function localizeHref(locale: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//") || localeOf(href) || !isPagePath(href)) return href;
  const rest = href.slice(1);
  return rest === "" || rest.startsWith("?") || rest.startsWith("#") ? `/${locale}${rest}` : `/${locale}/${rest}`;
}

/**
 * A path without its language: "/en/kundli/chart" becomes "/kundli/chart", "/en" becomes "/" and "/en?q=1"
 * becomes "/?q=1". A path without a language is returned unchanged.
 */
export function stripLocale(path: string): string {
  const locale = localeOf(path);
  if (!locale) return path;
  const rest = path.slice(locale.length + 1);
  return rest === "" || rest.startsWith("?") || rest.startsWith("#") ? `/${rest}` : rest;
}

/** The same path in another language. */
export function switchLocale(path: string, locale: Locale): string {
  return localizeHref(locale, stripLocale(path));
}
