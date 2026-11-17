import type { IconType } from "react-icons";
import { PiArrowRight } from "react-icons/pi";
import Link from "@/i18n/Link";

export type PageHeroCrumb = {
  label: string;
  /** Path without a language (rendered with @/i18n/Link). Leave out for the current page. */
  href?: string;
};

export type PageHeroCta = {
  label: string;
  /** A path without a language, or "#id" to scroll to a section of the same page. */
  href: string;
};

export type PageHeroProps = {
  /** "Home / Section / Page": the last item is the current page. */
  breadcrumb: PageHeroCrumb[];
  /** The page's icon, shown in a white tile. */
  icon: IconType;
  /** Small Devanagari line above the title. Rendered with lang="hi" so it is allowed on English pages. */
  devaKicker?: string;
  title: string;
  description?: string;
  cta?: PageHeroCta;
  /** Decorative picture on the right (hidden below lg). Give it aria-hidden content. */
  illustration?: React.ReactNode;
  /** Accessible name of the breadcrumb navigation. */
  breadcrumbLabel?: string;
};

const ctaClass =
  "button-sm on-inverse mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-surface-inverse px-5 text-ink-inverse transition hover:bg-surface-inverse-raised motion-safe:active:scale-98";

/**
 * The rounded banner that opens an inner page, as in the design: breadcrumb, icon tile, Devanagari kicker, title,
 * short description, a navy call-to-action and a decorative illustration on the right.
 */
export default function PageHero({
  breadcrumb,
  icon: Icon,
  devaKicker,
  title,
  description,
  cta,
  illustration,
  breadcrumbLabel = "Breadcrumb",
}: PageHeroProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-5 md:px-8 md:pt-7">
      <div className="relative overflow-hidden rounded-3xl border border-[#F4E2C3] bg-[linear-gradient(100deg,#FFFCF6_0%,#FFF5E6_45%,#FFE9CC_78%,#FFDDB3_100%)] px-5 py-7 shadow-[0_14px_34px_rgba(255,106,0,.07)] md:px-11 md:py-9 lg:min-h-[340px]">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <span className="absolute -top-28 -right-14 h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(255,174,0,.22),transparent_65%)]" />
          <span className="absolute -bottom-36 right-44 h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,.14),transparent_65%)]" />
        </div>
        {illustration && (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-8 hidden w-[44%] items-center justify-center lg:flex xl:right-12">
            {illustration}
          </div>
        )}

        <div className="relative z-10 max-w-[520px]">
          <nav aria-label={breadcrumbLabel}>
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
              {breadcrumb.map((item, i) => {
                const last = i === breadcrumb.length - 1;
                return (
                  <li key={`${item.label}-${i}`} className="flex items-center gap-2">
                    {i > 0 && (
                      <span aria-hidden className="text-ink-muted">
                        /
                      </span>
                    )}
                    {item.href && !last ? (
                      <Link href={item.href} className="rounded-sm text-ink transition hover:text-brand-strong">
                        {item.label}
                      </Link>
                    ) : (
                      <span aria-current={last ? "page" : undefined} className={last ? "font-semibold text-brand-strong" : "text-ink"}>
                        {item.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="mt-5 flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] border border-[#F7DDBB] bg-white shadow-[0_6px_16px_rgba(255,106,0,.08)] md:h-16 md:w-16">
              <Icon className="h-7 w-7 text-[#FF6A00] md:h-8 md:w-8" aria-hidden />
            </span>
            <div className="min-w-0">
              {devaKicker && (
                <p lang="hi" className="font-display text-[13px] font-medium text-[#C2410C]">
                  {devaKicker}
                </p>
              )}
              <h1 className="font-display text-3xl leading-[1.1] font-bold tracking-tight text-ink md:text-[40px]">{title}</h1>
            </div>
          </div>

          {description && <p className="mt-4 max-w-[470px] text-base text-[#4A5168]">{description}</p>}

          {cta &&
            (cta.href.startsWith("#") ? (
              <a href={cta.href} className={ctaClass}>
                {cta.label}
                <PiArrowRight className="h-4 w-4" aria-hidden />
              </a>
            ) : (
              <Link href={cta.href} className={ctaClass}>
                {cta.label}
                <PiArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
