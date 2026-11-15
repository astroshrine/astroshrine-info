import type { Metadata } from "next";
import { Suspense } from "react";
import type { IconType } from "react-icons";
import AstroGemsSection from "@/components/AstroGemsSection";
import BlogSection, { BlogSectionSkeleton } from "@/components/BlogSection";
import PujaBookingSection from "@/components/PujaBookingSection";
import {
  PiCalculator,
  PiCaretDown,
  PiClock,
  PiHourglassMedium,
  PiMapPin,
  PiPlanet,
  PiSparkle,
  PiSquaresFour,
  PiUserCircle,
} from "react-icons/pi";
import { Reveal, RevealItem } from "@/components/Reveal";
import AstrologerProof from "@/components/landing/AstrologerProof";
import FinalCta from "@/components/landing/FinalCta";
import HeroChart from "@/components/landing/HeroChart";
import HeroIntro from "@/components/landing/HeroIntro";
import StepsTimeline from "@/components/landing/StepsTimeline";
import TaglineReveal from "@/components/landing/TaglineReveal";
import { LOCALES, OG_LOCALE } from "@/i18n/config";
import { localizeHref } from "@/i18n/paths";
import { getLocale, languageAlternates } from "@/i18n/server";
import { PRIVACY_URL } from "@/lib/site";
import { LANDING_TEXT, type BenefitKey, type SolutionKey } from "./landing.text";

// Motion design (Framer Motion, landing-page-design B7): the hero copy arrives line by line and the
// sample chart assembles itself on load; sections rise in once as they scroll into view; cards lift on
// hover; the steps track draws itself; live figures count up. Transform and opacity only, one base curve,
// and reduced motion turns movement into plain fades (MotionConfig in AppShell + the CSS rule in globals.css).

