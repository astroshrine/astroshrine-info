"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PiSignIn, PiUserCircle } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import BrandMark from "@/components/BrandMark";
import { APP_HOME_PATH, LANDING_PATH, isActivePath, navLinks } from "@/lib/site";
import { base, menuLink, quick } from "@/lib/motion";

const rupees = (n: number) => `₹ ${Math.floor(n).toLocaleString("en-IN")}`;

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

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-4">
        <nav
          aria-label="मुख्य नेविगेशन"
          className="pointer-events-auto flex w-full items-center justify-between gap-2 rounded-full border border-line bg-surface-card/80 p-2 shadow-sm backdrop-blur-xl lg:w-auto lg:justify-start"
        >
          <Link
            href={signedIn ? APP_HOME_PATH : LANDING_PATH}
            onClick={() => onMenuChange(false)}
            className="flex items-center gap-2 rounded-full pr-3 transition motion-safe:active:scale-98"
          >
            <BrandMark size={40} />
            <span className="title-3 text-ink">AstroShrine</span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {links.map(({ href, label }) => {
              const active = isActivePath(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`title-4 block rounded-full px-3 py-2 transition motion-safe:active:scale-98 ${
                      active ? "bg-surface-sunken text-ink" : "text-ink-soft hover:bg-surface-sunken hover:text-ink"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden lg:block lg:pl-2">
            <AccountControl pathname={pathname} />
          </div>

          <MenuToggle open={menuOpen} onToggle={() => onMenuChange(!menuOpen)} />
        </nav>
      </header>

      <AnimatePresence>{menuOpen && <MobileMenu pathname={pathname} onClose={() => onMenuChange(false)} />}</AnimatePresence>
    </>
  );
}

function AccountControl({ pathname }: { pathname: string }) {
  const { status, user, balance } = useAuth();

  if (status === "loading") {
    return <span aria-hidden className="block h-10 w-24 animate-pulse rounded-full bg-surface-sunken" />;
  }

  if (status === "signedOut") {
    return (
      <Link
        href="/login"
        className="button-sm inline-flex items-center gap-2 rounded-full bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98"
      >
        <PiSignIn className="h-4 w-4" aria-hidden />
        लॉगिन करें
      </Link>
    );
  }

  const name = user?.name?.trim() || "AstroShrine";
  return (
    <Link
      href="/profile"
      aria-current={pathname === "/profile" ? "page" : undefined}
      aria-label={balance ? `प्रोफ़ाइल, wallet ${rupees(balance.points_balance)}` : "प्रोफ़ाइल"}
      className="flex items-center gap-2 rounded-full bg-surface-sunken py-1 pl-3 pr-1 transition hover:bg-line motion-safe:active:scale-98"
    >
      <span className="caption-3 text-ink">{balance ? rupees(balance.points_balance) : "Wallet"}</span>
      <span className="caption-3 grid h-8 w-8 place-items-center rounded-full bg-surface-inverse text-ink-inverse">
        {name.charAt(0).toUpperCase()}
      </span>
    </Link>
  );
}

/** Two lines that turn into a cross: the change is animated, not swapped. */
function MenuToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="mobile-menu"
      aria-label={open ? "मेनू बंद करें" : "मेनू खोलें"}
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
  const items = [
    ...navLinks(signedIn),
    signedIn
      ? { href: "/profile", label: "प्रोफ़ाइल", icon: PiUserCircle }
      : { href: "/login", label: "लॉगिन करें", icon: PiSignIn },
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
      <nav aria-label="मेनू" className="flex min-h-full flex-col px-4 pb-12 pt-24">
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
            Wallet: {rupees(balance.points_balance)}
          </motion.p>
        )}
      </nav>
    </motion.div>
  );
}
