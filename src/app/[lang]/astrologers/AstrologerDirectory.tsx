"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  PiArrowClockwise,
  PiCaretDown,
  PiChatCircleDotsFill,
  PiHeart,
  PiHeartFill,
  PiMagnifyingGlass,
  PiPhoneFill,
  PiSealCheck,
  PiStarFill,
  PiUsersThree,
} from "react-icons/pi";
import AppPromoBand from "@/components/AppPromoBand";
import PageHero from "@/components/PageHero";
import { useAuth } from "@/components/AuthProvider";
import { secondaryButton } from "@/components/consult/Dialog";
import { useStatuses } from "@/components/consult/useAstrologerStatus";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { fadeUp, stagger } from "@/lib/motion";
import type { Availability } from "@/lib/endpoints";
import { getFavouriteIds, listAstrologers, setFavourite } from "@/lib/services/astrologers";
import {
  ASTROLOGER_TEXT,
  SORTS,
  contentLang,
  formatNextAvailable,
  isOnApp,
  matchesFilter,
  matchesQuery,
  rupees,
  sortAstrologers,
  withStatus,
  type AstrologerCard,
  type Filter,
  type Sort,
} from "@/lib/services/astrologerModel";
import { getConsultConfig } from "@/lib/services/chat";

const text = defineMessages({
  hi: {
    loading: "Astrologers लोड हो रहे हैं",
    favouriteFailed: "पसंदीदा अपडेट नहीं हो सका। कृपया फिर से कोशिश करें।",
    filters: "Astrologers फ़िल्टर",
    search: "खोजें",
    searchPlaceholder: "नाम या विशेषज्ञता से ज्योतिषी खोजें",
    category: "श्रेणी",
    language: "भाषा",
    allLanguages: "सभी भाषाएं",
    sort: "क्रम",
    favourites: "पसंदीदा",
    heading: "Astrologers",
    count: (n: number) => `${n} ज्योतिषी उपलब्ध`,
    onlineNow: (n: number) => `${n} अभी ऑनलाइन`,
    loadFailed: "Astrologers अभी लोड नहीं हो सके।",
    checkConnection: "इंटरनेट कनेक्शन देखें और फिर से कोशिश करें।",
    retry: "फिर से कोशिश करें",
    noFavourites: "अभी कोई पसंदीदा ज्योतिषी नहीं है।",
    noFavouritesHint: "किसी भी ज्योतिषी के कार्ड पर दिल दबाकर उन्हें यहां सेव करें।",
    noMatch: "इन फ़िल्टर से कोई ज्योतिषी नहीं मिला।",
    noMatchHint: "दूसरा शब्द खोजें या फ़िल्टर हटाएं।",
    seeAll: "सभी ज्योतिषी देखें",
    verified: "Verified",
    experience: (years: number) => `${years} साल`,
    outOfFive: " में से 5 रेटिंग",
    addFavourite: (name: string) => `${name} को पसंदीदा में जोड़ें`,
    removeFavourite: (name: string) => `${name} को पसंदीदा से हटाएं`,
    chatOff: "चैट अभी बंद है",
    available: (when: string) => `उपलब्ध ${when}`,
    free: "मुफ़्त",
    off: (percent: number) => `${percent}% छूट`,
    perMin: "/मिनट",
    chatNow: "अभी चैट करें",
    callNow: "प्रोफ़ाइल देखें",
    profile: "प्रोफ़ाइल देखें",
    modes: "ज्योतिषी से बात करें",
    chatTab: "ज्योतिषी से चैट",
    callTab: "ज्योतिषी से कॉल",
    breadcrumb: "ब्रेडक्रम्ब",
    home: "होम",
    consultations: "परामर्श",
    chatKicker: "ज्योतिषी से चैट करें",
    callKicker: "ज्योतिषी से कॉल करें",
    chatTitle: "ज्योतिषी से चैट करें",
    callTitle: "ज्योतिषी से कॉल करें",
    chatIntro: "अपना सवाल लिखें और वेरिफ़ाइड ज्योतिषी से कुछ ही सेकंड में जवाब पाएं।",
    callIntro: "सीधे वेरिफ़ाइड ज्योतिषी से बात करें और अपने सवालों के जवाब पाएं।",
    viewAstrologers: "ज्योतिषी देखें",
    pill: { online: "उपलब्ध", busy: "व्यस्त", offline: "ऑफ़लाइन" } satisfies Record<Availability, string>,
    startsAt: "शुरुआत",
    expYears: (years: number) => `${years} साल अनुभव`,
    chatCta: "Chat",
    callCta: "Call",
  },
  en: {
    loading: "Loading astrologers",
    favouriteFailed: "Your favourites could not be updated. Please try again.",
    filters: "Astrologer filters",
    search: "Search",
    searchPlaceholder: "Search astrologer by name or skill",
    category: "Category",
    language: "Language",
    allLanguages: "All languages",
    sort: "Sort by",
    favourites: "Favourites",
    heading: "Astrologers",
    count: (n) => (n === 1 ? "1 astrologer available" : `${n} astrologers available`),
    onlineNow: (n) => `${n} online now`,
    loadFailed: "Astrologers could not be loaded.",
    checkConnection: "Check your internet connection and try again.",
    retry: "Try again",
    noFavourites: "You have no favourite astrologers yet.",
    noFavouritesHint: "Tap the heart on any astrologer's card to save them here.",
    noMatch: "No astrologers match these filters.",
    noMatchHint: "Try a different search or clear the filters.",
    seeAll: "See all astrologers",
    verified: "Verified",
    experience: (years) => (years === 1 ? "1 yr" : `${years} yrs`),
    outOfFive: " out of 5 stars",
    addFavourite: (name) => `Add ${name} to favourites`,
    removeFavourite: (name) => `Remove ${name} from favourites`,
    chatOff: "Chat is off right now",
    available: (when) => `Available ${when}`,
    free: "Free",
    off: (percent) => `${percent}% off`,
    perMin: "/min",
    chatNow: "Chat now",
    callNow: "View profile",
    profile: "View profile",
    modes: "Talk to an astrologer",
    chatTab: "Chat with astrologer",
    callTab: "Call with astrologer",
    breadcrumb: "Breadcrumb",
    home: "Home",
    consultations: "Consultations",
    chatKicker: "ज्योतिषी से चैट करें",
    callKicker: "ज्योतिषी से कॉल करें",
    chatTitle: "Chat with astrologer",
    callTitle: "Call with astrologer",
    chatIntro: "Type your question and get answers from a verified astrologer in seconds.",
    callIntro: "Speak directly to a verified astrologer and get your questions answered.",
    viewAstrologers: "View astrologers",
    pill: { online: "Available", busy: "Busy", offline: "Offline" },
    startsAt: "Starts at",
    expYears: (years) => `${years} yrs exp`,
    chatCta: "Chat",
    callCta: "Call",
  },
});

