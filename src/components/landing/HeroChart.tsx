"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, type Variants } from "framer-motion";
import { CHART } from "@/components/ChartOutline";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { EASE_OUT, fadeUp, popIn } from "@/lib/motion";

const { VB, P, HOUSE_CENTER, LAGNA_POINTS, DIAMOND_POINTS } = CHART;

const text = defineMessages({
  hi: {
    houses: "भाव",
    planets: "ग्रह",
    vargas: "वर्ग चार्ट",
    caption: "नमूना चार्ट: आपकी कुंडली इसी रूप में बनेगी।",
  },
  en: {
    houses: "Houses",
    planets: "Planets",
    vargas: "Divisional charts",
    caption: "Sample chart: your Kundli will look like this.",
  },
});

/** SVG parts scale around their own centre, not the SVG origin. */
const OWN_CENTER = { transformBox: "fill-box", transformOrigin: "center" } as const;

/** The card rises in just after the hero copy starts. */
const card: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: EASE_OUT, delay: 0.2, when: "beforeChildren", staggerChildren: 0.04 },
  },
};

/** The chart assembles: frame, then the twelve house numbers in house order, then the lagna lights up. */
const frame: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE_OUT } },
};
const houses: Variants = { hidden: {}, show: { transition: { delayChildren: 0.25, staggerChildren: 0.05 } } };
const lagna: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7, ease: EASE_OUT, delay: 0.95 } },
};
const chips: Variants = { hidden: {}, show: { transition: { delayChildren: 0.9, staggerChildren: 0.08 } } };

/** Faint stars around the card (decoration). Positions are in % of the figure. */
const STARS: { top: string; left: string; delay: number }[] = [
  { top: "6%", left: "8%", delay: 0 },
  { top: "14%", left: "92%", delay: 1.1 },
  { top: "48%", left: "3%", delay: 2.2 },
  { top: "62%", left: "96%", delay: 0.6 },
  { top: "94%", left: "18%", delay: 1.7 },
  { top: "90%", left: "84%", delay: 2.8 },
];

const TILT = 6; // degrees at the card's edge

/**
 * Hero visual: the product's own North Indian chart (a blank sample) assembling on load, with what every
 * kundli includes. On a mouse or trackpad the card tilts a few degrees toward the pointer. With reduced
 * motion: no tilt and no twinkle, and the reveal is a plain fade (MotionConfig in AppShell).
 */
export default function HeroChart({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const t = useT(text);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 150, damping: 20, mass: 0.6 });
  const rotateY = useSpring(ry, { stiffness: 150, damping: 20, mass: 0.6 });

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    rx.set(-y * TILT * 2);
    ry.set(x * TILT * 2);
  };
  const onPointerLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.figure
      variants={card}
      initial="hidden"
      animate="show"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={`relative rounded-3xl border border-line bg-surface-card p-6 ${className}`}
    >
      {STARS.map(({ top, left, delay }) => (
        <motion.span
          key={`${top}-${left}`}
          aria-hidden
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-brand"
          style={{ top, left }}
          initial={{ opacity: 0.5 }}
          animate={reduce ? { opacity: 0.5 } : { opacity: [0.2, 1, 0.2] }}
          transition={reduce ? undefined : { duration: 3.2, ease: EASE_OUT, repeat: Infinity, delay }}
        />
      ))}

      <div className="mx-auto max-w-sm">
        <svg viewBox={`0 0 ${VB} ${VB}`} aria-hidden className="h-auto w-full">
          <motion.g variants={frame} style={OWN_CENTER}>
            <rect x={P} y={P} width={VB - 2 * P} height={VB - 2 * P} rx={8} className="fill-surface-sunken" />
          </motion.g>
          <motion.polygon variants={lagna} points={LAGNA_POINTS} className="fill-brand-soft" />
          <motion.g variants={frame} style={OWN_CENTER} className="stroke-brand-strong" strokeWidth={1.5} fill="none" strokeLinejoin="round">
            <rect x={P} y={P} width={VB - 2 * P} height={VB - 2 * P} rx={8} />
            <line x1={P} y1={P} x2={VB - P} y2={VB - P} />
            <line x1={VB - P} y1={P} x2={P} y2={VB - P} />
            <polygon points={DIAMOND_POINTS} />
          </motion.g>
          <motion.g variants={houses}>
            {HOUSE_CENTER.map(([x, y], i) => (
              <motion.text
                key={i}
                variants={popIn}
                style={OWN_CENTER}
                x={x}
                y={y + 6}
                textAnchor="middle"
                fontSize={20}
                fontWeight={600}
                className={i === 0 ? "fill-brand-strong" : "fill-ink-muted"}
              >
                {i + 1}
              </motion.text>
            ))}
          </motion.g>
        </svg>
      </div>

      <motion.ul variants={chips} className="mt-6 grid grid-cols-3 gap-2 text-center">
        {[
          ["12", t.houses],
          ["9", t.planets],
          ["16", t.vargas],
        ].map(([value, label]) => (
          <motion.li key={value} variants={fadeUp} className="rounded-xl bg-surface-sunken p-3">
            <span className="title-3 block text-ink">{value}</span>
            <span className="caption-5 block text-ink-soft">{label}</span>
          </motion.li>
        ))}
      </motion.ul>
      <motion.figcaption variants={fadeUp} className="caption-5 mt-4 text-center text-ink-muted">
        {t.caption}
      </motion.figcaption>
    </motion.figure>
  );
}
