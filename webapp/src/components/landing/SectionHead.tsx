import { Reveal } from "@/components/Reveal";
import Link from "@/i18n/Link";

/** The design's section heading: gold eyebrow, 38px title, optional lead and a ghost button on the right. */
export default function SectionHead({
  id,
  eyebrow,
  title,
  lead,
  action,
  dark = false,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  action?: { href: string; label: string; external?: boolean };
  /** On the navy rashifal band. */
  dark?: boolean;
  /** Extra control at the right of the heading. */
  children?: React.ReactNode;
}) {
  const ghost =
    "inline-flex h-[52px] shrink-0 items-center justify-center rounded-[14px] border-[1.5px] border-ink px-[26px] text-[15px] font-semibold text-ink transition-colors hover:bg-surface-inverse hover:text-ink-inverse motion-safe:active:translate-y-px";
  return (
    <Reveal className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
      <div>
        <p className={`font-display text-sm font-medium tracking-[0.02em] ${dark ? "text-brand" : "text-brand-strong"}`}>{eyebrow}</p>
        <h2 id={id} className="mt-2.5 font-display text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] md:text-[38px]">
          {title}
        </h2>
        {lead && <p className={`mt-3.5 max-w-[560px] text-[17px] leading-[1.65] ${dark ? "text-ink-inverse-soft" : "text-ink-soft"}`}>{lead}</p>}
      </div>
      {action &&
        (action.external ? (
          <a href={action.href} className={`${ghost} hidden md:inline-flex`}>
            {action.label}
          </a>
        ) : (
          <Link href={action.href} className={`${ghost} hidden md:inline-flex`}>
            {action.label}
          </Link>
        ))}
      {children}
    </Reveal>
  );
}
