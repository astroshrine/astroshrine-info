"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { PiArrowClockwise, PiArrowRight, PiStarFill } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import type { Astrologer, Availability } from "@/lib/endpoints";
import { contentLang } from "@/lib/services/astrologerModel";
import { useAstrologerDirectory } from "@/lib/useAstrologerDirectory";

const SHOWN = 8;
const MAX_TABS = 5;

const text = defineMessages({
  hi: {
    failed: "Astrologers की सूची लोड नहीं हुई। Internet connection जांचें और फिर कोशिश करें।",
    tryAgain: "फिर कोशिश करें",
    loading: "Astrologers लोड हो रहे हैं",
    all: "सभी",
    topics: "विषय के अनुसार चुनें",
    availability: { online: "Online", busy: "Busy", offline: "Offline" } satisfies Record<Availability, string>,
    years: (n: number) => `${n} yrs`,
    rating: "Rating",
    free: "मुफ़्त",
    perMin: "/min",
    chat: "Chat करें",
    seeAll: "सभी astrologers देखें",
  },
  en: {
    failed: "Could not load the list of astrologers. Check your internet connection and try again.",
    tryAgain: "Try again",
    loading: "Loading astrologers",
    all: "All",
    topics: "Choose by topic",
    availability: { online: "Online", busy: "Busy", offline: "Offline" },
    years: (n) => (n === 1 ? "1 yr" : `${n} yrs`),
    rating: "Rating",
    free: "Free",
    perMin: "/min",
    chat: "Chat",
    seeAll: "See all astrologers",
  },
});

const DOT: Record<Availability, string> = { online: "bg-online", busy: "bg-busy", offline: "bg-offline" };

/** The most common expertise topics in the live list, the tabs of the grid. */
function topicsOf(list: Astrologer[]) {
  const counts = new Map<string, { label: string; n: number }>();
  for (const a of list)
    for (const e of new Set(a.expertise.map((x) => x.trim()).filter(Boolean))) {
      const key = e.toLowerCase();
      counts.set(key, { label: counts.get(key)?.label ?? e, n: (counts.get(key)?.n ?? 0) + 1 });
    }
  return [...counts.entries()]
    .filter(([, v]) => v.n >= 2)
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, MAX_TABS)
    .map(([key, v]) => ({ key, label: v.label }));
}

/** Astrologers straight from the public list, online first, with tabs for the commonest expertise topics. */
export default function AstrologerShowcase() {
  const { list, failed, retry } = useAstrologerDirectory();
  const t = useT(text);
  const [tab, setTab] = useState("");
  const topics = useMemo(() => (list ? topicsOf(list) : []), [list]);

  if (failed) {
    return (
      <div role="alert" className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-surface-card p-6">
        <p className="body-6 text-ink">{t.failed}</p>
        <button
          type="button"
          onClick={retry}
          className="button-sm inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken motion-safe:active:scale-98"
        >
          <PiArrowClockwise className="h-4 w-4" aria-hidden />
          {t.tryAgain}
        </button>
      </div>
    );
  }

  if (list === null) {
    return (
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label={t.loading}>
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} aria-hidden className="h-[420px] animate-pulse rounded-[28px] bg-surface-sunken" />
        ))}
      </ul>
    );
  }

  const shown = (tab ? list.filter((a) => a.expertise.some((e) => e.trim().toLowerCase() === tab)) : list).slice(0, SHOWN);

  return (
    <div>
      {topics.length > 0 && (
        <div role="group" aria-label={t.topics} className="-mx-4 mb-8 flex gap-1.5 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0">
          {[{ key: "", label: t.all }, ...topics].map((o) => (
            <button
              key={o.key}
              type="button"
              aria-pressed={tab === o.key}
              onClick={() => setTab(o.key)}
              lang={contentLang(o.label)}
              className={`button-sm -mb-px h-12 shrink-0 whitespace-nowrap border-b-[3px] px-4 capitalize transition-colors ${
                tab === o.key ? "border-brand bg-brand text-brand-ink" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((a) => (
          <li key={a.id}>
            <Card a={a} />
          </li>
        ))}
      </ul>
      <Link
        href="/astrologers"
        className="button-sm mt-8 inline-flex w-fit items-center gap-2 rounded-xl border border-ink px-4 py-3 text-ink transition hover:bg-surface-sunken motion-safe:active:scale-98 md:hidden"
      >
        {t.seeAll}
        <PiArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

function Card({ a }: { a: Astrologer }) {
  const t = useT(text);
  const lang = contentLang(a.name);
  return (
    <Link
      href={`/astrologers/${encodeURIComponent(a.id)}`}
      className="group flex h-full flex-col rounded-[28px] border border-line bg-surface-card p-3 transition motion-safe:hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_18px_38px_rgba(20,33,61,0.10)]"
    >
      <span className="relative block aspect-[1/0.95] overflow-hidden rounded-t-[999px] rounded-b-2xl bg-surface-inverse">
        {a.photo ? (
          <Image src={a.photo} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover object-top" />
        ) : (
          <span aria-hidden lang={lang} className="font-display absolute inset-0 grid place-items-center text-6xl font-bold text-brand-on-inverse">
            {a.name.trim().slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className="caption-4 absolute inset-x-0 bottom-2 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-surface-card px-2.5 py-1 font-semibold text-ink">
          <span aria-hidden className={`h-2 w-2 rounded-full ${DOT[a.availability]}`} />
          {t.availability[a.availability]}
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-3 px-3 pb-3 pt-4 text-center">
        <span lang={lang} className="font-display block truncate text-lg font-semibold capitalize leading-snug text-ink">
          {a.name}
        </span>
        <span lang={contentLang(a.expertise.join(" "))} className="caption-4 block min-h-4 truncate text-ink-soft">
          {a.expertise.slice(0, 3).join(" · ")}
        </span>
        <span className="caption-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-y border-line py-2.5 text-ink">
          {a.rating !== null && (
            <span className="inline-flex items-center gap-1 font-bold">
              <PiStarFill className="h-3.5 w-3.5 text-brand" aria-hidden />
              <span className="sr-only">{t.rating}</span>
              {a.rating.toFixed(1)}
            </span>
          )}
          {a.experience > 0 && <span>{t.years(a.experience)}</span>}
          {a.languages.length > 0 && (
            <span lang={contentLang(a.languages.join(" "))} className="max-w-full truncate">
              {a.languages.slice(0, 2).join(", ")}
            </span>
          )}
        </span>
        <span className="font-display text-xl font-bold text-ink">
          {a.chat.hasOffer && <s className="mr-1.5 text-sm font-medium text-ink-muted">₹{a.chat.rate}</s>}
          {a.chat.price === 0 ? t.free : <>₹{a.chat.price}<span className="caption-3 font-medium text-ink-soft">{t.perMin}</span></>}
        </span>
        <span className="button-sm mt-auto grid h-11 place-items-center rounded-xl bg-surface-inverse text-ink-inverse transition-colors group-hover:bg-surface-inverse-raised">{t.chat}</span>
      </span>
    </Link>
  );
}
