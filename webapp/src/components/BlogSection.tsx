import Image from "next/image";
import { PiArrowUpRight, PiBookOpenText } from "react-icons/pi";
import { Reveal, RevealItem } from "@/components/Reveal";
import { INTL_LOCALE, type Locale } from "@/i18n/config";
import { defineMessages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { getLatestBlogPosts } from "@/lib/services/blog.server";
import { BLOG_URL } from "@/lib/site";

const text = defineMessages({
  hi: {
    kicker: "Future For You पत्रिका",
    title: "पत्रिका से",
    allArticles: "सभी लेख",
    featured: "प्रमुख लेख",
  },
  en: {
    kicker: "Future For You magazine",
    title: "From the journal",
    allArticles: "All articles",
    featured: "Featured",
  },
});

const published = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/**
 * The blog: the newest articles from Future For You, AstroShrine's magazine, each opening on futureforyou.co in
 * a new tab: the newest as the large navy card, the next three as a list. If the blog cannot be reached, only the
 * heading and the "all articles" link are shown. The articles are written in Hindi, so their titles and excerpts
 * are marked lang="hi" on every page.
 */
export default async function BlogSection() {
  const [posts, locale] = await Promise.all([getLatestBlogPosts(4), getLocale()]);
  const t = text[locale];
  const [big, ...rest] = posts;
  const link = { target: "_blank", rel: "noopener noreferrer" } as const;

  return (
    <section id="blog" aria-labelledby="blog-title" className="scroll-mt-24 pb-16 md:pb-[104px]">
      <Reveal className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-medium tracking-[.02em] text-brand-strong">{t.kicker}</p>
          <h2 id="blog-title" className="mt-2.5 font-display text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] text-ink md:text-[38px]">
            {t.title}
          </h2>
        </div>
        <a
          href={BLOG_URL}
          {...link}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-ink px-5 text-[15px] font-semibold text-ink transition hover:bg-surface-inverse hover:text-ink-inverse motion-safe:active:scale-98 md:h-[52px] md:px-[26px]"
        >
          {t.allArticles}
          <PiArrowUpRight className="h-4 w-4" aria-hidden />
        </a>
      </Reveal>

      {big && (
        <Reveal group className="mt-8 grid grid-cols-1 gap-6 md:mt-12 lg:grid-cols-[1.4fr_1fr]">
          <RevealItem>
            <a
              href={big.link}
              {...link}
              className="group relative flex min-h-[320px] flex-col justify-end overflow-hidden rounded-3xl bg-surface-inverse p-6 text-ink-inverse md:min-h-[380px] md:p-9"
            >
              {big.image ? (
                <>
                  <Image
                    src={big.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 700px, 100vw"
                    className="object-cover opacity-45 transition-transform duration-700 group-hover:scale-105"
                  />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-surface-inverse via-surface-inverse/60 to-transparent" />
                </>
              ) : (
                <svg
                  aria-hidden
                  width="360"
                  height="360"
                  viewBox="0 0 300 300"
                  className="absolute -top-[60px] -right-20 opacity-35 motion-safe:animate-[spin_120s_linear_infinite]"
                >
                  <circle cx="150" cy="150" r="140" fill="none" stroke="var(--color-brand)" />
                  <circle cx="150" cy="150" r="100" fill="none" stroke="var(--color-brand)" strokeDasharray="4 6" />
                  <circle cx="150" cy="150" r="40" fill="var(--color-brand)" fillOpacity=".4" />
                  <circle cx="250" cy="150" r="10" fill="var(--color-brand)" />
                </svg>
              )}
              <span className="absolute top-7 left-6 rounded-full bg-brand px-3 py-[5px] text-xs font-extrabold text-brand-ink md:left-9">{t.featured}</span>
              <h3
                lang="hi"
                className="relative max-w-[520px] font-display text-2xl leading-[1.25] font-semibold tracking-[-0.02em] md:text-[30px]"
              >
                {big.title}
              </h3>
              <small className="relative mt-3 text-sm text-ink-inverse-soft">
                Future For You · {published(big.date, locale)}
              </small>
            </a>
          </RevealItem>

          <RevealItem as="div" className="flex flex-col gap-3.5">
            {rest.map((p) => (
              <a
                key={p.id}
                href={p.link}
                {...link}
                className="flex items-center gap-[18px] rounded-[18px] border border-line bg-surface-card p-4 transition-colors hover:border-brand"
              >
                {p.image ? (
                  <Image src={p.image} alt="" width={144} height={144} sizes="72px" className="h-[72px] w-[72px] flex-none rounded-[14px] object-cover" />
                ) : (
                  <span aria-hidden className="grid h-[72px] w-[72px] flex-none place-items-center rounded-[14px] bg-surface-sunken text-ink">
                    <PiBookOpenText className="h-[30px] w-[30px]" />
                  </span>
                )}
                <span className="min-w-0">
                  <span lang="hi" className="line-clamp-2 block font-display text-[15px] leading-[1.35] font-semibold text-ink">
                    {p.title}
                  </span>
                  <small className="text-[13px] text-ink-soft">{published(p.date, locale)}</small>
                </span>
              </a>
            ))}
          </RevealItem>
        </Reveal>
      )}
    </section>
  );
}

/** Same footprint as the section, while the articles are read. */
export function BlogSectionSkeleton() {
  return (
    <div aria-hidden className="pb-16">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-sunken" />
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-surface-sunken" />
        ))}
      </div>
    </div>
  );
}
