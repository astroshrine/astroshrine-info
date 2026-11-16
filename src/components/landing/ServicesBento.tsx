import type { IconType } from "react-icons";
import { PiArrowRight, PiCheckCircle, PiSquaresFour } from "react-icons/pi";
import { Reveal, RevealItem } from "@/components/Reveal";
import Link from "@/i18n/Link";

export type ServiceTile = { href: string; icon: IconType; title: string; body: string };

type Props = {
  titleId: string;
  kicker: string;
  title: string;
  main: { title: string; body: string; points: string[]; cta: { href: string; label: string } };
  tiles: ServiceTile[];
};

/** "Our services": the free Kundli as a large navy tile (with its three promises) beside the other kundli tools. */
export default function ServicesBento({ titleId, kicker, title, main, tiles }: Props) {
  return (
    <section aria-labelledby={titleId} className="pb-24">
      <Reveal>
        <p className="font-display text-lg text-brand-strong">{kicker}</p>
        <h2 id={titleId} className="heading-5 md:heading-4 mt-1 text-ink">
          {title}
        </h2>
      </Reveal>
      <Reveal group className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr] lg:grid-rows-2">
        <RevealItem className="on-inverse flex flex-col gap-3 rounded-3xl bg-surface-inverse p-8 text-ink-inverse md:col-span-2 lg:col-span-1 lg:row-span-2 lg:p-9">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-brand-on-inverse">
            <PiSquaresFour className="h-7 w-7" aria-hidden />
          </span>
          <h3 className="font-display text-3xl font-semibold leading-tight tracking-tight">{main.title}</h3>
          <p className="body-5 text-ink-inverse-soft">{main.body}</p>
          <ul className="mt-2 flex flex-col gap-3">
            {main.points.map((p) => (
              <li key={p} className="body-6 flex items-start gap-3 text-ink-inverse">
                <PiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-on-inverse" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
          <Link
            href={main.cta.href}
            className="button-md mt-auto inline-flex h-[52px] w-fit items-center gap-2 rounded-2xl bg-brand px-6 pt-0 text-brand-ink transition-colors hover:bg-brand-hover motion-safe:active:scale-98"
          >
            {main.cta.label}
            <PiArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </RevealItem>
        {tiles.map(({ href, icon: Icon, title: tileTitle, body }) => (
          <RevealItem key={href} hover>
            <Link href={href} className="group flex h-full flex-col gap-2.5 rounded-3xl border border-line bg-surface-card p-7 text-ink transition-colors hover:border-brand">
              <span className="grid h-[54px] w-[54px] place-items-center rounded-2xl bg-surface-sunken text-ink transition-transform duration-500 group-hover:-rotate-6">
                <Icon className="h-7 w-7" aria-hidden />
              </span>
              <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight">{tileTitle}</h3>
              <p className="body-6 text-ink-soft">{body}</p>
            </Link>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  );
}
