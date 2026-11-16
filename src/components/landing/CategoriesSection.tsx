import { PiSparkleFill } from "react-icons/pi";
import { Reveal, RevealItem } from "@/components/Reveal";
import Link from "@/i18n/Link";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import SectionHead from "./SectionHead";

const text = defineMessages({
  hi: {
    eyebrow: "श्रेणी से खोजें",
    title: "अपने लिए सही ज्योतिषी खोजें",
    seeAll: "सभी ज्योतिषी देखें",
    items: [
      "प्रेम",
      "विवाह और कुंडली",
      "करियर",
      "महिला ज्योतिषी",
      "व्यापार और धन",
      "स्वास्थ्य और परिवार",
      "KP ज्योतिष",
      "लाल किताब",
      "नाड़ी ज्योतिष",
      "अंक ज्योतिष",
      "हस्तरेखा",
      "प्रश्न कुंडली",
      "साइकिक रीडर",
      "टैरो रीडिंग",
      "वास्तु",
    ],
  },
  en: {
    eyebrow: "Browse by topic",
    title: "Find the right astrologer for you",
    seeAll: "See all astrologers",
    items: [
      "Love",
      "Marriage and Kundli",
      "Career",
      "Women astrologers",
      "Business and money",
      "Health and family",
      "KP astrology",
      "Lal Kitab",
      "Nadi astrology",
      "Numerology",
      "Palmistry",
      "Prashna",
      "Psychic reader",
      "Tarot reading",
      "Vastu",
    ],
  },
});

/** The design's category pills: topics that open the astrologer directory. */
export default async function CategoriesSection() {
  const t = await getT(text);
  return (
    <section aria-labelledby="cats-title" className="pt-16 md:pt-[104px]">
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
        <SectionHead id="cats-title" eyebrow={t.eyebrow} title={t.title} action={{ href: "/astrologers", label: t.seeAll }} />
        <Reveal as="ul" group className="mt-10 flex flex-wrap gap-3">
          {t.items.map((label) => (
            <RevealItem as="li" key={label}>
              <Link
                href="/astrologers"
                className="inline-flex h-[52px] items-center gap-2.5 rounded-full border border-line bg-surface-card pl-2 pr-5 text-[15px] font-semibold tracking-[-0.005em] text-ink transition-colors hover:border-brand motion-safe:active:scale-[0.98]"
              >
                <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-surface-inverse text-brand">
                  <PiSparkleFill className="h-4 w-4" aria-hidden />
                </span>
                {label}
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
