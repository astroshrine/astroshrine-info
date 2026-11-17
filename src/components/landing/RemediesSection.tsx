import Image from "next/image";
import { PiArrowRight } from "react-icons/pi";
import { Reveal, RevealItem } from "@/components/Reveal";
import { defineMessages } from "@/i18n/messages";
import { getLocale, getT } from "@/i18n/server";
import { ASTROGEMS_URL, PUJA_BOOKING_URL } from "@/lib/site";
import { REMEDIES, type RemedyKey } from "./samples/remedies";
import SectionHead from "./SectionHead";

const text = defineMessages({
  hi: { eyebrow: "पूजा और उपाय", title: "पूजा और उपाय", lead: "आपके ज्योतिषी द्वारा सुझाए गए, ध्यान से किए या मँगवाए गए।", store: "स्टोर देखें" },
  en: { eyebrow: "Puja and remedies", title: "Puja and remedies", lead: "Suggested by your astrologer, performed or sourced with care.", store: "Visit the store" },
});

// Real photos already used elsewhere on the site: the puja card photo from Shri Mahakal Dham, and the AstroGems store products.
const PHOTOS: Record<RemedyKey, string> = {
  puja: "https://shrimahakaldham.com/website-assets/assets/images/category/puja-by-purpose.jpg",
  gem: "https://astrogems.astroshrine.in/products/natural-pukhraj-5-25-ct-ceylon.jpg",
  rudraksha: "https://astrogems.astroshrine.in/products/5-mukhi-rudraksha-mala-108-beads.jpg",
};

// Puja bookings go to Shri Mahakal Dham; gemstones and rudraksha to the AstroGems store.
const LINKS: Record<RemedyKey, string> = { puja: PUJA_BOOKING_URL, gem: ASTROGEMS_URL, rudraksha: ASTROGEMS_URL };

/** Puja and remedies: three cards (the design's #remedies). */
export default async function RemediesSection() {
  const [locale, t] = [await getLocale(), await getT(text)];
  return (
    <section id="remedies" aria-labelledby="remedies-title" className="scroll-mt-24 py-16 md:py-[104px]">
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
        <SectionHead
          id="remedies-title"
          eyebrow={t.eyebrow}
          title={t.title}
          lead={t.lead}
          action={{ href: ASTROGEMS_URL, label: t.store, external: true }}
        />
        <Reveal as="ul" group className="mt-10 grid grid-cols-1 gap-6 md:mt-12 md:grid-cols-3">
          {(Object.keys(REMEDIES) as RemedyKey[]).map((key) => {
            const r = REMEDIES[key];
            return (
              <RevealItem as="li" key={key} hover className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface-card">
                <div className="relative h-[200px] overflow-hidden bg-surface-sunken">
                  <Image
                    src={PHOTOS[key]}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-6">
                  <h3 className="font-display text-xl font-semibold leading-[1.3] tracking-[-0.01em] text-ink">{r.title[locale]}</h3>
                  <p className="flex-1 text-[15px] tracking-[-0.01em] text-ink-soft">{r.body[locale]}</p>
                  <a
                    href={LINKS[key]}
                    className="mt-2 inline-flex items-center gap-2 font-semibold text-ink transition-colors hover:text-brand-strong"
                  >
                    {r.cta[locale]}
                    <PiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </a>
                </div>
              </RevealItem>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
