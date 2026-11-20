"use client";

import type { IconType } from "react-icons";
import {
  PiCalendarDotsFill,
  PiChatsCircleFill,
  PiFireFill,
  PiHouseFill,
  PiMagicWandFill,
} from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { usePathname } from "@/i18n/navigation";
import { APP_HOME_PATH, LANDING_PATH, isActivePath } from "@/lib/site";

const text = defineMessages({
  hi: { label: "ऐप टैब", home: "होम", astro: "Astro", puja: "पूजा", bookings: "बुकिंग", chat: "Chat" },
  en: { label: "App tabs", home: "Home", astro: "Astro", puja: "Puja", bookings: "Bookings", chat: "Chat" },
});

type TabKey = "home" | "astro" | "puja" | "bookings" | "chat";

/** The Android app's five bottom tabs, in its order. Puja opens the store's puja tab. */
const TABS: { key: TabKey; href: string; icon: IconType; match: string[] }[] = [
  { key: "home", href: APP_HOME_PATH, icon: PiHouseFill, match: [APP_HOME_PATH] },
  { key: "astro", href: "/astrologers", icon: PiMagicWandFill, match: ["/astrologers", "/ai-astrologers"] },
  { key: "puja", href: "/store", icon: PiFireFill, match: ["/store"] },
  { key: "bookings", href: "/bookings", icon: PiCalendarDotsFill, match: ["/bookings", "/history"] },
  { key: "chat", href: "/chat", icon: PiChatsCircleFill, match: ["/chat"] },
];

/** Pages without the tab bar: login, a live call, and the astrologer console. */
const HIDDEN = ["/login", "/call", "/astrologer"];

/**
 * The app's floating navy tab bar (Home, Astro, Puja, Bookings, Chat), on phones and tablets only: the desktop
 * header carries the same links. The current tab sits in a gold pill, as in the app. Screen-filling views (an open
 * chat) hide it through globals.css, so it never covers the message box.
 */
export default function BottomTabBar() {
  const pathname = usePathname();
  const t = useT(text);
  const { status } = useAuth();
  if (HIDDEN.some((p) => isActivePath(pathname, p))) return null;
  // Visitors who have not signed in have the public home page as Home, as in the header.
  const homeHref = status === "signedIn" ? APP_HOME_PATH : LANDING_PATH;

  return (
    <nav
      id="tabbar"
      aria-label={t.label}
      className="on-inverse fixed inset-x-3 bottom-3 z-30 mx-auto max-w-md rounded-[1.75rem] bg-surface-inverse px-2 py-2 shadow-[0_10px_30px_rgb(12_35_64/0.35)] pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ key, href: tabHref, icon: Icon, match }) => {
          const href = key === "home" ? homeHref : tabHref;
          const active = key === "home" ? pathname === href || pathname === APP_HOME_PATH : match.some((m) => isActivePath(pathname, m));
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 rounded-2xl py-1 transition motion-safe:active:scale-95"
              >
                <span
                  className={`grid h-8 w-12 place-items-center rounded-full transition ${
                    active ? "bg-brand text-brand-ink" : "text-ink-inverse-soft"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className={`caption-4 ${active ? "font-bold text-brand-on-inverse" : "text-ink-inverse-soft"}`}>
                  {t[key]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
