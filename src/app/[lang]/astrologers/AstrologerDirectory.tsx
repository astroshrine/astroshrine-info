"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PiArrowClockwise, PiHeart, PiHeartFill, PiMagnifyingGlass, PiSealCheck, PiStarFill } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import AstrologerAvatar from "@/components/consult/AstrologerAvatar";
import AvailabilityBadge from "@/components/consult/AvailabilityBadge";
import { secondaryButton } from "@/components/consult/Dialog";
import { useStatuses } from "@/components/consult/useAstrologerStatus";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { fadeUp, stagger } from "@/lib/motion";
import { getFavouriteIds, listAstrologers, setFavourite } from "@/lib/services/astrologers";
import {
  ASTROLOGER_TEXT,
  FILTERS,
  SORTS,
  compactCount,
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
    searchPlaceholder: "नाम या विशेषज्ञता",
    expertiseAndLanguage: "विशेषज्ञता और भाषा",
    sort: "क्रम",
    favourites: "पसंदीदा",
    heading: "Astrologers",
    count: (n: number) => `${n} ज्योतिषी`,
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
    experience: (years: number) => `${years} साल अनुभव`,
    outOfFive: " में से 5 रेटिंग",
    consultations: (n: number) => `${compactCount(n)} consultations`,
    addFavourite: (name: string) => `${name} को पसंदीदा में जोड़ें`,
    removeFavourite: (name: string) => `${name} को पसंदीदा से हटाएं`,
    chatOff: "चैट अभी बंद है",
    available: (when: string) => `उपलब्ध ${when}`,
    free: "मुफ़्त",
    off: (percent: number) => `${percent}% छूट`,
    perMin: "/मिनट",
    chat: "चैट करें",
    profile: "प्रोफ़ाइल",
  },
  en: {
    loading: "Loading astrologers",
    favouriteFailed: "Your favourites could not be updated. Please try again.",
    filters: "Astrologer filters",
    search: "Search",
    searchPlaceholder: "Name or expertise",
    expertiseAndLanguage: "Expertise and language",
    sort: "Sort by",
    favourites: "Favourites",
    heading: "Astrologers",
    count: (n) => (n === 1 ? "1 astrologer" : `${n} astrologers`),
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
    experience: (years) => (years === 1 ? "1 yr exp" : `${years} yrs exp`),
    outOfFive: " out of 5 stars",
    consultations: (n) => (n === 1 ? "1 consultation" : `${compactCount(n)} consultations`),
    addFavourite: (name) => `Add ${name} to favourites`,
    removeFavourite: (name) => `Remove ${name} from favourites`,
    chatOff: "Chat is off right now",
    available: (when) => `Available ${when}`,
    free: "Free",
    off: (percent) => `${percent}% off`,
    perMin: "/min",
    chat: "Chat",
    profile: "Profile",
  },
});

export type DirectoryQuery = { q: string; filter: Filter; sort: Sort; favourites: boolean };

