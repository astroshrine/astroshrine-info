import type { ReactNode } from "react";
import { PiGooglePlayLogo, PiPlus } from "react-icons/pi";
import { Reveal, RevealItem } from "@/components/Reveal";
import { defineMessages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { PLAY_STORE_URL } from "@/lib/site";

const text = defineMessages({
  hi: {
    eyebrow: "प्रश्न",
    app: "आपका ज्योतिषी, आपकी जेब में",
    appBody: "AstroShrine ऐप पर राशिफल अलर्ट, चैट का इतिहास और तुरंत जवाब पाइए।",
    getItOn: "यहाँ से पाएं",
    newTab: "(नए टैब में खुलेगा)",
  },
  en: {
    eyebrow: "Questions",
    app: "Your astrologer, in your pocket",
    appBody: "Get rashifal alerts, chat history and instant replies on the AstroShrine app.",
    getItOn: "Get it on",
    newTab: "(opens in a new tab)",
  },
});

/**
 * The FAQ as an accordion (native details, so it also works without scripts) beside the app card with the Google
 * Play link. The FAQPage JSON-LD is written by the page from the same list.
 */
export default async function FaqSection({ title, note, items }: { title: string; note: ReactNode; items: { q: string; a: string }[] }) {
  const t = text[await getLocale()];
  return (
    <section aria-labelledby="faq-title" className="pb-16 md:pb-[104px]">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.2fr_.8fr] lg:gap-12">
        <div>
          <Reveal>
            <p className="font-display text-sm font-medium tracking-[.02em] text-brand-strong">{t.eyebrow}</p>
            <h2 id="faq-title" className="mt-2.5 mb-5 font-display text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] text-ink md:text-[38px]">
              {title}
            </h2>
          </Reveal>
          <Reveal as="ul" group>
            {items.map(({ q, a }) => (
              <RevealItem as="li" key={q} className="border-b border-line">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-[22px] text-left text-lg font-bold text-ink [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-full border-[1.5px] border-brand transition-transform duration-200 group-open:rotate-45 group-open:bg-brand">
                      <PiPlus className="h-3.5 w-3.5 text-ink" aria-hidden />
                    </span>
                  </summary>
                  <p className="pr-12 pb-[22px] leading-[1.7] text-ink-soft group-open:animate-reveal-down">{a}</p>
                </details>
              </RevealItem>
            ))}
          </Reveal>
          <p className="mt-5 text-sm text-ink-soft">{note}</p>
        </div>

        <Reveal as="div" className="relative rounded-[28px_28px_180px_28px] bg-surface-inverse p-8 pb-12 text-ink-inverse md:p-10 md:pb-24 lg:sticky lg:top-[120px]">
          <h3 className="font-display text-[28px] leading-[1.1] font-semibold tracking-[-0.01em] md:text-[38px]">{t.app}</h3>
          <p className="mt-3.5 mb-6 text-ink-inverse-soft">{t.appBody}</p>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[58px] items-center gap-3 rounded-[14px] border border-brand/30 bg-white/10 px-5 transition hover:border-brand"
          >
            <PiGooglePlayLogo className="h-6 w-6 text-brand" aria-hidden />
            <span>
              <small className="block text-[11px] text-ink-inverse-soft">{t.getItOn}</small>
              <b className="block text-base leading-[1.1]">Google Play</b>
            </span>
            <span className="sr-only">{t.newTab}</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
