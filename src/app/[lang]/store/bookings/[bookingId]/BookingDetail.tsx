"use client";

import { useState } from "react";
import { PiArrowLeft } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { contentLang } from "@/lib/services/astrologerModel";
import { cancelPujaBooking, formatDate, getPujaBooking, rupee, type PujaBooking } from "@/lib/services/store";
import StatusBadge from "../../StatusBadge";
import { bookingStatus } from "../../status";
import { BTN_SECONDARY, CARD, LoadError, Notice, PAGE, Skeleton, useLoad, useSignedIn } from "../../ui";

const text = defineMessages({
  hi: {
    back: "मेरी पूजा बुकिंग",
    notFound: "यह बुकिंग नहीं मिली",
    notFoundBody: "हो सकता है लिंक गलत हो, या यह बुकिंग किसी दूसरे account की हो।",
    booking: (id: string) => `बुकिंग ${id}`,
    booked: (d: string) => `${d} को बुक की गई`,
    when: "पूजा की तारीख और समय",
    devotee: "यजमान",
    name: "नाम",
    father: "पिता का नाम",
    gotra: "गोत्र",
    mobile: "मोबाइल",
    whatsapp: "WhatsApp",
    gender: "लिंग",
    marital: "वैवाहिक स्थिति",
    address: "पता",
    birth: "जन्म विवरण",
    birthDate: "जन्म तिथि और समय",
    birthPlace: "जन्म का स्थान",
    request: "विशेष निवेदन",
    payment: "भुगतान",
    amount: "राशि",
    paymentId: "पेमेंट आईडी",
    refund: (a: string) => `रिफंड: ${a}`,
    cancel: "बुकिंग रद्द करें",
    cancelAsk: "पूरी राशि आपके भुगतान माध्यम में वापस जाएगी। रद्द करें?",
    cancelYes: "हाँ, रद्द करें",
    cancelNo: "नहीं, रखें",
    cancelNote: "पूजा की तारीख से 48 घंटे पहले तक रद्द कर सकते हैं।",
    cancelled: "बुकिंग रद्द हो गई। रिफंड शुरू किया जा रहा है।",
    cancelFailed: "बुकिंग रद्द नहीं हो सकी। फिर कोशिश करें, या सपोर्ट से संपर्क करें।",
    loading: "बुकिंग लोड हो रही है",
  },
  en: {
    back: "My puja bookings",
    notFound: "This booking was not found",
    notFoundBody: "The link may be wrong, or the booking may belong to another account.",
    booking: (id) => `Booking ${id}`,
    booked: (d) => `Booked ${d}`,
    when: "Puja date and time",
    devotee: "Devotee",
    name: "Name",
    father: "Father's name",
    gotra: "Gotra",
    mobile: "Mobile",
    whatsapp: "WhatsApp",
    gender: "Gender",
    marital: "Marital status",
    address: "Address",
    birth: "Birth details",
    birthDate: "Date and time of birth",
    birthPlace: "Place of birth",
    request: "Special request",
    payment: "Payment",
    amount: "Amount",
    paymentId: "Payment ID",
    refund: (a) => `Refund: ${a}`,
    cancel: "Cancel this booking",
    cancelAsk: "The full amount goes back to your payment method. Cancel the booking?",
    cancelYes: "Yes, cancel",
    cancelNo: "No, keep it",
    cancelNote: "You can cancel up to 48 hours before the puja date.",
    cancelled: "The booking is cancelled. Your refund is being started.",
    cancelFailed: "The booking could not be cancelled. Try again, or contact support.",
    loading: "Loading the booking",
  },
});

/** Same rule as the backend (canUserCancelPuja): paid, not cancelled, 48 hours or more before the puja day. */
function cancellable(b: PujaBooking) {
  if ((b.payment_status || "").toUpperCase() !== "PAID") return false;
  const st = (b.booking_status || "").toUpperCase();
  if (st === "CANCELLED" || st === "COMPLETED") return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(b.booking_date || "");
  if (!m) return false;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() - Date.now() >= 48 * 3600 * 1000;
}

