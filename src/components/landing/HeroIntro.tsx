"use client";

import { motion } from "framer-motion";
import { PiArrowRight, PiCheckCircle } from "react-icons/pi";
import Link from "@/i18n/Link";
import { buttonHover, buttonPress, fadeUp, heroStagger } from "@/lib/motion";
import { HeroBadge, HeroStats } from "./HeroLive";
import MotionCta from "./MotionCta";

type Props = {
  eyebrow: string;
  /** The heading, one entry per line (B5: break where the thought breaks). */
  lines: string[];
  body: string;
  cta: { href: string; label: string };
  secondary: { href: string; label: string };
  /** Short, true promises shown under the buttons. */
  trust: string[];
  className?: string;
};

const MotionLink = motion.create(Link);

/**
 * Hero copy choreography on page load (not on scroll: it is already in view). Live badge, eyebrow, each heading
 * line, the subheading, the buttons, the promises and the stat box rise 32px and fade in, 120ms apart, on the base curve.
 */
export default function HeroIntro({ eyebrow, lines, body, cta, secondary, trust, className = "" }: Props) {
  return (
    <motion.div variants={heroStagger} initial="hidden" animate="show" className={className}>
      <motion.div variants={fadeUp}>
        <HeroBadge />
      </motion.div>
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
      <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
        <MotionCta href={cta.href}>{cta.label}</MotionCta>
        <MotionLink
          href={secondary.href}
          whileHover={buttonHover}
          whileTap={buttonPress}
          className="button-md group inline-flex h-[52px] items-center gap-2 rounded-2xl border border-ink px-6 text-ink transition-colors hover:bg-surface-sunken"
        >
          {secondary.label}
          <PiArrowRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" aria-hidden />
        </MotionLink>
      </motion.div>
      <motion.ul variants={fadeUp} className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ink-soft">
        {trust.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <PiCheckCircle className="h-5 w-5 shrink-0 text-brand" aria-hidden />
            {item}
          </li>
        ))}
      </motion.ul>
      <motion.div variants={fadeUp}>
        <HeroStats />
      </motion.div>
    </motion.div>
  );
}
