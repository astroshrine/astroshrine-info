"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PiArrowLeft, PiArrowsClockwise, PiPaperPlaneTilt, PiPlus, PiThumbsDown, PiThumbsUp, PiWallet } from "react-icons/pi";
import Link from "@/i18n/Link";
import { primaryButton, secondaryButton } from "@/components/consult/Dialog";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import {
  MAX_QUESTION,
  chatErrorKind,
  hasBirthChart,
  listAiMessages,
  listPersonas,
  sendAiFeedback,
  sendAiMessage,
  type AiLang,
  type AiMessage,
  type Persona,
} from "@/lib/services/aiAstrologers";
import { rechargeHref } from "@/lib/services/chat";
import { ListSkeleton, LoadError, PageFrame, useRequireSignIn } from "../../bookings/_parts/shared";
import { PersonaIcon, personaName, personaTopic } from "../personaUi";
import BirthDetailsForm from "./BirthDetailsForm";
import Markdownish from "./Markdownish";

const text = defineMessages({
  hi: {
    back: "सभी AI ज्योतिषी",
    badge: "AI",
    aiNote: "ये AI हैं, असली इंसान नहीं। जवाब सलाह के लिए हैं। सेहत, कानून और बड़े पैसे के फ़ैसले के लिए विशेषज्ञ से मिलें।",
    loadFailed: "यह AI ज्योतिषी लोड नहीं हो सके।",
    notFound: "यह AI ज्योतिषी उपलब्ध नहीं हैं।",
    all: "सभी AI ज्योतिषी देखें",
    newChat: "नई बातचीत",
    language: "जवाब की भाषा",
    langs: { hi: "हिन्दी", en: "English", hinglish: "Hinglish" },
    emptyTitle: (name: string) => `${name} से अपना सवाल पूछें`,
    emptyBody: "अपने सवाल को खुलकर और साफ़ लिखें। जितनी ज़्यादा जानकारी, उतना सही जवाब।",
    placeholder: "अपना सवाल लिखें…",
    send: "भेजें",
    sending: "भेजा जा रहा है",
    thinking: "जवाब लिखा जा रहा है…",
    you: "आप",
    helpful: "जवाब काम का था",
    notHelpful: "जवाब काम का नहीं था",
    thanks: "फ़ीडबैक के लिए धन्यवाद",
    errBalance: "इस सवाल के लिए wallet में पॉइंट्स कम हैं।",
    recharge: "Wallet रिचार्ज करें",
    errRate: "आप बहुत तेज़ी से सवाल भेज रहे हैं। थोड़ी देर रुककर फिर कोशिश करें।",
    errLong: "सवाल भेजा नहीं जा सका। उसे छोटा करके फिर से कोशिश करें।",
    errOther: "सवाल भेजा नहीं जा सका। कृपया फिर से कोशिश करें।",
    errSlow: "जवाब आने में सामान्य से ज़्यादा समय लग रहा है। वही सवाल दोबारा न भेजें, वरना दो बार शुल्क लग सकता है। थोड़ी देर बाद बातचीत ताज़ा करें।",
    refresh: "बातचीत ताज़ा करें",
    redirectTitle: (name: string) => `यह सवाल ${name} के विषय का लगता है`,
    redirectBody: "अभी कुछ नहीं कटा। बेहतर जवाब के लिए उनसे पूछ सकते हैं, या इन्हीं से पूछें।",
    askThem: (name: string) => `${name} से पूछें`,
    askAnyway: "फिर भी इन्हीं से पूछें",
    needsFaceTitle: "इसके लिए फ़ेस रीडिंग चाहिए",
    needsFaceBody: "यह ज्योतिषी आपकी फ़ेस रीडिंग से जवाब देते हैं, जो अभी सिर्फ़ AstroShrine ऐप में बनती है। आप फिर भी सवाल पूछ सकते हैं।",
    sessionFailed: "यह बातचीत लोड नहीं हो सकी।",
    charCount: (n: number, max: number) => `${n}/${max}`,
  },
  en: {
    back: "All AI astrologers",
    badge: "AI",
    aiNote: "These are an AI, not a person. Answers are guidance. For health, legal and big money decisions, see a professional.",
    loadFailed: "This AI astrologer could not be loaded.",
    notFound: "This AI astrologer is not available.",
    all: "See all AI astrologers",
    newChat: "New conversation",
    language: "Answer language",
    langs: { hi: "हिन्दी", en: "English", hinglish: "Hinglish" },
    emptyTitle: (name) => `Ask ${name} your question`,
    emptyBody: "Write your question openly and clearly. The more detail you give, the better the answer.",
    placeholder: "Write your question…",
    send: "Send",
    sending: "Sending",
    thinking: "Writing the answer…",
    you: "You",
    helpful: "The answer was helpful",
    notHelpful: "The answer was not helpful",
    thanks: "Thanks for the feedback",
    errBalance: "Your wallet does not have enough points for this question.",
    recharge: "Recharge wallet",
    errRate: "You are sending questions very fast. Wait a moment and try again.",
    errLong: "The question could not be sent. Shorten it and try again.",
    errOther: "The question could not be sent. Please try again.",
    errSlow: "The answer is taking longer than usual. Do not send the same question again or you may be charged twice. Refresh the conversation in a moment.",
    refresh: "Refresh conversation",
    redirectTitle: (name) => `This looks like a question for ${name}`,
    redirectBody: "Nothing was charged yet. You can ask them for a better answer, or ask this astrologer anyway.",
    askThem: (name) => `Ask ${name}`,
    askAnyway: "Ask this one anyway",
    needsFaceTitle: "This needs a face reading",
    needsFaceBody: "This astrologer answers from your face reading, which is made only in the AstroShrine app for now. You can still ask a question.",
    sessionFailed: "This conversation could not be loaded.",
    charCount: (n, max) => `${n}/${max}`,
  },
});