export type Mode = "chat" | "call";
export type Language = "all" | "Hindi" | "English";
export type DirectoryQuery = { q: string; filter: Filter; language: Language; sort: Sort; favourites: boolean; mode: Mode };

/** Category options: the expertise filters; languages have their own select. */
const CATEGORIES: Filter[] = ["all", "online", "Vedic", "Tarot", "Numerology", "Vastu", "Kundli"];
const LANGUAGES: Language[] = ["all", "Hindi", "English"];

/** Keeps the filters in the address bar (shareable, survives a reload) without a server round trip. */
function writeQuery(q: DirectoryQuery) {
  const params = new URLSearchParams();
  if (q.mode === "call") params.set("mode", "call");
  if (q.q.trim()) params.set("q", q.q.trim());
  if (q.filter !== "all") params.set("filter", q.filter);
  if (q.language !== "all") params.set("language", q.language);
  if (q.sort !== "popularity") params.set("sort", q.sort);
  if (q.favourites) params.set("fav", "1");
  const search = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}`);
}

const selectClass =
  "body-6 h-12 w-full appearance-none rounded-xl border border-line-strong bg-surface-card pr-9 pl-3 text-ink focus:border-brand focus:ring-3 focus:ring-brand/25 focus:outline-none";

function Hero({ mode }: { mode: Mode }) {
  const t = useT(text);
  const call = mode === "call";
  return (
    <PageHero
      breadcrumbLabel={t.breadcrumb}
      breadcrumb={[{ label: t.home, href: "/" }, { label: t.consultations }, { label: call ? t.callTitle : t.chatTitle }]}
      icon={PiUsersThree}
      devaKicker={call ? t.callKicker : t.chatKicker}
      title={call ? t.callTitle : t.chatTitle}
      description={call ? t.callIntro : t.chatIntro}
      cta={{ label: t.viewAstrologers, href: "#astrologers" }}
      illustration={
        <Image src="/astrologers-trio.webp" alt="" width={1073} height={560} priority sizes="(min-width: 1024px) 480px, 0px" className="h-auto w-full max-w-[470px] self-end" />
      }
    />
  );
}

export function DirectorySkeleton() {
  const t = useT(text);
  return (
    <div aria-busy="true" aria-label={t.loading}>
      <Hero mode="chat" />
      <div className="mx-auto mt-10 grid w-full max-w-6xl grid-cols-1 gap-6 px-4 md:grid-cols-[repeat(auto-fill,minmax(22rem,1fr))] md:px-8">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[200px] animate-pulse rounded-card bg-surface-sunken" />
        ))}
      </div>
    </div>
  );
}

export default function AstrologerDirectory({ initial, initialQuery }: { initial: AstrologerCard[] | null; initialQuery: DirectoryQuery }) {
  const { status: authStatus } = useAuth();
  const signedIn = authStatus === "signedIn";
  const searchId = useId();
  const categoryId = useId();
  const languageId = useId();
  const sortId = useId();
  const t = useT(text);
  const labels = useT(ASTROLOGER_TEXT);

  const [astrologers, setAstrologers] = useState<AstrologerCard[] | null>(initial);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState<DirectoryQuery>(initialQuery);
  const [favourites, setFavourites] = useState<Set<string>>(() => new Set());
  const [favError, setFavError] = useState<string | null>(null);
  const [free, setFree] = useState(false);

  // No server copy (backend unreachable while rendering), or Retry: load it here.
  useEffect(() => {
    if (initial && reloadKey === 0) return;
    const controller = new AbortController();
    listAstrologers(controller.signal).then(
      (list) => {
        setAstrologers(list);
        setLoadFailed(false);
      },
      () => {
        if (!controller.signal.aborted) setLoadFailed(true);
      },
    );
    return () => controller.abort();
  }, [initial, reloadKey]);

  // Signed in: the hearts and whether consultations are free right now.
  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    getFavouriteIds(controller.signal).then(setFavourites, () => undefined);
    getConsultConfig(controller.signal).then((c) => setFree(c.free));
    return () => controller.abort();
  }, [signedIn]);

  const statuses = useStatuses(useMemo(() => (astrologers ?? []).map((a) => a.id), [astrologers]));

  const update = (patch: Partial<DirectoryQuery>) => {
    const next = { ...query, ...patch };
    setQuery(next);
    writeQuery(next);
  };

  const live = useMemo(() => (astrologers ?? []).map((a) => withStatus(a, statuses.get(a.id))), [astrologers, statuses]);
  const onAppCount = live.filter((a) => isOnApp(a.status)).length;
  const visible = useMemo(
    () =>
      sortAstrologers(
        live.filter(
          (a) =>
            matchesFilter(a, query.filter) &&
            matchesFilter(a, query.language) &&
            matchesQuery(a, query.q) &&
            (!query.favourites || favourites.has(a.id)),
        ),
        query.sort,
      ),
    [live, query, favourites],
  );

  const toggleFavourite = async (id: string) => {
    const next = !favourites.has(id);
    const flip = (on: boolean) =>
      setFavourites((prev) => {
        const s = new Set(prev);
        if (on) s.add(id);
        else s.delete(id);
        return s;
      });
    flip(next);
    setFavError(null);
    try {
      await setFavourite(id, next);
    } catch {
      flip(!next);
      setFavError(t.favouriteFailed);
    }
  };

  const filtersActive = query.filter !== "all" || query.language !== "all" || !!query.q.trim() || query.favourites;

  return (
    <>
      <Hero mode={query.mode} />

      <nav aria-label={t.modes} className="mt-5">
        <ul className="no-scrollbar mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 md:px-8">
          {(["chat", "call"] as const).map((m) => {
            const active = query.mode === m;
            return (
              <li key={m} className="shrink-0">
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => update({ mode: m })}
                  className={`on-inverse flex h-11 items-center whitespace-nowrap rounded-full border px-5 text-[15px] font-bold transition active:scale-98 ${
                    active ? "border-surface-inverse bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink hover:bg-surface-sunken"
                  }`}
                >
                  {m === "chat" ? t.chatTab : t.callTab}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div id="astrologers" className="mx-auto flex w-full max-w-6xl scroll-mt-24 flex-col gap-5 px-4 pt-8 md:px-8">
        <aside aria-label={t.filters} className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex h-12 min-w-0 shrink-0 items-center md:flex-1 gap-2 rounded-input border border-line bg-surface-card px-3 shadow-card focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/25">
            <PiMagnifyingGlass className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
            <label htmlFor={searchId} className="sr-only">
              {t.search}
            </label>
            <input
              id={searchId}
              type="search"
              value={query.q}
              onChange={(e) => update({ q: e.target.value.slice(0, 60) })}
              placeholder={t.searchPlaceholder}
              className="body-6 min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-muted"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 md:flex md:gap-3">
            <Select id={categoryId} label={t.category} value={query.filter} onChange={(v) => update({ filter: v as Filter })} className="md:w-36">
              {CATEGORIES.map((f) => (
                <option key={f} value={f}>
                  {labels.filters[f]}
                </option>
              ))}
            </Select>
            <Select id={languageId} label={t.language} value={query.language} onChange={(v) => update({ language: v as Language })} className="md:w-44">
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l === "all" ? t.allLanguages : labels.filters[l]}
                </option>
              ))}
            </Select>
            <Select id={sortId} label={t.sort} value={query.sort} onChange={(v) => update({ sort: v as Sort })} className="col-span-2 md:w-48">
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {labels.sorts[s]}
                </option>
              ))}
            </Select>
          </div>
          {signedIn && (
            <button
              type="button"
              aria-pressed={query.favourites}
              onClick={() => update({ favourites: !query.favourites })}
              className={`button-sm inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border px-4 transition active:scale-98 ${
                query.favourites ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink-soft hover:bg-surface-sunken hover:text-ink"
              }`}
            >
              {query.favourites ? <PiHeartFill className="h-4 w-4" aria-hidden /> : <PiHeart className="h-4 w-4" aria-hidden />}
              {t.favourites}
            </button>
          )}
        </aside>

        <section aria-labelledby="results-title" className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="results-title" className="text-sm font-medium text-ink-soft" aria-live="polite">
              {astrologers ? t.count(visible.length) : t.heading}
            </h2>
            {astrologers && (
              <p className="caption-2 flex items-center gap-2 text-ink-soft">
                <span aria-hidden className="h-2 w-2 rounded-full bg-online" />
                {t.onlineNow(onAppCount)}
              </p>
            )}
          </div>

          {favError && (
            <p role="alert" className="caption-2 rounded-xl bg-danger-soft px-3 py-2 text-danger">
              {favError}
            </p>
          )}

          {!astrologers ? (
            loadFailed ? (
              <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface-card p-6">
                <p className="body-5 text-ink">{t.loadFailed}</p>
                <p className="caption-2 text-ink-soft">{t.checkConnection}</p>
                <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={secondaryButton}>
                  <PiArrowClockwise className="h-4 w-4" aria-hidden />
                  {t.retry}
                </button>
              </div>
            ) : (
              <ul aria-busy="true" className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fill,minmax(22rem,1fr))]">
                {Array.from({ length: 4 }, (_, i) => (
                  <li key={i} className="h-[200px] animate-pulse rounded-card bg-surface-sunken" />
                ))}
              </ul>
            )
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface-card p-6">
              <p className="body-5 text-ink">{query.favourites && favourites.size === 0 ? t.noFavourites : t.noMatch}</p>
              <p className="caption-2 text-ink-soft">{query.favourites && favourites.size === 0 ? t.noFavouritesHint : t.noMatchHint}</p>
              {filtersActive && (
                <button type="button" onClick={() => update({ q: "", filter: "all", language: "all", favourites: false })} className={secondaryButton}>
                  {t.seeAll}
                </button>
              )}
            </div>
          ) : (
            <motion.ul variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fill,minmax(22rem,1fr))]">
              {visible.map((a) => (
                <motion.li key={a.id} variants={fadeUp} className="flex">
                  <AstrologerCardView
                    astrologer={a}
                    mode={query.mode}
                    free={free}
                    favourite={signedIn ? favourites.has(a.id) : null}
                    onToggleFavourite={() => void toggleFavourite(a.id)}
                  />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </section>
      </div>

      <AppPromoBand />
    </>
  );
}

function Select({
  id,
  label,
  value,
  onChange,
  className = "",
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        {children}
      </select>
      <PiCaretDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink-soft" />
    </div>
  );
}

const PILL: Record<Availability, string> = { online: "bg-online", busy: "bg-busy", offline: "bg-offline" };

const SUPABASE_PUBLIC = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/`
  : null;

