"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSelectedLayoutSegment } from "next/navigation";
import { MotionConfig } from "framer-motion";
import {
  PiBell,
  PiCalendarBlank,
  PiCaretDown,
  PiChatCircleDots,
  PiGraduationCap,
  PiHeadset,
  PiHouse,
  PiLeaf,
  PiNewspaper,
  PiPower,
  PiQuestion,
  PiShieldCheck,
  PiStar,
  PiTag,
  PiUserCircle,
  PiUsersThree,
  PiWallet,
} from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { usePathname, useRouter } from "@/i18n/navigation";
import { switchLocale } from "@/i18n/paths";
import { Button } from "./ui";
import { getCallWaitlist, getChatQueue } from "@/lib/services/astrologerHome";
import { getOwnAstrologer } from "@/lib/services/astrologerProfile";
import "./shell.css";
import { ownNeedsSetup, profileNeedsSetup } from "./setup";
import { useAstrologer, useOnlineStatus } from "./useAstrologer";

const text = defineMessages({
  hi: {
    skip: "सीधे सामग्री पर जाएं",
    forAstro: "ज्योतिषियों के लिए",
    strip: "ज्योतिषी कंसोल · केवल सत्यापित AstroShrine ज्योतिषियों के लिए",
    stripLink: "परामर्श चाहिए? AstroShrine पर जाएँ",
    home: "होम",
    chats: "चैट",
    waitingN: "प्रतीक्षा में",
    welcomeTitle: "स्वागत है",
    signInTitle: "साइन इन",
    joinTitle: "AstroShrine से जुड़ें",
    helpTitle: "सहायता",
    earningsTitle: "कमाई",
    profileTitle: "प्रोफ़ाइल",
    chatTitle: "लाइव चैट",
    setupTitle: "अपनी प्रोफ़ाइल बनाएँ",
    homeTitle: "होम",
    turnEyebrow: "AstroShrine · ज्योतिषियों के लिए",
    earnings: "कमाई",
    profile: "प्रोफ़ाइल",
    help: "सहायता",
    more: "और",
    moreMenu: "और विकल्प",
    schedule: "समय-सारणी",
    clients: "ग्राहक",
    remedies: "उपाय",
    coupons: "कूपन",
    articles: "लेख",
    notifications: "सूचनाएँ",
    supportPage: "सपोर्ट",
    learn: "सीखें",
    online: "ऑनलाइन",
    offline: "ऑफ़लाइन",
    checking: "जाँच हो रही है…",
    loadingConsole: "कंसोल खुल रहा है…",
    astrologerFallback: "ज्योतिषी",
    langLabel: "भाषा",
    account: "खाता मेनू",
    myProfile: "मेरी प्रोफ़ाइल",
    verified: "सत्यापित ज्योतिषी",
    signOut: "साइन आउट",
    signIn: "साइन इन",
    join: "ज्योतिषी के रूप में जुड़ें",
    homeLabel: "AstroShrine ज्योतिषियों के लिए, होम",
    main: "मुख्य",
    footerNav: "फ़ुटर",
    tagline: "आस्था • ज्योतिष • जीवन समाधान",
    footer: "ज्योतिषी कंसोल",
    terms: "पवित्रता की शर्तें",
    privacy: "गोपनीयता व्यवस्था",
    support: "सहायता केंद्र",
  },
  en: {
    skip: "Skip to content",
    forAstro: "For astrologers",
    strip: "Astrologer console · for verified AstroShrine astrologers only",
    stripLink: "Looking for a consultation? Visit AstroShrine",
    home: "Home",
    chats: "Chats",
    waitingN: "waiting",
    welcomeTitle: "Welcome",
    signInTitle: "Sign in",
    joinTitle: "Join AstroShrine",
    helpTitle: "Help",
    earningsTitle: "Earnings",
    profileTitle: "Profile",
    chatTitle: "Live chat",
    setupTitle: "Set up your profile",
    homeTitle: "Home",
    turnEyebrow: "AstroShrine · For astrologers",
    earnings: "Earnings",
    profile: "Profile",
    help: "Help",
    more: "More",
    moreMenu: "More options",
    schedule: "Schedule",
    clients: "Clients",
    remedies: "Remedies",
    coupons: "Coupons",
    articles: "Articles",
    notifications: "Notifications",
    supportPage: "Support",
    learn: "Learn",
    online: "Online",
    offline: "Offline",
    checking: "Checking…",
    loadingConsole: "Opening the console…",
    astrologerFallback: "Astrologer",
    langLabel: "Language",
    account: "Account menu",
    myProfile: "My profile",
    verified: "Verified astrologer",
    signOut: "Sign out",
    signIn: "Sign in",
    join: "Join as astrologer",
    homeLabel: "AstroShrine for astrologers, home",
    main: "Main",
    footerNav: "Footer",
    tagline: "Faith • Astrology • Life Solutions",
    footer: "Astrologer console",
    terms: "Terms of Sanctity",
    privacy: "Privacy Architecture",
    support: "Support",
  },
});

