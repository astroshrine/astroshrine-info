"use client";

import { useEffect, useState } from "react";
import { PiPlayFill } from "react-icons/pi";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import {
  embedUrl,
  FEEDBACK_CATEGORIES,
  FEEDBACK_MAX,
  FEEDBACK_MIN,
  getFeedback,
  getTrainingVideos,
  sendFeedback,
  thumbUrl,
  type Feedback,
  type FeedbackCategory,
  type TrainingVideo,
} from "@/lib/services/astrologerHub";
import { Accent, Button, Card, fieldClass, labelClass, Page, PageTitle, Pill } from "../_console/ui";
import { useAstrologer } from "../_console/useAstrologer";

const text = defineMessages({
  hi: {
    eyebrow: "सीखें",
    titleA: "प्रशिक्षण और ",
    titleB: "आपकी राय",
    sub: "AstroShrine के प्रशिक्षण वीडियो देखें और टीम को अपना सुझाव या शिकायत भेजें।",
    tabs: { videos: "प्रशिक्षण वीडियो", feedback: "टीम को सुझाव" },
    loading: "लोड हो रहा है…",
    failed: "यह भाग नहीं खुल सका।",
    retry: "फिर कोशिश करें",
    all: "सभी",
    category: "श्रेणी",
    noVideos: "अभी कोई प्रशिक्षण वीडियो नहीं है।",
    noVideosIn: "इस श्रेणी में कोई वीडियो नहीं।",
    play: (title: string) => `चलाएँ: ${title}`,
    watchYoutube: "YouTube पर खोलें",
    close: "बंद करें",
    cats: { app: "ऐप", payments: "भुगतान", users: "ग्राहक", support: "सहायता", suggestion: "सुझाव", other: "अन्य" } as Record<string, string>,
    fbTitle: "टीम को लिखें",
    fbSub: "आपका संदेश सीधे प्रबंधन तक पहुँचता है। एक दिन में अधिकतम 5 संदेश भेज सकते हैं।",
    message: "आपका संदेश",
    messagePh: "यहाँ लिखें…",
    anonymous: "नाम छिपाकर भेजें",
    send: "भेजें",
    sending: "भेज रहे हैं…",
    sent: "धन्यवाद, आपका संदेश भेज दिया गया।",
    tooShort: `कम से कम ${FEEDBACK_MIN} अक्षर लिखें।`,
    tooMany: "आज के 5 संदेश पूरे हो गए। कल फिर लिखें।",
    sendFailed: "संदेश नहीं जा सका। फिर कोशिश करें।",
    past: "आपके पुराने संदेश",
    noPast: "आपने अभी कोई संदेश नहीं भेजा।",
    status: { new: "भेजा गया", read: "देखा गया", resolved: "निपटाया गया" } as Record<string, string>,
    reply: "टीम का जवाब",
    anonTag: "नाम छिपाकर",
  },
  en: {
    eyebrow: "Learn",
    titleA: "Training and ",
    titleB: "your feedback",
    sub: "Watch AstroShrine's training videos and send the team a suggestion or a complaint.",
    tabs: { videos: "Training videos", feedback: "Feedback to the team" },
    loading: "Loading…",
    failed: "Could not open this section.",
    retry: "Try again",
    all: "All",
    category: "Category",
    noVideos: "There are no training videos yet.",
    noVideosIn: "No videos in this category.",
    play: (title) => `Play: ${title}`,
    watchYoutube: "Open on YouTube",
    close: "Close",
    cats: { app: "App", payments: "Payments", users: "Customers", support: "Support", suggestion: "Suggestion", other: "Other" },
    fbTitle: "Write to the team",
    fbSub: "Your message goes straight to the management. You can send up to 5 a day.",
    message: "Your message",
    messagePh: "Write here…",
    anonymous: "Send without my name",
    send: "Send",
    sending: "Sending…",
    sent: "Thank you, your message was sent.",
    tooShort: `Write at least ${FEEDBACK_MIN} characters.`,
    tooMany: "You have sent 5 today. Please write again tomorrow.",
    sendFailed: "Could not send. Please try again.",
    past: "Your earlier messages",
    noPast: "You have not sent any feedback yet.",
    status: { new: "Sent", read: "Seen", resolved: "Resolved" },
    reply: "Reply from the team",
    anonTag: "Anonymous",
  },
});

