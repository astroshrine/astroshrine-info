"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PiSignIn, PiUserCircle, PiWallet } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import BrandMark from "@/components/BrandMark";
import LanguageSwitch from "@/i18n/LanguageSwitch";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { usePathname } from "@/i18n/navigation";
import { APP_HOME_PATH, LANDING_PATH, SITE_TEXT, isActivePath, navLinks } from "@/lib/site";
import { base, menuLink, quick } from "@/lib/motion";

const rupees = (n: number) => `₹ ${Math.floor(n).toLocaleString("en-IN")}`;

const text = defineMessages({
  hi: {
    mainNav: "मुख्य नेविगेशन",
    menuNav: "मेनू",
    login: "लॉगिन करें",
    profile: "प्रोफ़ाइल",
    profileWithBalance: (amount: string) => `प्रोफ़ाइल, wallet ${amount}`,
    walletBalance: (amount: string) => `Wallet, बैलेंस ${amount}`,
    walletLine: (amount: string) => `Wallet: ${amount}`,
    openMenu: "मेनू खोलें",
    closeMenu: "मेनू बंद करें",
  },
  en: {
    mainNav: "Main navigation",
    menuNav: "Menu",
    login: "Log in",
    profile: "Profile",
    profileWithBalance: (amount) => `Profile, wallet ${amount}`,
    walletBalance: (amount) => `Wallet, balance ${amount}`,
    walletLine: (amount) => `Wallet: ${amount}`,
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
});

/** The language switch as a quiet pill, the same height as the nav links. */
const languagePill =
  "title-4 inline-flex items-center gap-1 rounded-xl px-3 py-2 text-ink-soft transition hover:bg-surface-sunken hover:text-ink motion-safe:active:scale-98";

/** The live header: knows the current page and owns the mobile menu. Render it inside <Suspense>. */
export default function SiteHeader() {
  const pathname = usePathname();
  // The menu belongs to the page it was opened on, so any navigation (links, back button) closes it.
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const menuOpen = menuFor === pathname;

  // While the full-height menu is open: the page behind is inert and doesn't scroll, and Escape closes it.
  useEffect(() => {
    if (!menuOpen) return;
    const page = document.getElementById("page");
    const previous = document.body.style.overflow;
    if (page) page.inert = true;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuFor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      if (page) page.inert = false;
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return <HeaderBar pathname={pathname} menuOpen={menuOpen} onMenuChange={(open) => setMenuFor(open ? pathname : null)} />;
}

/** Prerendered stand-in while the pathname is unknown (dynamic routes): same bar, nothing marked current. */
export function SiteHeaderFallback() {
  return <HeaderBar pathname="" menuOpen={false} onMenuChange={() => {}} />;
}

/**
 * B7 navigation: a compact translucent bar floating off the top edge (sized to its content on desktop),
 * and below the lg breakpoint a full-height blurred panel whose links arrive one after another.
 */
function HeaderBar({
  pathname,
  menuOpen,
  onMenuChange,
}: {
  pathname: string;
  menuOpen: boolean;
  onMenuChange: (open: boolean) => void;
}) {
  const { status } = useAuth();
  const signedIn = status === "signedIn";
  const links = navLinks(signedIn);
  const t = useT(text);
  const site = useT(SITE_TEXT);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-surface-page/95 backdrop-blur-md">
        <nav
          aria-label={t.mainNav}
          className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-2 px-4 md:px-8 lg:justify-start lg:gap-8"
        >
          <Link
            href={signedIn ? APP_HOME_PATH : LANDING_PATH}
            onClick={() => onMenuChange(false)}
            className="flex items-center gap-3 rounded-xl pr-3 transition motion-safe:active:scale-98"
          >
            <BrandMark size={44} />
            <span className="leading-none">
              <span className="font-display text-2xl font-bold tracking-tight text-ink">AstroShrine</span>
              <span className="mt-1 hidden text-[11px] font-medium text-ink-soft xl:block">Ancient wisdom, modern guidance</span>
            </span>
          </Link>

          <ul className="hidden flex-1 items-center gap-1 lg:flex">
            {links.map(({ href, key }) => {
              const active = isActivePath(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`title-4 block rounded-xl px-3 py-2.5 transition motion-safe:active:scale-98 ${
                      active ? "bg-surface-sunken text-ink" : "text-ink-soft hover:bg-surface-sunken hover:text-ink"
                    }`}
                  >
                    {site.nav[key]}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitch pathname={pathname} className={languagePill} />
            <AccountControl pathname={pathname} />
          </div>

          {/* Phones and tablets: the wallet balance (or, for visitors, the language switch) beside the menu button. */}
          <div className="flex items-center gap-2 lg:hidden">
            {status === "signedOut" ? (
              // Below 360px the pill would push the menu button off the bar; the menu has the switch too.
              <LanguageSwitch pathname={pathname} className={`${languagePill} max-[360px]:hidden`} />
            ) : (
              <MobileWalletPill pathname={pathname} onNavigate={() => onMenuChange(false)} />
            )}
            <MenuToggle open={menuOpen} onToggle={() => onMenuChange(!menuOpen)} />
          </div>
        </nav>
      </header>

      <AnimatePresence>{menuOpen && <MobileMenu pathname={pathname} onClose={() => onMenuChange(false)} />}</AnimatePresence>
    </>
  );
}

function AccountControl({ pathname }: { pathname: string }) {
  const { status, user, balance } = useAuth();
  const t = useT(text);

  if (status === "loading") {
    return <span aria-hidden className="block h-10 w-24 animate-pulse rounded-full bg-surface-sunken" />;
  }

  if (status === "signedOut") {
    return (
      <Link
        href="/login"
        className="button-sm inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98"
      >
        <PiSignIn className="h-4 w-4" aria-hidden />
        {t.login}
      </Link>
    );
  }

  const name = user?.name?.trim() || "AstroShrine";
  return (
    <Link
      href="/profile"
      aria-current={pathname === "/profile" ? "page" : undefined}
      aria-label={balance ? t.profileWithBalance(rupees(balance.points_balance)) : t.profile}
      className="flex items-center gap-2 rounded-full bg-surface-sunken py-1 pl-3 pr-1 transition hover:bg-line motion-safe:active:scale-98"
    >
      <span className="caption-3 text-ink">{balance ? rupees(balance.points_balance) : "Wallet"}</span>
      <span className="caption-3 grid h-8 w-8 place-items-center rounded-full bg-surface-inverse text-ink-inverse">
        {name.charAt(0).toUpperCase()}
      </span>
    </Link>
  );
}

/**
 * Below lg: the signed-in visitor's wallet balance as a small pill that opens the wallet. HeaderBar shows the
 * language switch in its place for visitors who are signed out.
 */
function MobileWalletPill({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const { status, balance } = useAuth();
  const t = useT(text);

  // Same size as the pill, so nothing shifts when the balance arrives.
  if (status === "loading" || !balance) {
    return <span aria-hidden className="block h-8 w-20 animate-pulse rounded-full bg-surface-sunken" />;
  }

  const amount = rupees(balance.points_balance);
  return (
    <Link
      href="/wallet"
      onClick={onNavigate}
      aria-current={pathname.startsWith("/wallet") ? "page" : undefined}
      aria-label={t.walletBalance(amount)}
      className="caption-3 flex h-8 items-center gap-1 rounded-full bg-surface-sunken pl-2 pr-3 text-ink transition hover:bg-line motion-safe:active:scale-98"
    >
      <PiWallet className="h-4 w-4 text-brand-strong" aria-hidden />
      {amount}
    </Link>
  );
}

/** Two lines that turn into a cross: the change is animated, not swapped. */
function MenuToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const t = useT(text);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="mobile-menu"
      aria-label={open ? t.closeMenu : t.openMenu}
      className="relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-surface-sunken motion-safe:active:scale-98 lg:hidden"
    >
      <motion.span
        aria-hidden
        className="absolute h-0.5 w-5 rounded-full bg-ink"
        initial={false}
        animate={open ? { y: 0, rotate: 45 } : { y: -4, rotate: 0 }}
        transition={base}
      />
      <motion.span
        aria-hidden
        className="absolute h-0.5 w-5 rounded-full bg-ink"
        initial={false}
        animate={open ? { y: 0, rotate: -45 } : { y: 4, rotate: 0 }}
        transition={base}
      />
    </button>
  );
}

function MobileMenu({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  const { status, balance } = useAuth();
  const signedIn = status === "signedIn";
  const t = useT(text);
  const site = useT(SITE_TEXT);
  const items = [
    ...navLinks(signedIn).map(({ href, key, icon }) => ({ href, label: site.nav[key], icon })),
    signedIn ? { href: "/profile", label: t.profile, icon: PiUserCircle } : { href: "/login", label: t.login, icon: PiSignIn },
  ];

  return (
    <motion.div
      id="mobile-menu"
      className="fixed inset-0 z-30 overflow-y-auto bg-surface-page/90 backdrop-blur-2xl lg:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={quick}
    >
      <nav aria-label={t.menuNav} className="flex min-h-full flex-col px-4 pb-12 pt-24">
        <ul className="flex flex-col gap-2">
          {items.map(({ href, label, icon: Icon }, i) => {
            const active = isActivePath(pathname, href);
            return (
              <motion.li key={href} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={menuLink(i)}>
                <Link
                  href={href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  // B1: nav items use a Title style (title-2, 18px), not a heading. py-3 keeps each row a 52px tap target.
                  className={`title-2 flex items-center gap-3 rounded-2xl px-4 py-3 transition motion-safe:active:scale-98 ${
                    active ? "bg-surface-sunken text-ink" : "text-ink-soft hover:bg-surface-sunken hover:text-ink"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  {label}
                </Link>
              </motion.li>
            );
          })}
        </ul>
        {signedIn && balance && (
          <motion.p
            className="caption-2 mt-6 px-4 text-ink-soft"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={menuLink(items.length)}
          >
            {t.walletLine(rupees(balance.points_balance))}
          </motion.p>
        )}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={menuLink(items.length + 1)}
        >
          <LanguageSwitch
            pathname={pathname}
            onSwitch={onClose}
            className="title-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-ink-soft transition hover:bg-surface-sunken hover:text-ink motion-safe:active:scale-98"
          />
        </motion.div>
      </nav>
    </motion.div>
  );
}