// Public landing page (layout A: classic hero plus sections). One offer, one audience, one action:
// a free birth chart, for people who want their kundli without guesswork → "make your free kundli".
// The text is in ./landing.text.tsx, in Hindi and English.

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { title, description } = LANDING_TEXT[locale].meta;
  const url = localizeHref(locale, "/");
  return {
    title: { absolute: title },
    description,
    alternates: await languageAlternates("/"),
    // openGraph / twitter replace the layout's objects (shallow merge), so the shared fields are repeated here.
    openGraph: {
      type: "website",
      siteName: "AstroShrine",
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      title,
      description,
      url,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Card icon tiles turn and grow slightly when their card is hovered (CSS, transform only). */
const iconHover = "transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110";

const SOLUTIONS: { key: SolutionKey; icon: IconType }[] = [
  { key: "place", icon: PiMapPin },
  { key: "time", icon: PiClock },
  { key: "accuracy", icon: PiCalculator },
];

const BENEFITS: { key: BenefitKey; icon: IconType }[] = [
  { key: "charts", icon: PiSquaresFour },
  { key: "planets", icon: PiPlanet },
  { key: "dasha", icon: PiHourglassMedium },
  { key: "yogas", icon: PiSparkle },
  { key: "account", icon: PiUserCircle },
];

export default async function LandingPage() {
  const locale = await getLocale();
  const t = LANDING_TEXT[locale];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: t.faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />

      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        {/* 1. Hero */}
        <section aria-labelledby="hero-title" className="grid grid-cols-1 items-center gap-12 pb-24 pt-8 lg:grid-cols-5 lg:pt-16">
          <HeroIntro
            className="lg:col-span-3"
            eyebrow={t.hero.eyebrow}
            lines={t.hero.lines}
            body={t.hero.body}
            cta={{ href: "/kundli", label: t.cta }}
          />
          <HeroChart className="lg:col-span-2" />
        </section>

        {/* 2. Problem to solution */}
        <section aria-labelledby="problem-title" className="grid grid-cols-1 gap-12 pb-24 lg:grid-cols-2">
          <Reveal>
            <p className="caption-3 text-brand-strong">{t.problem.kicker}</p>
            <h2 id="problem-title" className="heading-5 md:heading-4 mt-3 max-w-[680px] text-ink">
              {t.problem.title}
            </h2>
            <p className="body-3 mt-4 max-w-[680px] text-ink-soft">{t.problem.body}</p>
          </Reveal>
          <Reveal as="ul" group className="flex flex-col gap-4">
            {SOLUTIONS.map(({ key, icon: Icon }) => (
              <RevealItem as="li" key={key} hover className="group flex items-start gap-4 rounded-2xl border border-line bg-surface-card p-6">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-sunken text-brand-strong ${iconHover}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="title-3 block text-ink">{t.solutions[key].title}</span>
                  <span className="body-6 mt-1 block text-ink-soft">{t.solutions[key].body}</span>
                </span>
              </RevealItem>
            ))}
          </Reveal>
        </section>

        {/* 3. Benefits */}
        <section aria-labelledby="benefits-title" className="pb-24">
          <Reveal>
            <h2 id="benefits-title" className="heading-5 md:heading-4 max-w-[680px] text-ink">
              {t.benefitsTitle}
            </h2>
          </Reveal>
          <Reveal as="ul" group className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ key, icon: Icon }, i) => (
              <RevealItem
                as="li"
                key={key}
                hover
                className={`group flex flex-col gap-4 rounded-2xl border border-line bg-surface-card p-6 ${i === 0 ? "lg:col-span-2" : ""}`}
              >
                <span className={`grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-ink ${iconHover}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="title-2 block text-ink">{t.benefits[key].title}</span>
                  <span className="body-6 mt-2 block text-ink-soft">{t.benefits[key].body}</span>
                </span>
              </RevealItem>
            ))}
          </Reveal>
        </section>
      </div>

      {/* B11. Tagline reveal */}
      <section aria-label={t.taglineLabel} className="py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <TaglineReveal className="heading-4 md:heading-3 max-w-[680px] text-ink" lines={t.tagline} />
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        {/* 4. How it works */}
        <section aria-labelledby="steps-title" className="pb-24">
          <Reveal>
            <h2 id="steps-title" className="heading-5 md:heading-4 text-ink">
              {t.stepsTitle}
            </h2>
          </Reveal>
          <StepsTimeline items={t.steps} />
        </section>

        {/* 5. Proof: live data only */}
        <section aria-labelledby="proof-title" className="pb-24">
          <Reveal>
            <h2 id="proof-title" className="heading-5 md:heading-4 text-ink">
              {t.proofTitle}
            </h2>
            <p className="body-6 mt-2 max-w-[680px] text-ink-soft">{t.proofBody}</p>
          </Reveal>
          <div className="mt-8">
            <AstrologerProof />
          </div>
        </section>

        {/* From the sister sites: puja booking (Shri Mahakal Dham), the AstroGems store and the newest Future For You articles. */}
        <PujaBookingSection />
        <AstroGemsSection />
        <Suspense fallback={<BlogSectionSkeleton />}>
          <BlogSection />
        </Suspense>

        {/* 6. FAQ */}
        <section aria-labelledby="faq-title" className="grid grid-cols-1 gap-8 pb-24 lg:grid-cols-3">
          <Reveal>
            <h2 id="faq-title" className="heading-5 md:heading-4 text-ink">
              {t.faqTitle}
            </h2>
            <p className="body-6 mt-2 text-ink-soft">
              {t.privacy(
                <a href={PRIVACY_URL} className="rounded-sm text-brand-strong underline underline-offset-4 transition hover:text-ink">
                  {t.privacyLink}
                </a>,
              )}
            </p>
          </Reveal>
          <Reveal as="ul" group className="flex flex-col gap-2 lg:col-span-2">
            {t.faq.map(({ q, a }) => (
              <RevealItem as="li" key={q}>
                <details className="group rounded-2xl border border-line bg-surface-card">
                  <summary className="title-3 flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-4 text-ink transition hover:bg-surface-sunken [&::-webkit-details-marker]:hidden">
                    {q}
                    <PiCaretDown className="h-5 w-5 shrink-0 text-ink-soft transition-transform duration-500 group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="body-6 px-4 pb-4 text-ink-soft group-open:animate-reveal-down">{a}</p>
                </details>
              </RevealItem>
            ))}
          </Reveal>
        </section>

        {/* 7. Final CTA with risk reversal */}
        <FinalCta title={t.finalTitle} body={t.finalBody} cta={{ href: "/kundli", label: t.cta }} promises={t.promises} />
      </div>
    </>
  );
}