const SITE_URL = "https://www.astroshrine.in";

/** Open to everyone: no sign in needed (a signed-out visitor sees the header without navigation). */
const PUBLIC_SEGMENTS = new Set(["login", "join", "help", "welcome"]);

/** Pages a signed-in astrologer can open before their profile details are filled in. */
const SETUP_EXEMPT = new Set(["setup", "login", "join", "help", "welcome"]);

const hasDevanagari = (s: string) => /[\u0900-\u097F]/.test(s);

function initialsOf(name: string): string {
  const words = name.replace(/^(pt|dr|acharya)\.?\s+/i, "").split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] ?? "").slice(0, 2)).toUpperCase();
}

/** The online / offline pill, from the backend's presence for this astrologer. */
function OnlinePill({ id }: { id: string }) {
  const t = useT(text);
  const online = useOnlineStatus(id);
  const label = online === null ? t.checking : online ? t.online : t.offline;
  return (
    <span
      role="status"
      className={`inline-flex h-[38px] items-center gap-1.5 rounded-full px-3 text-[13px] font-bold ${online ? "bg-success-soft text-success" : "bg-neutral-soft text-ink-soft"}`}
    >
      <span className={`h-[9px] w-[9px] rounded-full ${online ? "bg-online motion-safe:animate-pulse" : "bg-ink-muted"}`} aria-hidden />
      {label}
    </span>
  );
}

/** How many customers are waiting (chat queue plus call waitlist), refreshed every 30 s. null until known. */
function useWaitingCount(id: string, enabled: boolean): number | null {
  const [state, setState] = useState<{ id: string; n: number } | null>(null);
  useEffect(() => {
    if (!enabled || !id) return;
    let live = true;
    const controller = new AbortController();
    const load = () =>
      Promise.allSettled([getChatQueue(controller.signal), getCallWaitlist(id, controller.signal)]).then((parts) => {
        const ok = parts.filter((p) => p.status === "fulfilled");
        if (live && ok.length) setState({ id, n: ok.reduce((sum, p) => sum + p.value.length, 0) });
      });
    void load();
    const timer = setInterval(load, 30_000);
    return () => {
      live = false;
      controller.abort();
      clearInterval(timer);
    };
  }, [id, enabled]);
  return state && state.id === id ? state.n : null;
}

/** The design's page turn: a sheet with the page name sweeps away when a console page opens. Decoration only. */
function PageTurn({ title }: { title: string }) {
  const t = useT(text);
  return (
    <div className="pg-turn" aria-hidden="true">
      <div className="pg-sheet">
        <div className="pg-mark">
          <span className="pg-seal">
            <i />
            <i />
            <Image src="/logo.png" alt="" width={64} height={64} className="block h-16 w-16 flex-none" />
          </span>
          <span className="pg-eye">{t.turnEyebrow}</span>
          <b className="pg-name">{title}</b>
        </div>
      </div>
      <div className="pg-curl">
        <div className="pg-flap" />
        <span className="pg-cast" />
        <span className="pg-fold" />
      </div>
      <span className="pg-line" />
    </div>
  );
}

/** Which nav link is current, from the first path segment under /astrologer (null is the console home). */
const MORE_KEYS = ["schedule", "clients", "remedies", "coupons", "articles", "notifications", "support", "learn"] as const;
type MoreKey = (typeof MORE_KEYS)[number];

function navKey(segment: string | null): "home" | "chats" | "earnings" | "profile" | "help" | MoreKey | null {
  if (segment === null) return "home";
  if (segment === "session") return "chats";
  if (segment === "earnings" || segment === "profile" || segment === "help") return segment;
  return (MORE_KEYS as readonly string[]).includes(segment) ? (segment as MoreKey) : null;
}

