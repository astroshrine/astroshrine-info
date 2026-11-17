"use client";

import Link from "@/i18n/Link";
import { usePathname, useRouter } from "@/i18n/navigation";
import { isActivePath } from "@/lib/site";

export type SubTabItem = {
  /** Path without a language. */
  href: string;
  label: string;
  /** Mark the tab current for sub-paths too (default: only the exact path). */
  prefix?: boolean;
  /** Carry the URL hash (a shared kundli's details) to the tab's page. */
  keepHash?: boolean;
};

export type SubTabsProps = {
  items: SubTabItem[];
  /** Accessible name of the tab navigation. */
  label: string;
};

/** The section's tab bar under the hero: link tabs, the current one underlined in gold. Scrolls sideways on phones. */
export default function SubTabs({ items, label }: SubTabsProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav aria-label={label} className="mt-6 border-y border-line bg-surface-card">
      <ul className="no-scrollbar mx-auto flex w-full max-w-6xl overflow-x-auto px-2 md:px-6">
        {items.map(({ href, label: name, prefix, keepHash }) => {
          const active = prefix ? isActivePath(pathname, href) : pathname === href;
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  const hash = window.location.hash;
                  if (keepHash && hash.length > 1 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    router.push(href + hash);
                  }
                }}
                className={`flex h-14 items-center whitespace-nowrap border-b-[3px] px-4 text-[15px] transition md:px-5 ${
                  active
                    ? "border-brand font-semibold text-ink"
                    : "border-transparent font-medium text-ink-soft hover:text-ink"
                }`}
              >
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
