import type { IconType } from "react-icons";
import { PiArrowRight } from "react-icons/pi";
import { Reveal, RevealItem } from "@/components/Reveal";
import Link from "@/i18n/Link";

export type QuickItem = { href: string; icon: IconType; title: string; body: string; action: string };

/** Four cards that open the main things to do on the website (the design's quick actions). */
export default function QuickActions({ label, items }: { label: string; items: QuickItem[] }) {
  return (
    <Reveal as="ul" group aria-label={label} className="grid grid-cols-1 gap-5 pb-20 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ href, icon: Icon, title, body, action }) => (
        <RevealItem as="li" key={href} hover>
          <Link
            href={href}
            className="group flex h-full flex-col gap-2 rounded-[20px] border border-line bg-surface-card px-6 pb-5 pt-6 text-ink transition-colors hover:border-line-strong hover:shadow-[0_18px_38px_rgba(20,33,61,0.10)]"
          >
            <span className="mb-2 grid h-12 w-12 place-items-center rounded-[14px] bg-surface-inverse text-brand-on-inverse transition-colors duration-300 group-hover:bg-brand group-hover:text-brand-ink">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="font-display text-lg font-semibold leading-snug tracking-tight">{title}</h3>
            <p className="body-6 flex-1 text-ink-soft">{body}</p>
            <span className="button-sm mt-3 flex items-center gap-1.5 border-t border-line pt-3.5 text-ink transition-colors group-hover:text-brand-strong">
              {action}
              <PiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>
        </RevealItem>
      ))}
    </Reveal>
  );
}
