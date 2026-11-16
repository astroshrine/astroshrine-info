"use client";

import { Suspense } from "react";
import { MotionConfig } from "framer-motion";
import SiteHeader, { SiteHeaderFallback } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WalletPrefetch from "@/components/WalletPrefetch";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";

const text = defineMessages({
  hi: { skip: "सीधे सामग्री पर जाएं" },
  en: { skip: "Skip to content" },
});

/**
 * The page frame: skip link, floating header, main, footer.
 *
 * Only the header reads the pathname (for the current-page state), and it sits inside <Suspense>: with
 * Cache Components, usePathname() suspends on routes whose params are only known at request time
 * (e.g. /astrologers/[id]). The fallback bar keeps the rest of the layout prerendered.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const t = useT(text);
  return (
    // reducedMotion="user": people who prefer reduced motion get plain opacity changes, no movement.
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="on-inverse button-sm sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface-inverse focus:px-3 focus:py-2 focus:text-ink-inverse"
      >
        {t.skip}
      </a>

      <Suspense fallback={<SiteHeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <WalletPrefetch />

      {/* SiteHeader makes this inert while the full-height mobile menu is open. */}
      <div id="page" className="flex min-h-dvh flex-col">
        <main id="main" tabIndex={-1} className="flex-1 pt-[72px] outline-none">
          {children}
        </main>
        <SiteFooter />
      </div>
    </MotionConfig>
  );
}
