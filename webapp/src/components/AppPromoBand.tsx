"use client";

import type { IconType } from "react-icons";
import { PiBell, PiChatCircleDots, PiGooglePlayLogo, PiPlanet } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { PLAY_STORE_URL } from "@/lib/site";

const text = defineMessages({
  hi: {
    eyebrow: "ऐप डाउनलोड करें",
    title: "आपका ज्योतिषी,",
    accent: "आपकी जेब में",
    body: "AstroShrine ऐप पर chat, call और रोज़ का राशिफल पाइए।",
    points: [
      { title: "तुरंत chat और call", detail: "कुछ ही सेकंड में astrologer से बात" },
      { title: "रोज़ राशिफल अलर्ट", detail: "हर सुबह आपका राशिफल" },
      { title: "कुंडली हमेशा साथ", detail: "चार्ट और दशा, कहीं भी" },
    ],
    getItOn: "GET IT ON",
    googlePlay: "Google Play",
    label: "Google Play पर पाएं (नए टैब में खुलेगा)",
  },
  en: {
    eyebrow: "Download the app",
    title: "Your astrologer,",
    accent: "in your pocket",
    body: "Chat, call and get your daily rashifal on the AstroShrine app.",
    points: [
      { title: "Instant chat and call", detail: "Talk to an astrologer in seconds" },
      { title: "Daily rashifal alerts", detail: "Your reading every morning" },
      { title: "Kundli always with you", detail: "Charts and dasha on the go" },
    ],
    getItOn: "GET IT ON",
    googlePlay: "Google Play",
    label: "Get it on Google Play (opens in a new tab)",
  },
});

const ICONS: IconType[] = [PiChatCircleDots, PiBell, PiPlanet];

/** "Your astrologer, in your pocket": the navy Google Play band that closes an inner page, above the footer. */
export default function AppPromoBand() {
  const t = useT(text);
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-14 pb-10 md:px-8 md:pt-20">
      <div className="on-inverse grid gap-6 overflow-hidden rounded-3xl bg-[linear-gradient(160deg,#1D2D50_0%,#14213D_60%,#0F1A33_100%)] p-6 text-ink-inverse shadow-[0_18px_40px_rgba(20,33,61,.16),inset_0_0_0_1px_rgba(255,174,0,.2)] md:p-8 lg:grid-cols-2 lg:items-center lg:gap-10">
        <div className="flex min-w-0 flex-col items-start gap-3">
          <span className="font-display text-[13px] font-medium tracking-[.02em] text-brand">{t.eyebrow}</span>
          <h2 className="font-display text-3xl leading-[1.15] font-semibold tracking-[-0.01em] md:text-4xl">
            {t.title} <span className="text-brand">{t.accent}</span>
          </h2>
          <p className="text-ink-inverse-soft">{t.body}</p>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.label}
            className="mt-2 flex h-[46px] items-center gap-[9px] rounded-[10px] border border-[#444] bg-black px-4 text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,.3)]"
          >
            <PiGooglePlayLogo className="h-6 w-6" aria-hidden />
            <span className="flex flex-col leading-[1.05]">
              <small className="text-[9px] font-medium tracking-[.02em]">{t.getItOn}</small>
              <b className="text-[15px] font-semibold tracking-[-0.01em]">{t.googlePlay}</b>
            </span>
          </a>
        </div>
        <ul className="flex flex-col gap-3">
          {t.points.map(({ title, detail }, i) => {
            const Icon = ICONS[i];
            return (
              <li key={title} className="flex items-center gap-3.5 rounded-2xl border border-brand/20 bg-white/5 px-4 py-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand/25 bg-brand/10">
                  <Icon className="h-5 w-5 text-brand" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-col">
                  <b className="font-display text-[15px] font-semibold">{title}</b>
                  <small className="text-[13px] text-ink-inverse-soft">{detail}</small>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
