"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import Link from "@/i18n/Link";
import { defineMessages } from "@/i18n/messages";
import { EASE_OUT } from "@/lib/motion";
import { entryFor, istDate, useDailyHoroscope } from "@/lib/services/horoscope";
import { ELEMENTS, SIGNS } from "./zodiac";
import SectionHead from "./SectionHead";

const text = defineMessages({
  hi: {
    eyebrow: "आज का राशिफल",
    title: "अपनी राशि चुनें",
    lead: "अपनी राशि पर चक्र घुमाएँ और आज के प्रेम, काम और सेहत का हाल पढ़ें।",
    today: "आज",
    mood: (m: string) => `मूड: ${m}`,
    love: "प्रेम",
    career: "करियर",
    health: "सेहत",
    loading: "आज का राशिफल आ रहा है…",
    failed: "आज का राशिफल अभी नहीं खुल पाया। थोड़ी देर बाद फिर देखें।",
    wheel: "राशि चक्र",
    element: (e: string) => `${e} तत्व`,
    elementSign: (e: string) => `${e} राशि`,
    ruledBy: (l: string) => `स्वामी: ${l}`,
    number: "शुभ अंक",
    colour: "शुभ रंग",
    time: "शुभ समय",
    ask: "अपनी राशि के बारे में पूछें",
    full: "पूरा राशिफल",
  },
  en: {
    eyebrow: "Today's rashifal",
    title: "Choose your rashi",
    lead: "Turn the wheel to your sign and read today's outlook for love, work and health.",
    today: "Today",
    mood: (m: string) => `Mood: ${m}`,
    love: "Love",
    career: "Career",
    health: "Health",
    loading: "Loading today's rashifal…",
    failed: "Today's rashifal couldn't load. Please check again in a little while.",
    wheel: "Zodiac wheel",
    element: (e: string) => `${e} element`,
    elementSign: (e: string) => `${e} sign`,
    ruledBy: (l: string) => `Ruled by ${l}`,
    number: "Lucky number",
    colour: "Lucky colour",
    time: "Good time",
    ask: "Ask about my rashi",
    full: "Full reading",
  },
});

const STARS =
  "radial-gradient(1.4px 1.4px at 8% 18%,#fff 50%,transparent 51%),radial-gradient(1px 1px at 22% 72%,#fff 50%,transparent 51%),radial-gradient(1.6px 1.6px at 37% 32%,#FFD27A 50%,transparent 51%),radial-gradient(1px 1px at 51% 86%,#fff 50%,transparent 51%),radial-gradient(1.3px 1.3px at 64% 14%,#fff 50%,transparent 51%),radial-gradient(1px 1px at 78% 58%,#FFD27A 50%,transparent 51%),radial-gradient(1.5px 1.5px at 91% 28%,#fff 50%,transparent 51%),radial-gradient(1px 1px at 96% 82%,#fff 50%,transparent 51%),radial-gradient(1.2px 1.2px at 4% 92%,#fff 50%,transparent 51%),radial-gradient(1px 1px at 44% 6%,#fff 50%,transparent 51%)";

const SYMBOL_FONT = "'Segoe UI Symbol','DejaVu Sans',serif";
const glyph = (code: number) => `${String.fromCodePoint(code)}︎`;

/** Tick marks every 5 degrees (big every 30) and a dot between signs, as in the design (520 unit viewBox). */
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const a = i * 5;
  const big = a % 30 === 0;
  const r1 = big ? 248 : 252;
  const rad = ((a - 90) * Math.PI) / 180;
  return { a, big, x1: r3(260 + r1 * Math.cos(rad)), y1: r3(260 + r1 * Math.sin(rad)), x2: r3(260 + 259 * Math.cos(rad)), y2: r3(260 + 259 * Math.sin(rad)) };
});
const DOTS = Array.from({ length: 12 }, (_, k) => {
  const a = ((k * 30 + 15 - 90) * Math.PI) / 180;
  return { cx: r3(260 + 186 * Math.cos(a)), cy: r3(260 + 186 * Math.sin(a)) };
});

