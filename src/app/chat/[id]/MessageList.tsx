"use client";

import { useLayoutEffect, useRef } from "react";
import { PiArrowClockwise, PiCheck, PiChecks, PiClock, PiWarningCircle } from "react-icons/pi";
import type { ChatMessage } from "@/lib/services/chat";

const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

function dayLabel(ms: number, now: number) {
  const d = new Date(ms).toDateString();
  if (d === new Date(now).toDateString()) return "आज";
  if (d === new Date(now - 86_400_000).toDateString()) return "कल";
  return dayFormat.format(new Date(ms));
}

const RANK: Record<string, number> = { sent: 1, delivered: 2, seen: 3, read: 3 };

function Ticks({ m }: { m: ChatMessage }) {
  if (m.local === "sending") return <PiClock className="h-4 w-4" aria-label="भेजा जा रहा है" />;
  if (m.local === "failed") return <PiWarningCircle className="h-4 w-4 text-danger" aria-label="नहीं भेजा जा सका" />;
  const rank = RANK[String(m.status || "sent").toLowerCase()] ?? 1;
  if (rank >= 3) return <PiChecks className="h-4 w-4 text-brand-strong" aria-label="पढ़ा गया" />;
  if (rank === 2) return <PiChecks className="h-4 w-4" aria-label="पहुंच गया" />;
  return <PiCheck className="h-4 w-4" aria-label="भेजा गया" />;
}

function Body({ m, mine }: { m: ChatMessage; mine: boolean }) {
  const type = String(m.type).toLowerCase();
  if (type === "image")
    return (
      <a href={m.message} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- chat photos live on the backend's media host */}
        <img src={m.message} alt={mine ? "आपकी भेजी तस्वीर" : "ज्योतिषी की भेजी तस्वीर"} loading="lazy" className="max-h-72 w-full max-w-64 object-cover" />
      </a>
    );
  if (type === "audio" || type === "recording")
    return <audio controls preload="none" src={m.message} className="w-64 max-w-full" aria-label="Voice note" />;
  if (type === "video") return <video controls preload="metadata" src={m.message} className="max-h-72 w-full max-w-64 rounded-xl" />;
  if (type !== "text") return <p className="body-6 italic text-ink-muted">यह संदेश यहां नहीं दिख सकता।</p>;
  return <p className="body-6 whitespace-pre-wrap break-words">{m.message}</p>;
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
  const scroller = useRef<HTMLDivElement>(null);
  const anchor = useRef<{ height: number; top: number } | null>(null);
  const lastKey = useRef<string | null>(null);

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

  const days = messages.map((m) => dayLabel(m.sentTs, now));

  return (
    <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-4 md:px-6" aria-live="polite" aria-relevant="additions">
      {hasOlder && (
        <button
          type="button"
          onClick={loadOlder}
          disabled={loadingOlder}
          className="button-sm mx-auto rounded-full border border-line-strong bg-surface-card px-3 py-1 text-ink-soft transition hover:bg-surface-sunken active:scale-98 disabled:opacity-60"
        >
          {loadingOlder ? "लोड हो रहे हैं…" : "पुराने संदेश देखें"}
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
                <span className="sr-only">{mine ? "आप:" : `${peerName}:`}</span>
                {m.repliedTo?.message && (
                  <p className="caption-5 line-clamp-2 rounded-xl bg-surface-page/70 px-2 py-1 text-ink-soft">{m.repliedTo.message}</p>
                )}
                <Body m={m} mine={mine} />
                <span className={`caption-5 flex items-center gap-1 self-end ${mine ? "text-ink-soft" : "text-ink-muted"}`}>
                  {timeFormat.format(new Date(m.sentTs))}
                  {mine && <Ticks m={m} />}
                </span>
                {m.local === "failed" && (
                  <span className="caption-5 flex flex-wrap items-center gap-2 text-danger">
                    {m.error || "नहीं भेजा जा सका।"}
                    {m.retry && (
                      <button
                        type="button"
                        onClick={() => onRetry(m)}
                        className="button-xsm inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-ink transition hover:bg-surface-sunken"
                      >
                        <PiArrowClockwise className="h-3 w-3" aria-hidden />
                        फिर से भेजें
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
          {peerName} लिख रहे हैं…
        </p>
      )}
    </div>
  );
}
