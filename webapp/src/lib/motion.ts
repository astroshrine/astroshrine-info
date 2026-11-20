import type { Transition, Variants } from "framer-motion";

// Motion tokens (landing-page-design skill, B7): everything decelerates on one base curve and only
// transform and opacity animate. <MotionConfig reducedMotion="user"> in AppShell turns the movement
// off for people who prefer reduced motion, leaving the plain opacity change.

/** The base curve: cubic-bezier(0.22, 1, 0.36, 1). */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Layout and position changes. */
export const base: Transition = { duration: 0.5, ease: EASE_OUT };

/** Color and opacity shifts on hover / press. */
export const quick: Transition = { duration: 0.3, ease: EASE_OUT };

/** Scroll reveal: rise 32px (Spacing-400) and fade in over 700ms, once. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};

/** Children of a revealed section arrive one after another. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};

/** The landing hero's copy arrives line by line on page load, a little slower than a section reveal. */
export const heroStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

/** Small marks (chart house numbers, step badges, check icons) grow in from 60% while fading in. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT } },
};

/** Hover feedback for cards: a 4px lift on the base curve. */
export const lift = { y: -4, transition: base };

/** Hover and press feedback for buttons: a 2px lift, and 98% on press (B9). */
export const buttonHover = { y: -2, transition: quick };
export const buttonPress = { scale: 0.98, transition: quick };

/** @deprecated Kept for existing imports. It is the base curve now (B7), not a spring: use `base`. */
export const spring: Transition = base;

/** @deprecated Kept for existing imports: use `fadeUp`. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT } },
};

/** Mobile menu links: rise 24px (Spacing-300), 60ms apart, the whole sequence capped at 400ms. */
export const menuLink = (index: number): Transition => ({ ...base, delay: Math.min(index * 0.06, 0.4) });