const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
const Txt = ({ children, className }: { children: string; className?: string }) => (
  <span lang={hasDevanagari(children) ? "hi" : undefined} className={className}>
    {children}
  </span>
);

type Tab = "videos" | "feedback";
type Load<T> = { id: string; data: T } | "error" | null;

export default function LearnView() {
  const t = useT(text);
  const { id, status } = useAstrologer();
  const [tab, setTab] = useState<Tab>("videos");

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
      <div role="tablist" className="grid w-full max-w-lg grid-cols-2 gap-1 self-start rounded-2xl bg-surface-sunken p-1">
        {(["videos", "feedback"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`learn-tab-${k}`}
            aria-selected={tab === k}
            aria-controls="learn-panel"
            onClick={() => setTab(k)}
            className={`h-11 cursor-pointer rounded-xl px-3 text-[15px] font-bold transition ${tab === k ? "bg-surface-inverse text-ink-inverse" : "text-ink hover:bg-surface-card"}`}
          >
            {t.tabs[k]}
          </button>
        ))}
      </div>
      <div id="learn-panel" role="tabpanel" aria-labelledby={`learn-tab-${tab}`} className="flex flex-col gap-6">
        {status === "ready" && id && (tab === "videos" ? <Videos id={id} /> : <FeedbackPanel id={id} />)}
      </div>
    </Page>
  );
}

function Failed({ onRetry }: { onRetry: () => void }) {
  const t = useT(text);
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-8" role="alert">
      <p className="text-danger">{t.failed}</p>
      <Button variant="line" size="sm" onClick={onRetry}>
        {t.retry}
      </Button>
    </Card>
  );
}