const WHEEL_EASE = "cubic-bezier(.7,0,.2,1)";

/** The rashifal band: a zodiac wheel that turns to the chosen sign and the reading for it (the design's #rashifal). */
export default function RashifalSection() {
  const t = useT(text);
  const locale = useLocale();
  const reduce = useReducedMotion();
  const [sel, setSel] = useState(0);
  const { data, failed } = useDailyHoroscope(locale);
  const [rot, setRot] = useState(0);
  const [touched, setTouched] = useState(false);

  const choose = (i: number) => {
    setTouched(true);
    // The shortest turn that puts the chosen sign under the pointer.
    setRot((cur) => {
      const diff = ((((-i * 30 - cur) % 360) + 540) % 360) - 180;
      return cur + diff;
    });
    setSel(i);
  };

  const sign = SIGNS[sel];
  const el = ELEMENTS[sel % 4][locale];
  const r = entryFor(data, sign.name.en);
  const swapKey = `${sel}-${data ? "data" : "wait"}`;
  const intl = locale === "hi" ? "hi-IN" : "en-IN";
  // The visitor's own date. Empty on the server and during hydration, so nothing differs between them.
  const today = useSyncExternalStore(
    () => () => {},
    () => new Date().toDateString(),
    () => "",
  );
  // The backend's date (IST) once the readings arrive, else today in IST as this browser counts it.
  const day = data?.date ?? (today ? istDate() : "");
  const dateLabel = day
    ? `${t.today}, ${new Date(`${day}T12:00:00+05:30`).toLocaleDateString(intl, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}`
    : t.today;

  // Content that changes with the sign (or arrives from the backend) fades up again; the first paint is plain.
  const swap = (delay = 0) =>
    ({
      initial: touched ? { opacity: 0, y: 8 } : false,
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease: EASE_OUT, delay },
    }) as const;

  return (
    <section
      id="rashifal"
      aria-labelledby="rashifal-title"
      className="relative isolate scroll-mt-24 overflow-hidden py-16 text-ink-inverse md:py-[104px]"
      style={{ background: "radial-gradient(ellipse 60% 70% at 26% 60%,#1E3060 0%,#14213D 55%,#0E1830 100%)" }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-35"
        style={{ backgroundImage: STARS }}
        animate={reduce ? undefined : { opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 translate-x-[3%] translate-y-[5%] scale-110"
        style={{ backgroundImage: STARS }}
        animate={reduce ? undefined : { opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: -2 }}
      />

      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
        <SectionHead id="rashifal-title" eyebrow={t.eyebrow} title={t.title} lead={t.lead} dark />

        <Reveal className="mt-10 grid grid-cols-1 items-center gap-12 md:mt-12 lg:grid-cols-[520px_1fr] lg:gap-[72px]">
          {/* Wheel */}
          <div
            role="group"
            aria-label={t.wheel}
            className="relative mx-auto aspect-square w-full max-w-[520px] rounded-full"
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              const next = (sel + (e.key === "ArrowRight" ? 1 : 11)) % 12;
              choose(next);
              e.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-sign]")[next]?.focus();
            }}
          >
            <div className="absolute inset-0 rounded-full border border-brand/[0.22]" aria-hidden />
            <div className="absolute inset-[13.46%] rounded-full border border-dashed border-brand/[0.14]" aria-hidden />

            <div
              className="absolute inset-0 motion-reduce:!transition-none"
              style={{ transform: `rotate(${rot}deg)`, transition: `transform 1.3s ${WHEEL_EASE}` }}
            >
              <svg viewBox="0 0 520 520" className="absolute inset-0 h-full w-full opacity-70" aria-hidden>
                {TICKS.map(({ a, big, x1, y1, x2, y2 }) => (
                  <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={big ? "#FFAE00" : "rgba(255,174,0,.35)"} strokeWidth={big ? 2 : 1} />
                ))}
                {DOTS.map((d, i) => (
                  <circle key={i} {...d} r="1.8" fill="rgba(255,174,0,.5)" />
                ))}
              </svg>
              {SIGNS.map((s, i) => {
                const a = ((i * 30 - 90) * Math.PI) / 180;
                const on = i === sel;
                return (
                  <button
                    key={s.short}
                    type="button"
                    data-sign
                    aria-label={s.name[locale]}
                    aria-pressed={on}
                    onClick={() => choose(i)}
                    className={`absolute z-[2] aspect-square w-[14.62%] -translate-x-1/2 -translate-y-1/2 rounded-full border transition-[background-color,border-color,scale,box-shadow] duration-300 motion-reduce:transition-none ${
                      on
                        ? "scale-[1.08] border-transparent bg-gradient-to-br from-[#FFDC85] to-brand text-brand-ink shadow-[0_12px_28px_rgba(255,174,0,0.25),0_0_0_5px_rgba(255,174,0,0.1)]"
                        : "border-brand/20 bg-[#0F1A33]/85 text-ink-inverse hover:scale-105 hover:border-brand/65 hover:bg-brand/[0.07]"
                    }`}
                    style={{ left: `${r3(50 + 43.27 * Math.cos(a))}%`, top: `${r3(50 + 43.27 * Math.sin(a))}%` }}
                  >
                    <span
                      className="flex h-full flex-col items-center justify-center gap-0.5 motion-reduce:!transition-none"
                      style={{ transform: `rotate(${-rot}deg)`, transition: `transform 1.3s ${WHEEL_EASE}` }}
                    >
                      <span className={`text-[17px] leading-none sm:text-[21px] ${on ? "text-brand-ink" : "text-brand"}`} style={{ fontFamily: SYMBOL_FONT }} aria-hidden>
                        {glyph(s.glyph)}
                      </span>
                      <small className={`text-[9px] font-semibold sm:text-[11px] ${on ? "text-brand-ink" : "text-[#CFCBC0]"}`}>{s.short}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Pointer and beam */}
            <motion.div
              key={`beam-${sel}`}
              aria-hidden
              className="absolute left-1/2 top-[8.46%] z-[1] h-[20%] w-px origin-top bg-gradient-to-b from-brand/55 to-transparent"
              initial={touched ? { scaleY: 0 } : false}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.9, ease: EASE_OUT }}
            />
            <motion.svg
              aria-hidden
              width="14"
              height="20"
              viewBox="0 0 14 20"
              className="absolute left-1/2 top-[-18px] z-[3] -ml-[7px] text-brand md:top-[-24px]"
              animate={reduce ? undefined : { y: [0, 5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d="M7 0l7 10-7 10-7-10z" fill="currentColor" />
            </motion.svg>

            {/* Core */}
            <div
              aria-hidden
              className="absolute inset-[28.85%] flex flex-col items-center justify-center overflow-hidden rounded-full border border-brand/50 text-center shadow-[0_0_0_7px_rgba(14,24,48,0.9),0_0_0_8px_rgba(255,174,0,0.22),0_28px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]"
              style={{ background: "radial-gradient(circle at 50% 30%,#24375F 0%,#15223F 55%,#0F1A33 100%)" }}
            >
              <motion.div
                key={sel}
                className="flex flex-col items-center"
                initial={touched ? { opacity: 0, scale: 0.88 } : false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: EASE_OUT }}
              >
                <span
                  className="bg-gradient-to-b from-[#FFE3A0] to-brand bg-clip-text text-[40px] leading-none text-transparent sm:text-[66px]"
                  style={{ fontFamily: SYMBOL_FONT }}
                >
                  {glyph(sign.glyph)}
                </span>
                <b className="mt-1 font-display text-lg font-semibold tracking-[-0.01em] text-ink-inverse sm:mt-2 sm:text-2xl">{sign.name[locale]}</b>
                <small className="mt-0.5 hidden text-[12.5px] text-[#9FA6BA] sm:block">{sign.dates[locale]}</small>
                <span className="mt-2.5 hidden border-t border-brand/25 pt-2 text-[11px] font-semibold tracking-[0.08em] text-[#D9B25C] sm:block">
                  {t.elementSign(el)}
                </span>
              </motion.div>
            </div>
          </div>

          {/* Reading */}
          <div aria-live="polite">
            <motion.h3 key={`h${swapKey}`} {...swap()} className="mt-7 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[32px]">
              {`${sign.name[locale]} · ${locale === "hi" ? sign.name.en : sign.short}`}
            </motion.h3>
            <motion.div key={`d${swapKey}`} {...swap(0.05)} className="mt-2 text-sm font-semibold text-[#D9B25C]">
              <time>{dateLabel}</time>
            </motion.div>
            <motion.div key={`t${swapKey}`} {...swap(0.1)} className="mt-3.5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/[0.18] bg-white/[0.035] px-3 py-1.5 text-[13px] font-medium text-[#DCD8CE]">
                <i className="h-1.5 w-1.5 rounded-full bg-brand" />
                {t.element(el)}
              </span>
              <span className="inline-flex items-center rounded-full border border-brand/[0.18] bg-white/[0.035] px-3 py-1.5 text-[13px] font-medium text-[#DCD8CE]">
                {t.ruledBy(sign.lord[locale])}
              </span>
              <span className="inline-flex items-center rounded-full border border-brand/[0.18] bg-white/[0.035] px-3 py-1.5 text-[13px] font-medium text-[#DCD8CE]">
                {sign.dates[locale]}
              </span>
            </motion.div>
            {r ? (
              <>
                <motion.p key={`p${swapKey}`} {...swap(0.15)} className="mt-[18px] max-w-[600px] text-[17px] leading-[1.75] text-ink-inverse-soft">
                  {r.prediction}
                </motion.p>

                <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {(
                    [
                      [t.love, r.love],
                      [t.career, r.career],
                      [t.health, r.health],
                    ] as const
                  ).map(([label, body], j) => (
                    <motion.div
                      key={`${swapKey}-${label}`}
                      initial={touched ? { opacity: 0, y: 8 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, ease: EASE_OUT, delay: j * 0.08 }}
                      className="rounded-2xl border border-brand/[0.16] bg-white/[0.025] p-4 transition-colors hover:border-brand/45"
                    >
                      <b className="block text-[15px] font-semibold text-brand">{label}</b>
                      <p className="mt-1.5 text-sm leading-[1.6] text-[#DCD8CE]">{body}</p>
                    </motion.div>
                  ))}
                </div>

                <p className="mt-6 flex flex-wrap gap-x-7 gap-y-1 text-sm text-[#9FA6BA]">
                  <span>
                    {t.number} <b className="font-semibold text-ink-inverse">{r.luckyNumber}</b>
                  </span>
                  <span>
                    {t.colour} <b className="font-semibold text-ink-inverse">{r.luckyColor}</b>
                  </span>
                  <span>
                    {t.time} <b className="font-semibold text-ink-inverse">{r.luckyTime}</b>
                  </span>
                  {r.mood && <span>{t.mood(r.mood)}</span>}
                </p>
              </>
            ) : failed || data ? (
              <p className="mt-[18px] max-w-[600px] text-[17px] leading-[1.75] text-ink-inverse-soft">{t.failed}</p>
            ) : (
              <div className="mt-[18px] max-w-[600px] space-y-2.5" role="status" aria-label={t.loading}>
                {[100, 92, 70].map((w) => (
                  <span key={w} className="block h-4 animate-pulse rounded bg-white/10" style={{ width: `${w}%` }} />
                ))}
              </div>
            )}

            <div className="mt-[30px] flex flex-wrap gap-3">
              <Link
                href="/astrologers"
                className="inline-flex h-[52px] items-center justify-center rounded-[14px] bg-brand px-[26px] text-[15px] font-semibold text-brand-ink transition-colors hover:bg-brand-hover motion-safe:active:translate-y-px"
              >
                {t.ask}
              </Link>
              <Link
                href="/kundli"
                className="inline-flex h-[52px] items-center justify-center rounded-[14px] border-[1.5px] border-ink-inverse/60 px-[26px] text-[15px] font-semibold text-ink-inverse transition-colors hover:bg-ink-inverse hover:text-ink motion-safe:active:translate-y-px"
              >
                {t.full}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
