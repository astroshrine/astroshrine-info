"use client";

import Image from "next/image";
import { PiChatCircleDotsFill, PiSealCheckFill, PiStarFill } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import type { Astrologer, Availability } from "@/lib/endpoints";
import { contentLang } from "@/lib/services/astrologerModel";

const DOT: Record<Availability, string> = { online: "bg-online", busy: "bg-busy", offline: "bg-offline" };

const text = defineMessages({
  hi: {
    availability: { online: "Online", busy: "Busy", offline: "Offline" } satisfies Record<Availability, string>,
    years: (n: number) => `${n} yrs`,
    rating: "Rating",
    was: "पहले ",
    free: "मुफ़्त",
    perMin: (price: number) => `₹${price}/min`,
    verified: "Verified",
    chat: "Chat",
  },
  en: {
    availability: { online: "Online", busy: "Busy", offline: "Offline" },
    years: (n) => (n === 1 ? "1 yr" : `${n} yrs`),
    rating: "Rating",
    was: "Was ",
    free: "Free",
    perMin: (price) => `₹${price}/min`,
    verified: "Verified",
    chat: "Chat",
  },
});

/** One astrologer from the public list, linking to their profile page. Styled like the Android app's cards. */
export default function AstrologerCard({ astrologer: a }: { astrologer: Astrologer }) {
  const t = useT(text);
  const meta = [...a.expertise.slice(0, 2), a.experience ? t.years(a.experience) : null].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/astrologers/${encodeURIComponent(a.id)}`}
      className="group flex h-full items-center gap-4 rounded-card border border-line bg-surface-card p-4 shadow-card transition motion-safe:hover:-translate-y-0.5 hover:border-line-strong motion-safe:active:scale-98"
    >
      <span className="relative shrink-0">
        {a.photo ? (
          <Image src={a.photo} alt="" width={56} height={56} className="h-14 w-14 rounded-full object-cover ring-[3px] ring-brand ring-offset-2 ring-offset-surface-card" />
        ) : (
          <span aria-hidden lang={contentLang(a.name)} className="title-3 grid h-14 w-14 place-items-center rounded-full bg-surface-sunken font-bold text-ink ring-[3px] ring-brand ring-offset-2 ring-offset-surface-card">
            {a.name.charAt(0).toUpperCase()}
          </span>
        )}
        <span aria-hidden className={`absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-surface-card ${DOT[a.availability]}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1">
          <span lang={contentLang(a.name)} className="title-4 truncate font-bold capitalize text-ink">
            {a.name}
          </span>
          <PiSealCheckFill className="h-4 w-4 shrink-0 text-brand" aria-label={t.verified} />
        </span>
        {meta && <span className="caption-5 block truncate text-ink-soft">{meta}</span>}
        <span className="caption-4 mt-1 flex items-center gap-2 text-ink-soft">
          {a.rating !== null && (
            <>
              <span className="inline-flex items-center gap-1">
                <PiStarFill className="h-4 w-4 text-brand" aria-hidden />
                <span className="sr-only">{t.rating}</span>
                {a.rating.toFixed(1)}
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          <span>
            {a.chat.hasOffer && (
              <s className="mr-1 text-ink-muted">
                <span className="sr-only">{t.was}</span>₹{a.chat.rate}
              </s>
            )}
            {a.chat.price === 0 ? t.free : t.perMin(a.chat.price)}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={`caption-4 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-bold ${
            a.availability === "online" ? "bg-success-soft text-success" : a.availability === "busy" ? "bg-surface-sunken text-brand-strong" : "bg-neutral-soft text-neutral"
          }`}
        >
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOT[a.availability]}`} />
          {t.availability[a.availability]}
        </span>
        <span aria-hidden className="button-xsm inline-flex h-8 items-center gap-1 rounded-input bg-brand px-3 text-brand-ink transition group-hover:bg-brand-hover">
          <PiChatCircleDotsFill className="h-3.5 w-3.5" />
          {t.chat}
        </span>
      </span>
    </Link>
  );
}

/** Loading placeholder shaped like AstrologerCard (B9: skeletons, not spinners). */
export function AstrologerCardSkeleton() {
  return (
    <div aria-hidden className="flex items-center gap-4 rounded-card border border-line bg-surface-card p-4 shadow-card">
      <span className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-surface-sunken" />
      <span className="flex flex-1 flex-col gap-2">
        <span className="h-4 w-2/3 animate-pulse rounded-sm bg-surface-sunken" />
        <span className="h-3 w-1/2 animate-pulse rounded-sm bg-surface-sunken" />
        <span className="h-3 w-1/3 animate-pulse rounded-sm bg-surface-sunken" />
      </span>
    </div>
  );
}
