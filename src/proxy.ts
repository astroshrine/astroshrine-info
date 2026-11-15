import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { isPagePath, localeOf, localizeHref } from "@/i18n/paths";

/**
 * Every page lives under its language (/hi/..., /en/...). A link without one, such as "/" or an old
 * "/kundli" link, is redirected to the visitor's saved language, or to Hindi.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (localeOf(pathname) || !isPagePath(pathname)) return NextResponse.next();

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const url = request.nextUrl.clone();
  url.pathname = localizeHref(isLocale(saved) ? saved : DEFAULT_LOCALE, pathname);
  const response = NextResponse.redirect(url);
  // The target depends on the visitor's cookie, so no shared cache may reuse this redirect.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  // Everything except the API proxy, Next's own files, /.well-known and files with an extension (icons, the
  // share image). Keep in step with isPagePath (src/i18n/paths.ts); a matcher must be a literal.
  matcher: ["/((?!api/|_next/|\\.well-known/|.*\\.[^/]*$).*)"],
};
