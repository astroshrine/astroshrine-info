"use client";

import { useState } from "react";
import { PiArrowRight, PiChatCircleDots, PiPhoneCall, PiXCircle } from "react-icons/pi";
import AstrologerAvatar from "@/components/consult/AstrologerAvatar";
import Dialog, { primaryButton, quietButton, secondaryButton } from "@/components/consult/Dialog";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { contentLang } from "@/lib/services/astrologerModel";
import { canCancel, cancelBooking, clockLabel, isCancelled, joinState, refundPercent, type Booking } from "@/lib/services/bookings";
import { ChannelBadge, whenLabel } from "./shared";

export const bookingText = defineMessages({
  hi: {
    astrologer: "ज्योतिषी",
    status: {
      WAITING: "लाइन में इंतज़ार",
      CONFIRMED: "बुक हो गई",
      IN_PROGRESS: "चल रही है",
      COMPLETED: "पूरी हुई",
      CANCELLED_BY_USER: "आपने रद्द की",
      CANCELLED_BY_ASTRO: "ज्योतिषी ने रद्द की",
      CANCELLED_BY_ADMIN: "रद्द की गई",
      EXPIRED: "समय निकल गया",
      other: "अन्य",
    },
    pts: (n: number) => `${n} पॉइंट्स`,
    min: (n: number) => `${n} मिनट`,
    joinCall: "कॉल में जुड़ें",
    openChat: "चैट खोलें",
    opensAt: (clock: string) => `${clock} से 5 मिनट पहले खुलेगा`,
    over: "कॉल का समय निकल गया",
    details: "विवरण",
    cancel: "रद्द करें",
    cancelTitle: "बुकिंग रद्द करें?",
    refund100: (pts: string) => `पूरा रिफ़ंड: ${pts} आपके wallet में लौटेंगे।`,
    refund50: (pts: string) => `शुरू होने में 60 मिनट से कम बचे हैं, इसलिए आधा रिफ़ंड: ${pts} लौटेंगे।`,
    refund0: "शुरू होने में 15 मिनट से कम बचे हैं, इसलिए कोई रिफ़ंड नहीं मिलेगा।",
    refundFree: "यह बुकिंग मुफ़्त थी, कुछ नहीं कटा था।",
    keep: "बुकिंग रखें",
    yesCancel: "हां, रद्द करें",
    cancelling: "रद्द हो रही है…",
    cancelFailed: "बुकिंग रद्द नहीं हो सकी। कृपया फिर से कोशिश करें।",
    cancelledRefund: (pts: number, percent: number) => `बुकिंग रद्द हुई। ${pts} पॉइंट्स (${percent}%) लौटाए गए।`,
    cancelledNoRefund: "बुकिंग रद्द हुई। कोई रिफ़ंड लागू नहीं।",
    refunded: (pts: number) => `${pts} पॉइंट्स लौटाए गए`,
    chatPack: "चैट पैक",
    questions: (used: number, allowed: number) => `${used}/${allowed} सवाल पूछे`,
  },
  en: {
    astrologer: "Astrologer",
    status: {
      WAITING: "Waiting in line",
      CONFIRMED: "Booked",
      IN_PROGRESS: "In progress",
      COMPLETED: "Completed",
      CANCELLED_BY_USER: "Cancelled by you",
      CANCELLED_BY_ASTRO: "Cancelled by the astrologer",
      CANCELLED_BY_ADMIN: "Cancelled",
      EXPIRED: "Expired",
      other: "Other",
    },
    pts: (n) => `${n} points`,
    min: (n) => `${n} min`,
    joinCall: "Join call",
    openChat: "Open chat",
    opensAt: (clock) => `Opens 5 minutes before ${clock}`,
    over: "The call window has ended",
    details: "Details",
    cancel: "Cancel",
    cancelTitle: "Cancel this booking?",
    refund100: (pts) => `Full refund: ${pts} go back to your wallet.`,
    refund50: (pts) => `Less than 60 minutes to the start, so half is refunded: ${pts} go back.`,
    refund0: "Less than 15 minutes to the start, so there is no refund.",
    refundFree: "This booking was free: nothing was charged.",
    keep: "Keep booking",
    yesCancel: "Yes, cancel",
    cancelling: "Cancelling…",
    cancelFailed: "The booking could not be cancelled. Please try again.",
    cancelledRefund: (pts, percent) => `Booking cancelled. ${pts} points (${percent}%) refunded.`,
    cancelledNoRefund: "Booking cancelled. No refund applies.",
    refunded: (pts) => `${pts} points refunded`,
    chatPack: "Chat pack",
    questions: (used, allowed) => `${used} of ${allowed} questions asked`,
  },
});

const STATUS_TONE: Record<string, string> = {
  CONFIRMED: "bg-success-soft text-success",
  IN_PROGRESS: "bg-success-soft text-success",
  WAITING: "bg-warning-soft text-warning",
  COMPLETED: "bg-neutral-soft text-neutral",
  EXPIRED: "bg-neutral-soft text-neutral",
};

export function StatusChip({ status }: { status: string }) {
  const t = useT(bookingText);
  const label = (t.status as Record<string, string>)[status] ?? t.status.other;
  const tone = STATUS_TONE[status] ?? (status.startsWith("CANCELLED") ? "bg-danger-soft text-danger" : "bg-neutral-soft text-neutral");
  return <span className={`caption-4 inline-flex w-fit rounded-full px-2 py-0.5 ${tone}`}>{label}</span>;
}

