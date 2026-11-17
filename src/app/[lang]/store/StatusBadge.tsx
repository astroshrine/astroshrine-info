"use client";

import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { TONE_CLASS, type StatusKey, type Tone } from "./status";

const text = defineMessages({
  hi: {
    paymentPending: "भुगतान बाकी",
    paymentFailed: "भुगतान असफल",
    placed: "ऑर्डर मिला",
    confirmed: "कन्फर्म",
    shipped: "भेज दिया गया",
    delivered: "डिलीवर हुआ",
    cancelled: "रद्द",
    refunded: "रिफंड हुआ",
    completed: "पूरी हुई",
    processing: "प्रक्रिया में",
  } satisfies Record<StatusKey, string>,
  en: {
    paymentPending: "Payment pending",
    paymentFailed: "Payment failed",
    placed: "Order placed",
    confirmed: "Confirmed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
    completed: "Completed",
    processing: "Processing",
  },
});

export default function StatusBadge({ status }: { status: { key: StatusKey; tone: Tone } }) {
  const t = useT(text);
  return <span className={`caption-3 inline-block rounded-full px-2.5 py-1 ${TONE_CLASS[status.tone]}`}>{t[status.key]}</span>;
}