type Pending = { text: string; redirect?: Persona; failed?: "balance" | "rate" | "long" | "other" | "slow" };

export default function AiChat(props: { personaId: string; sessionId: string | null; draft: string }) {
  const signedIn = useRequireSignIn();
  if (!signedIn) return <PageFrame narrow><ListSkeleton rows={2} /></PageFrame>;
  return <Room {...props} />;
}

function Room({ personaId, sessionId: initialSession, draft }: { personaId: string; sessionId: string | null; draft: string }) {
  const t = useT(text);
  const locale = useLocale();
  const router = useRouter();

  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(initialSession);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(!!initialSession);
  const [sessionFailed, setSessionFailed] = useState(false);
  const [text_, setText] = useState(draft);
  const [lang, setLang] = useState<AiLang>(locale === "hi" ? "hi" : "en");
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [needsBirth, setNeedsBirth] = useState(false);
  const [birthDismissed, setBirthDismissed] = useState(false);
  const [thanked, setThanked] = useState<Set<string>>(new Set());
  const end = useRef<HTMLDivElement>(null);
  const localSeq = useRef(0);

  const persona = personas?.find((p) => p.id === personaId) ?? null;

  useEffect(() => {
    const controller = new AbortController();
    listPersonas(controller.signal).then(setPersonas, () => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [attempt]);

  // Personas that answer from a birth chart: ask for the details once, if none is saved.
  const wantsBirth = !!persona?.needs.includes("birth");
  useEffect(() => {
    if (!wantsBirth) return;
    const controller = new AbortController();
    hasBirthChart(controller.signal).then(
      (has) => setNeedsBirth(!has),
      () => undefined,
    );
    return () => controller.abort();
  }, [wantsBirth]);

  const loadMessages = useCallback(async (id: string, signal?: AbortSignal) => {
    try {
      const r = await listAiMessages(id, signal);
      setMessages(r.messages);
      setSessionFailed(false);
    } catch {
      if (!signal?.aborted) setSessionFailed(true);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!initialSession) return;
    const controller = new AbortController();
    listAiMessages(initialSession, controller.signal).then(
      (r) => {
        setMessages(r.messages);
        setLoadingMessages(false);
      },
      () => {
        if (controller.signal.aborted) return;
        setSessionFailed(true);
        setLoadingMessages(false);
      },
    );
    return () => controller.abort();
  }, [initialSession]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, pending?.text, sending]);

  const submit = async (question: string, noRedirect = false) => {
    const q = question.trim();
    if (!q || sending || !persona) return;
    setSending(true);
    setPending({ text: q });
    setText("");
    try {
      const r = await sendAiMessage({ personaId: persona.id, message: q, sessionId: sessionId ?? undefined, lang, noRedirect });
      if (r.kind === "redirect") {
        setPending({ text: q, redirect: r.persona });
        return;
      }
      const sid = r.sessionId || sessionId;
      if (sid && sid !== sessionId) {
        setSessionId(sid);
        window.history.replaceState(null, "", `${window.location.pathname}?session=${encodeURIComponent(sid)}`);
      }
      const seq = (localSeq.current += 2);
      setMessages((m) => [
        ...m,
        { id: `local-${seq}`, role: "user", content: q, createdAt: seq },
        { id: r.messageId || `local-a-${seq}`, role: "assistant", content: r.content, createdAt: seq + 1 },
      ]);
      setPending(null);
    } catch (e) {
      // A gateway timeout or a dropped connection: the server may still have answered and charged for it.
      const slow = e instanceof ApiError ? e.status === 502 || e.status === 504 : true;
      setPending({ text: q, failed: slow ? "slow" : chatErrorKind(e) });
      if (!slow) setText(q);
    } finally {
      setSending(false);
    }
  };

  const newChat = () => {
    setSessionId(null);
    setMessages([]);
    setPending(null);
    setSessionFailed(false);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const rate = async (m: AiMessage, value: "positive" | "negative") => {
    setMessages((all) => all.map((x) => (x.id === m.id ? { ...x, feedback: value } : x)));
    try {
      await sendAiFeedback(m.id, value);
      setThanked((s) => new Set(s).add(m.id));
    } catch {
      setMessages((all) => all.map((x) => (x.id === m.id ? { ...x, feedback: m.feedback } : x)));
    }
  };

  if (personas === null) {
    return <PageFrame narrow>{failed ? <LoadError message={t.loadFailed} onRetry={() => {
            setFailed(false);
            setAttempt((a) => a + 1);
          }} /> : <ListSkeleton rows={2} />}</PageFrame>;
  }
  if (!persona) {
    return (
      <PageFrame narrow>
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface-card p-6">
          <p className="body-5 text-ink">{t.notFound}</p>
          <Link href="/ai-astrologers" className={secondaryButton}>
            {t.all}
          </Link>
        </div>
      </PageFrame>
    );
  }

  const name = personaName(persona, locale);
  const empty = messages.length === 0 && !pending && !loadingMessages;
  const needsFace = persona.needs.includes("face_report");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4 pt-6 md:px-8 lg:pt-10">
      <Link href="/ai-astrologers" className="button-sm inline-flex w-fit items-center gap-1 text-brand-strong hover:underline">
        <PiArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </Link>

      <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface-card p-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-inverse text-brand-on-inverse">
          <PersonaIcon persona={persona} className="h-6 w-6" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="title-3 flex flex-wrap items-center gap-2 text-ink">
            {name}
            <span className="caption-4 rounded-md bg-surface-inverse px-1.5 py-0.5 text-ink-inverse">{t.badge}</span>
          </h1>
          <p className="caption-2 text-brand-strong">{personaTopic(persona, locale)}</p>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={newChat} className={secondaryButton}>
            <PiPlus className="h-4 w-4" aria-hidden />
            {t.newChat}
          </button>
        )}
      </header>
      <p className="caption-2 text-ink-soft">{t.aiNote}</p>

      {needsBirth && !birthDismissed && <BirthDetailsForm onSaved={() => setNeedsBirth(false)} onSkip={() => setBirthDismissed(true)} />}
      {needsFace && (
        <div role="note" className="flex flex-col gap-1 rounded-2xl bg-warning-soft px-4 py-3 text-warning">
          <p className="body-6 font-semibold">{t.needsFaceTitle}</p>
          <p className="caption-2">{t.needsFaceBody}</p>
        </div>
      )}

      <section aria-label={name} className="flex min-h-[40dvh] flex-col gap-4">
        {loadingMessages ? (
          <ListSkeleton rows={2} />
        ) : sessionFailed ? (
          <LoadError message={t.sessionFailed} onRetry={() => sessionId && void loadMessages(sessionId)} />
        ) : empty ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <h2 className="heading-6 text-ink">{t.emptyTitle(name)}</h2>
            <p className="body-6 max-w-md text-ink-soft">{t.emptyBody}</p>
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {messages.map((m) => (
              <li key={m.id} className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                <span className="caption-4 text-ink-muted">{m.role === "user" ? t.you : `${name} · ${t.badge}`}</span>
                <div className={`body-6 max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[85%] ${m.role === "user" ? "bg-brand text-brand-ink" : "border border-line bg-surface-card text-ink"}`}>
                  {m.role === "user" ? <p className="whitespace-pre-wrap">{m.content}</p> : <Markdownish text={m.content} />}
                </div>
                {m.role === "assistant" && !m.id.startsWith("local-a-") && (
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label={t.helpful} aria-pressed={m.feedback === "positive"} onClick={() => rate(m, "positive")} className={`grid h-8 w-8 place-items-center rounded-full transition hover:bg-surface-sunken ${m.feedback === "positive" ? "text-success" : "text-ink-muted"}`}>
                      <PiThumbsUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" aria-label={t.notHelpful} aria-pressed={m.feedback === "negative"} onClick={() => rate(m, "negative")} className={`grid h-8 w-8 place-items-center rounded-full transition hover:bg-surface-sunken ${m.feedback === "negative" ? "text-danger" : "text-ink-muted"}`}>
                      <PiThumbsDown className="h-4 w-4" aria-hidden />
                    </button>
                    {thanked.has(m.id) && <span className="caption-4 text-ink-soft">{t.thanks}</span>}
                  </div>
                )}
              </li>
            ))}
            {pending && !pending.redirect && !pending.failed && (
              <>
                <li className="flex flex-col items-end gap-1">
                  <span className="caption-4 text-ink-muted">{t.you}</span>
                  <div className="body-6 max-w-[92%] rounded-2xl bg-brand px-4 py-3 text-brand-ink sm:max-w-[85%]">
                    <p className="whitespace-pre-wrap">{pending.text}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <p role="status" className="caption-2 animate-pulse rounded-2xl border border-line bg-surface-card px-4 py-3 text-ink-soft">
                    {t.thinking}
                  </p>
                </li>
              </>
            )}
          </ol>
        )}

        {pending?.redirect && (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-line-strong bg-surface-sunken p-4">
            <p className="body-5 text-ink">{t.redirectTitle(personaName(pending.redirect, locale))}</p>
            <p className="caption-2 text-ink-soft">{t.redirectBody}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => router.push(`/ai-astrologers/${encodeURIComponent(pending.redirect!.id)}?q=${encodeURIComponent(pending.text)}`)} className={primaryButton}>
                {t.askThem(personaName(pending.redirect, locale))}
              </button>
              <button type="button" onClick={() => void submit(pending.text, true)} className={secondaryButton}>
                {t.askAnyway}
              </button>
            </div>
          </div>
        )}

        {pending?.failed && (
          <div role="alert" className="flex flex-col items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-danger">
            <p className="body-6">{pending.failed === "balance" ? t.errBalance : pending.failed === "rate" ? t.errRate : pending.failed === "long" ? t.errLong : pending.failed === "slow" ? t.errSlow : t.errOther}</p>
            {pending.failed === "balance" && (
              <Link href={rechargeHref()} className={secondaryButton}>
                <PiWallet className="h-4 w-4" aria-hidden />
                {t.recharge}
              </Link>
            )}
            {pending.failed === "slow" && sessionId && (
              <button
                type="button"
                onClick={() => {
                  setPending(null);
                  void loadMessages(sessionId);
                }}
                className={secondaryButton}
              >
                <PiArrowsClockwise className="h-4 w-4" aria-hidden />
                {t.refresh}
              </button>
            )}
          </div>
        )}
        <div ref={end} />
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(text_);
        }}
        className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-line bg-surface-page/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border md:px-3"
      >
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={t.language}>
          <span className="caption-4 text-ink-muted">{t.language}</span>
          {(["hi", "en", "hinglish"] as const).map((l) => (
            <label key={l} className={`caption-2 cursor-pointer rounded-full border px-2.5 py-1 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus ${lang === l ? "border-brand bg-surface-sunken text-ink" : "border-line text-ink-soft hover:bg-surface-sunken"}`}>
              <input type="radio" name="lang" value={l} checked={lang === l} onChange={() => setLang(l)} className="sr-only" />
              <span lang={l === "hi" ? "hi" : undefined}>{t.langs[l]}</span>
            </label>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <label className="flex-1">
            <span className="sr-only">{t.placeholder}</span>
            <textarea
              value={text_}
              rows={2}
              maxLength={MAX_QUESTION}
              placeholder={t.placeholder}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void submit(text_);
                }
              }}
              className="body-6 w-full resize-none rounded-xl border border-line-strong bg-surface-card px-3 py-2 text-ink"
            />
          </label>
          <button type="submit" disabled={sending || !text_.trim()} aria-label={sending ? t.sending : t.send} className={`${primaryButton} h-11 shrink-0`}>
            <PiPaperPlaneTilt className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">{t.send}</span>
          </button>
        </div>
        {text_.length > MAX_QUESTION - 200 && <p className="caption-4 text-right text-ink-soft">{t.charCount(text_.length, MAX_QUESTION)}</p>}
      </form>
    </div>
  );
}