/** Keeps the filters in the address bar (shareable, survives a reload) without a server round trip. */
function writeQuery(q: DirectoryQuery) {
  const params = new URLSearchParams();
  if (q.q.trim()) params.set("q", q.q.trim());
  if (q.filter !== "all") params.set("filter", q.filter);
  if (q.sort !== "popularity") params.set("sort", q.sort);
  if (q.favourites) params.set("fav", "1");
  const search = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}`);
}

export function DirectorySkeleton() {
  const t = useT(text);
  return (
    <div aria-busy="true" aria-label={t.loading} className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
      <div className="h-48 animate-pulse rounded-2xl bg-surface-sunken" />
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="h-48 animate-pulse rounded-2xl bg-surface-sunken" />
        ))}
      </ul>
    </div>
  );
}

export default function AstrologerDirectory({ initial, initialQuery }: { initial: AstrologerCard[] | null; initialQuery: DirectoryQuery }) {
  const { status: authStatus } = useAuth();
  const signedIn = authStatus === "signedIn";
  const searchId = useId();
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
          (a) => matchesFilter(a, query.filter) && matchesQuery(a, query.q) && (!query.favourites || favourites.has(a.id)),
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

  const filtersActive = query.filter !== "all" || !!query.q.trim() || query.favourites;

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
      <aside aria-label={t.filters} className="lg:col-span-1">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-card p-4 shadow-sm lg:sticky lg:top-24 lg:p-6">
          <div className="flex flex-col gap-2">
            <label htmlFor={searchId} className="title-4 text-ink">
              {t.search}
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface-page px-3 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/25">
              <PiMagnifyingGlass className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
              <input
                id={searchId}
                type="search"
                value={query.q}
                onChange={(e) => update({ q: e.target.value.slice(0, 60) })}
                placeholder={t.searchPlaceholder}
                className="body-6 min-w-0 flex-1 bg-transparent py-2 text-ink placeholder:text-ink-muted"
              />
            </div>
          </div>

          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="title-4 mb-2 text-ink">{t.expertiseAndLanguage}</legend>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible">
              {FILTERS.map((f) => {
                const on = query.filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ filter: f })}
                    className={`button-sm shrink-0 rounded-xl border px-3 py-1 transition active:scale-98 ${
                      on ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink-soft hover:border-brand hover:bg-surface-sunken hover:text-ink"
                    }`}
                  >
                    {labels.filters[f]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <label htmlFor={sortId} className="title-4 text-ink">
                {t.sort}
              </label>
              <select
                id={sortId}
                value={query.sort}
                onChange={(e) => update({ sort: e.target.value as Sort })}
                className="body-6 rounded-xl border border-line-strong bg-surface-card px-3 py-3 text-ink focus:border-brand focus:ring-3 focus:ring-brand/25 focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {labels.sorts[s]}
                  </option>
                ))}
              </select>
            </div>
            {signedIn && (
              <button
                type="button"
                aria-pressed={query.favourites}
                onClick={() => update({ favourites: !query.favourites })}
                className={`button-sm inline-flex items-center gap-2 rounded-xl border px-3 py-2 transition active:scale-98 ${
                  query.favourites ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong text-ink-soft hover:bg-surface-sunken hover:text-ink"
                }`}
              >
                {query.favourites ? <PiHeartFill className="h-4 w-4" aria-hidden /> : <PiHeart className="h-4 w-4" aria-hidden />}
                {t.favourites}
              </button>
            )}
          </div>
        </div>
      </aside>

      <section aria-labelledby="results-title" className="flex min-w-0 flex-col gap-4 lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="results-title" className="heading-6 text-ink" aria-live="polite">
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
            <ul aria-busy="true" className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="h-48 animate-pulse rounded-2xl bg-surface-sunken" />
              ))}
            </ul>
          )
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface-card p-6">
            <p className="body-5 text-ink">{query.favourites && favourites.size === 0 ? t.noFavourites : t.noMatch}</p>
            <p className="caption-2 text-ink-soft">{query.favourites && favourites.size === 0 ? t.noFavouritesHint : t.noMatchHint}</p>
            {filtersActive && (
              <button type="button" onClick={() => update({ q: "", filter: "all", favourites: false })} className={secondaryButton}>
                {t.seeAll}
              </button>
            )}
          </div>
        ) : (
          <motion.ul variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visible.map((a) => (
              <motion.li key={a.id} variants={fadeUp} className="flex">
                <AstrologerCardView
                  astrologer={a}
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
  );
}

function AstrologerCardView({
  astrologer: a,
  free,
  favourite,
  onToggleFavourite,
}: {
  astrologer: AstrologerCard;
  free: boolean;
  /** null: signed out, no heart. */
  favourite: boolean | null;
  onToggleFavourite: () => void;
}) {
  const t = useT(text);
  const locale = useLocale();
  const next = a.availability === "offline" ? formatNextAvailable(a.nextAvailableAt, locale) : null;
  const meta = [a.languages.slice(0, 3).join(", "), a.experience ? t.experience(a.experience) : null].filter(Boolean).join(" · ");
  const isFree = free || a.chat.price === 0;
  const canChat = a.availability !== "offline" && !a.chatOff;

  return (
    <article className="group relative flex w-full flex-col gap-4 rounded-2xl border border-line bg-surface-card p-4 transition hover:border-brand hover:shadow-md md:p-5">
      <div className="flex items-start gap-4">
        <AstrologerAvatar name={a.name} photo={a.photo} size={64} availability={a.availability} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="heading-6 flex items-center gap-1 text-ink">
            <Link
              href={`/astrologers/${a.id}`}
              lang={contentLang(a.name)}
              className="truncate rounded-sm capitalize after:absolute after:inset-0 after:rounded-2xl after:content-['']"
            >
              {a.name}
            </Link>
            <PiSealCheck className="h-4 w-4 shrink-0 text-brand-strong" aria-label={t.verified} />
          </h3>
          {a.expertise.length > 0 && (
            <p lang={contentLang(a.expertise.join(" "))} className="caption-2 truncate text-ink-soft">
              {a.expertise.slice(0, 3).join(", ")}
            </p>
          )}
          {meta && <p className="caption-5 truncate text-ink-muted">{meta}</p>}
          <p className="caption-4 flex flex-wrap items-center gap-2 text-ink-soft">
            {a.rating !== null && (
              <span className="inline-flex items-center gap-1">
                <PiStarFill className="h-4 w-4 text-brand" aria-hidden />
                <span>
                  {a.rating.toFixed(1)}
                  <span className="sr-only">{t.outOfFive}</span>
                </span>
              </span>
            )}
            {a.orders > 0 && <span>{t.consultations(a.orders)}</span>}
          </p>
        </div>
        {favourite !== null && (
          <button
            type="button"
            onClick={onToggleFavourite}
            aria-pressed={favourite}
            aria-label={favourite ? t.removeFavourite(a.name) : t.addFavourite(a.name)}
            className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-surface-sunken hover:text-ink active:scale-98"
          >
            {favourite ? <PiHeartFill className="h-5 w-5 text-danger" aria-hidden /> : <PiHeart className="h-5 w-5" aria-hidden />}
          </button>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <AvailabilityBadge availability={a.availability} />
          {a.chatOff ? (
            <span className="caption-5 text-ink-muted">{t.chatOff}</span>
          ) : next ? (
            <span className="caption-5 text-ink-muted">{t.available(next)}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <p className="flex flex-col items-end">
            {isFree ? (
              <span className="title-3 text-success">{t.free}</span>
            ) : (
              <>
                {a.chat.hasOffer && (
                  <span className="caption-5 text-ink-muted">
                    <s>{rupees(a.chat.rate)}</s> · {t.off(a.offerPercent)}
                  </span>
                )}
                <span className="title-3 text-ink">
                  {rupees(a.chat.price)}
                  <span className="caption-5 text-ink-muted">{t.perMin}</span>
                </span>
              </>
            )}
          </p>
          <span
            aria-hidden
            className={`button-sm rounded-xl px-3 py-2 transition ${
              canChat ? "bg-brand text-brand-ink group-hover:bg-brand-hover" : "border border-line-strong text-ink-soft group-hover:bg-surface-sunken"
            }`}
          >
            {canChat ? t.chat : t.profile}
          </span>
        </div>
      </div>
    </article>
  );
}
