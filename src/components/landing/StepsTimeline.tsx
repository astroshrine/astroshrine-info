"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { EASE_OUT, fadeUp, lift, popIn } from "@/lib/motion";

/** Line draws left to right over 800ms; the three steps arrive as it passes them. */
const LINE_DURATION = 0.8;
const steps: Variants = { hidden: {}, show: { transition: { delayChildren: 0.1, staggerChildren: LINE_DURATION / 3 } } };

/**
 * "How it works": three step cards. On wide screens a track above them draws from step 1 to step 3
 * (scaleX, transform only) and each step's dot and number badge pop in as the line reaches it.
 * Plays once, when the section scrolls into view.
 */
export default function StepsTimeline({ items }: { items: { title: string; body: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const state = inView ? "show" : "hidden";

  return (
    <div ref={ref} className="mt-8">
      {/* The dots sit over each card's number badge: 24px card padding + half the 40px badge, less half the dot. */}
      <motion.div aria-hidden variants={steps} initial="hidden" animate={state} className="relative mb-4 hidden h-2 md:block">
        <motion.span
          className="absolute inset-x-0 inset-y-0 my-auto h-0.5 origin-left rounded-full bg-line-strong"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: LINE_DURATION, ease: EASE_OUT }}
        />
        <div className="relative grid h-full grid-cols-3 gap-4">
          {items.map(({ title }) => (
            <motion.span key={title} variants={popIn} className="ml-10 block h-2 w-2 rounded-full bg-brand" />
          ))}
        </div>
      </motion.div>

      <motion.ol variants={steps} initial="hidden" animate={state} className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map(({ title, body }, i) => (
          <motion.li
            key={title}
            variants={fadeUp}
            whileHover={lift}
            className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-card p-6"
          >
            <motion.span
              aria-hidden
              variants={popIn}
              className="heading-6 grid h-10 w-10 place-items-center rounded-full bg-surface-inverse text-ink-inverse"
            >
              {i + 1}
            </motion.span>
            <span>
              <span className="title-2 block text-ink">{title}</span>
              <span className="body-6 mt-2 block text-ink-soft">{body}</span>
            </span>
          </motion.li>
        ))}
      </motion.ol>
    </div>
  );
}
