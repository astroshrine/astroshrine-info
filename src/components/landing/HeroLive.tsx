"use client";

import Image from "next/image";
import { PiChatsCircle, PiStarFill, PiUsersThree, PiWifiHigh } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { statsOf, useAstrologerDirectory } from "@/lib/useAstrologerDirectory";
import CountUp from "./CountUp";

const text = defineMessages({
  hi: {
    online: (n: number) => `${n} astrologers अभी online`,
    total: (n: number) => `AstroShrine पर ${n} astrologers`,
    statsLabel: "AstroShrine के आंकड़े",
    astrologers: "Astrologers",
    onlineNow: "अभी online",
    rating: "औसत rating",
    reviews: "Reviews",
  },
  en: {
    online: (n) => `${n} astrologers online now`,
    total: (n) => `${n} astrologers on AstroShrine`,
    statsLabel: "AstroShrine in numbers",
    astrologers: "Astrologers",
    onlineNow: "Online now",
    rating: "Average rating",
    reviews: "Reviews",
  },
});

/** The pill above the heading: real astrologers from the public list, photos of those who are online. Hidden if it can't load. */
export function HeroBadge() {
  const { list, failed } = useAstrologerDirectory();
  const t = useT(text);
  if (failed) return null;
  if (!list) return <span aria-hidden className="mb-6 block h-11 w-64 animate-pulse rounded-full bg-surface-sunken" />;

  const s = statsOf(list);
  if (s.total === 0) return null;
  const faces = list.filter((a) => a.availability === "online").slice(0, 3);
  return (
    <span className="mb-6 inline-flex items-center gap-3 rounded-full border border-line bg-surface-card py-1.5 pl-1.5 pr-4 text-sm font-semibold text-ink">
      {faces.length > 0 && (
        <span className="flex -space-x-2" aria-hidden>
          {faces.map((a) =>
            a.photo ? (
              <Image key={a.id} src={a.photo} alt="" width={32} height={32} className="h-8 w-8 rounded-full border-2 border-surface-card object-cover" />
            ) : (
              <span key={a.id} className="grid h-8 w-8 place-items-center rounded-full border-2 border-surface-card bg-surface-inverse text-xs font-bold text-brand-on-inverse">
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
      <span>{s.online > 0 ? t.online(s.online) : t.total(s.total)}</span>
    </span>
  );
}

/** The navy stat box: live figures only (counts, rating and review count from the public list). */
export function HeroStats() {
  const { list } = useAstrologerDirectory();
  const t = useT(text);
  const s = list ? statsOf(list) : null;
  if (list && s?.total === 0) return null;

  const cells = [
    { icon: PiUsersThree, label: t.astrologers, value: s?.total ?? null, decimals: 0 },
    { icon: PiWifiHigh, label: t.onlineNow, value: s?.online ?? null, decimals: 0 },
    ...(s && s.averageRating === null ? [] : [{ icon: PiStarFill, label: t.rating, value: s?.averageRating ?? null, decimals: 1, suffix: "/5" }]),
    ...(s && s.reviews === 0 ? [] : [{ icon: PiChatsCircle, label: t.reviews, value: s?.reviews ?? null, decimals: 0 }]),
  ];

  return (
    <dl
      aria-label={t.statsLabel}
      className="on-inverse relative mt-8 grid grid-cols-2 gap-y-5 overflow-hidden rounded-[22px] bg-surface-inverse px-2 py-5 shadow-[0_22px_44px_rgba(20,33,61,0.22),inset_0_0_0_1px_rgba(255,174,0,0.22)] sm:grid-cols-[repeat(auto-fit,minmax(0,1fr))]"
    >
      <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand to-transparent opacity-80" />
      {cells.map(({ icon: Icon, label, value, decimals, suffix }, i) => (
        <div key={label} className={`flex min-w-0 flex-col items-center gap-1.5 px-3 text-center ${i > 0 ? "sm:border-l sm:border-brand/20" : ""}`}>
          <span className="mb-1 grid h-9 w-9 place-items-center rounded-xl border border-brand/25 bg-brand/10 text-brand-on-inverse">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <dd className="font-display order-1 flex items-baseline text-2xl font-semibold leading-none tracking-tight text-ink-inverse tabular-nums">
            {value === null ? <span aria-hidden className="block h-6 w-10 animate-pulse rounded bg-surface-inverse-raised" /> : <CountUp value={value} decimals={decimals} />}
            {value !== null && suffix && <em className="ml-0.5 text-sm font-medium not-italic text-ink-inverse-soft">{suffix}</em>}
          </dd>
          <dt className="caption-5 order-2 text-ink-inverse-soft">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
