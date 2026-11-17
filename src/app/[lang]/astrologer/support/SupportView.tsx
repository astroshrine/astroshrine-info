"use client";

import { useEffect, useRef, useState } from "react";
import { PiPaperPlaneRight } from "react-icons/pi";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { getSupport, markSupportRead, sendSupport, SUPPORT_MAX, type SupportMessage } from "@/lib/services/astrologerHub";
import { Accent, Button, Card, fieldClass, Page, PageTitle } from "../_console/ui";
import { useAstrologer } from "../_console/useAstrologer";

const text = defineMessages({
  hi: {
    eyebrow: "सहायता",
    titleA: "AstroShrine ",
    titleB: "टीम से बात",
    sub: "भुगतान, खाते या ऐप की कोई भी समस्या यहाँ लिखें। टीम यहीं जवाब देती है।",
    loading: "बातचीत लोड हो रही है…",
    failed: "बातचीत नहीं खुल सकी।",
    retry: "फिर कोशिश करें",
    empty: "अभी कोई संदेश नहीं। अपना पहला संदेश नीचे लिखें।",
    you: "आप",
    team: "AstroShrine टीम",
    placeholder: "अपना संदेश लिखें…",
    send: "भेजें",
    sendFailed: "संदेश नहीं जा सका। फिर कोशिश करें।",
    count: (n: number) => `${n.toLocaleString("hi-IN")}/${SUPPORT_MAX.toLocaleString("hi-IN")}`,
    label: "संदेश",
  },
  en: {
    eyebrow: "Support",
    titleA: "Talk to the ",
    titleB: "AstroShrine team",
    sub: "Write about payments, your account or any problem with the app. The team replies here.",
    loading: "Loading the conversation…",
    failed: "Could not open the conversation.",
    retry: "Try again",
    empty: "No messages yet. Write your first one below.",
    you: "You",
    team: "AstroShrine team",
    placeholder: "Write your message…",
    send: "Send",
    sendFailed: "Could not send. Please try again.",
    count: (n) => `${n.toLocaleString("en-IN")}/${SUPPORT_MAX.toLocaleString("en-IN")}`,
    label: "Message",
  },
});

const POLL_MS = 15_000;
const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);

export default function SupportView() {
  const t = useT(text);
  const intl = INTL_LOCALE[useLocale()];
  const { id, status } = useAstrologer();
  const [state, setState] = useState<{ id: string; messages: SupportMessage[] } | "error" | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = useRef("");

  useEffect(() => {
    if (status !== "ready" || !id) return;
    const controller = new AbortController();
    const poll = (first: boolean) =>
      getSupport(id, controller.signal).then(
        (thread) => {
          setState({ id, messages: thread.messages });
          if (thread.unread > 0) markSupportRead(id).catch(() => {});
        },
        () => {
          if (first && !controller.signal.aborted) setState("error");
        },
      );
    void poll(true);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void poll(false);
    }, POLL_MS);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [id, status, attempt]);

  const messages = state && state !== "error" && state.id === id ? state.messages : null;
  useEffect(() => {
    const last = messages?.[messages.length - 1]?.id ?? "";
    if (last && last !== lastId.current) endRef.current?.scrollIntoView({ block: "end", behavior: lastId.current ? "smooth" : "auto" });
    lastId.current = last;
  }, [messages]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(false);
    try {
      const m = await sendSupport(id, body);
      setDraft("");
      setState((s) => (s && s !== "error" ? { ...s, messages: [...s.messages, m] } : s));
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  const when = (iso: string) => new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));

  return (
    <Page>
      <PageTitle
        eyebrow={t.eyebrow}
        title={
          <>
            {t.titleA}
            <Accent>{t.titleB}</Accent>
          </>
        }
        sub={t.sub}
      />
      {state === "error" ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-8" role="alert">
          <p className="text-danger">{t.failed}</p>
          <Button variant="line" size="sm" onClick={() => { setState(null); setAttempt((n) => n + 1); }}>
            {t.retry}
          </Button>
        </Card>
      ) : !messages ? (
        <Card className="p-8 text-ink-soft" role="status">
          {t.loading}
        </Card>
      ) : (
        <Card className="flex flex-col overflow-hidden">
          <div className="flex max-h-[55vh] min-h-[260px] flex-col gap-3 overflow-y-auto p-5 sm:p-6" aria-live="polite">
            {messages.length === 0 && <p className="m-auto text-center text-ink-soft">{t.empty}</p>}
            {messages.map((m) => {
              const mine = m.sender === "astrologer";
              return (
                <div key={m.id} className={mine ? "flex flex-col items-end" : "flex flex-col items-start"}>
                  <div
                    lang={hasDevanagari(m.body) ? "hi" : undefined}
                    className={`max-w-[85%] whitespace-pre-wrap break-words rounded-[18px] px-4 py-2.5 text-[15px] ${mine ? "bg-surface-inverse text-ink-inverse" : "bg-surface-sunken text-ink"}`}
                  >
                    {m.body}
                  </div>
                  <span className="mt-1 text-xs text-ink-muted">
                    {mine ? t.you : t.team} · {when(m.createdAt)}
                  </span>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <form onSubmit={submit} className="flex flex-col gap-2 border-t border-line p-4 sm:p-5">
            <label htmlFor="support-msg" className="sr-only">
              {t.label}
            </label>
            <div className="flex items-end gap-3">
              <textarea
                id="support-msg"
                value={draft}
                maxLength={SUPPORT_MAX}
                rows={2}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t.placeholder}
                className={`${fieldClass} h-auto min-h-[52px] resize-y py-3`}
              />
              <Button type="submit" variant="gold" disabled={sending || !draft.trim()} aria-label={t.send}>
                <PiPaperPlaneRight size={18} aria-hidden="true" />
                <span className="hidden sm:inline">{t.send}</span>
              </Button>
            </div>
            <div className="flex justify-between text-xs text-ink-muted">
              <span role="alert" className="text-danger">{sendError ? t.sendFailed : ""}</span>
              <span>{t.count(draft.length)}</span>
            </div>
          </form>
        </Card>
      )}
    </Page>
  );
}
