"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import type { Locale } from "./config";
import { useLocale } from "./LocaleProvider";
import { localizeHref } from "./paths";

type Href = ComponentProps<typeof NextLink>["href"];

function localize(locale: Locale, href: Href): Href {
  if (typeof href === "string") return localizeHref(locale, href);
  // An absolute URL, or an object that names its own host or protocol, points somewhere specific: leave it.
  if (href instanceof URL || href.host || href.hostname || href.protocol) return href;
  return href.pathname ? { ...href, pathname: localizeHref(locale, href.pathname) } : href;
}

/**
 * next/link that keeps the visitor in their language: an internal path such as "/kundli" points to
 * "/en/kundli" on English pages (also through `as`). Use it for every internal link; external links pass
 * through unchanged.
 */
export default function Link({ href, as, ...props }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  return <NextLink href={localize(locale, href)} as={as === undefined ? undefined : localize(locale, as)} {...props} />;
}
