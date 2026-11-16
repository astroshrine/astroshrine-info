"use client";

import { useState } from "react";
import { PiCaretLeft, PiCaretRight, PiStarFill } from "react-icons/pi";
import { Reveal } from "@/components/Reveal";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { SAMPLE_LETTERS, SAMPLE_RATING } from "./samples/letters";

const text = defineMessages({
  hi: {
    eyebrow: "आपके अनुभव",
    title: "जिन्हें हमने राह दिखाई, उनके शब्द",
    rating: "हमारे उपयोगकर्ताओं की औसत रेटिंग",
    prev: "पिछला अनुभव",
    next: "अगला अनुभव",
    choose: "अनुभव चुनें",
    note: (n: number) => `अनुभव ${n}`,
    stars: "5 में से 5 सितारे",
  },
  en: {
    eyebrow: "Testimonials",
    title: "Notes from people we have guided",
    rating: "average rating from our users",
    prev: "Previous note",
    next: "Next note",
    choose: "Choose note",
    note: (n) => `Note ${n}`,
    stars: "5 out of 5 stars",
  },
});

const navButton =
  "grid h-12 w-12 place-items-center rounded-xl border-[1.5px] border-ink text-ink transition hover:bg-surface-inverse hover:text-ink-inverse motion-safe:active:scale-95";

/** Testimonial letters: one note at a time with previous/next buttons and pips (sample copy in ./samples/letters). */
export default function LettersSection() {
  const t = useT(text);
  const locale = useLocale();
  const letters = SAMPLE_LETTERS[locale];
  const [index, setIndex] = useState(0);
  const letter = letters[index];
  const go = (to: number) => setIndex((to + letters.length) % letters.length);

  return (
    <section aria-labelledby="letters-title" className="pb-16 md:pb-[104px]">
      <Reveal className="grid grid-cols-1 items-center gap-10 md:grid-cols-[1fr_1.3fr] md:gap-16">
        <div>
          <p className="font-display text-sm font-medium tracking-[.02em] text-brand-strong">{t.eyebrow}</p>
          <h2 id="letters-title" className="mt-2.5 font-display text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] text-ink md:text-[38px]">
            {t.title}
          </h2>
          <p className="mt-7 flex flex-wrap items-baseline gap-x-2.5">
            <b className="font-display text-[64px] leading-none font-semibold tracking-[-0.03em] text-ink md:text-[88px]">{SAMPLE_RATING}</b>
            <span className="font-semibold text-ink-soft">{t.rating}</span>
          </p>
          <div className="mt-7 flex gap-2.5">
            <button type="button" aria-label={t.prev} onClick={() => go(index - 1)} className={navButton}>
              <PiCaretLeft className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <button type="button" aria-label={t.next} onClick={() => go(index + 1)} className={navButton}>
              <PiCaretRight className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        </div>

        <div>
          <article
            aria-live="polite"
            className="relative rounded-[6px] border border-line bg-surface-card p-7 shadow-[12px_12px_0_var(--color-surface-sunken)] md:px-[52px] md:py-12"
          >
            <span aria-hidden className="absolute top-0 left-9 font-display text-[96px] leading-none font-bold text-brand">
              “
            </span>
            <p key={index} className="mt-[30px] mb-7 font-display text-lg leading-[1.55] font-medium tracking-[-0.01em] text-ink motion-safe:animate-reveal-down md:text-[22px]">
              {letter.text}
            </p>
            <div className="flex items-center justify-between gap-4 border-t border-line pt-[18px]">
              <span>
                <b className="block font-semibold text-ink">{letter.name}</b>
                <small className="text-ink-soft">{locale === "hi" ? `${letter.city}, भारत` : `${letter.city}, India`}</small>
              </span>
              <span role="img" aria-label={t.stars} className="flex gap-0.5 text-brand">
                {[0, 1, 2, 3, 4].map((i) => (
                  <PiStarFill key={i} className="h-4 w-4" aria-hidden />
                ))}
              </span>
            </div>
          </article>
          <div role="group" aria-label={t.choose} className="mt-[22px] flex items-center gap-2">
            {letters.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={t.note(i + 1)}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-2.5 rounded-full transition-all ${i === index ? "w-7 bg-brand" : "w-2.5 bg-line-strong"}`}
              />
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
