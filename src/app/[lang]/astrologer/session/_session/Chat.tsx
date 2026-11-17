"use client";

import { useState } from "react";
import { PiClock, PiInfo, PiPaperPlaneTilt, PiWarningCircle } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { formatClock, isPackOpen, MAX_TEXT, packEnded, type ChatMessage } from "@/lib/services/chat";
import { Button, Card, Pill } from "../../_console/ui";
import { text } from "./messages";
import type { SendError, SessionChat } from "./useSessionChat";

const DEVANAGARI = /[ऀ-ॿ]/;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0])
    .join("")
    .toUpperCase();

/** The live chat with the customer: the pack's clock, the real thread and a reply box. */
export default function Chat({ chat, selfId, name, ppUrl }: { chat: SessionChat; selfId: string; name: string; ppUrl?: string }) {
  const t = useT(text);
  const locale = useLocale();
  const [draft, setDraft] = useState("");
  const { pack } = chat;
  const open = !!pack && isPackOpen(pack.status) && !pack.expired && !packEnded(pack);
  const waiting = pack?.status === "WAITING";
  const canSend = open && !waiting;
  const ended = !!pack && !open && !waiting;

  const submit = () => {
    const body = draft.trim().slice(0, MAX_TEXT);
    if (!body || !canSend) return;
    chat.send(body);
    chat.onTyping(false);
    setDraft("");
  };

  const time = (ts: number) => new Date(ts).toLocaleTimeString(locale === "hi" ? "hi-IN" : "en-IN", { hour: "numeric", minute: "2-digit" });
  const errorText = (e?: SendError) =>
    e === "contact" ? t.errContact : e === "noPack" ? t.errNoPack : e === "timeOver" ? t.errTimeOver : e === "tooLarge" ? t.errTooLarge : t.errOther;

  const clock =
    pack?.timeBased && open && !waiting ? (
      pack.paused ? (
        t.clockPaused
      ) : !pack.timerStarted ? (
        t.clockWaits
      ) : (
        t.timeLeft(formatClock(chat.secondsLeft))
      )
    ) : null;

  return (
    <Card aria-label={`${t.chatLabel}: ${name}`} className="flex h-[820px] flex-none flex-col overflow-hidden">
      <header className="flex flex-wrap items-center gap-x-3.5 gap-y-3 border-b border-line px-5 py-4">
        {ppUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ppUrl} alt="" className="h-[46px] w-[46px] flex-none rounded-full object-cover" />
        ) : (
          <div aria-hidden className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full bg-surface-sunken font-bold text-brand-strong">
            {initials(name) || "?"}
          </div>
        )}
        <div className="min-w-0 flex-[1_1_140px]">
          <div className="truncate text-[17px] font-bold">{name || t.customer}</div>
          <div className="text-sm text-ink-soft">{chat.peerTyping ? t.typing : t.customer}</div>
        </div>
        {clock && (
          <div className="flex items-center gap-2 rounded-[14px] bg-surface-sunken px-3 py-2">
            <PiClock className="h-[18px] w-[18px] shrink-0 text-brand-strong" />
            <span className={`${pack?.timerStarted && !pack.paused ? "font-display text-xl tabular-nums" : "text-sm"} font-bold leading-none`}>{clock}</span>
          </div>
        )}
        {open && !waiting && chat.elapsed !== null && <span className="text-sm font-bold tabular-nums text-success">{t.elapsed(formatClock(chat.elapsed))}</span>}
        {waiting && <Pill tone="amber">{t.stWaiting}</Pill>}
        {ended && <Pill tone="neutral">{pack?.expired ? t.timeUp : t.sessionEnded}</Pill>}
      </header>
      <div role="note" className="flex items-start gap-2.5 border-b border-[#F2D58A] bg-[#FFF7E3] px-[18px] py-2.5 text-[13.5px] leading-normal">
        <PiInfo className="mt-0.5 h-[17px] w-[17px] shrink-0 text-brand-strong" />
        <span>{pack === null ? t.noPack : waiting ? t.waitingPack : t.rule}</span>
      </div>
      <div aria-live="polite" className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto bg-surface-page px-5">
        <div className="flex flex-col gap-3.5 pb-3 pt-[18px]">
          {chat.hasOlder && (
            <button type="button" onClick={chat.loadOlder} disabled={chat.loadingOlder} className="cursor-pointer self-center rounded-full border border-line-strong bg-surface-card px-4 py-1.5 text-sm font-bold text-ink hover:bg-surface-sunken disabled:opacity-60">
              {chat.loadingOlder ? t.loading : t.earlier}
            </button>
          )}
          {chat.loadFailed && (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[14px] bg-danger-soft px-4 py-3 text-sm text-danger">
              {t.loadFailed}
              <button type="button" onClick={chat.reload} className="cursor-pointer font-bold underline">
                {t.retry}
              </button>
            </div>
          )}
          {!chat.loaded && !chat.loadFailed && (
            <div aria-busy="true" aria-label={t.loading} className="flex flex-col gap-3">
              {["w-1/2", "ml-auto w-2/5", "w-2/3"].map((w) => (
                <div key={w} className={`h-12 animate-pulse rounded-2xl bg-surface-sunken ${w}`} />
              ))}
            </div>
          )}
          {chat.loaded && chat.messages.length === 0 && <p className="m-0 py-10 text-center text-sm text-ink-soft">{t.empty}</p>}
          {chat.messages.map((m) => (
            <Bubble key={m.key} m={m} mine={m.sentBy === selfId} time={time(m.sentTs)} locale={locale} error={chat.sendFailures[m.key] ? errorText(chat.sendFailures[m.key]) : t.errOther} onRetry={() => chat.retry(m)} />
          ))}
          {chat.peerTyping && (
            <div role="status" aria-label={t.typing} className="flex items-center gap-[5px] self-start rounded-[18px] border border-line bg-surface-card px-4 py-3">
              {[0, 150, 300].map((d) => (
                <span key={d} className="inline-block h-[7px] w-[7px] animate-bounce rounded-full bg-brand-strong" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5 border-t border-line bg-surface-card px-[18px] pb-4 pt-3.5">
        <label htmlFor="msg" className="sr-only">
          {t.msgLabel}
        </label>
        <input
          id="msg"
          value={draft}
          disabled={!canSend}
          maxLength={MAX_TEXT}
          onChange={(e) => {
            setDraft(e.target.value);
            chat.onTyping(!!e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) submit();
          }}
          placeholder={t.placeholder}
          autoComplete="off"
          className="h-[52px] min-w-0 flex-1 rounded-[14px] border border-line-strong bg-surface-page px-4 text-base text-ink disabled:opacity-60"
        />
        <Button onClick={submit} disabled={!canSend || !draft.trim()} className="!h-[52px]">
          <PiPaperPlaneTilt className="h-[17px] w-[17px] text-brand" />
          {t.send}
        </Button>
      </div>
    </Card>
  );
}

function Bubble({ m, mine, time, locale, error, onRetry }: { m: ChatMessage; mine: boolean; time: string; locale: string; error: string; onRetry: () => void }) {
  const t = useT(text);
  // The customer may write Hindi on the English site: tell the browser so it picks a Devanagari font.
  const lang = locale === "en" && m.type === "text" && DEVANAGARI.test(m.message) ? "hi" : undefined;
  const box = mine ? "self-end rounded-[18px_18px_6px_18px] bg-[#FFE29A]" : "self-start rounded-[18px_18px_18px_6px] border border-line bg-surface-card";
  return (
    <div className={`motion-safe:animate-reveal-down max-w-[82%] ${box} px-4 py-3 text-base leading-[1.55]`}>
      {m.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.message} alt={t.photo} className="max-h-72 max-w-full rounded-xl" />
      ) : m.type === "text" ? (
        <span lang={lang} className="whitespace-pre-wrap break-words">
          {m.message}
        </span>
      ) : (
        <a href={m.message} target="_blank" rel="noreferrer" className="font-bold underline">
          {m.type}
        </a>
      )}
      <div className={`mt-1 flex items-center gap-1.5 text-xs ${mine ? "justify-end text-[#5C3D00]" : "text-ink-soft"}`}>
        {m.local === "sending" ? t.sending : m.local === "failed" ? null : time}
        {mine && !m.local && m.status && <span aria-hidden>{m.status === "seen" || m.status === "read" ? "✓✓" : m.status === "delivered" ? "✓✓" : "✓"}</span>}
      </div>
      {m.local === "failed" && (
        <div role="alert" className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-danger">
          <PiWarningCircle className="h-4 w-4" />
          {error}
          {m.retry && (
            <button type="button" onClick={onRetry} className="cursor-pointer underline">
              {t.retryMsg}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
