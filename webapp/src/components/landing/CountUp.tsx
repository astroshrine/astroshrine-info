"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

/**
 * A real figure that counts up from 0 the first time it scrolls into view (800ms, base curve). Only the
 * text changes; with reduced motion it shows the final value straight away. Screen readers get the
 * final value from the label, never the running count.
 */
export default function CountUp({ value, decimals = 0, className = "" }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const count = useMotionValue(0);
  const text = useTransform(count, (v) => v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration: 0.8, ease: EASE_OUT });
    return () => controls.stop();
  }, [inView, reduce, value, count]);

  const final = value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{final}</span>
      <motion.span aria-hidden>{text}</motion.span>
    </span>
  );
}
