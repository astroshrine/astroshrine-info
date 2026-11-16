"use client";

import { useState } from "react";
import Image from "next/image";
import { PiArrowClockwise, PiArrowRight, PiStarFill } from "react-icons/pi";
import { Reveal } from "@/components/Reveal";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import type { Astrologer, Availability } from "@/lib/endpoints";
import { contentLang } from "@/lib/services/astrologerModel";
import { useAstrologerDirectory } from "@/lib/useAstrologerDirectory";
import { ASTRO_SAMPLE, TOPIC_WORDS } from "./samples/hero";

const SHOWN = 8;

const text = defineMessages({
  hi: {
    failed: "Astrologers की सूची लोड नहीं हुई। Internet connection जांचें और फिर कोशिश करें।",
    tryAgain: "फिर कोशिश करें",
    loading: "Astrologers लोड हो रहे हैं",
    topics: "विषय के अनुसार चुनें",
    availability: { online: "Online", busy: "Busy", offline: "Offline" } satisfies Record<Availability, string>,
    years: (n: number) => `${n} yrs`,
    rating: "Rating",
    free: "मुफ़्त",
    perMin: "/min",
    chat: "Chat करें",
  },
  en: {
    failed: "Could not load the list of astrologers. Check your internet connection and try again.",
    tryAgain: "Try again",
    loading: "Loading astrologers",
    topics: "Choose by topic",
    availability: { online: "Online", busy: "Busy", offline: "Offline" },
    years: (n) => (n === 1 ? "1 yr" : `${n} yrs`),
    rating: "Rating",
    free: "Free",
    perMin: "/min",
    chat: "Chat",
  },
});

const DOT: Record<Availability, string> = { online: "bg-online", busy: "bg-busy", offline: "bg-offline" };

/** Astrologers (live from the public list, online first) under the design's topic tabs; a tab keeps those whose expertise mentions the topic. */
export default function AstrologerShowcase() {
  const { list, failed, retry } = useAstrologerDirectory();
  const t = useT(text);
  const s = useT(ASTRO_SAMPLE);
  const [tab, setTab] = useState(0);

  const shown = list ? list.filter((a) => !TOPIC_WORDS[tab] || TOPIC_WORDS[tab].test(a.expertise.join(" "))).slice(0, SHOWN) : [];

  return (
    <section aria-labelledby="astro-title" className="border-y border-line bg-surface-card py-16 md:py-[104px]">
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p lang="hi" className="font-display mb-2.5 text-sm font-medium tracking-[0.02em] text-brand-strong">{s.kicker}</p>
            <h2 id="astro-title" className="font-display text-[1.75rem] font-semibold leading-[1.2] tracking-[-0.02em] text-ink md:text-[38px]">
              {s.title}
            </h2>
            <p className="mt-3.5 max-w-[560px] text-[17px] leading-[1.65] text-ink-soft">{s.lead}</p>
          </div>
          <Link
            href="/astrologers"
            className="button-md hidden h-[52px] items-center justify-center rounded-[14px] border-[1.5px] border-ink px-[26px] font-bold text-ink transition-colors hover:bg-surface-inverse hover:text-ink-inverse md:inline-flex"
          >
            {s.seeAll}
          </Link>
        </Reveal>

        <div role="tablist" aria-label={t.topics} className="-mx-4 mb-8 mt-9 flex gap-1.5 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0">
          {s.topics.map((label, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={tab === i}
              onClick={() => setTab(i)}
              className={`button-sm -mb-px h-12 shrink-0 whitespace-nowrap border-b-[3px] px-[18px] font-bold transition-colors ${
                tab === i ? "border-brand text-ink" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {failed ? (
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
        ) : list === null ? (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label={t.loading}>
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i} aria-hidden className="h-[420px] animate-pulse rounded-[28px] bg-surface-sunken" />
            ))}
          </ul>
        ) : shown.length === 0 ? (
          <p className="p-10 text-center text-ink-soft">{s.empty}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((a) => (
              <li key={a.id}>
                <Card a={a} />
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/astrologers"
          className="button-sm mt-8 inline-flex w-fit items-center gap-2 rounded-xl border border-ink px-4 py-3 text-ink transition hover:bg-surface-sunken motion-safe:active:scale-98 md:hidden"
        >
          {s.seeAll}
          <PiArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

const ART = (
  <svg aria-hidden viewBox="0 0 200 210" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full opacity-35">
    <circle cx="100" cy="105" r="80" fill="none" stroke="#FFAE00" />
    <circle cx="100" cy="105" r="56" fill="none" stroke="#FFAE00" strokeDasharray="3 5" />
    <path d="M100 25v160M20 105h160" stroke="#FFAE00" strokeOpacity=".5" />
  </svg>
);

function Card({ a }: { a: Astrologer }) {
  const t = useT(text);
  const lang = contentLang(a.name);
  return (
    <Link
      href={`/astrologers/${encodeURIComponent(a.id)}`}
      className="group flex h-full flex-col rounded-b-[22px] rounded-t-[180px] border border-line bg-surface-card px-[22px] pb-6 pt-[22px] transition motion-safe:hover:-translate-y-1.5 hover:shadow-[0_22px_44px_rgba(20,33,61,0.12)]"
    >
      <span className="relative block aspect-[1/1.05] overflow-hidden rounded-b-[14px] rounded-t-[160px] bg-surface-inverse">
        {ART}
        {a.photo ? (
          <Image src={a.photo} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover object-top" />
        ) : (
          <span aria-hidden lang={lang} className="font-display absolute inset-0 grid place-items-center text-5xl font-semibold tracking-[-0.02em] text-brand-on-inverse">
            {a.name.trim().slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-3 mx-auto flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-card px-3 py-[5px] text-xs font-extrabold text-ink">
          <span aria-hidden className={`h-2 w-2 rounded-full ${DOT[a.availability]}`} />
          {t.availability[a.availability]}
        </span>
      </span>
      <span className="flex flex-1 flex-col items-center gap-2.5 pt-2.5 text-center">
        <span lang={lang} className="font-display mt-1.5 block max-w-full truncate text-lg font-semibold capitalize leading-[1.3] tracking-[-0.01em] text-ink">
          {a.name}
        </span>
        <span lang={contentLang(a.expertise.join(" "))} className="block min-h-4 max-w-full truncate text-[13px] text-ink-soft">
          {a.expertise.slice(0, 3).join(" · ")}
        </span>
        <span className="flex w-full flex-wrap items-center justify-center gap-x-3.5 gap-y-1 border-y border-line py-2.5 text-[13px] font-semibold text-ink">
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
        <span className="text-sm text-ink">
          {a.chat.hasOffer && <s className="mr-1.5 text-sm font-medium text-ink-muted">₹{a.chat.rate}</s>}
          {a.chat.price === 0 ? t.free : <><b className="text-lg font-bold">₹{a.chat.price}</b>{t.perMin}</>}
        </span>
        <span className="button-sm mt-1 grid h-11 w-full place-items-center rounded-xl bg-surface-inverse text-ink-inverse transition-colors group-hover:bg-surface-inverse-raised">{t.chat}</span>
      </span>
    </Link>
  );
}