function AstrologerCardView({
  astrologer: a,
  mode,
  free,
  favourite,
  onToggleFavourite,
}: {
  astrologer: AstrologerCard;
  mode: Mode;
  free: boolean;
  /** null: signed out, no heart. */
  favourite: boolean | null;
  onToggleFavourite: () => void;
}) {
  const t = useT(text);
  const locale = useLocale();
  const next = a.availability === "offline" ? formatNextAvailable(a.nextAvailableAt, locale) : null;
  const price = mode === "call" ? a.call : a.chat;
  const isFree = mode === "chat" && (free || a.chat.price === 0);
  const optimizable = !!a.photo && !!SUPABASE_PUBLIC && a.photo.startsWith(SUPABASE_PUBLIC);
  const pill = t.pill[a.availability];
  const initials = a.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    // The Android app's astrologer card: round photo in a gold ring with the status dot, name and verified seal,
    // skills, languages, experience, rating and price on the left, the gold Chat and navy Call buttons on the right,
    // and the offer in a gold band along the bottom. The whole card opens the profile (chat and call start there).
    <article className="group relative flex w-full flex-col overflow-hidden rounded-card border border-line bg-surface-card shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_10px_24px_rgb(12_35_64/0.10)]">
      <div className="flex gap-4 p-4">
        <div className="relative h-20 w-20 shrink-0">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-surface-sunken ring-[3px] ring-brand ring-offset-2 ring-offset-surface-card">
            {a.photo ? (
              <Image src={a.photo} alt="" fill sizes="80px" unoptimized={!optimizable} className="object-cover object-top" />
            ) : (
              <span aria-hidden lang={contentLang(a.name)} className="font-display absolute inset-0 grid place-items-center text-2xl font-bold text-ink">
                {initials}
              </span>
            )}
          </div>
          <span aria-hidden className={`absolute right-0.5 bottom-0.5 h-4 w-4 rounded-full border-2 border-surface-card ${PILL[a.availability]}`} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display flex min-w-0 items-center gap-1 text-base font-bold text-ink">
              <Link
                href={`/astrologers/${a.id}`}
                lang={contentLang(a.name)}
                className="truncate rounded-sm capitalize after:absolute after:inset-0 after:rounded-card after:content-['']"
              >
                {a.name}
              </Link>
              <PiSealCheck className="h-4 w-4 shrink-0 text-brand" aria-label={t.verified} />
            </h3>
            <span
              className={`caption-4 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-bold ${
                a.availability === "online"
                  ? "bg-success-soft text-success"
                  : a.availability === "busy"
                    ? "bg-surface-sunken text-brand-strong"
                    : "bg-neutral-soft text-neutral"
              }`}
            >
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${PILL[a.availability]}`} />
              {pill}
            </span>
          </div>
          {a.expertise.length > 0 && (
            <p lang={contentLang(a.expertise.join(" "))} className="caption-2 truncate text-ink-soft">
              {a.expertise.slice(0, 3).join(", ")}
            </p>
          )}
          {a.languages.length > 0 && <p className="caption-2 truncate text-ink-soft">{a.languages.join(", ")}</p>}
          <div className="flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              {a.experience > 0 && <span className="caption-2 text-ink-soft">{t.expYears(a.experience)}</span>}
              {a.rating !== null && (
                <span className="caption-1 inline-flex items-center gap-1 font-bold text-ink">
                  <PiStarFill className="h-3.5 w-3.5 text-brand" aria-hidden />
                  {a.rating.toFixed(1)}
                  <span className="sr-only">{t.outOfFive}</span>
                </span>
              )}
              {a.chatOff && mode === "chat" ? (
                <span className="caption-5 text-ink-muted">{t.chatOff}</span>
              ) : next ? (
                <span className="caption-5 text-ink-muted">{t.available(next)}</span>
              ) : null}
              {isFree ? (
                <span className="font-display text-lg font-bold text-success">{t.free}</span>
              ) : (
                <span className="flex flex-col">
                  <span className="caption-5 text-ink-muted">{t.startsAt}</span>
                  <span className="font-display text-lg font-bold text-ink">
                    {price.hasOffer && <s className="caption-5 mr-1 font-medium text-ink-muted">{rupees(price.rate)}</s>}
                    {rupees(price.price)}
                    <span className="caption-5 font-medium text-ink-muted">{t.perMin}</span>
                  </span>
                </span>
              )}
            </div>
            {/* Visual only: the card's link (above) takes the click to the profile, where chat and call start. */}
            <div aria-hidden className="flex w-24 shrink-0 flex-col gap-2">
              <span className="button-sm flex h-10 items-center justify-center gap-1.5 rounded-input bg-brand text-brand-ink transition group-hover:bg-brand-hover">
                <PiChatCircleDotsFill className="h-4 w-4" />
                {t.chatCta}
              </span>
              <span className="button-sm flex h-10 items-center justify-center gap-1.5 rounded-input bg-surface-inverse text-ink-inverse transition group-hover:bg-surface-inverse-raised">
                <PiPhoneFill className="h-4 w-4" />
                {t.callCta}
              </span>
            </div>
          </div>
        </div>
      </div>

      {favourite !== null && (
        <button
          type="button"
          onClick={onToggleFavourite}
          aria-pressed={favourite}
          aria-label={favourite ? t.removeFavourite(a.name) : t.addFavourite(a.name)}
          className="absolute top-2 left-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-surface-card text-ink-soft shadow-card transition hover:text-ink active:scale-98"
        >
          {favourite ? <PiHeartFill className="h-4 w-4 text-danger" aria-hidden /> : <PiHeart className="h-4 w-4" aria-hidden />}
        </button>
      )}

      {price.hasOffer && !isFree && (
        <p className="caption-3 mt-auto bg-surface-sunken px-4 py-2 font-bold text-brand-strong">
          {t.off(Math.round(((price.rate - price.price) / price.rate) * 100)).toUpperCase()}
        </p>
      )}
    </article>
  );
}
