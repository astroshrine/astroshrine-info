"use client";

import { PiArrowClockwise, PiArrowRight, PiStarFill } from "react-icons/pi";
import AstrologerCard, { AstrologerCardSkeleton } from "@/components/AstrologerCard";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { statsOf, useAstrologerDirectory } from "@/lib/useAstrologerDirectory";
import type { Astrologer } from "@/lib/endpoints";
import CountUp from "./CountUp";

/** Ratings with at least this many reviews count as "top rated" (a 5.0 from one review is not proof). */
const MIN_REVIEWS = 10;

const text = defineMessages({
  hi: {
    listFailed: "Astrologers की सूची लोड नहीं हुई। Internet connection जांचें और फिर कोशिश करें।",
    tryAgain: "फिर कोशिश करें",
    astrologers: "Astrologers",
    onlineNow: "अभी online",
    averageRating: "औसत rating",
    averageFrom: (reviews: string) => `औसत rating, ${reviews} reviews से`,
    notYet: "अभी नहीं",
    loading: "Astrologers लोड हो रहे हैं",
    seeAll: "सभी astrologers देखें",
  },
  en: {
    listFailed: "Could not load the list of astrologers. Check your internet connection and try again.",
    tryAgain: "Try again",
    astrologers: "Astrologers",
    onlineNow: "Online now",
    averageRating: "Average rating",
    averageFrom: (reviews) => `Average rating from ${reviews} reviews`,
    notYet: "Not yet",
    loading: "Loading astrologers",
    seeAll: "See all astrologers",
  },
});

function topRated(list: Astrologer[]) {
  const rated = list.filter((a) => a.rating !== null && a.reviews >= MIN_REVIEWS);
  const pool = rated.length >= 3 ? rated : list.filter((a) => a.rating !== null);
  return [...pool].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviews - a.reviews).slice(0, 3);
}

/** Real proof only: counts, ratings and profiles straight from the public astrologer list. */
export default function AstrologerProof() {
  const { list, failed, retry } = useAstrologerDirectory();
  const t = useT(text);

  if (failed) {
    return (
      <div role="alert" className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-surface-card p-6">
        <p className="body-6 text-ink">{t.listFailed}</p>
        <button
          type="button"
          onClick={retry}
          className="button-sm inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken motion-safe:active:scale-98"
        >
          <PiArrowClockwise className="h-4 w-4" aria-hidden />
          {t.tryAgain}
        </button>
      </div>
    );
  }

  const stats = list ? statsOf(list) : null;
  const top = list ? topRated(list) : null;

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label={t.astrologers} value={stats ? stats.total : null} />
        <Stat label={t.onlineNow} value={stats ? stats.online : null} />
        <Stat
          label={stats ? t.averageFrom(stats.reviews.toLocaleString("en-IN")) : t.averageRating}
          value={stats ? (stats.averageRating ?? t.notYet) : null}
          decimals={1}
          star={stats?.averageRating != null}
        />
      </dl>

      {top === null ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-busy="true" aria-label={t.loading}>
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i}>
              <AstrologerCardSkeleton />
            </li>
          ))}
        </ul>
      ) : (
        top.length > 0 && (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {top.map((a) => (
              <li key={a.id}>
                <AstrologerCard astrologer={a} />
              </li>
            ))}
          </ul>
        )
      )}

      <Link
        href="/astrologers"
        className="button-sm inline-flex w-fit items-center gap-2 rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken motion-safe:active:scale-98"
      >
        {t.seeAll}
        <PiArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

/** A live figure. Numbers count up the first time they scroll into view; text (e.g. "not yet") shows as is. */
function Stat({
  label,
  value,
  decimals = 0,
  star = false,
}: {
  label: string;
  value: number | string | null;
  decimals?: number;
  star?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface-card p-6">
      <dt className="caption-2 order-2 text-ink-soft">{label}</dt>
      <dd className="heading-4 order-1 flex items-center gap-2 text-ink">
        {value === null ? (
          <span aria-hidden className="block h-9 w-20 animate-pulse rounded-lg bg-surface-sunken" />
        ) : (
          <>
            {typeof value === "number" ? <CountUp value={value} decimals={decimals} /> : value}
            {star && <PiStarFill className="h-6 w-6 text-brand" aria-hidden />}
          </>
        )}
      </dd>
    </div>
  );
}