/** The booking's own title line: an astrologer name in its own language, or a generic word. */
export function NameLine({ b, className }: { b: Booking; className?: string }) {
  const t = useT(bookingText);
  const name = b.astrologerName || t.astrologer;
  return (
    <span lang={contentLang(name)} className={className}>
      {name}
    </span>
  );
}

/** Join / open-chat / waiting-for-the-window, for a booking that is still open. */
export function JoinAction({ b, now }: { b: Booking; now: number }) {
  const t = useT(bookingText);
  const state = joinState(b, now);
  if (state === "na") return null;
  if (state === "over") return <p className="caption-2 text-ink-soft">{t.over}</p>;
  if (state === "early") {
    const opens = clockLabel(b.start);
    return <p className="caption-2 text-ink-soft">{t.opensAt(opens)}</p>;
  }
  return b.channel === "call" ? (
    <Link href={`/call/${encodeURIComponent(b.id)}`} className={primaryButton}>
      <PiPhoneCall className="h-5 w-5" aria-hidden />
      {t.joinCall}
    </Link>
  ) : (
    <Link href={`/chat/${encodeURIComponent(b.astrologerId)}?booking=${encodeURIComponent(b.id)}`} className={primaryButton}>
      <PiChatCircleDots className="h-5 w-5" aria-hidden />
      {t.openChat}
    </Link>
  );
}

/** Cancel with the refund the server will give spelled out first. */
export function CancelAction({ b, onCancelled }: { b: Booking; onCancelled: (message: string) => void }) {
  const t = useT(bookingText);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  if (!canCancel(b)) return null;

  const percent = refundPercent(b);
  const refundPts = Math.round((b.pointsCharged * percent) / 100);
  const explain = b.pointsCharged === 0 ? t.refundFree : percent === 100 ? t.refund100(t.pts(refundPts)) : percent === 50 ? t.refund50(t.pts(refundPts)) : t.refund0;

  const confirm = async () => {
    setBusy(true);
    setError(false);
    try {
      const r = await cancelBooking(b.id, "Cancelled by user");
      setOpen(false);
      onCancelled(r.refundedPoints > 0 ? t.cancelledRefund(r.refundedPoints, r.refundPercent || percent) : t.cancelledNoRefund);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={quietButton}>
        <PiXCircle className="h-4 w-4" aria-hidden />
        {t.cancel}
      </button>
      <Dialog open={open} onClose={() => (busy ? undefined : setOpen(false))} title={t.cancelTitle}>
        <p className="body-6 text-ink-soft">{explain}</p>
        {error && (
          <p role="alert" className="caption-2 text-danger">
            {t.cancelFailed}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} disabled={busy} className={secondaryButton}>
            {t.keep}
          </button>
          <button type="button" onClick={confirm} disabled={busy} className={primaryButton}>
            {busy ? t.cancelling : t.yesCancel}
          </button>
        </div>
      </Dialog>
    </>
  );
}

/** One booking as a card (the list on /bookings and the history). */
export default function BookingCard({
  b,
  photo,
  now,
  detailsHref = true,
  onCancelled,
  footer,
}: {
  b: Booking;
  photo: string | null;
  now: number;
  detailsHref?: boolean;
  onCancelled?: (message: string) => void;
  footer?: React.ReactNode;
}) {
  const t = useT(bookingText);
  const locale = useLocale();
  const name = b.astrologerName || t.astrologer;
  const open = b.status === "CONFIRMED" || b.status === "WAITING" || b.status === "IN_PROGRESS";
  const isPack = b.channel === "chat" && b.durationMinutes <= 1;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <AstrologerAvatar name={name} photo={photo} size={52} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <NameLine b={b} className="title-4 truncate text-ink" />
            <StatusChip status={b.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ChannelBadge channel={b.channel} />
            <span className="caption-2 text-ink-soft">{isPack ? t.chatPack : whenLabel(b, locale)}</span>
            {!isPack && b.durationMinutes > 0 && <span className="caption-2 text-ink-soft">{t.min(b.durationMinutes)}</span>}
            <span className="caption-2 text-ink-soft">{t.pts(b.pointsCharged)}</span>
          </div>
          {b.channel === "chat" && b.questionsAllowed > 0 && <p className="caption-2 text-ink-soft">{t.questions(b.questionsUsed, b.questionsAllowed)}</p>}
          {isCancelled(b) && b.pointsRefunded > 0 && <p className="caption-2 text-success">{t.refunded(b.pointsRefunded)}</p>}
        </div>
        {detailsHref && (
          <Link href={`/bookings/${encodeURIComponent(b.id)}`} aria-label={`${t.details}: ${name}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-surface-sunken hover:text-ink">
            <PiArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        )}
      </div>
      {(open || footer) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <div className="flex flex-wrap items-center gap-3">{open && <JoinAction b={b} now={now} />}</div>
          <div className="flex items-center gap-2">
            {open && onCancelled && <CancelAction b={b} onCancelled={onCancelled} />}
            {footer}
          </div>
        </div>
      )}
    </li>
  );
}
