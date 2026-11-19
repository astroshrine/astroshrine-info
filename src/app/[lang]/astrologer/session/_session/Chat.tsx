"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PiCheckCircle, PiClock, PiInfo, PiLightning, PiTimer, PiPaperPlaneTilt, PiWarningCircle } from "react-icons/pi";
import VoiceNoteButton from "@/components/VoiceNoteButton";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { formatClock, isPackOpen, MAX_TEXT, packEnded, type ChatMessage } from "@/lib/services/chat";
import { Button, Card, Pill } from "../../_console/ui";
import { dt } from "./design";
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
/** The running clock as the design shows it: "02:50 of 5 min". Null when the chat has no clock to show. */
export function clockParts(chat: SessionChat) {
  const { pack } = chat;
  if (!pack?.timeBased || !isPackOpen(pack.status) || pack.expired || packEnded(pack) || pack.status === "WAITING" || pack.paused) return null;
  const elapsed = pack.timerStarted ? (chat.elapsed ?? 0) : 0;
  const total = pack.timerStarted ? elapsed + chat.secondsLeft : pack.secondsAllowed || 0;
  const pad = formatClock(elapsed).replace(/^(\d):/, "0$1:");
  return { time: pad, minutes: Math.max(1, Math.round(total / 60)) };
}

