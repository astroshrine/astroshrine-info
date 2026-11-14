"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PiArrowClockwise, PiHeart, PiHeartFill, PiMagnifyingGlass, PiSealCheck, PiStarFill } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import AstrologerAvatar from "@/components/consult/AstrologerAvatar";
import AvailabilityBadge from "@/components/consult/AvailabilityBadge";
import { secondaryButton } from "@/components/consult/Dialog";
import { useStatuses } from "@/components/consult/useAstrologerStatus";
import { fadeUp, stagger } from "@/lib/motion";
import { getFavouriteIds, listAstrologers, setFavourite } from "@/lib/services/astrologers";
import {
  FILTERS,
  FILTER_LABELS,
  SORTS,
  SORT_LABELS,
  compactCount,
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
  return (
    <div aria-busy="true" aria-label="Astrologers लोड हो रहे हैं" className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
      <div className="h-48 animate-pulse rounded-3xl bg-surface-sunken" />
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="h-48 animate-pulse rounded-3xl bg-surface-sunken" />
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
      setFavError("पसंदीदा अपडेट नहीं हो सका। कृपया फिर से कोशिश करें।");
    }
  };

  const filtersActive = query.filter !== "all" || !!query.q.trim() || query.favourites;

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
      <aside aria-label="Astrologers फ़िल्टर" className="lg:col-span-1">
        <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface-card p-4 lg:sticky lg:top-24 lg:p-6">
          <div className="flex flex-col gap-2">
            <label htmlFor={searchId} className="title-4 text-ink">
              खोजें
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface-page px-3 focus-within:border-ink-muted">
              <PiMagnifyingGlass className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
              <input
                id={searchId}
                type="search"
                value={query.q}
                onChange={(e) => update({ q: e.target.value.slice(0, 60) })}
                placeholder="नाम या विशेषज्ञता"
                className="body-6 min-w-0 flex-1 bg-transparent py-2 text-ink placeholder:text-ink-muted"
              />
            </div>
          </div>

          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="title-4 mb-2 text-ink">विशेषज्ञता और भाषा</legend>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible">
              {FILTERS.map((f) => {
                const on = query.filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ filter: f })}
                    className={`button-sm shrink-0 rounded-full border px-3 py-1 transition active:scale-98 ${
                      on ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink-soft hover:bg-surface-sunken hover:text-ink"
                    }`}
                  >
                    {FILTER_LABELS[f]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <label htmlFor={sortId} className="title-4 text-ink">
                क्रम
              </label>
              <select
                id={sortId}
                value={query.sort}
                onChange={(e) => update({ sort: e.target.value as Sort })}
                className="body-6 rounded-xl border border-line-strong bg-surface-page px-3 py-2 text-ink"
              >
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {SORT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            {signedIn && (
              <button
                type="button"
                aria-pressed={query.favourites}
                onClick={() => update({ favourites: !query.favourites })}
                className={`button-sm inline-flex items-center gap-2 rounded-full border px-3 py-2 transition active:scale-98 ${
                  query.favourites ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong text-ink-soft hover:bg-surface-sunken hover:text-ink"
                }`}
              >
                {query.favourites ? <PiHeartFill className="h-4 w-4" aria-hidden /> : <PiHeart className="h-4 w-4" aria-hidden />}
                पसंदीदा
              </button>
            )}
          </div>
        </div>
      </aside>

      <section aria-labelledby="results-title" className="flex min-w-0 flex-col gap-4 lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="results-title" className="title-3 text-ink" aria-live="polite">
            {astrologers ? `${visible.length} ज्योतिषी` : "Astrologers"}
          </h2>
          {astrologers && (
            <p className="caption-2 flex items-center gap-2 text-ink-soft">
              <span aria-hidden className="h-2 w-2 rounded-full bg-online" />
              {onAppCount} अभी ऑनलाइन
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
            <div role="alert" className="flex flex-col items-start gap-3 rounded-3xl border border-line bg-surface-card p-6">
              <p className="body-5 text-ink">Astrologers अभी लोड नहीं हो सके।</p>
              <p className="caption-2 text-ink-soft">इंटरनेट कनेक्शन देखें और फिर से कोशिश करें।</p>
              <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={secondaryButton}>
                <PiArrowClockwise className="h-4 w-4" aria-hidden />
                फिर से कोशिश करें
              </button>
            </div>
          ) : (
            <ul aria-busy="true" className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="h-48 animate-pulse rounded-3xl bg-surface-sunken" />
              ))}
            </ul>
          )
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-3xl border border-line bg-surface-card p-6">
            <p className="body-5 text-ink">
              {query.favourites && favourites.size === 0 ? "अभी कोई पसंदीदा ज्योतिषी नहीं है।" : "इन फ़िल्टर से कोई ज्योतिषी नहीं मिला।"}
            </p>
            <p className="caption-2 text-ink-soft">
              {query.favourites && favourites.size === 0
                ? "किसी भी ज्योतिषी के कार्ड पर दिल दबाकर उन्हें यहां सेव करें।"
                : "दूसरा शब्द खोजें या फ़िल्टर हटाएं।"}
            </p>
            {filtersActive && (
              <button type="button" onClick={() => update({ q: "", filter: "all", favourites: false })} className={secondaryButton}>
                सभी ज्योतिषी देखें
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
  const next = a.availability === "offline" ? formatNextAvailable(a.nextAvailableAt) : null;
  const meta = [a.languages.slice(0, 3).join(", "), a.experience ? `${a.experience} साल अनुभव` : null].filter(Boolean).join(" · ");
  const isFree = free || a.chat.price === 0;
  const canChat = a.availability !== "offline" && !a.chatOff;

  return (
    <article className="group relative flex w-full flex-col gap-4 rounded-3xl border border-line bg-surface-card p-4 transition hover:border-line-strong hover:shadow-md md:p-6">
      <div className="flex items-start gap-4">
        <AstrologerAvatar name={a.name} photo={a.photo} size={64} availability={a.availability} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="title-3 flex items-center gap-1 text-ink">
            <Link
              href={`/astrologers/${a.id}`}
              className="truncate rounded-sm capitalize after:absolute after:inset-0 after:rounded-3xl after:content-['']"
            >
              {a.name}
            </Link>
            <PiSealCheck className="h-4 w-4 shrink-0 text-brand-strong" aria-label="Verified" />
          </h3>
          {a.expertise.length > 0 && <p className="caption-2 truncate text-ink-soft">{a.expertise.slice(0, 3).join(", ")}</p>}
          {meta && <p className="caption-5 truncate text-ink-muted">{meta}</p>}
          <p className="caption-4 flex flex-wrap items-center gap-2 text-ink-soft">
            {a.rating !== null && (
              <span className="inline-flex items-center gap-1">
                <PiStarFill className="h-4 w-4 text-brand" aria-hidden />
                <span>
                  {a.rating.toFixed(1)}
                  <span className="sr-only"> में से 5 रेटिंग</span>
                </span>
              </span>
            )}
            {a.orders > 0 && <span>{compactCount(a.orders)} consultations</span>}
          </p>
        </div>
        {favourite !== null && (
          <button
            type="button"
            onClick={onToggleFavourite}
            aria-pressed={favourite}
            aria-label={favourite ? `${a.name} को पसंदीदा से हटाएं` : `${a.name} को पसंदीदा में जोड़ें`}
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
            <span className="caption-5 text-ink-muted">चैट अभी बंद है</span>
          ) : next ? (
            <span className="caption-5 text-ink-muted">उपलब्ध {next}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <p className="flex flex-col items-end">
            {isFree ? (
              <span className="title-3 text-success">मुफ़्त</span>
            ) : (
              <>
                {a.chat.hasOffer && (
                  <span className="caption-5 text-ink-muted">
                    <s>{rupees(a.chat.rate)}</s> · {a.offerPercent}% छूट
                  </span>
                )}
                <span className="title-3 text-ink">
                  {rupees(a.chat.price)}
                  <span className="caption-5 text-ink-muted">/मिनट</span>
                </span>
              </>
            )}
          </p>
          <span
            aria-hidden
            className={`button-sm rounded-full px-3 py-2 transition ${
              canChat ? "bg-brand text-brand-ink group-hover:bg-brand-hover" : "border border-line-strong text-ink-soft group-hover:bg-surface-sunken"
            }`}
          >
            {canChat ? "चैट करें" : "प्रोफ़ाइल"}
          </span>
        </div>
      </div>
    </article>
  );
}
