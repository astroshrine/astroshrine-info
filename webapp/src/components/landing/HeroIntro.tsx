"use client";

import { motion } from "framer-motion";
import { PiClock, PiLockSimple, PiShieldCheck } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { buttonHover, buttonPress, fadeUp, heroStagger } from "@/lib/motion";
import { HeroBadge, HeroStats } from "./HeroLive";
import MotionCta from "./MotionCta";
import { HERO_SAMPLE } from "./samples/hero";

const text = defineMessages({
  hi: { lines: ["स्पष्टता, जो आपके", "सितारों में लिखी है।"] },
  en: { lines: ["Clarity, written in", "your stars."] },
});

const MotionLink = motion.create(Link);
const TRUST_ICONS = [PiShieldCheck, PiLockSimple, PiClock];

/**
 * Hero copy choreography on page load (not on scroll: it is already in view). Live badge, deva line, each heading
 * line, the subheading, the buttons, the trust row and the stat box rise 32px and fade in, 120ms apart, on the base curve.
 */
export default function HeroIntro({ className = "" }: { className?: string }) {
  const t = useT(text);
  const s = useT(HERO_SAMPLE);
  return (
    <motion.div variants={heroStagger} initial="hidden" animate="show" className={className}>
      <motion.div variants={fadeUp}>
        <HeroBadge />
      </motion.div>
      <motion.p
        variants={fadeUp}
        lang="hi"
        className="font-display mb-[18px] flex items-center gap-3.5 text-[15px] font-medium tracking-[0.02em] text-brand-strong before:h-px before:w-9 before:bg-brand after:h-px after:w-9 after:bg-brand"
      >
        {s.deva}
      </motion.p>
      <h1 id="hero-title" className="font-display text-[2.5rem] font-bold leading-[1.1] tracking-[-0.025em] text-ink sm:text-[3.75rem]">
        {t.lines.map((line, i) => (
          <motion.span key={line} variants={fadeUp} className={`block ${i === t.lines.length - 1 ? "text-brand-strong" : ""}`}>
            {line}
          </motion.span>
        ))}
      </h1>
      <motion.p variants={fadeUp} className="mt-[22px] max-w-[560px] text-[17px] leading-[1.65] text-ink-soft sm:text-lg">
        {s.lead}
      </motion.p>
      <motion.div variants={fadeUp} className="mt-[30px] flex flex-wrap items-center gap-3">
        <MotionCta href="/astrologers" arrow>
          {s.chat}
        </MotionCta>
        <MotionLink
          href="/kundli"
          whileHover={buttonHover}
          whileTap={buttonPress}
          className="button-md inline-flex h-[54px] items-center justify-center rounded-[14px] border-[1.5px] border-ink px-[26px] font-bold text-ink transition-colors hover:bg-surface-inverse hover:text-ink-inverse"
        >
          {s.kundli}
        </MotionLink>
      </motion.div>
      <motion.ul variants={fadeUp} className="mt-[22px] flex flex-wrap gap-x-7 gap-y-2 text-sm font-semibold text-ink-soft">
        {s.trust.map((item, i) => {
          const Icon = TRUST_ICONS[i];
          return (
            <li key={item} className="flex items-center gap-2">
              <Icon className="h-[18px] w-[18px] shrink-0 text-brand" aria-hidden />
              {item}
            </li>
          );
        })}
      </motion.ul>
      <motion.div variants={fadeUp}>
        <HeroStats />
      </motion.div>
    </motion.div>
  );
}
