"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { PiCheckBold, PiShieldCheck } from "react-icons/pi";
import { CHART } from "@/components/ChartOutline";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { EASE_OUT, fadeUp, popIn, stagger } from "@/lib/motion";
import MotionCta from "./MotionCta";

const { VB, P, DIAMOND_POINTS } = CHART;

const text = defineMessages({
  hi: { kicker: "मुफ़्त · हिंदी में", noRisk: "कोई जोखिम नहीं" },
  en: { kicker: "Free · in English and Hindi", noRisk: "No risk" },
});

/** The faint chart motif turns 12° into place as the section arrives (transform and opacity only). */
const motif: Variants = {
  hidden: { opacity: 0, rotate: 12, scale: 0.9 },
  show: { opacity: 0.16, rotate: 0, scale: 1, transition: { duration: 0.8, ease: EASE_OUT } },
};

/** Stars on the navy card, as % of the section. */
const STARS = [
  { top: "14%", left: "52%", delay: 0 },
  { top: "28%", left: "94%", delay: 1.3 },
  { top: "78%", left: "58%", delay: 0.7 },
  { top: "88%", left: "6%", delay: 2.1 },
  { top: "10%", left: "4%", delay: 1.7 },
];

type Props = {
  title: string;
  body: string;
  cta: { href: string; label: string };
  /** Risk reversal: what the visitor does not risk by clicking. */
  promises: string[];
};

/**
 * Final call to action (A2 #12, identical to the hero's). Message and button on the left; on wide screens
 * the risk reversal sits in a raised panel on the right so the card is balanced, over a faint kundli
 * chart cropped by the card's edge. Everything arrives once, in reading order, when it scrolls into view.
 */
export default function FinalCta({ title, body, cta, promises }: Props) {
  const reduce = useReducedMotion();
  const t = useT(text);

  return (
    <motion.section
      aria-labelledby="final-title"
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="on-inverse relative mb-8 overflow-hidden rounded-3xl bg-surface-inverse text-ink-inverse"
    >
      <motion.svg
        aria-hidden
        variants={motif}
        viewBox={`0 0 ${VB} ${VB}`}
        className="pointer-events-none absolute -bottom-24 -right-24 hidden h-96 w-96 text-brand-on-inverse md:block"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      >
        <rect x={P} y={P} width={VB - 2 * P} height={VB - 2 * P} rx={8} />
        <line x1={P} y1={P} x2={VB - P} y2={VB - P} />
        <line x1={VB - P} y1={P} x2={P} y2={VB - P} />
        <polygon points={DIAMOND_POINTS} />
      </motion.svg>

      {STARS.map(({ top, left, delay }) => (
        <motion.span
          key={`${top}-${left}`}
          aria-hidden
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-brand-on-inverse"
          style={{ top, left }}
          initial={{ opacity: 0.4 }}
          animate={reduce ? { opacity: 0.4 } : { opacity: [0.15, 0.9, 0.15] }}
          transition={reduce ? undefined : { duration: 3.2, ease: EASE_OUT, repeat: Infinity, delay }}
        />
      ))}

      <div className="relative grid grid-cols-1 gap-8 p-8 md:p-12 lg:grid-cols-5 lg:items-center lg:gap-12">
        <div className="lg:col-span-3">
          <motion.p variants={fadeUp} className="caption-3 text-brand-on-inverse">
            {t.kicker}
          </motion.p>
          <motion.h2 variants={fadeUp} id="final-title" className="heading-5 md:heading-3 mt-3 max-w-[680px]">
            {title}
          </motion.h2>
          <motion.p variants={fadeUp} className="body-3 mt-4 max-w-[680px] text-ink-inverse-soft">
            {body}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8">
            <MotionCta href={cta.href}>{cta.label}</MotionCta>
          </motion.div>
        </div>

        <motion.div variants={fadeUp} className="rounded-2xl border border-line-inverse bg-surface-inverse-raised p-6 lg:col-span-2">
          <p className="title-3 flex items-center gap-2 text-ink-inverse">
            <PiShieldCheck className="h-5 w-5 text-brand-on-inverse" aria-hidden />
            {t.noRisk}
          </p>
          <motion.ul variants={stagger} className="mt-4 flex flex-col gap-4">
            {promises.map((item) => (
              <motion.li key={item} variants={fadeUp} className="body-5 flex items-start gap-3 text-ink-inverse-soft">
                <motion.span variants={popIn} className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-brand-ink">
                  <PiCheckBold className="h-3 w-3" aria-hidden />
                </motion.span>
                {item}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </motion.section>
  );
}
