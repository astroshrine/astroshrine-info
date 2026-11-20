"use client";

import { useEffect } from "react";
import { PiArrowClockwise, PiCalendarCheck, PiChatCircleDots, PiPhone } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { secondaryButton } from "@/components/consult/Dialog";
import { INTL_LOCALE, LOCALES, type Locale } from "@/i18n/config";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { BOOKING_UTC_OFFSET, clockLabel, type Booking } from "@/lib/services/bookings";

/** Signed-out visitors go to the login page and come back here (the wallet page does the same). */
export function useRequireSignIn() {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "signedOut") router.replace(`/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
  }, [status, router]);
  return status === "signedIn";
}

const text = defineMessages({
  hi: { retry: "फिर से कोशिश करें", loading: "लोड हो रहा है", voice: "वॉइस कॉल", chat: "चैट" },
  en: { retry: "Try again", loading: "Loading", voice: "Voice call", chat: "Chat" },
});

export function PageFrame({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  return <div className={`mx-auto flex w-full flex-col gap-6 px-4 py-8 md:px-8 lg:py-12 ${narrow ? "max-w-3xl" : "max-w-5xl"}`}>{children}</div>;
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  const t = useT(text);
  return (
    <ul aria-busy="true" aria-label={t.loading} className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="h-28 animate-pulse rounded-2xl bg-surface-sunken" />
      ))}
    </ul>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useT(text);
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface-card p-6">
      <p className="body-5 text-ink">{message}</p>
      <button type="button" onClick={onRetry} className={secondaryButton}>
        <PiArrowClockwise className="h-4 w-4" aria-hidden />
        {t.retry}
      </button>
    </div>
  );
}

export function EmptyState({ icon, title, body, children }: { icon?: React.ReactNode; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface-card p-8 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-sunken text-brand-strong">{icon ?? <PiCalendarCheck className="h-7 w-7" aria-hidden />}</span>
      <h2 className="heading-6 text-ink">{title}</h2>
      <p className="body-6 max-w-md text-ink-soft">{body}</p>
      {children}
    </div>
  );
}

// ─── Dates and times, in booking time (India), in the page's language ────────────────────────────

const instant = (date: string) => new Date(`${date}T00:00:00${BOOKING_UTC_OFFSET}`);
const fmt = (options: Intl.DateTimeFormatOptions) =>
  Object.fromEntries(LOCALES.map((l) => [l, new Intl.DateTimeFormat(INTL_LOCALE[l], { timeZone: "Asia/Kolkata", ...options })])) as Record<Locale, Intl.DateTimeFormat>;
const LONG = fmt({ weekday: "long", day: "numeric", month: "long" });
const SHORT = fmt({ weekday: "short", day: "numeric", month: "short" });
const WEEKDAY = fmt({ weekday: "short" });
const DAYNUM = fmt({ day: "numeric", month: "short" });

export const longDate = (date: string, locale: Locale) => LONG[locale].format(instant(date));
export const shortDate = (date: string, locale: Locale) => SHORT[locale].format(instant(date));
export const weekdayOf = (date: string, locale: Locale) => WEEKDAY[locale].format(instant(date));
export const dayMonthOf = (date: string, locale: Locale) => DAYNUM[locale].format(instant(date));

export function whenLabel(b: Pick<Booking, "date" | "start" | "end">, locale: Locale) {
  return `${shortDate(b.date, locale)} · ${clockLabel(b.start)}`;
}

export function ChannelBadge({ channel }: { channel: "call" | "chat" }) {
  const t = useT(text);
  const Icon = channel === "call" ? PiPhone : PiChatCircleDots;
  return (
    <span className="caption-4 inline-flex w-fit items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-ink-soft">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {channel === "call" ? t.voice : t.chat}
    </span>
  );
}
