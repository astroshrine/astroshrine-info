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
      <motion.p variants={fadeUp} className="font-display flex items-center gap-3 text-lg text-brand-strong before:h-px before:w-9 before:bg-brand after:h-px after:w-9 after:bg-brand">
        {eyebrow}
      </motion.p>
      <h1 id="hero-title" className="font-display mt-5 max-w-[680px] text-[2.75rem] font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
        {lines.map((line, i) => (
          <motion.span key={line} variants={fadeUp} className={`block py-1 ${i === lines.length - 1 ? "text-brand-strong" : ""}`}>
            {line}
          </motion.span>
        ))}
      </h1>
      <motion.p variants={fadeUp} className="mt-6 max-w-[560px] text-lg leading-relaxed text-ink-soft">
        {body}
      </motion.p>
      <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <MotionCta href={cta.href}>{cta.label}</MotionCta>
        <HeroProof />
      </motion.div>
    </motion.div>
  );
}