export default function BookingDetail({ bookingId }: { bookingId: string }) {
  const t = useT(text);
  const ready = useSignedIn();
  const { state, retry } = useLoad((signal) => getPujaBooking(bookingId, signal), ready, [bookingId]);
  return (
    <div className={`${PAGE} max-w-3xl`}>
      <Link href="/store/orders?tab=pujas" className="button-sm inline-flex items-center gap-2 text-ink-soft hover:text-ink">
        <PiArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </Link>
      <div className="mt-4">
        {(!ready || state.status === "loading") && (
          <div role="status" aria-label={t.loading}>
            <Skeleton className="h-96 w-full" />
          </div>
        )}
        {ready && state.status === "error" && <LoadError error={state.error} onRetry={retry} />}
        {ready && state.status === "ready" && (state.data ? <Body booking={state.data} onChanged={retry} /> : <Notice title={t.notFound} body={t.notFoundBody} />)}
      </div>
    </div>
  );
}

function Body({ booking: b, onChanged }: { booking: PujaBooking; onChanged: () => void }) {
  const t = useT(text);
  const d = b.booking_details ?? {};
  const [step, setStep] = useState<"idle" | "ask" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setStep("busy");
    try {
      await cancelPujaBooking(b.id);
      setStep("done");
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError && e.message ? e.message : t.cancelFailed);
      setStep("error");
    }
  }

  const rows = (list: [string, string | undefined | null][]) =>
    list
      .filter(([, v]) => v)
      .map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4">
          <dt className="caption-2 text-ink-muted">{k}</dt>
          <dd lang={contentLang(v)} className="title-5 text-right text-ink">
            {v}
          </dd>
        </div>
      ));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 lang={contentLang(b.puja_title)} className="heading-5 text-ink md:heading-4">
            {b.puja_title}
          </h1>
          <p className="caption-2 text-ink-muted">{[t.booking(d.checkoutBookingId ?? b.id.slice(0, 8).toUpperCase()), t.booked(formatDate(b.created_at))].join(" · ")}</p>
        </div>
        <StatusBadge status={bookingStatus(b)} />
      </header>

      <section className={`${CARD} p-4 md:p-6`}>
        <h2 className="heading-6 text-ink">{t.when}</h2>
        <p className="title-3 mt-2 text-ink">{[d.poojaDate || formatDate(b.booking_date), d.poojaTime].filter(Boolean).join(", ")}</p>
      </section>

      <section className={`${CARD} p-4 md:p-6`}>
        <h2 className="heading-6 text-ink">{t.devotee}</h2>
        <dl className="mt-3 space-y-2">
          {rows([
            [t.name, d.name],
            [t.father, d.fatherName],
            [t.gotra, d.gotra],
            [t.mobile, d.mobile],
            [t.whatsapp, d.whatsapp],
            [t.gender, d.gender],
            [t.marital, d.maritalStatus],
            [t.address, d.address],
          ])}
        </dl>
      </section>

      <section className={`${CARD} p-4 md:p-6`}>
        <h2 className="heading-6 text-ink">{t.birth}</h2>
        <dl className="mt-3 space-y-2">
          {rows([
            [t.birthDate, [d.birthDate, d.birthTime].filter(Boolean).join(", ")],
            [t.birthPlace, [d.birthPlace, d.birthState, d.birthCountry].filter(Boolean).join(", ")],
            [t.request, d.specificRequirement],
          ])}
        </dl>
      </section>

      <section className={`${CARD} p-4 md:p-6`}>
        <h2 className="heading-6 text-ink">{t.payment}</h2>
        <dl className="mt-3 space-y-2">
          {rows([
            [t.amount, rupee(Number(b.amount))],
            [t.paymentId, b.razorpay_payment_id],
            ...(b.refund_amount ? ([[t.refund(rupee(Number(b.refund_amount))), b.refund_status]] as [string, string | null | undefined][]) : []),
          ])}
        </dl>
      </section>

      <div aria-live="polite" className="flex flex-col gap-3">
        {step === "done" && <Notice tone="success" title={t.cancelled} />}
        {step === "error" && error && <Notice tone="danger" title={error} />}
        {cancellable(b) && step !== "done" && (
          <>
            {step === "ask" || step === "busy" ? (
              <Notice tone="warning" title={t.cancelAsk}>
                <div className="flex gap-2">
                  <button type="button" onClick={cancel} disabled={step === "busy"} className={`${BTN_SECONDARY} !px-4 !py-2`}>
                    {t.cancelYes}
                  </button>
                  <button type="button" onClick={() => setStep("idle")} disabled={step === "busy"} className={`${BTN_SECONDARY} !px-4 !py-2`}>
                    {t.cancelNo}
                  </button>
                </div>
              </Notice>
            ) : (
              <div>
                <button type="button" onClick={() => setStep("ask")} className={BTN_SECONDARY}>
                  {t.cancel}
                </button>
                <p className="caption-3 mt-2 text-ink-muted">{t.cancelNote}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
