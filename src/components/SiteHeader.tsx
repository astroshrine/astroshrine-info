"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PiCaretDown, PiUserCircle, PiWallet } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import BrandMark from "@/components/BrandMark";
import LanguageSwitch from "@/i18n/LanguageSwitch";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { usePathname } from "@/i18n/navigation";
import { APP_HOME_PATH, LANDING_PATH, SITE_TEXT, isActivePath, moreLinks, navLinks } from "@/lib/site";
import { base, menuLink, quick } from "@/lib/motion";
import { KUNDLI_PAGES, KUNDLI_PAGE_TEXT } from "@/app/[lang]/kundli/_components/pages";

const rupees = (n: number) => `₹ ${Math.floor(n).toLocaleString("en-IN")}`;

const text = defineMessages({
  hi: {
    mainNav: "मुख्य नेविगेशन",
    menuNav: "मेनू",
    login: "लॉगिन करें",
    signup: "साइन अप",
    kundliMenu: "कुंडली के टूल",
    profile: "प्रोफ़ाइल",
    profileWithBalance: (amount: string) => `प्रोफ़ाइल, wallet ${amount}`,
    walletBalance: (amount: string) => `Wallet, बैलेंस ${amount}`,
    walletLine: (amount: string) => `Wallet: ${amount}`,
    wallet: "Wallet",
    openMenu: "मेनू खोलें",
    closeMenu: "मेनू बंद करें",
  },
  en: {
    mainNav: "Main navigation",
    menuNav: "Menu",
    login: "Login",
    signup: "Sign up",
    kundliMenu: "Kundli tools",
    profile: "Profile",
    profileWithBalance: (amount) => `Profile, wallet ${amount}`,
    walletBalance: (amount) => `Wallet, balance ${amount}`,
    walletLine: (amount) => `Wallet: ${amount}`,
    wallet: "Wallet",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
});

/** The language switch as a quiet pill, the same height as the nav links. */
const languagePill =
  "title-4 inline-flex items-center gap-1 rounded-xl bg-surface-inverse-raised px-3 py-2 text-ink-inverse transition hover:text-brand-on-inverse motion-safe:active:scale-98";

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
 * The app's navy header bar (its colours, wallet pill with the gold "+", gold current-page marks),
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
      <header className="on-inverse fixed inset-x-0 top-0 z-40 bg-surface-inverse text-ink-inverse">
        <nav
          aria-label={t.mainNav}
          className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-2 px-4 md:px-8 lg:justify-start lg:gap-6 xl:gap-8"
        >
          <Link
            href={signedIn ? APP_HOME_PATH : LANDING_PATH}
            onClick={() => onMenuChange(false)}
            className="flex items-center gap-3 rounded-xl pr-3 transition motion-safe:active:scale-98"
          >
            <BrandMark size={44} />
            {/* Below 520px the bar has no room for the wordmark beside the language, wallet and menu: the sun mark alone
                (the name stays for screen readers). */}
            <span className="leading-none max-[519px]:sr-only">
              <span className="font-display text-2xl font-bold tracking-tight text-ink-inverse">AstroShrine</span>
              <span className="mt-1 hidden text-[11px] font-medium text-ink-inverse-soft sm:block">Ancient wisdom, modern guidance</span>
            </span>
          </Link>

          <ul className="hidden flex-1 items-center gap-1 lg:flex">
            {links.map(({ href, key }) => {
              const active = isActivePath(pathname, href);
              if (key === "kundli") {
                return (
                  <li key={href}>
                    <KundliDropdown pathname={pathname} active={active} label={site.nav.kundli} />
                  </li>
                );
              }
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`title-4 relative block rounded-xl px-3 py-2.5 transition motion-safe:active:scale-98 ${
                      active ? "text-brand-on-inverse" : "text-ink-inverse-soft hover:text-ink-inverse"
                    }`}
                  >
                    {site.nav[key]}
                    {active && <span aria-hidden className="absolute inset-x-3 bottom-0.5 h-0.5 rounded-full bg-brand" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Language, then the wallet (as in the app's top bar), then the account. */}
          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitch pathname={pathname} className={languagePill} />
            <WalletPill pathname={pathname} onNavigate={() => {}} />
            <AccountControl pathname={pathname} />
          </div>

          {/* Phones and tablets: language and wallet beside the menu button. */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Narrow phones: the language as its icon alone (its name stays for screen readers), so it fits beside the
                wallet and the menu button down to 320px. */}
            <LanguageSwitch pathname={pathname} className={`${languagePill} max-[519px]:px-2.5`} labelClassName="max-[519px]:sr-only" />
            <WalletPill pathname={pathname} onNavigate={() => onMenuChange(false)} />
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
    return <span aria-hidden className="block h-10 w-24 animate-pulse rounded-full bg-surface-inverse-raised" />;
  }

  if (status === "signedOut") {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="button-sm inline-flex h-11 items-center rounded-xl border border-ink-inverse-soft px-5 text-ink-inverse transition hover:bg-surface-inverse-raised motion-safe:active:scale-98"
        >
          {t.login}
        </Link>
        <Link
          href="/login"
          className="button-sm inline-flex h-11 items-center rounded-xl bg-brand px-5 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98"
        >
          {t.signup}
        </Link>
      </div>
    );
  }

  const name = user?.name?.trim() || "AstroShrine";
  return (
    <Link
      href="/profile"
      aria-current={pathname === "/profile" ? "page" : undefined}
      aria-label={balance ? t.profileWithBalance(rupees(balance.points_balance)) : t.profile}
      className="flex items-center rounded-full transition motion-safe:active:scale-98"
    >
      <span className="caption-3 grid h-10 w-10 place-items-center rounded-full bg-brand text-base text-brand-ink ring-2 ring-brand-soft ring-offset-2 ring-offset-surface-inverse">
        {name.charAt(0).toUpperCase()}
      </span>
    </Link>
  );
}

/**
 * The app's wallet pill: the balance with a gold "+" that opens the wallet (where it is topped up). Visitors who
 * have not signed in see "Wallet"; the wallet page asks them to log in.
 */
function WalletPill({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const { status, balance } = useAuth();
  const t = useT(text);

  // Same size as the pill, so nothing shifts when the balance arrives.
  if (status === "loading" || (status === "signedIn" && !balance)) {
    return <span aria-hidden className="block h-9 w-24 animate-pulse rounded-full bg-surface-inverse-raised" />;
  }

  const amount = balance ? rupees(balance.points_balance) : t.wallet;
  return (
    <Link
      href="/wallet"
      onClick={onNavigate}
      aria-current={pathname.startsWith("/wallet") ? "page" : undefined}
      aria-label={balance ? t.walletBalance(amount) : t.wallet}
      className="caption-3 flex h-9 items-center gap-1.5 rounded-full bg-surface-sunken pl-2.5 pr-1 text-ink transition hover:bg-brand-soft motion-safe:active:scale-98"
    >
      <PiWallet className="h-4 w-4 text-ink" aria-hidden />
      {amount}
      {/* The app's gold "+": the wallet page is where the balance is topped up. */}
      <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-brand text-base font-bold leading-none text-brand-ink">
        +
      </span>
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
      className="relative grid h-10 w-10 place-items-center rounded-xl bg-surface-inverse-raised transition hover:bg-line-inverse motion-safe:active:scale-98 lg:hidden"
    >
      <motion.span
        aria-hidden
        className="absolute h-0.5 w-5 rounded-full bg-ink-inverse"
        initial={false}
        animate={open ? { y: 0, rotate: 45 } : { y: -4, rotate: 0 }}
        transition={base}
      />
      <motion.span
        aria-hidden
        className="absolute h-0.5 w-5 rounded-full bg-ink-inverse"
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
  const kundliNames = useT(KUNDLI_PAGE_TEXT);
  const items = [
    ...navLinks(signedIn).flatMap(({ href, key, icon }) =>
      key === "kundli"
        ? [
            { href, label: site.nav[key], icon, sub: false },
            ...KUNDLI_PAGES.map((p) => ({ href: p.href, label: kundliNames[p.key], icon: p.icon, sub: true })),
          ]
        : [{ href, label: site.nav[key], icon, sub: false }],
    ),
    ...(signedIn ? [{ href: "/profile", label: t.profile, icon: PiUserCircle, sub: false }] : []),
  ];
  // The app's other tabs and drawer entries, under a "More" heading after the main links.
  const more = moreLinks(signedIn).map(({ href, key, icon }) => ({ href, label: site.more[key], icon }));

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
          {items.map(({ href, label, icon: Icon, sub }, i) => {
            const active = sub ? pathname === href : isActivePath(pathname, href);
            return (
              <motion.li key={`${href}-${i}`} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={menuLink(i)}>
                <Link
                  href={href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  // B1: nav items use a Title style (title-2, 18px), not a heading. py-3 keeps each row a 52px tap target.
                  className={`${sub ? "title-4 ml-8" : "title-2"} flex items-center gap-3 rounded-2xl px-4 py-3 transition motion-safe:active:scale-98 ${
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
        <motion.p
          className="caption-3 mt-6 px-4 uppercase tracking-[0.08em] text-ink-soft"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={menuLink(items.length)}
        >
          {site.more.title}
        </motion.p>
        <ul aria-label={site.more.title} className="mt-2 grid grid-cols-2 gap-2">
          {more.map(({ href, label, icon: Icon }, i) => {
            const active = isActivePath(pathname, href);
            return (
              <motion.li key={href} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={menuLink(items.length + i)}>
                <Link
                  href={href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={`title-4 flex h-full items-center gap-2.5 rounded-2xl border border-line px-3.5 py-3 transition motion-safe:active:scale-98 ${
                    active ? "bg-surface-sunken text-ink" : "text-ink-soft hover:bg-surface-sunken hover:text-ink"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0 text-brand-strong" aria-hidden />
                  {label}
                </Link>
              </motion.li>
            );
          })}
        </ul>
        {!signedIn && (
          <motion.div
            className="mt-6 grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={menuLink(items.length)}
          >
            <Link
              href="/login"
              onClick={onClose}
              className="button-md inline-flex h-12 items-center justify-center rounded-xl border border-ink text-ink transition hover:bg-surface-sunken"
            >
              {t.login}
            </Link>
            <Link
              href="/login"
              onClick={onClose}
              className="button-md inline-flex h-12 items-center justify-center rounded-xl bg-brand text-brand-ink transition hover:bg-brand-hover"
            >
              {t.signup}
            </Link>
          </motion.div>
        )}
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

/**
 * The Kundli entry of the main navigation: a disclosure button (not a menu role) that reveals the section's pages as
 * links. Opens on click, hover or ArrowDown; Escape closes it and returns focus to the button; focus or a click
 * outside closes it too.
 */
function KundliDropdown({ pathname, active, label }: { pathname: string; active: boolean; label: string }) {
  const t = useT(text);
  const names = useT(KUNDLI_PAGE_TEXT);
  // Open for the page it was opened on, so any navigation closes it.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const setOpen = (value: boolean | ((o: boolean) => boolean)) =>
    setOpenFor((current) => ((typeof value === "function" ? value(current === pathname) : value) ? pathname : null));
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpenFor(null);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const focusLink = (index: number) => {
    const links = root.current?.querySelectorAll<HTMLAnchorElement>("[data-kundli-link]");
    if (!links?.length) return;
    links[(index + links.length) % links.length]?.focus();
  };

  return (
    <div
      ref={root}
      className="relative"
      onMouseEnter={() => {
        window.clearTimeout(closeTimer.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        closeTimer.current = window.setTimeout(() => setOpen(false), 120);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpen(false);
          button.current?.focus();
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const links = Array.from(root.current?.querySelectorAll("[data-kundli-link]") ?? []);
          const at = links.indexOf(document.activeElement as Element);
          if (!open) {
            setOpen(true);
            requestAnimationFrame(() => focusLink(e.key === "ArrowDown" ? 0 : -1));
          } else focusLink(at + (e.key === "ArrowDown" ? 1 : -1));
        }
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={`title-4 relative inline-flex items-center gap-1 rounded-xl px-3 py-2.5 transition motion-safe:active:scale-98 ${
          active ? "text-brand-on-inverse" : "text-ink-inverse-soft hover:text-ink-inverse"
        }`}
      >
        {label}
        <PiCaretDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        {active && <span aria-hidden className="absolute inset-x-3 bottom-0.5 h-0.5 rounded-full bg-brand" />}
      </button>
      <div id={panelId} hidden={!open} className="absolute top-full left-0 z-50 pt-2">
        <ul
          aria-label={t.kundliMenu}
          className="w-60 rounded-2xl border border-line bg-surface-card p-2 shadow-[0_18px_40px_rgba(20,33,61,.14)]"
        >
          {KUNDLI_PAGES.map(({ href, key, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                data-kundli-link
                aria-current={pathname === href ? "page" : undefined}
                className={`title-4 flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                  pathname === href ? "bg-surface-sunken text-ink" : "text-ink-soft hover:bg-surface-sunken hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
                {names[key]}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