export default function Chat({ chat, selfId, name, ppUrl, place, kundliShared }: { chat: SessionChat; selfId: string; name: string; ppUrl?: string; place: string; kundliShared: boolean }) {
  const t = useT(text);
  const d = useT(dt);
  const locale = useLocale();
  const [draft, setDraft] = useState("");
  // While a voice note is recording, its bar takes the reply row.
  const [recording, setRecording] = useState(false);
  const onRecordingChange = useCallback((on: boolean) => setRecording(on), []);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const box = useRef<HTMLInputElement>(null);
  const { pack } = chat;
  const open = !!pack && isPackOpen(pack.status) && !pack.expired && !packEnded(pack);
  const waiting = pack?.status === "WAITING";
  const canSend = open && !waiting;
  const ended = !!pack && !open && !waiting;

  // Cursor in the reply box when the chat opens and whenever sending becomes possible again (not on touch screens).
  useEffect(() => {
    if (!canSend) return;
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) box.current?.focus({ preventScroll: true });
  }, [canSend]);

  const submit = () => {
    const body = draft.trim().slice(0, MAX_TEXT);
    if (!body || !canSend) return;
    chat.send(body);
    chat.onTyping(false);
    setDraft("");
    box.current?.focus({ preventScroll: true });
  };

  const time = (ts: number) => new Date(ts).toLocaleTimeString(locale === "hi" ? "hi-IN" : "en-IN", { hour: "numeric", minute: "2-digit" });
  const errorText = (e?: SendError) =>
    e === "contact" ? t.errContact : e === "noPack" ? t.errNoPack : e === "timeOver" ? t.errTimeOver : e === "tooLarge" ? t.errTooLarge : t.errOther;

  const parts = clockParts(chat);
  const pausedNote = pack?.timeBased && open && !waiting && pack.paused ? t.clockPaused : null;

  return (
    <Card id="chatbox" aria-label={`${t.chatLabel}: ${name}`} className="flex max-h-[1100px] min-h-[860px] flex-[1_1_auto] flex-col overflow-hidden">
      <header className="border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          {ppUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ppUrl} alt="" className="h-[46px] w-[46px] flex-none rounded-full object-cover" />
          ) : (
            <div aria-hidden className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full bg-surface-sunken font-bold text-brand-strong">
              {initials(name) || "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[17px] font-bold">{d.chatWho((name || t.customer).split(/\s+/)[0], place)}</div>
            <div className="text-[13.5px] text-ink-soft">{chat.peerTyping ? t.typing : t.customer}</div>
          </div>
          {parts && (
            <div className="flex flex-none items-center gap-2 rounded-[14px] bg-surface-sunken px-3 py-2">
              <PiClock className="h-[18px] w-[18px] shrink-0 text-brand-strong" aria-hidden />
              <span className="font-display text-xl font-bold leading-none tabular-nums">{parts.time}</span>
              <span className="whitespace-nowrap text-[12.5px] text-brand-strong">{d.of(parts.minutes)}</span>
            </div>
          )}
          {pausedNote && <span className="flex-none rounded-[14px] bg-surface-sunken px-3 py-2 text-sm font-bold">{pausedNote}</span>}
          {waiting && <Pill tone="amber">{t.stWaiting}</Pill>}
          {ended && <Pill tone="neutral">{pack?.expired ? t.timeUp : t.sessionEnded}</Pill>}
        </div>
        {kundliShared && (
          <div className="mt-2.5 flex items-center justify-between gap-2.5 text-[13.5px]">
            <span className="text-ink-soft">{d.kundliShared}</span>
          </div>
        )}
      </header>
      <div role="note" className="flex items-start gap-2.5 border-b border-[#F2D58A] bg-[#FFF7E3] px-[18px] py-2.5 text-[13.5px] leading-normal">
        <PiInfo className="mt-0.5 h-[17px] w-[17px] shrink-0 text-brand-strong" />
        <span>{pack === null ? t.noPack : waiting ? t.waitingPack : t.rule}</span>
      </div>
      {(chat.extendReq || chat.extendError || chat.extendDone) && (
        <div role={chat.extendReq ? "alertdialog" : "status"} aria-label={t.extTitle} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-brand bg-[#FFF1CC] px-[18px] py-3">
          {chat.extendReq ? (
            <>
              <PiTimer className="h-6 w-6 shrink-0 text-brand-strong" aria-hidden />
              <div className="min-w-0 flex-[1_1_220px]">
                <div className="text-[15px] font-bold">{t.extTitle}</div>
                <div className="text-[13.5px] leading-normal text-ink-soft">{t.extBody(chat.extendReq.minutes, chat.extendReq.cost)}</div>
                {chat.extendError && (
                  <div role="alert" className="mt-1 flex items-center gap-1.5 text-[13.5px] font-bold text-danger">
                    <PiWarningCircle className="h-4 w-4 shrink-0" aria-hidden />
                    {chat.extendError === "noBalance" ? t.extNoBalance : t.extOther}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => chat.answerExtend(true)} disabled={!!chat.extendBusy}>
                  {chat.extendBusy === "accept" ? t.extWorking : t.extAccept}
                </Button>
                <Button size="sm" variant="line" onClick={() => chat.answerExtend(false)} disabled={!!chat.extendBusy}>
                  {chat.extendBusy === "decline" ? t.extWorking : t.extDecline}
                </Button>
              </div>
            </>
          ) : chat.extendError ? (
            <p className="m-0 flex items-center gap-2 text-[14px] font-bold text-danger">
              <PiWarningCircle className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {chat.extendError === "expired" ? t.extExpired : chat.extendError === "answered" ? t.extAnswered : chat.extendError === "noBalance" ? t.extNoBalance : t.extOther}
            </p>
          ) : (
            <p className="m-0 flex items-center gap-2 text-[14px] font-bold text-success">
              <PiCheckCircle className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {chat.extendDone === "accepted" ? t.extAccepted : t.extDeclined}
            </p>
          )}
        </div>
      )}
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
      <div role="group" aria-label={d.qrTitle} className="border-t border-line bg-surface-card px-4 pt-2.5">
        <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-brand-strong">
          <PiLightning className="h-[13px] w-[13px]" aria-hidden />
          {d.qrTitle} <span className="font-medium text-ink-soft">· {d.qrSub}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {d.qr.map((q, i) => (
            <button
              key={q}
              type="button"
              title={q}
              disabled={!canSend}
              onClick={() => {
                setDraft(q);
                chat.onTyping(true);
                box.current?.focus({ preventScroll: true });
              }}
              className="h-[34px] cursor-pointer whitespace-nowrap rounded-full border border-[#F2D58A] bg-surface-sunken px-3 text-[13px] font-semibold text-ink transition hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-60"
            >
              {d.qrShort[i]}
            </button>
          ))}
        </div>
      </div>
      {voiceError && (
        <p role="alert" className="bg-surface-card px-4 pt-2 text-sm font-semibold text-danger">
          {voiceError}
        </p>
      )}
      <div className="flex items-center gap-2.5 bg-surface-card px-4 pb-4 pt-2.5">
        <VoiceNoteButton
          disabled={!canSend}
          onRecorded={chat.sendVoice}
          onActiveChange={onRecordingChange}
          onError={setVoiceError}
          buttonClassName="grid h-[52px] w-[52px] flex-none cursor-pointer place-items-center rounded-[14px] border border-line-strong bg-surface-page text-ink transition hover:bg-surface-sunken disabled:cursor-default disabled:opacity-60"
        />
        <label htmlFor="msg" className="sr-only">
          {t.msgLabel}
        </label>
        <input
          ref={box}
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
          data-hidden={recording}
          className="h-[52px] min-w-0 flex-1 rounded-[14px] data-[hidden=true]:hidden border border-line-strong bg-surface-page px-4 text-base text-ink disabled:opacity-60"
        />
        <Button onClick={submit} disabled={!canSend || !draft.trim()} className={`!h-[52px] ${recording ? "!hidden" : ""}`}>
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
      ) : m.type === "audio" || m.type === "recording" ? (
        <audio controls preload="none" src={m.message} className="w-64 max-w-full" aria-label={t.voiceNote} />
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
