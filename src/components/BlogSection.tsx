import Image from "next/image";
import { PiArrowUpRight, PiBookOpenText } from "react-icons/pi";
import { Reveal, RevealItem } from "@/components/Reveal";
import { INTL_LOCALE, type Locale } from "@/i18n/config";
import { defineMessages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { getLatestBlogPosts } from "@/lib/services/blog.server";
import { BLOG_URL } from "@/lib/site";

const secondaryButton =
  "button-sm inline-flex w-fit items-center gap-2 rounded-xl border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken motion-safe:active:scale-98";

const text = defineMessages({
  hi: {
    kicker: "Future For You पत्रिका",
    title: "ब्लॉग: ज्योतिष और धर्म के लेख",
    body: "वेद, ज्योतिष, पूजा विधि और सनातन परंपराओं पर AstroShrine की मासिक पत्रिका के नए लेख।",
    allArticles: "सभी लेख पढ़ें",
    readArticle: "पूरा लेख पढ़ें",
  },
  en: {
    kicker: "Future For You magazine",
    title: "Blog: articles on astrology and dharma",
    body: "New articles, in Hindi, from AstroShrine's monthly magazine on the Vedas, astrology, puja rituals and Sanatan traditions.",
    allArticles: "Read all articles",
    readArticle: "Read the full article",
  },
});

const published = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/**
 * The blog: the newest articles from Future For You, AstroShrine's magazine, each opening on futureforyou.co in
 * a new tab. If the blog cannot be reached, only the heading and the "all articles" link are shown. The articles
 * are written in Hindi, so their titles and excerpts are marked lang="hi" on every page.
 */
export default async function BlogSection() {
  const [posts, locale] = await Promise.all([getLatestBlogPosts(3), getLocale()]);
  const t = text[locale];

  return (
    <section aria-labelledby="blog-title" className="pb-16">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="caption-3 text-brand-strong">{t.kicker}</p>
          <h2 id="blog-title" className="heading-5 md:heading-4 mt-1 text-ink">
            {t.title}
          </h2>
          <p className="body-6 mt-2 max-w-[680px] text-ink-soft">{t.body}</p>
        </div>
        <a href={BLOG_URL} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
          {t.allArticles}
          <PiArrowUpRight className="h-4 w-4" aria-hidden />
        </a>
      </Reveal>

      {posts.length > 0 && (
        <Reveal as="ul" group className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {posts.map((p) => (
            <RevealItem as="li" key={p.id} hover>
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-card transition-colors hover:bg-surface-sunken"
              >
                {p.image ? (
                  <Image src={p.image} alt="" width={768} height={432} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-video w-full object-cover" />
                ) : (
                  <span aria-hidden className="grid aspect-video place-items-center bg-surface-sunken text-brand-strong">
                    <PiBookOpenText className="h-8 w-8" />
                  </span>
                )}
                <span className="flex flex-1 flex-col gap-2 p-4">
                  <span className="caption-5 text-ink-muted">{published(p.date, locale)}</span>
                  <span lang="hi" className="title-3 line-clamp-2 text-ink">
                    {p.title}
                  </span>
                  {p.excerpt && (
                    <span lang="hi" className="caption-2 line-clamp-3 text-ink-soft">
                      {p.excerpt}
                    </span>
                  )}
                  <span className="caption-3 mt-auto inline-flex items-center gap-1 pt-2 text-brand-strong">
                    {t.readArticle}
                    <PiArrowUpRight className="h-4 w-4" aria-hidden />
                  </span>
                </span>
              </a>
            </RevealItem>
          ))}
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
