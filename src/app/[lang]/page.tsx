import type { Metadata } from "next";
import { Suspense } from "react";
import AstroGemsSection from "@/components/AstroGemsSection";
import BlogSection, { BlogSectionSkeleton } from "@/components/BlogSection";
import PujaBookingSection from "@/components/PujaBookingSection";
import AstrologerShowcase from "@/components/landing/AstrologerShowcase";
import CategoriesSection from "@/components/landing/CategoriesSection";
import KundliSection from "@/components/landing/KundliSection";
import RashifalSection from "@/components/landing/RashifalSection";
import RemediesSection from "@/components/landing/RemediesSection";
import FaqSection from "@/components/landing/FaqSection";
import HeroChart from "@/components/landing/HeroChart";
import HeroIntro from "@/components/landing/HeroIntro";
import LettersSection from "@/components/landing/LettersSection";
import QuickActions from "@/components/landing/QuickActions";
import Ticker from "@/components/landing/Ticker";
import WhySteps from "@/components/landing/WhySteps";
import { LOCALES, OG_LOCALE } from "@/i18n/config";
import { localizeHref } from "@/i18n/paths";
import { getLocale, languageAlternates } from "@/i18n/server";
import { PRIVACY_URL } from "@/lib/site";
import { LANDING_TEXT } from "./landing.text";

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

      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
        {/* 1. Hero */}
        <section aria-labelledby="hero-title" className="grid grid-cols-1 items-center gap-12 pb-10 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-16">
          <HeroIntro />
          <HeroChart />
        </section>
      </div>

      {/* 1b. Activity ticker */}
      <Ticker />

      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
        {/* 1c. Quick actions */}
        <QuickActions />
      </div>

      {/* 1d. Astrologers: live list, with tabs by topic (full-bleed paper band) */}
      <AstrologerShowcase />

      {/* Categories, services with the kundli form, rashifal wheel and remedies (the design's home) */}
      <CategoriesSection />
      <KundliSection />
      <RashifalSection />
      <RemediesSection />

      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        {/* Design order: letters, the sister sites (puja, AstroGems), journal (blog), why astrology + steps, FAQ. */}
        <LettersSection />
        <PujaBookingSection />
        <AstroGemsSection />
        <Suspense fallback={<BlogSectionSkeleton />}>
          <BlogSection />
        </Suspense>
        <WhySteps />
        <FaqSection
          title={t.faqTitle}
          note={t.privacy(
            <a href={PRIVACY_URL} className="rounded-sm text-brand-strong underline underline-offset-4 transition hover:text-ink">
              {t.privacyLink}
            </a>,
          )}
          items={t.faq}
        />
      </div>
    </>
  );
}
