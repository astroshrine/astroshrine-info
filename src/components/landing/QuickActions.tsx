"use client";

import type { IconType } from "react-icons";
import { PiArrowRight, PiChatCircleDots, PiMoon, PiPhone, PiSquaresFour } from "react-icons/pi";
import { Reveal, RevealItem } from "@/components/Reveal";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { HERO_SAMPLE } from "./samples/hero";

// The website has no voice calls and no daily horoscope page yet: those two cards open the astrologer list and the Panchang.
const TARGETS: { href: string; icon: IconType }[] = [
  { href: "/astrologers", icon: PiChatCircleDots },
  { href: "/astrologers", icon: PiPhone },
  { href: "/kundli/panchang", icon: PiMoon },
  { href: "/kundli", icon: PiSquaresFour },
];

/** Four cards that open the main things to do on the website (the design's quick actions). */
export default function QuickActions() {
  const s = useT(HERO_SAMPLE);
  return (
    <Reveal as="ul" group aria-label={s.quickLabel} className="grid grid-cols-1 gap-5 pb-20 pt-14 sm:grid-cols-2 lg:grid-cols-4">
      {s.quick.map(({ title, body, action }, i) => {
        const { href, icon: Icon } = TARGETS[i];
        return (
          <RevealItem as="li" key={title} hover>
            <Link
              href={href}
              className="group flex h-full flex-col gap-2 rounded-[20px] border border-line bg-surface-card px-6 pb-[22px] pt-[26px] text-ink shadow-[0_1px_2px_rgba(20,33,61,0.04),0_8px_24px_rgba(20,33,61,0.04)] transition-[border-color,box-shadow] duration-300 hover:border-line-strong hover:shadow-[0_18px_38px_rgba(20,33,61,0.10)]"
            >
              <span className="mb-2.5 grid h-12 w-12 place-items-center rounded-[14px] bg-surface-inverse text-brand-on-inverse transition-colors duration-300 group-hover:bg-brand group-hover:text-brand-ink">
                <Icon className="h-[22px] w-[22px]" aria-hidden />
              </span>
              <h3 className="font-display text-lg font-semibold leading-[1.3] tracking-[-0.015em]">{title}</h3>
              <p className="flex-1 text-sm leading-[1.55] text-ink-soft">{body}</p>
              <span className="mt-3.5 flex items-center gap-1.5 border-t border-line pt-3.5 text-sm font-semibold text-ink transition-colors group-hover:text-brand-strong">
                {action}
                <PiArrowRight className="h-[15px] w-[15px] transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </RevealItem>
        );
      })}
    </Reveal>
  );
}
