"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { KUNDLI_PAGES } from "./pages";

/** The Jyotish section's own navigation: every tool one click away, the current one marked. */
export default function KundliNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav aria-label="कुंडली के टूल" className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex w-max gap-2 md:w-auto md:flex-wrap">
        {KUNDLI_PAGES.map(({ href, label, icon: Icon, carriesProfile }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  // Keep a shared kundli's details (in the hash) when moving between kundli and gochar.
                  const hash = window.location.hash;
                  if (carriesProfile && hash.length > 1 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    router.push(href + hash);
                  }
                }}
                className={`title-4 flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 transition active:scale-98 ${
                  active
                    ? "border-surface-inverse bg-surface-inverse text-ink-inverse on-inverse"
                    : "border-line bg-surface-card text-ink-soft hover:border-line-strong hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
