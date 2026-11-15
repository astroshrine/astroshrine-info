"use client";

import { motion } from "framer-motion";
import { PiPlanet } from "react-icons/pi";
import Link from "@/i18n/Link";
import { buttonHover, buttonPress } from "@/lib/motion";

const MotionLink = motion.create(Link);

/**
 * The landing page's primary action. Lifts 2px on hover and settles to 98% on press (Framer Motion);
 * the planet turns a little on hover. Only color uses a CSS transition, so it never fights the
 * transform Framer Motion drives.
 */
export default function MotionCta({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <MotionLink
      href={href}
      whileHover={buttonHover}
      whileTap={buttonPress}
      className={`button-md group inline-flex items-center gap-2 rounded-full bg-brand px-3 py-2 text-brand-ink transition-colors hover:bg-brand-hover ${className}`}
    >
      <PiPlanet className="h-5 w-5 transition-transform duration-500 group-hover:rotate-45" aria-hidden />
      {children}
    </MotionLink>
  );
}
