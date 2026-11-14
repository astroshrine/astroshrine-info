"use client";

import { motion } from "framer-motion";
import { fadeUp, heroStagger } from "@/lib/motion";
import HeroProof from "./HeroProof";
import MotionCta from "./MotionCta";

type Props = {
  eyebrow: string;
  /** The heading, one entry per line (B5: break where the thought breaks). */
  lines: string[];
  body: string;
  cta: { href: string; label: string };
  className?: string;
};

/**
 * Hero copy choreography on page load (not on scroll: it is already in view). Eyebrow, then each heading
 * line, then the subheading, then the action row rise 32px and fade in, 120ms apart, on the base curve.
 */
export default function HeroIntro({ eyebrow, lines, body, cta, className = "" }: Props) {
  return (
    <motion.div variants={heroStagger} initial="hidden" animate="show" className={className}>
      <motion.p variants={fadeUp} className="caption-3 text-brand-strong">
        {eyebrow}
      </motion.p>
      {/* heading-3 is the largest step whose line height (40px) sets Devanagari without clipped matras. */}
      <h1 id="hero-title" className="heading-4 sm:heading-3 mt-1 max-w-[680px] py-2">
        {lines.map((line) => (
          <motion.span key={line} variants={fadeUp} className="block">
            <span className="hero-gradient-text">{line}</span>
          </motion.span>
        ))}
      </h1>
      <motion.p variants={fadeUp} className="body-3 mt-4 max-w-[680px] text-ink-soft">
        {body}
      </motion.p>
      <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <MotionCta href={cta.href}>{cta.label}</MotionCta>
        <HeroProof />
      </motion.div>
    </motion.div>
  );
}
