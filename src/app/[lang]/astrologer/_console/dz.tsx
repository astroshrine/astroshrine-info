import type { AnchorHTMLAttributes, CSSProperties } from "react";
import Link from "@/i18n/Link";
import "./design.css";

/** Turns a CSS declaration string ("a-b:c;d:e") into a React style object (the design builds states as strings). */
export function css(decls: string): CSSProperties {
  const style: Record<string, string> = {};
  for (const part of decls.split(";")) {
    const at = part.indexOf(":");
    if (at < 0) continue;
    const key = part.slice(0, at).trim();
    const value = part.slice(at + 1).trim();
    if (!key) continue;
    style[key.startsWith("--") ? key : key.replace(/^-webkit-/, "Webkit-").replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
  }
  return style as CSSProperties;
}

/** A link: a path inside the site goes through the language aware Link, anything else is a plain anchor. */
export function A({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  if (href.startsWith("/")) return <Link href={href} {...rest} />;
  return <a href={href} {...rest} />;
}
