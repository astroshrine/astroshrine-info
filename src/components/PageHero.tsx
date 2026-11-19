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
  "button-sm mt-5 hidden md:inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98";

/**
 * The navy banner that opens an inner page, like the Android app's screen headers: breadcrumb, gold icon tile,
 * Devanagari kicker, title, short description, a gold call-to-action and a decorative illustration on the right.
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
    <section className="mx-auto w-full max-w-6xl md:px-8 md:pt-7">
      {/* On phones it continues the navy header bar, like the app's screen headers; from md up it is a card. */}
      <div className="on-inverse relative overflow-hidden rounded-b-sheet bg-surface-inverse px-4 pt-2 pb-6 text-ink-inverse md:rounded-sheet md:px-11 md:py-9 md:shadow-card lg:min-h-[340px]">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <span className="absolute -top-28 -right-14 h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgb(240_196_58/.22),transparent_65%)]" />
          <span className="absolute -bottom-36 right-44 h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgb(27_52_84/.9),transparent_65%)]" />
        </div>
        {illustration && (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-8 hidden w-[44%] items-center justify-center lg:flex xl:right-12">
            {illustration}
          </div>
        )}

        <div className="relative z-10 max-w-[520px]">
          <nav aria-label={breadcrumbLabel} className="hidden md:block">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-inverse-soft">
              {breadcrumb.map((item, i) => {
                const last = i === breadcrumb.length - 1;
                return (
                  <li key={`${item.label}-${i}`} className="flex items-center gap-2">
                    {i > 0 && (
                      <span aria-hidden className="text-ink-inverse-soft">
                        /
                      </span>
                    )}
                    {item.href && !last ? (
                      <Link href={item.href} className="rounded-sm text-ink-inverse transition hover:text-brand-on-inverse">
                        {item.label}
                      </Link>
                    ) : (
                      <span aria-current={last ? "page" : undefined} className={last ? "font-semibold text-brand-on-inverse" : "text-ink-inverse"}>
                        {item.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="flex items-center gap-4 md:mt-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand md:h-16 md:w-16">
              <Icon className="h-6 w-6 text-brand-ink md:h-8 md:w-8" aria-hidden />
            </span>
            <div className="min-w-0">
              {devaKicker && (
                <p lang="hi" className="font-display text-[13px] font-medium text-brand-on-inverse">
                  {devaKicker}
                </p>
              )}
              <h1 className="font-display text-3xl leading-[1.1] font-bold tracking-tight text-ink-inverse max-md:text-2xl md:text-[40px]">{title}</h1>
            </div>
          </div>

          {description && <p className="mt-3 max-w-[470px] text-sm text-ink-inverse-soft md:mt-4 md:text-base">{description}</p>}

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
