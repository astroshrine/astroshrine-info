"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { PiArrowClockwise, PiCheck, PiChecks, PiClock, PiWarningCircle } from "react-icons/pi";
import WithName from "@/components/consult/WithName";
import { INTL_LOCALE, LOCALES, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { contentLang } from "@/lib/services/astrologerModel";
import type { ChatMessage } from "@/lib/services/chat";

const text = defineMessages({
  hi: {
    today: "आज",
    yesterday: "कल",
    ticks: { sending: "भेजा जा रहा है", failed: "नहीं भेजा जा सका", read: "पढ़ा गया", delivered: "पहुंच गया", sent: "भेजा गया" },
    myPhoto: "आपकी भेजी तस्वीर",
    theirPhoto: "ज्योतिषी की भेजी तस्वीर",
    voiceNote: "Voice note",
    unsupported: "यह संदेश यहां नहीं दिख सकता।",
    loadingOlder: "लोड हो रहे हैं…",
    older: "पुराने संदेश देखें",
    you: "आप:",
    sender: (name: string) => `${name}:`,
    notSent: "नहीं भेजा जा सका।",
    sendAgain: "फिर से भेजें",
    typing: (name: string) => `${name} लिख रहे हैं…`,
  },
  en: {
    today: "Today",
    yesterday: "Yesterday",
    ticks: { sending: "Sending", failed: "Not sent", read: "Read", delivered: "Delivered", sent: "Sent" },
    myPhoto: "Photo you sent",
    theirPhoto: "Photo from the astrologer",
    voiceNote: "Voice note",
    unsupported: "This message cannot be shown here.",
    loadingOlder: "Loading…",
    older: "See older messages",
    you: "You:",
    sender: (name) => `${name}:`,
    notSent: "Not sent.",
    sendAgain: "Send again",
    typing: (name) => `${name} is typing…`,
  },
});

type Text = (typeof text)["hi"];

/** Times read the same in both languages; day separators carry the month in the page's language. */
const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
const DAY_FORMAT = Object.fromEntries(
  LOCALES.map((l) => [l, new Intl.DateTimeFormat(INTL_LOCALE[l], { day: "numeric", month: "long", year: "numeric" })]),
) as Record<Locale, Intl.DateTimeFormat>;

function dayLabel(ms: number, now: number, t: Text, locale: Locale) {
  const d = new Date(ms).toDateString();
  if (d === new Date(now).toDateString()) return t.today;
  if (d === new Date(now - 86_400_000).toDateString()) return t.yesterday;
  return DAY_FORMAT[locale].format(new Date(ms));
}

const RANK: Record<string, number> = { sent: 1, delivered: 2, seen: 3, read: 3 };

function Ticks({ m }: { m: ChatMessage }) {
  const t = useT(text).ticks;
  if (m.local === "sending") return <PiClock className="h-4 w-4" aria-label={t.sending} />;
  if (m.local === "failed") return <PiWarningCircle className="h-4 w-4 text-danger" aria-label={t.failed} />;
  const rank = RANK[String(m.status || "sent").toLowerCase()] ?? 1;
  if (rank >= 3) return <PiChecks className="h-4 w-4 text-brand-strong" aria-label={t.read} />;
  if (rank === 2) return <PiChecks className="h-4 w-4" aria-label={t.delivered} />;
  return <PiCheck className="h-4 w-4" aria-label={t.sent} />;
}

function Body({ m, mine, onMediaLoad }: { m: ChatMessage; mine: boolean; onMediaLoad: () => void }) {
  const t = useT(text);
  const type = String(m.type).toLowerCase();
  if (type === "image")
    return (
      <a href={m.message} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- chat photos live on the backend's media host */}
        <img
          src={m.message}
          alt={mine ? t.myPhoto : t.theirPhoto}
          loading="lazy"
          onLoad={onMediaLoad}
          className="max-h-72 w-full max-w-64 object-cover"
        />
      </a>
    );
  if (type === "audio" || type === "recording")
    return <audio controls preload="none" src={m.message} className="w-64 max-w-full" aria-label={t.voiceNote} />;
  if (type === "video")
    return <video controls preload="metadata" src={m.message} onLoadedMetadata={onMediaLoad} className="max-h-72 w-full max-w-64 rounded-xl" />;
  if (type !== "text") return <p className="body-6 italic text-ink-muted">{t.unsupported}</p>;
  return (
    <p lang={contentLang(m.message)} className="body-6 whitespace-pre-wrap break-words">
      {m.message}
    </p>
  );
}

/**
 * The conversation, oldest at the top. Keeps the reading position when older messages load above, and
 * follows new messages only when the reader is already at the bottom (or sent it themselves).
 */
export default function MessageList({
  messages,
  selfId,
  peerName,
  peerTyping,
  hasOlder,
  loadingOlder,
  onLoadOlder,
  onRetry,
  now,
  empty,
}: {
  messages: ChatMessage[];
  selfId: string;
  peerName: string;
  peerTyping: boolean;
  hasOlder: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  onRetry: (m: ChatMessage) => void;
  now: number;
  empty: React.ReactNode;
}) {
  const t = useT(text);
  const locale = useLocale();
  const scroller = useRef<HTMLDivElement>(null);
  const anchor = useRef<{ height: number; top: number } | null>(null);
  const lastKey = useRef<string | null>(null);
  // Whether the reader is at the newest message (updated as they scroll).
  const atNewest = useRef(true);

  const onScroll = () => {
    const el = scroller.current;
    if (el) atNewest.current = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
  };

  // A photo or video grows its bubble once it has loaded. If the reader was at the newest message, keep it in
  // view, so opening a chat that ends with a photo still lands on the last message.
  const onMediaLoad = () => {
    const el = scroller.current;
    if (el && atNewest.current) el.scrollTop = el.scrollHeight;
  };

  // The list itself gets shorter or taller when a bar opens or closes beside it (the kundli notice, the
  // low-time warning, the composer growing to several lines). Its scroll position stays put, which would slide
  // the newest message out of view; keep it in view if the reader was there.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (atNewest.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    // Older messages were added above: stay on what was being read.
    if (anchor.current) {
      el.scrollTop = el.scrollHeight - anchor.current.height + anchor.current.top;
      anchor.current = null;
      return;
    }
    const last = messages[messages.length - 1];
    if (!last || last.key === lastKey.current) return;
    const firstPaint = lastKey.current === null;
    lastKey.current = last.key;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    if (firstPaint || nearBottom || last.sentBy === selfId) el.scrollTop = el.scrollHeight;
  }, [messages, selfId]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && peerTyping && el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTop = el.scrollHeight;
  }, [peerTyping]);

  const loadOlder = () => {
    const el = scroller.current;
    if (el) anchor.current = { height: el.scrollHeight, top: el.scrollTop };
    onLoadOlder();
  };

  const days = messages.map((m) => dayLabel(m.sentTs, now, t, locale));

  return (
    // relative: the screen-reader labels (sr-only, absolutely positioned) are then placed and clipped inside this
    // scroll box. Without it they escape it, and a long conversation stretches the whole page below the chat.
    <div
      ref={scroller}
      onScroll={onScroll}
      className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-4 md:px-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      {hasOlder && (
        <button
          type="button"
          onClick={loadOlder}
          disabled={loadingOlder}
          className="button-sm mx-auto rounded-full border border-line-strong bg-surface-card px-3 py-1 text-ink-soft transition hover:bg-surface-sunken active:scale-98 disabled:opacity-60"
        >
          {loadingOlder ? t.loadingOlder : t.older}
        </button>
      )}

      {messages.length === 0 && empty}

      {messages.map((m, i) => {
        const mine = m.sentBy === selfId;
        const day = days[i];
        const showDay = i === 0 || day !== days[i - 1];
        return (
          <div key={m.key} className="flex flex-col gap-2">
            {showDay && (
              <p className="caption-4 mx-auto rounded-full bg-surface-sunken px-3 py-1 text-ink-soft" role="separator">
                {day}
              </p>
            )}
            <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex max-w-[85%] flex-col gap-1 rounded-2xl px-3 py-2 md:max-w-[70%] ${
                  mine ? "bg-brand-soft text-ink" : "border border-line bg-surface-card text-ink"
                } ${m.local === "failed" ? "ring-1 ring-danger" : ""}`}
              >
                <span className="sr-only">{mine ? t.you : <WithName text={t.sender(peerName)} name={peerName} />}</span>
                {m.repliedTo?.message && (
                  <p lang={contentLang(m.repliedTo.message)} className="caption-5 line-clamp-2 rounded-xl bg-surface-page/70 px-2 py-1 text-ink-soft">
                    {m.repliedTo.message}
                  </p>
                )}
                <Body m={m} mine={mine} onMediaLoad={onMediaLoad} />
                <span className={`caption-5 flex items-center gap-1 self-end ${mine ? "text-ink-soft" : "text-ink-muted"}`}>
                  {timeFormat.format(new Date(m.sentTs))}
                  {mine && <Ticks m={m} />}
                </span>
                {m.local === "failed" && (
                  <span className="caption-5 flex flex-wrap items-center gap-2 text-danger">
                    {m.error || t.notSent}
                    {m.retry && (
                      <button
                        type="button"
                        onClick={() => onRetry(m)}
                        className="button-xsm inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-ink transition hover:bg-surface-sunken"
                      >
                        <PiArrowClockwise className="h-3 w-3" aria-hidden />
                        {t.sendAgain}
                      </button>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {peerTyping && (
        <p className="caption-5 flex items-center gap-2 text-ink-muted" role="status">
          <span aria-hidden className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-muted" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-muted [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-muted [animation-delay:300ms]" />
          </span>
          <WithName text={t.typing(peerName)} name={peerName} />
        </p>
      )}
    </div>
  );
}
