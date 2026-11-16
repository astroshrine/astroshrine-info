"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useT } from "@/i18n/LocaleProvider";
import { HERO_SAMPLE } from "./samples/hero";

/**
 * The navy activity strip under the hero (sample lines, see samples/hero.ts). The track holds the list twice and
 * slides left by half its width every 70s, so the loop has no seam. With reduced motion it stays still and the strip scrolls by hand.
 */
export default function Ticker() {
  const s = useT(HERO_SAMPLE);
  const reduce = useReducedMotion();
  const items = (hidden: boolean) =>
    s.ticker.map(([who, city, what, when]) => (
      <span key={`${hidden}-${who}`} aria-hidden={hidden || undefined} className="shrink-0 border-r border-brand/30 px-7">
        <b className="font-semibold text-brand-on-inverse">{who}</b> {city} {what}
        <small className="ml-1.5 text-[length:inherit] text-ink-inverse-soft opacity-80">{when}</small>
      </span>
    ));
  return (
    <div aria-label={s.tickerLabel} role="region" className="mt-10 overflow-hidden bg-surface-inverse text-sm text-[#E7E2D4] [&_small]:text-xs">
      <motion.div
        className={`inline-flex whitespace-nowrap py-[15px] ${reduce ? "overflow-x-auto" : ""}`}
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 70, ease: "linear", repeat: Infinity }}
      >
        {items(false)}
        {!reduce && items(true)}
      </motion.div>
    </div>
  );
}