function Videos({ id }: { id: string }) {
  const t = useT(text);
  const [state, setState] = useState<Load<TrainingVideo[]>>(null);
  const [attempt, setAttempt] = useState(0);
  const [cat, setCat] = useState("");
  const [playing, setPlaying] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getTrainingVideos(id, controller.signal).then(
      (data) => setState({ id, data }),
      () => !controller.signal.aborted && setState("error"),
    );
    return () => controller.abort();
  }, [id, attempt]);

  if (state === "error") return <Failed onRetry={() => { setState(null); setAttempt((n) => n + 1); }} />;
  if (!state) return <Card className="p-8 text-ink-soft" role="status">{t.loading}</Card>;
  const videos = state.data;
  if (videos.length === 0) return <Card className="p-8 text-ink-soft">{t.noVideos}</Card>;
  const cats = [...new Set(videos.map((v) => v.category))];
  const shown = cat ? videos.filter((v) => v.category === cat) : videos;

  return (
    <>
      {cats.length > 1 && (
        <div role="group" aria-label={t.category} className="flex flex-wrap gap-2">
          {["", ...cats].map((c) => (
            <button
              key={c || "all"}
              type="button"
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className={`h-10 cursor-pointer rounded-full border px-4 text-sm font-bold transition ${cat === c ? "border-transparent bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card hover:bg-surface-sunken"}`}
            >
              {c ? <Txt>{c}</Txt> : t.all}
            </button>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <Card className="p-8 text-ink-soft">{t.noVideosIn}</Card>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((v) => (
            <li key={v.id}>
              <Card as="article" className="overflow-hidden">
                <div className="relative aspect-video bg-surface-inverse">
                  {playing === v.id ? (
                    <iframe
                      src={`${embedUrl(v.youtubeId)}&autoplay=1`}
                      title={v.title}
                      className="absolute inset-0 h-full w-full"
                      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <button type="button" onClick={() => setPlaying(v.id)} aria-label={t.play(v.title)} className="group absolute inset-0 cursor-pointer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbUrl(v.youtubeId)} alt="" loading="lazy" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/10">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-ink">
                          <PiPlayFill size={24} aria-hidden="true" />
                        </span>
                      </span>
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <Pill tone="gold" className="self-start"><Txt>{v.category}</Txt></Pill>
                  <h3 className="font-display text-lg font-bold leading-snug"><Txt>{v.title}</Txt></h3>
                  {v.description && <p className="text-[15px] text-ink-soft"><Txt>{v.description}</Txt></p>}
                  <a href={v.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-strong underline underline-offset-2">
                    {t.watchYoutube}
                  </a>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FeedbackPanel({ id }: { id: string }) {
  const t = useT(text);
  const intl = INTL_LOCALE[useLocale()];
  const [state, setState] = useState<Load<Feedback[]>>(null);
  const [attempt, setAttempt] = useState(0);
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getFeedback(id, controller.signal).then(
      (data) => setState({ id, data }),
      () => !controller.signal.aborted && setState("error"),
    );
    return () => controller.abort();
  }, [id, attempt]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = message.trim();
    if (body.length < FEEDBACK_MIN) return setNote({ tone: "bad", text: t.tooShort });
    setBusy(true);
    setNote(null);
    try {
      const f = await sendFeedback(id, { category, message: body, anonymous });
      setMessage("");
      setNote({ tone: "ok", text: t.sent });
      setState((s) => (s && s !== "error" ? { ...s, data: [f, ...s.data] } : s));
    } catch (err) {
      setNote({ tone: "bad", text: err instanceof ApiError && err.status === 429 ? t.tooMany : t.sendFailed });
    } finally {
      setBusy(false);
    }
  };

  const date = (iso: string) => new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso));
  const tone = (s: string) => (s === "resolved" ? "green" : s === "read" ? "amber" : "neutral");

  return (
    <>
      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold">{t.fbTitle}</h2>
        <p className="mt-1 text-ink-soft">{t.fbSub}</p>
        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <div role="group" aria-label={t.category} className="flex flex-wrap gap-2">
            {FEEDBACK_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`h-10 cursor-pointer rounded-full border px-4 text-sm font-bold transition ${category === c ? "border-transparent bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card hover:bg-surface-sunken"}`}
              >
                {t.cats[c]}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-msg" className={labelClass}>{t.message}</label>
            <textarea
              id="fb-msg"
              value={message}
              maxLength={FEEDBACK_MAX}
              rows={5}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.messagePh}
              className={`${fieldClass} h-auto resize-y py-3`}
            />
            <span className="self-end text-xs text-ink-muted">{message.length}/{FEEDBACK_MAX}</span>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-[15px]">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-5 w-5 accent-[var(--color-brand-strong)]" />
            {t.anonymous}
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" variant="gold" disabled={busy}>{busy ? t.sending : t.send}</Button>
            <p role={note?.tone === "bad" ? "alert" : "status"} className={note?.tone === "bad" ? "text-danger" : "text-success"}>{note?.text}</p>
          </div>
        </form>
      </Card>

      <div>
        <h2 className="font-display text-2xl font-bold">{t.past}</h2>
        {state === "error" ? (
          <div className="mt-4"><Failed onRetry={() => { setState(null); setAttempt((n) => n + 1); }} /></div>
        ) : !state ? (
          <Card className="mt-4 p-8 text-ink-soft" role="status">{t.loading}</Card>
        ) : state.data.length === 0 ? (
          <Card className="mt-4 p-8 text-ink-soft">{t.noPast}</Card>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {state.data.map((f) => (
              <li key={f.id}>
                <Card as="article" className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="gold">{t.cats[f.category] ?? t.cats.other}</Pill>
                    <Pill tone={tone(f.status)}>{t.status[f.status] ?? f.status}</Pill>
                    {f.anonymous && <Pill tone="neutral">{t.anonTag}</Pill>}
                    <span className="ml-auto text-sm text-ink-muted">{date(f.createdAt)}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words"><Txt>{f.message}</Txt></p>
                  {f.adminNote && (
                    <div className="mt-3 rounded-2xl bg-surface-sunken p-3.5 text-[15px]">
                      <b className="block text-brand-strong">{t.reply}</b>
                      <Txt className="whitespace-pre-wrap break-words">{f.adminNote}</Txt>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
