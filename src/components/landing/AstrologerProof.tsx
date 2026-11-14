"use client";

import Link from "next/link";
import { PiArrowClockwise, PiArrowRight, PiStarFill } from "react-icons/pi";
import AstrologerCard, { AstrologerCardSkeleton } from "@/components/AstrologerCard";
import { statsOf, useAstrologerDirectory } from "@/lib/useAstrologerDirectory";
import type { Astrologer } from "@/lib/endpoints";
import CountUp from "./CountUp";

/** Ratings with at least this many reviews count as "top rated" (a 5.0 from one review is not proof). */
const MIN_REVIEWS = 10;

function topRated(list: Astrologer[]) {
  const rated = list.filter((a) => a.rating !== null && a.reviews >= MIN_REVIEWS);
  const pool = rated.length >= 3 ? rated : list.filter((a) => a.rating !== null);
  return [...pool].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviews - a.reviews).slice(0, 3);
}

/** Real proof only: counts, ratings and profiles straight from the public astrologer list. */
export default function AstrologerProof() {
  const { list, failed, retry } = useAstrologerDirectory();

  if (failed) {
    return (
      <div role="alert" className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-surface-card p-6">
        <p className="body-6 text-ink">Astrologers की सूची लोड नहीं हुई। Internet connection जांचें और फिर कोशिश करें।</p>
        <button
          type="button"
          onClick={retry}
          className="button-sm inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken motion-safe:active:scale-98"
        >
          <PiArrowClockwise className="h-4 w-4" aria-hidden />
          फिर कोशिश करें
        </button>
      </div>
    );
  }

  const stats = list ? statsOf(list) : null;
  const top = list ? topRated(list) : null;

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Astrologers" value={stats ? stats.total : null} />
        <Stat label="अभी online" value={stats ? stats.online : null} />
        <Stat
          label={stats ? `औसत rating, ${stats.reviews.toLocaleString("en-IN")} reviews से` : "औसत rating"}
          value={stats ? (stats.averageRating ?? "अभी नहीं") : null}
          decimals={1}
          star={stats?.averageRating != null}
        />
      </dl>

      {top === null ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-busy="true" aria-label="Astrologers लोड हो रहे हैं">
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
        सभी astrologers देखें
        <PiArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

/** A live figure. Numbers count up the first time they scroll into view; text (e.g. "अभी नहीं") shows as is. */
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