/** "More": a menu button with the console's other pages. Arrow keys move, Escape closes and returns focus to the button. */
function MoreMenu({ current }: { current: ReturnType<typeof navKey> }) {
  const t = useT(text);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = [
    { key: "schedule", label: t.schedule, icon: PiCalendarBlank },
    { key: "clients", label: t.clients, icon: PiUsersThree },
    { key: "remedies", label: t.remedies, icon: PiLeaf },
    { key: "coupons", label: t.coupons, icon: PiTag },
    { key: "articles", label: t.articles, icon: PiNewspaper },
    { key: "notifications", label: t.notifications, icon: PiBell },
    { key: "support", label: t.supportPage, icon: PiHeadset },
    { key: "learn", label: t.learn, icon: PiGraduationCap },
  ] as const;
  const active = items.some((i) => i.key === current);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onFocus = (e: FocusEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open]);

  const entries = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      button.current?.focus();
      return;
    }
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    if (!open) setOpen(true);
    requestAnimationFrame(() => {
      const list = entries();
      if (!list.length) return;
      const at = list.indexOf(document.activeElement as HTMLElement);
      const next = e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : e.key === "ArrowDown" ? (at + 1) % list.length : (at <= 0 ? list.length : at) - 1;
      list[next].focus();
    });
  };

  return (
    <div ref={ref} className="relative" onKeyDown={onKeyDown}>
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.moreMenu}
        onClick={() => setOpen((o) => !o)}
        className={`group relative inline-flex cursor-pointer items-center gap-2 py-3 ${active ? "font-bold" : ""}`}
      >
        {t.more}
        <PiCaretDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} aria-hidden />
        <span aria-hidden className={`absolute bottom-1 h-0.5 bg-brand transition-all duration-200 ${active ? "left-0 w-full" : "left-1/2 w-0 group-hover:left-0 group-hover:w-full"}`} />
      </button>
      {open && (
        <div role="menu" aria-label={t.moreMenu} className="absolute left-0 top-12 z-30 w-[240px] max-w-[calc(100vw-40px)] rounded-[18px] border border-line bg-surface-card p-2 shadow-[0_24px_44px_-22px_rgba(20,33,61,0.5)]">
          {items.map(({ key, label, icon: Icon }) => (
            <Link
              key={key}
              role="menuitem"
              href={`/astrologer/${key}`}
              aria-current={current === key ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`flex h-11 items-center gap-2.5 rounded-xl px-3 text-[15px] font-semibold transition hover:bg-surface-sunken focus-visible:bg-surface-sunken ${current === key ? "bg-surface-sunken font-bold text-brand-strong" : ""}`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** EN / हिं: two links to the same page in each language; the current one is filled. */
function LangToggle() {
  const t = useT(text);
  const locale = useLocale();
  const pathname = usePathname();
  const options: Array<{ lang: Locale; label: string }> = [
    { lang: "en", label: "EN" },
    { lang: "hi", label: "हिं" },
  ];
  return (
    <div role="group" aria-label={t.langLabel} className="flex rounded-[14px] border border-line bg-surface-card p-[3px]">
      {options.map(({ lang, label }) => {
        const on = lang === locale;
        return (
          <a
            key={lang}
            href={switchLocale(pathname, lang)}
            hrefLang={lang}
            lang={lang}
            aria-current={on ? "true" : undefined}
            onClick={(event) => {
              if (on || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              window.addEventListener(
                "pagehide",
                () => {
                  document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
                },
                { once: true },
              );
              const { pathname: current, search, hash } = window.location;
              window.location.assign(switchLocale(current, lang) + search + hash);
            }}
            className={`inline-flex h-[38px] min-w-[46px] items-center justify-center rounded-[10px] px-3 text-sm font-bold transition ${
              on ? "bg-surface-inverse text-ink-inverse" : "text-ink hover:bg-surface-sunken"
            }`}
          >
            {label}
          </a>
        );
      })}
    </div>
  );
}

function Logo() {
  const t = useT(text);
  return (
    <Link href="/astrologer" aria-label={t.homeLabel} className="flex shrink-0 items-center gap-3">
      <Image src="/logo.png" alt="" width={50} height={50} priority className="h-[50px] w-[50px] shrink-0" />
      <span>
        <b className="block font-display text-[27px] font-bold leading-none">AstroShrine</b>
        <span className="mt-[5px] inline-flex items-center gap-[5px] rounded-full bg-surface-inverse px-2.5 py-[3px] text-[11.5px] font-bold uppercase tracking-[0.06em] text-brand">
          <PiStar className="h-[11px] w-[11px]" aria-hidden />
          {t.forAstro}
        </span>
      </span>
    </Link>
  );
}

function AccountMenu() {
  const t = useT(text);
  const { name, photo } = useAstrologer();
  const { signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const shown = name || t.astrologerFallback;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex h-11 items-center gap-2.5 rounded-xl px-3 text-[15px] font-semibold transition hover:bg-surface-sunken";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.account}
        className="flex h-12 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface-card py-[3px] pl-[3px] pr-2.5"
      >
        <span
          lang={hasDevanagari(shown) ? "hi" : undefined}
          className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-surface-sunken text-sm font-bold text-brand-strong"
        >
          {initialsOf(shown)}
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element -- a user-uploaded photo from any storage host
            <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
          )}
        </span>
        <PiCaretDown className="h-4 w-4" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-14 z-30 w-[250px] rounded-[18px] border border-line bg-surface-card p-2 shadow-[0_24px_44px_-22px_rgba(20,33,61,0.5)]">
          <div className="mb-1.5 border-b border-line px-3 pb-3 pt-2.5">
            <b lang={hasDevanagari(shown) ? "hi" : undefined} className="block truncate text-[15px]">{shown}</b>
            <span className="flex items-center gap-[5px] text-[13px] font-semibold text-success">
              <PiShieldCheck className="h-4 w-4" aria-hidden />
              {t.verified}
            </span>
          </div>
          <Link role="menuitem" href="/astrologer/profile" className={item} onClick={() => setOpen(false)}>
            <PiUserCircle className="h-5 w-5" aria-hidden />
            {t.myProfile}
          </Link>
          <Link role="menuitem" href="/astrologer/help" className={item} onClick={() => setOpen(false)}>
            <PiQuestion className="h-5 w-5" aria-hidden />
            {t.help}
          </Link>
          <div className="mx-1 my-1.5 h-px bg-line" />
          <button
            type="button"
            role="menuitem"
            className={`${item} w-full cursor-pointer text-danger`}
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.replace("/astrologer");
            }}
          >
            <PiPower className="h-5 w-5" aria-hidden />
            {t.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Chrome of the astrologer console: the "For astrologers" strip, the header and the footer. It is separate
 * from the customer site's header and footer. Sign in and Join show a header without navigation.
 */
export default function ConsoleShell({ children }: { children: React.ReactNode }) {
  const t = useT(text);
  const segment = useSelectedLayoutSegment();
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();
  const astrologer = useAstrologer();
  // The console home (no segment) is the front page for visitors and Home for astrologers: it decides for itself.
  const isPublic = segment === null || PUBLIC_SEGMENTS.has(segment);
  const ready = astrologer.status === "ready";
  // Signed out, or signed in as someone who is not an astrologer (the account row has loaded): to the login page.
  const denied = status === "signedOut" || (status === "signedIn" && astrologer.user !== null && !ready);
  const guarding = !isPublic && !ready;
  const setupExempt = segment !== null && SETUP_EXEMPT.has(segment);
  const checkedFor = useRef("");
  // Public chrome (no navigation, Sign in / Join buttons) until we know this is an astrologer.
  const auth = !ready;
  const current = navKey(segment);
  const waiting = useWaitingCount(astrologer.id, ready);
  const turnTitle: Record<string, string> = { login: t.signInTitle, join: t.joinTitle, help: t.helpTitle, earnings: t.earningsTitle, profile: t.profileTitle, session: t.chatTitle, setup: t.setupTitle };
  const pageTitle = segment === null ? (ready ? t.homeTitle : t.welcomeTitle) : turnTitle[segment];

  useEffect(() => {
    if (isPublic || !denied) return;
    const next = pathname + window.location.search;
    router.replace(`/astrologer/login?next=${encodeURIComponent(next)}`);
  }, [isPublic, denied, pathname, router]);

  // First sign-in: an astrologer who has not filled in their profile details goes to /astrologer/setup once.
  const { id, user } = astrologer;
  useEffect(() => {
    if (!ready || setupExempt || !user || checkedFor.current === id) return;
    if (profileNeedsSetup(user)) {
      router.replace("/astrologer/setup");
      return;
    }
    const controller = new AbortController();
    getOwnAstrologer(id, controller.signal).then(
      (own) => {
        if (ownNeedsSetup(own)) router.replace("/astrologer/setup");
        else checkedFor.current = id;
      },
      () => {},
    );
    return () => controller.abort();
  }, [ready, setupExempt, user, id, pathname, router]);

  const navItems = [
    { key: "home", href: "/astrologer", label: t.home, icon: PiHouse },
    { key: "chats", href: "/astrologer/session", label: t.chats, icon: PiChatCircleDots },
    { key: "earnings", href: "/astrologer/earnings", label: t.earnings, icon: PiWallet },
    { key: "profile", href: "/astrologer/profile", label: t.profile, icon: PiUserCircle },
    { key: "help", href: "/astrologer/help", label: t.help, icon: PiQuestion },
  ] as const;

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="on-inverse sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface-inverse focus:px-3 focus:py-2 focus:text-ink-inverse"
      >
        {t.skip}
      </a>
      {pageTitle && <PageTurn key={pathname} title={pageTitle} />}
      <div className="flex min-h-dvh flex-col bg-surface-page text-ink">
        <div className="on-inverse cs-sheen text-[13.5px] text-ink-inverse">
          <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-x-5 gap-y-1.5 px-5 py-2 sm:px-10">
            <span className="flex items-center gap-2 font-semibold">
              <PiStar className="h-[15px] w-[15px] shrink-0 text-brand" aria-hidden />
              <span className="font-bold tracking-[0.04em] text-brand">{t.forAstro}</span>
              <span className="opacity-60">·</span>
              {t.strip}
            </span>
            <a href={SITE_URL} target="_blank" rel="noopener" className="font-semibold text-[#ffe29a] underline underline-offset-[3px]">
              {t.stripLink} ↗
            </a>
          </div>
        </div>

        <header className="flex flex-wrap items-center gap-x-9 gap-y-3 border-b border-line bg-surface-page/95 px-5 py-3.5 sm:min-h-[84px] sm:px-10">
          <Logo />
          {!auth && (
            <nav aria-label={t.main} className="flex flex-1 basis-[420px] flex-wrap gap-x-[26px] gap-y-0.5 text-[15px] font-semibold">
              {navItems.map(({ key, href, label, icon: Icon }) => {
                const on = current === key;
                return (
                  <Link
                    key={key}
                    href={href}
                    aria-current={on ? "page" : undefined}
                    className={`group relative inline-flex items-center gap-2 py-3 ${on ? "font-bold" : ""}`}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                    {label}
                    {key === "chats" && !!waiting && (
                      <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-brand px-1.5 text-[13px] font-bold text-brand-ink motion-safe:animate-pulse" title={`${waiting} ${t.waitingN}`}>
                        {waiting}
                        <span className="sr-only"> {t.waitingN}</span>
                      </span>
                    )}
                    <span
                      aria-hidden
                      className={`absolute bottom-1 h-0.5 bg-brand transition-all duration-200 ${on ? "left-0 w-full" : "left-1/2 w-0 group-hover:left-0 group-hover:w-full"}`}
                    />
                  </Link>
                );
              })}
              <MoreMenu current={current} />
            </nav>
          )}
          <span className={auth ? "flex-1" : "hidden"} />
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {auth ? (
              <>
                <LangToggle />
                <Button href="/astrologer/login" variant="line" size="sm" className="h-[46px]" aria-current={segment === "login" ? "page" : undefined}>
                  {t.signIn}
                </Button>
                <Button href="/astrologer/join" variant="gold" size="sm" className="h-[46px]">
                  <PiStar className="h-4 w-4" aria-hidden />
                  {t.join}
                </Button>
              </>
            ) : (
              <>
                <OnlinePill id={astrologer.id} />
                <LangToggle />
                <AccountMenu />
              </>
            )}
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {guarding ? (
            <p role="status" className="m-auto px-5 py-24 text-ink-soft">
              {t.loadingConsole}
            </p>
          ) : (
            children
          )}
        </main>

        <footer className="border-t border-line bg-surface-card">
          <div className="cs-orn" aria-hidden />
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-start justify-between gap-x-10 gap-y-4 px-5 py-6 sm:px-10">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
              <div>
                <b className="font-display text-[19px]">AstroShrine</b>
                <div className="text-[13px] font-semibold text-brand-strong">{t.tagline}</div>
                <div className="text-[13px] text-ink-soft">{t.footer}</div>
              </div>
            </div>
            <nav aria-label={t.footerNav} className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
              <div className="flex flex-wrap gap-x-[22px] gap-y-1.5">
                {navItems.map(({ key, href, label }) => (
                  <Link key={key} href={href} className="hover:text-ink">
                    {label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-[22px] gap-y-1.5 font-medium">
                {[t.terms, t.privacy, t.support].map((label) => (
                  <a key={label} href={SITE_URL} target="_blank" rel="noopener" className="hover:text-ink">
                    {label}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
