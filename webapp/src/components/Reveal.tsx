"use client";

import { motion } from "framer-motion";
import { fadeUp, lift, stagger } from "@/lib/motion";

// B7 scroll reveals for server-rendered sections: rise 32px and fade in once as they enter the viewport.

const TAGS = { div: motion.div, section: motion.section, ul: motion.ul, li: motion.li, ol: motion.ol } as const;
type Tag = keyof typeof TAGS;

type Props = { as?: Tag; className?: string; children: React.ReactNode; id?: string } & React.AriaAttributes;

/** A block that reveals itself. With `group`, its RevealItem children arrive one after another instead. */
export function Reveal({ as = "div", group = false, className, children, ...rest }: Props & { group?: boolean }) {
  const Tag = TAGS[as];
  return (
    <Tag
      variants={group ? stagger : fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** A child of <Reveal group>. With `hover`, it lifts 4px under the pointer (cards). */
export function RevealItem({ as = "div", className, children, hover = false, ...rest }: Props & { hover?: boolean }) {
  const Tag = TAGS[as];
  return (
    <Tag variants={fadeUp} whileHover={hover ? lift : undefined} className={className} {...rest}>
      {children}
    </Tag>
  );
}
