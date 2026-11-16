// SAMPLE COPY taken from the design file. Replace with real data before launch.

import type { Locale } from "@/i18n/config";

type Copy = Record<Locale, string>;

export type RemedyKey = "puja" | "gem" | "rudraksha";

export const REMEDIES: Record<RemedyKey, { title: Copy; body: Copy; cta: Copy }> = {
  puja: {
    title: { hi: "ऑनलाइन पूजा", en: "Online puja" },
    body: {
      hi: "भारत भर के मंदिरों में सत्यापित पंडितों द्वारा लाइव पूजा, संकल्प में आपका नाम और गोत्र।",
      en: "Live puja by verified pandits at temples across India, with your name and gotra in the sankalp.",
    },
    cta: { hi: "पूजा बुक करें", en: "Book a puja" },
  },
  gem: {
    title: { hi: "प्रमाणित रत्न", en: "Certified gemstones" },
    body: {
      hi: "लैब-टेस्टेड रत्न, आपकी कुंडली के अनुसार चुने गए, पहनने की विधि आपके ज्योतिषी से।",
      en: "Lab-tested ratna chosen for your chart, with wearing instructions from your astrologer.",
    },
    cta: { hi: "मेरा रत्न खोजें", en: "Find my gemstone" },
  },
  rudraksha: {
    title: { hi: "रुद्राक्ष और यंत्र", en: "Rudraksha and yantra" },
    body: {
      hi: "असली रुद्राक्ष, यंत्र और पूजा सामग्री, भेजने से पहले ऊर्जित।",
      en: "Original rudraksha, yantras and puja items, energised before dispatch.",
    },
    cta: { hi: "उपाय खरीदें", en: "Shop remedies" },
  },
};
