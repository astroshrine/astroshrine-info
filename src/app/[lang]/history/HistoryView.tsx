"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PiChatCircleDots, PiSparkle, PiStar, PiStarFill } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { secondaryButton } from "@/components/consult/Dialog";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { listAiSessions, listPersonas, type AiSession, type Persona } from "@/lib/services/aiAstrologers";
import { listReviews } from "@/lib/services/astrologers";
import { formatDate, type Review } from "@/lib/services/astrologerModel";
import { bookingInstant, type Booking } from "@/lib/services/bookings";
import BookingCard from "../bookings/_parts/BookingParts";
import { EmptyState, ListSkeleton, LoadError, PageFrame, useRequireSignIn } from "../bookings/_parts/shared";
import { useBookings } from "../bookings/_parts/useBookings";
import { personaName } from "../ai-astrologers/personaUi";
import RateAstrologer from "../chat/[id]/RateAstrologer";

const text = defineMessages({
  hi: {
    title: "पुराने सेशन और रिव्यू",
    intro: "पूरी हुई सलाह, आपके दिए रिव्यू और AI ज्योतिषी से पुरानी बातचीत।",
    tabs: "इतिहास के हिस्से",
    consults: "ज्योतिषी के साथ",
    ai: "AI ज्योतिषी",
    loadFailed: "आपका इतिहास लोड नहीं हो सका।",
    emptyTitle: "अभी कोई पूरी हुई सलाह नहीं",
    emptyBody: "ज्योतिषी से बुक की हुई कॉल या चैट पूरी होने पर यहां दिखेगी, और आप रिव्यू दे सकेंगे।",
    emptyAiTitle: "अभी कोई AI बातचीत नहीं",
    emptyAiBody: "किसी AI ज्योतिषी से सवाल पूछें, बातचीत यहां मिलेगी।",
    chooseAi: "AI ज्योतिषी देखें",
    chooseAstro: "ज्योतिषी चुनें",
    chats: "सभी चैट बातचीत",
    myReview: (name: string) => `${name} को आपका रिव्यू`,
    rated: (n: number) => `${n} में से 5 स्टार`,
    reply: "ज्योतिषी का जवाब: ",
    reviewLoading: "रिव्यू देखे जा रहे हैं…",
    reviewUnknown: "आपका रिव्यू अभी जांचा नहीं जा सका।",
    rate: "रिव्यू दें",
    rateAgain: "एक और रिव्यू दें",
    sessions: "AI बातचीत",
    messages: (n: number) => `${n} संदेश`,
    untitled: "नई बातचीत",
    open: "खोलें",
    reviewNote: "रिव्यू ज्योतिषी की प्रोफ़ाइल पर आपके पहले नाम के साथ दिखता है।",
  },
  en: {
    title: "Past sessions and reviews",
    intro: "Your finished consultations, the reviews you left, and earlier conversations with AI astrologers.",
    tabs: "History sections",
    consults: "With astrologers",
    ai: "AI astrologers",
    loadFailed: "Your history could not be loaded.",
    emptyTitle: "No finished consultations yet",
    emptyBody: "A call or chat you booked with an astrologer shows here once it is finished, and you can leave a review.",
    emptyAiTitle: "No AI conversations yet",
    emptyAiBody: "Ask an AI astrologer a question and the conversation will be here.",
    chooseAi: "See AI astrologers",
    chooseAstro: "Choose an astrologer",
    chats: "All chat conversations",
    myReview: (name) => `Your review of ${name}`,
    rated: (n) => (n === 1 ? "1 out of 5 stars" : `${n} out of 5 stars`),
    reply: "Astrologer's reply: ",
    reviewLoading: "Checking your reviews…",
    reviewUnknown: "Your review could not be checked just now.",
    rate: "Leave a review",
    rateAgain: "Leave another review",
    sessions: "AI conversations",
    messages: (n) => (n === 1 ? "1 message" : `${n} messages`),
    untitled: "New conversation",
    open: "Open",
    reviewNote: "A review shows on the astrologer's profile under your first name.",
  },
});

type Tab = "consults" | "ai";
/** undefined = still reading; null = could not read. */
type MyReview = Review | null | undefined;

