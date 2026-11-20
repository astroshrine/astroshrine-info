"use client";

import { useEffect, useState } from "react";
import { PiArrowLeft, PiStarFill } from "react-icons/pi";
import AstrologerAvatar from "@/components/consult/AstrologerAvatar";
import { primaryButton, secondaryButton } from "@/components/consult/Dialog";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { clockLabel, isCancelled } from "@/lib/services/bookings";
import { CancelAction, JoinAction, NameLine, StatusChip, bookingText } from "../_parts/BookingParts";
import { ChannelBadge, ListSkeleton, LoadError, PageFrame, longDate, useRequireSignIn } from "../_parts/shared";
import { useBookings } from "../_parts/useBookings";

const text = defineMessages({
  hi: {
    back: "मेरी अपॉइंटमेंट",
    loadFailed: "यह बुकिंग लोड नहीं हो सकी।",
    notFoundTitle: "यह बुकिंग नहीं मिली",
    notFoundBody: "यह आपके account की बुकिंग नहीं है, या बहुत पुरानी है।",
    when: "दिन और समय",
    length: "अवधि",
    paid: "चुकाए गए पॉइंट्स",
    questions: "सवाल",
    callNote: "कॉल तब खुलती है जब ज्योतिषी उसे शुरू करते हैं। समय से 5 मिनट पहले से आप यहां से जुड़ सकते हैं।",
    chatNote: "चैट पैक में आप तय सवाल पूछ सकते हैं। जब चाहें चैट खोलें।",
    bookAgain: "फिर से बुक करें",
    rate: "रिव्यू दें",
  },
  en: {
    back: "My appointments",
    loadFailed: "This booking could not be loaded.",
    notFoundTitle: "We could not find this booking",
    notFoundBody: "It is not a booking on your account, or it is too old to list.",
    when: "Day and time",
    length: "Length",
    paid: "Points paid",
    questions: "Questions",
    callNote: "The call opens when the astrologer starts it. You can join from here from 5 minutes before the time.",
    chatNote: "A chat pack lets you ask a set number of questions. Open the chat whenever you like.",
    bookAgain: "Book again",
    rate: "Leave a review",
  },
});

export default function BookingDetail({ id }: { id: string }) {
  const signedIn = useRequireSignIn();
  if (!signedIn) return <PageFrame narrow><ListSkeleton rows={1} /></PageFrame>;
  return <Loaded id={id} />;
}

function Loaded({ id }: { id: string }) {
  const t = useT(text);
  const bt = useT(bookingText);
  const locale = useLocale();
  const { bookings, photos, failed, reload } = useBookings(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const b = bookings?.find((x) => x.id === id) ?? null;

  return (
    <PageFrame narrow>
      <Link href="/bookings" className="button-sm inline-flex w-fit items-center gap-1 text-brand-strong hover:underline">
        <PiArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </Link>

      {bookings === null ? (
        failed ? <LoadError message={t.loadFailed} onRetry={reload} /> : <ListSkeleton rows={1} />
      ) : !b ? (
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-line bg-surface-card p-6">
          <h1 className="heading-6 text-ink">{t.notFoundTitle}</h1>
          <p className="body-6 text-ink-soft">{t.notFoundBody}</p>
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface-card p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <AstrologerAvatar name={b.astrologerName || bt.astrologer} photo={photos.get(b.astrologerId) ?? null} size={64} />
              <div className="flex min-w-0 flex-col gap-1">
                <h1 className="heading-5 truncate text-ink">
                  <NameLine b={b} />
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip status={b.status} />
                  <ChannelBadge channel={b.channel} />
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {!(b.channel === "chat" && b.durationMinutes <= 1) && (
                <>
                  <Fact label={t.when} value={`${longDate(b.date, locale)}, ${clockLabel(b.start)} – ${clockLabel(b.end)}`} />
                  <Fact label={t.length} value={bt.min(b.durationMinutes)} />
                </>
              )}
              <Fact label={t.paid} value={String(b.pointsCharged)} />
              {b.channel === "chat" && b.questionsAllowed > 0 && <Fact label={t.questions} value={bt.questions(b.questionsUsed, b.questionsAllowed)} />}
            </dl>

            {notice && (
              <p role="status" className="body-6 rounded-xl bg-success-soft px-4 py-3 text-success">
                {notice}
              </p>
            )}
            {isCancelled(b) && b.pointsRefunded > 0 && <p className="body-6 text-success">{bt.refunded(b.pointsRefunded)}</p>}
            {(b.status === "CONFIRMED" || b.status === "IN_PROGRESS" || b.status === "WAITING") && (
              <p className="caption-2 text-ink-soft">{b.channel === "call" ? t.callNote : t.chatNote}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <JoinAction b={b} now={now} />
              <CancelAction
                b={b}
                onCancelled={(m) => {
                  setNotice(m);
                  reload();
                }}
              />
              {(b.status === "COMPLETED" || isCancelled(b) || b.status === "EXPIRED") && (
                <Link href={`/bookings/new/${encodeURIComponent(b.astrologerId)}`} className={primaryButton}>
                  {t.bookAgain}
                </Link>
              )}
              {b.status === "COMPLETED" && (
                <Link href={`/history?astrologer=${encodeURIComponent(b.astrologerId)}`} className={secondaryButton}>
                  <PiStarFill className="h-4 w-4" aria-hidden />
                  {t.rate}
                </Link>
              )}
            </div>
          </section>
        </>
      )}
    </PageFrame>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="caption-2 text-ink-soft">{label}</dt>
      <dd className="body-5 text-ink">{value}</dd>
    </div>
  );
}
