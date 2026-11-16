"use client";

import { motion } from "framer-motion";
import { PiArrowRight, PiPlanet } from "react-icons/pi";
import Link from "@/i18n/Link";
import { buttonHover, buttonPress } from "@/lib/motion";

const MotionLink = motion.create(Link);

/**
 * The landing page's primary action. Lifts 2px on hover and settles to 98% on press (Framer Motion);
 * the planet turns a little on hover (or, with `arrow`, a gold arrow after the label nudges right, as in the
 * design's hero button). Only color uses a CSS transition, so it never fights the transform Framer Motion drives.
 */
export default function MotionCta({
  href,
  children,
  className = "",
  arrow = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  arrow?: boolean;
}) {
  return (
    <MotionLink
      href={href}
      whileHover={buttonHover}
      whileTap={buttonPress}
      className={`button-md group inline-flex items-center gap-2 bg-surface-inverse text-ink-inverse transition-colors hover:bg-surface-inverse-raised ${
        arrow ? "h-[54px] justify-center gap-2.5 rounded-[14px] px-[26px] font-bold" : "h-[52px] rounded-2xl px-6"
      } ${className}`}
    >
      {!arrow && <PiPlanet className="h-5 w-5 transition-transform duration-500 group-hover:rotate-45" aria-hidden />}
      {children}
      {arrow && <PiArrowRight className="h-[18px] w-[18px] text-brand-on-inverse transition-transform duration-200 group-hover:translate-x-[3px]" aria-hidden />}
    </MotionLink>
  );
}