const MAX_REVIEW_PAGES = 4;

/** The signed-in user's latest review of an astrologer: reviews are public, keyed "<time>#<user id>". */
async function findMyReview(astrologerId: string, userId: string, signal: AbortSignal): Promise<Review | false> {
  let after: string | undefined;
  for (let page = 0; page < MAX_REVIEW_PAGES; page++) {
    const rows = await listReviews(astrologerId, after, signal);
    const mine = rows.find((r) => r.key.endsWith(`#${userId}`));
    if (mine) return mine;
    if (rows.length < 10) return false;
    after = rows[rows.length - 1].key;
  }
  return false;
}

export default function HistoryView() {
  const signedIn = useRequireSignIn();
  if (!signedIn) return <PageFrame narrow><ListSkeleton /></PageFrame>;
  return <SignedIn />;
}

function SignedIn() {
  const t = useT(text);
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  const focus = useSearchParams().get("astrologer");
  const { bookings, photos, failed, reload } = useBookings(true);
  const [tab, setTab] = useState<Tab>("consults");
  const [now] = useState(() => Date.now());

  const finished = useMemo(
    () => (bookings ?? []).filter((b) => b.status === "COMPLETED").sort((a, b) => bookingInstant(b.date, b.start) - bookingInstant(a.date, a.start)),
    [bookings],
  );
  // A review belongs to the astrologer, so it hangs on their newest finished consultation only.
  const newestPerAstrologer = useMemo(() => {
    const seen = new Map<string, string>();
    for (const b of finished) if (!seen.has(b.astrologerId)) seen.set(b.astrologerId, b.id);
    return seen;
  }, [finished]);

  const [reviews, setReviews] = useState<Map<string, MyReview>>(new Map());
  useEffect(() => {
    if (!userId || finished.length === 0) return;
    const controller = new AbortController();
    for (const id of new Set(finished.map((b) => b.astrologerId))) {
      findMyReview(id, userId, controller.signal).then(
        (r) => setReviews((m) => new Map(m).set(id, r === false ? undefined : r)),
        () => {
          if (!controller.signal.aborted) setReviews((m) => new Map(m).set(id, null));
        },
      );
    }
    return () => controller.abort();
  }, [finished, userId]);

  return (
    <PageFrame narrow>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-xl flex-col gap-2">
          <h1 className="heading-3 text-ink">{t.title}</h1>
          <p className="body-6 text-ink-soft">{t.intro}</p>
        </div>
        <Link href="/chat" className={secondaryButton}>
          <PiChatCircleDots className="h-5 w-5" aria-hidden />
          {t.chats}
        </Link>
      </header>

      <div role="tablist" aria-label={t.tabs} className="flex gap-1 rounded-2xl bg-surface-sunken p-1">
        {(["consults", "ai"] as const).map((k) => (
          <button key={k} type="button" role="tab" id={`h-${k}`} aria-selected={tab === k} aria-controls="history-panel" onClick={() => setTab(k)} className={`button-sm flex-1 rounded-xl px-3 py-2 transition ${tab === k ? "bg-surface-card text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}>
            {t[k]}
          </button>
        ))}
      </div>

      <div id="history-panel" role="tabpanel" aria-labelledby={`h-${tab}`} className="flex flex-col gap-3">
        {tab === "ai" ? (
          <AiHistory />
        ) : bookings === null ? (
          failed ? <LoadError message={t.loadFailed} onRetry={reload} /> : <ListSkeleton />
        ) : finished.length === 0 ? (
          <EmptyState title={t.emptyTitle} body={t.emptyBody}>
            <Link href="/astrologers" className={secondaryButton}>
              {t.chooseAstro}
            </Link>
          </EmptyState>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {finished.map((b) => (
                <BookingCard
                  key={b.id}
                  b={b}
                  photo={photos.get(b.astrologerId) ?? null}
                  now={now}
                  footer={newestPerAstrologer.get(b.astrologerId) === b.id ? <ReviewBlock b={b} review={reviews.get(b.astrologerId)} known={reviews.has(b.astrologerId)} openRate={focus === b.astrologerId} /> : undefined}
                />
              ))}
            </ul>
            <p className="caption-2 text-ink-soft">{t.reviewNote}</p>
          </>
        )}
      </div>
    </PageFrame>
  );
}

function ReviewBlock({ b, review, known, openRate }: { b: Booking; review: MyReview; known: boolean; openRate: boolean }) {
  const t = useT(text);
  const locale = useLocale();
  const [rating, setRating] = useState(openRate);
  const name = b.astrologerName || "";
  return (
    <div className="flex w-full basis-full flex-col gap-3">
      {!known ? (
        <p className="caption-2 text-ink-soft">{t.reviewLoading}</p>
      ) : review === null ? (
        <p className="caption-2 text-ink-soft">{t.reviewUnknown}</p>
      ) : review ? (
        <div className="flex flex-col gap-1 rounded-xl bg-surface-sunken p-3">
          <p className="caption-2 text-ink-soft">{t.myReview(name || "–")}</p>
          <div className="flex items-center gap-2">
            <span role="img" aria-label={t.rated(review.rating)} className="flex">
              {[1, 2, 3, 4, 5].map((n) => (n <= review.rating ? <PiStarFill key={n} className="h-4 w-4 text-brand-strong" aria-hidden /> : <PiStar key={n} className="h-4 w-4 text-ink-muted" aria-hidden />))}
            </span>
            <span className="caption-2 text-ink-soft">{formatDate(review.ts, locale)}</span>
          </div>
          {review.comment && <p className="body-6 text-ink">{review.comment}</p>}
          {review.reply && (
            <p className="caption-2 text-ink-soft">
              {t.reply}
              {review.reply}
            </p>
          )}
        </div>
      ) : null}
      {known && !rating && (
        <button type="button" onClick={() => setRating(true)} className={`${secondaryButton} w-fit`}>
          <PiStar className="h-4 w-4" aria-hidden />
          {review ? t.rateAgain : t.rate}
        </button>
      )}
      {rating && <RateAstrologer astrologerId={b.astrologerId} name={name || "AstroShrine"} />}
    </div>
  );
}

function AiHistory() {
  const t = useT(text);
  const locale = useLocale();
  const [sessions, setSessions] = useState<AiSession[] | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    listAiSessions(controller.signal).then(setSessions, () => {
      if (!controller.signal.aborted) setFailed(true);
    });
    listPersonas(controller.signal).then(setPersonas, () => undefined);
    return () => controller.abort();
  }, [attempt]);

  if (sessions === null) return failed ? <LoadError message={t.loadFailed} onRetry={() => {
          setFailed(false);
          setAttempt((a) => a + 1);
        }} /> : <ListSkeleton />;
  if (sessions.length === 0)
    return (
      <EmptyState icon={<PiSparkle className="h-7 w-7" aria-hidden />} title={t.emptyAiTitle} body={t.emptyAiBody}>
        <Link href="/ai-astrologers" className={secondaryButton}>
          {t.chooseAi}
        </Link>
      </EmptyState>
    );
  const byId = new Map(personas.map((p) => [p.id, p]));
  return (
    <ul className="flex flex-col gap-2">
      {sessions.map((s) => {
        const p = s.personaId ? byId.get(s.personaId) : undefined;
        const label = s.title || t.untitled;
        const body = (
          <>
            <span className="body-5 truncate text-ink">{label}</span>
            <span className="caption-2 text-ink-soft">
              {p ? `${personaName(p, locale)} · ` : ""}
              {t.messages(s.totalMessages)}
              {s.lastMessageAt ? ` · ${formatDate(s.lastMessageAt, locale)}` : ""}
            </span>
          </>
        );
        return (
          <li key={s.id}>
            {p ? (
              <Link href={`/ai-astrologers/${encodeURIComponent(p.id)}?session=${encodeURIComponent(s.id)}`} aria-label={`${t.open}: ${label}`} className="flex flex-col gap-0.5 rounded-2xl border border-line bg-surface-card p-4 transition hover:bg-surface-sunken">
                {body}
              </Link>
            ) : (
              <div className="flex flex-col gap-0.5 rounded-2xl border border-line bg-surface-card p-4">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
