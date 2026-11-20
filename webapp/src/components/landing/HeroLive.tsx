"use client";

import Image from "next/image";
import type { IconType } from "react-icons";
import { PiChatCircleText, PiShieldCheck, PiStarFill, PiUsersThree } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { statsOf, useAstrologerDirectory } from "@/lib/useAstrologerDirectory";
import CountUp from "./CountUp";
import { HERO_SAMPLE } from "./samples/hero";

const text = HERO_SAMPLE;

/** The pill above the heading: real astrologers from the public list, photos of those who are online. Hidden if it can't load. */
export function HeroBadge() {
  const { list, failed } = useAstrologerDirectory();
  const t = useT(text);
  if (failed) return null;
  if (!list) return <span aria-hidden className="mb-[22px] block h-[42px] w-64 animate-pulse rounded-full bg-surface-sunken" />;

  const s = statsOf(list);
  if (s.total === 0) return null;
  const faces = list.filter((a) => a.availability === "online").slice(0, 3);
  return (
    <span className="mb-[22px] inline-flex items-center gap-2.5 rounded-full border border-line bg-surface-card py-1.5 pl-1.5 pr-4 text-sm font-semibold text-ink">
      {faces.length > 0 && (
        <span className="flex -space-x-2" aria-hidden>
          {faces.map((a) =>
            a.photo ? (
              <Image key={a.id} src={a.photo} alt="" width={30} height={30} className="h-[30px] w-[30px] rounded-full border-2 border-surface-card object-cover" />
            ) : (
              <span key={a.id} className="grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-surface-card bg-surface-inverse text-[11px] font-extrabold text-brand-on-inverse">
                {a.name.charAt(0).toUpperCase()}
              </span>
            ),
          )}
        </span>
      )}
      {s.online > 0 && (
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full rounded-full bg-online opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-online" />
        </span>
      )}
      <span>{s.online > 0 ? t.online(s.online.toLocaleString("en-IN")) : t.online(s.total.toLocaleString("en-IN"))}</span>
    </span>
  );
}

/**
 * The navy stat box: every figure comes from the public astrologer list. It stays empty while the list loads and
 * is left out when the list can't load, rather than pulsing forever or falling back to made-up numbers.
 */
export function HeroStats() {
  const { list, failed } = useAstrologerDirectory();
  const t = useT(text);
  if (failed) return null;
  const s = list ? statsOf(list) : null;
  if (s && s.total === 0) return null;

  const cells: { icon: IconType; label: string; value: number | null; decimals?: number; suffix: string; sup?: string }[] = [
    { icon: PiShieldCheck, label: t.stats.astrologers, value: s ? s.total : null, suffix: "" },
    { icon: PiUsersThree, label: t.stats.online, value: s ? s.online : null, suffix: "" },
  ];
  // No rating yet (no reviews): show neither the rating nor a review count of 0.
  if (!s || s.averageRating !== null) {
    cells.push(
      { icon: PiStarFill, label: t.stats.rating, value: s ? s.averageRating : null, decimals: 1, suffix: "", sup: "/5" },
      { icon: PiChatCircleText, label: t.stats.reviews, value: s ? s.reviews : null, suffix: "" },
    );
  }

  return (
    <dl
      aria-label={t.statsLabel}
      className={`on-inverse relative mt-7 grid grid-cols-2 gap-y-5 overflow-hidden rounded-[22px] bg-surface-inverse px-1.5 py-[22px] shadow-[0_22px_44px_rgba(20,33,61,0.22),inset_0_0_0_1px_rgba(255,174,0,0.22)] ${cells.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-2"}`}
    >
      <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand to-transparent opacity-80" />
      {cells.map(({ icon: Icon, label, value, decimals, suffix, sup }, i) => (
        <div key={label} className={`group flex min-w-0 flex-col items-center gap-1.5 px-2.5 py-1 text-center ${i > 0 ? "sm:border-l sm:border-brand/20" : ""}`}>
          <span className="mb-1 grid h-[38px] w-[38px] place-items-center rounded-xl border border-brand/25 bg-brand/10 text-brand-on-inverse transition-transform duration-300 group-hover:-translate-y-[3px] group-hover:-rotate-6">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <dd className="font-display order-1 flex items-baseline whitespace-nowrap text-2xl font-semibold leading-[1.1] tracking-[-0.02em] text-ink-inverse tabular-nums">
            {value === null ? (
              <span aria-hidden className="block h-6 w-10 animate-pulse rounded bg-surface-inverse-raised" />
            ) : (
              <>
                <CountUp value={value} decimals={decimals ?? 0} />
                {suffix}
              </>
            )}
            {sup && <em className="ml-0.5 text-sm font-medium not-italic text-ink-inverse-soft">{sup}</em>}
          </dd>
          <dt className="order-2 text-xs font-medium leading-[1.3] text-ink-inverse-soft sm:whitespace-nowrap">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
