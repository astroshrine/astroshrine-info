"use client";

import { useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { IconType } from "react-icons";
import { PiMoon, PiSunDim } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { EASE_OUT } from "@/lib/motion";
import { CHART_PLANETS, HERO_SAMPLE } from "./samples/hero";

// The design's sample North Indian chart: a 400 x 400 square, twelve clickable house polygons. Points are the
// corners (A..D), edge midpoints (T, R, M, L), the centre (O) and the four inner diamond corners (p1..p4).
const P: Record<string, [number, number]> = {
  A: [0, 0], B: [400, 0], C: [400, 400], D: [0, 400],
  T: [200, 0], R: [400, 200], M: [200, 400], L: [0, 200], O: [200, 200],
  p1: [100, 100], p2: [300, 100], p3: [300, 300], p4: [100, 300],
};
/** [polygon corners, label x, label y] for houses 1 to 12. */
const HOUSES: [string, number, number][] = [
  ["T p2 O p1", 200, 100], ["A T p1", 100, 38], ["A p1 L", 38, 100], ["L p1 O p4", 100, 200],
  ["L p4 D", 38, 300], ["D p4 M", 100, 362], ["M p4 O p3", 200, 300], ["M p3 C", 300, 362],
  ["C p3 R", 362, 300], ["R p3 O p2", 300, 200], ["R p2 B", 362, 100], ["B p2 T", 300, 38],
].map(([k, x, y]) => [(k as string).split(" ").map((c) => P[c].join(",")).join(" "), x as number, y as number]);

/** The card rises in just after the hero copy starts. */
const card: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE_OUT, delay: 0.2, when: "beforeChildren" } },
};
const frame: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1, transition: { duration: 1.1, ease: EASE_OUT, delay: 0.3 } },
};
const chip: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  show: (delay: number) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: EASE_OUT, delay } }),
};

/**
 * Hero visual, after the design: a cream card with the sample chart, the house info panel and two floating chips,
 * on a soft gold sun and a slowly turning ring. Pick (hover, focus, tap or Enter) a house and the panel below
 * the chart says what it covers. With reduced motion the ring and chips stay still and the reveal is a fade.
 */
export default function HeroChart({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const s = useT(HERO_SAMPLE);
  const [sel, setSel] = useState(0);
  const [name, about] = s.houses[sel];

  return (
    <div role="group" aria-label={s.chartLabel} className={`relative flex items-center justify-center pb-16 pt-16 sm:py-[30px] ${className}`}>
      <div aria-hidden className="pointer-events-none absolute -right-10 top-0 hidden h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,174,0,0.22)_0%,rgba(255,174,0,0.06)_45%,transparent_70%)] lg:block" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 lg:block">
        <motion.div
          className="h-full w-full rounded-full border border-ink/[0.08]"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 60, ease: "linear", repeat: Infinity }}
        >
          <span className="absolute -left-[5px] top-1/2 -mt-[5px] h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_0_6px_rgba(255,174,0,0.15)]" />
        </motion.div>
      </div>

      <motion.div
        variants={card}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-[470px] rounded-[28px] border border-line-strong bg-surface-card px-[22px] pb-[18px] pt-[22px] shadow-[0_2px_4px_rgba(20,33,61,0.04),0_30px_60px_rgba(20,33,61,0.12)]"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <span lang="hi" className="font-display block text-[13px] font-medium text-[#C2410C]">{s.chartEyebrow}</span>
            <b className="font-display text-[22px] font-semibold tracking-[-0.02em] text-ink">{s.chartTitle}</b>
          </div>
          <span className="shrink-0 rounded-full border border-[#F6DDB0] bg-[#FFF1DC] px-3 py-1.5 text-xs font-semibold text-ink">{s.chartPill}</span>
        </div>

        <div className="overflow-hidden rounded-[18px] border border-[#F1E3C6] bg-[#FFF8EC]">
          <svg viewBox="0 0 400 400" role="group" aria-label={s.chartAria} className="block h-auto w-full">
            {HOUSES.map(([points], i) => (
              <polygon
                key={i}
                points={points}
                tabIndex={0}
                role="button"
                aria-label={`${i + 1}, ${s.houses[i][0]}: ${s.houses[i][1]}`}
                onMouseEnter={() => setSel(i)}
                onFocus={() => setSel(i)}
                onClick={() => setSel(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSel(i);
                  }
                }}
                className={`cursor-pointer stroke-ink transition-[fill] duration-200 outline-none hover:fill-brand/30 focus:fill-brand/30 ${sel === i ? "fill-brand/30" : i === 0 ? "fill-brand/15" : "fill-transparent"}`}
                strokeWidth={1.2}
              />
            ))}
            <motion.rect
              x={1}
              y={1}
              width={398}
              height={398}
              fill="none"
              className="pointer-events-none stroke-ink"
              strokeWidth={1.6}
              variants={frame}
              initial="hidden"
              animate="show"
            />
            {HOUSES.map(([, x, y], i) => (
              <g key={i} className="pointer-events-none" textAnchor="middle">
                <text x={x} y={y - 10} fontSize={12} fontWeight={500} className="fill-[#A0947B]">
                  {i + 1}
                </text>
                <text x={x} y={y + 10} fontSize={15} fontWeight={600} className="font-display fill-ink">
                  {CHART_PLANETS[i].join(" ")}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div aria-live="polite" className="mt-3.5 flex min-h-16 items-center gap-3.5 rounded-2xl border border-[#F3E2C2] bg-[#FFF5E6] px-3.5 py-3">
          <span className="font-display grid h-[38px] w-[38px] flex-none place-items-center rounded-xl bg-surface-inverse text-base font-semibold text-brand-on-inverse">{sel + 1}</span>
          <span className="text-[13.5px] leading-[1.45] text-ink-soft">
            <b className="font-display block text-[15px] font-semibold text-ink">
              {name} {s.bhava}
            </b>
            {about}. {sel === 0 && s.infoHint}
          </span>
        </div>
      </motion.div>

      <Chip pos="left-3 top-1 sm:left-[150px] sm:top-3" delay={1} float={7} label={s.chipLagna} value={s.chipLagnaValue} icon={PiSunDim} />
      <Chip pos="bottom-1 right-3 sm:-right-[18px] sm:bottom-[110px]" delay={1.25} float={8} label={s.chipMoon} value={s.chipMoonValue} icon={PiMoon} />
    </div>
  );
}

/** A floating chip: rises in after the card, then drifts gently (not at all with reduced motion). */
function Chip({ pos, delay, float, label, value, icon: Icon }: { pos: string; delay: number; float: number; label: string; value: string; icon: IconType }) {
  const reduce = useReducedMotion();
  return (
    <motion.div custom={delay} variants={chip} initial="hidden" animate="show" className={`absolute z-[2] ${pos}`}>
      <motion.div
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: float, ease: "easeInOut", repeat: Infinity, delay: delay + 1 }}
        className="flex items-center gap-2.5 rounded-2xl bg-surface-inverse py-2.5 pl-2.5 pr-4 text-ink-inverse shadow-[0_16px_34px_rgba(20,33,61,0.25)]"
      >
        <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-brand/30 bg-brand/15 text-brand-on-inverse">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span>
          <small className="block text-[11px] text-ink-inverse-soft">{label}</small>
          <b className="block text-sm font-semibold">{value}</b>
        </span>
      </motion.div>
    </motion.div>
  );
}
