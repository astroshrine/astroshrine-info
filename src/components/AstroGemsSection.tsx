import Image from "next/image";
import type { IconType } from "react-icons";
import { PiArrowUpRight, PiArrowsClockwise, PiSealCheck, PiTruck, PiFlowerLotus } from "react-icons/pi";
import AstroGemsMark from "@/components/AstroGemsMark";
import { Reveal, RevealItem } from "@/components/Reveal";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { ASTROGEMS_URL } from "@/lib/site";

// AstroGems (astrogems.astroshrine.in) is AstroShrine's store. The categories, photos and promises below are taken
// from it and each link was checked; prices and seasonal offers are left out because they change there.

const STORE = new URL(ASTROGEMS_URL).origin;

type CategoryKey = "gem" | "rudraksha" | "bracelet" | "mala";
type PromiseKey = "certified" | "energized" | "exchange" | "delivery";

const CATEGORIES: { key: CategoryKey; href: string; photo: string }[] = [
  { key: "gem", href: `${STORE}/collections/gem`, photo: `${STORE}/products/natural-pukhraj-5-25-ct-ceylon.jpg` },
  { key: "rudraksha", href: `${STORE}/collections/rudraksha`, photo: `${STORE}/products/5-mukhi-rudraksha-mala-108-beads.jpg` },
  { key: "bracelet", href: `${STORE}/collections/bracelet`, photo: `${STORE}/products/tiger-eye-power-bracelet.jpg` },
  { key: "mala", href: `${STORE}/collections/mala`, photo: `${STORE}/products/divya-raksha-rudraksha-karungali-mala.jpg` },
];

const PROMISES: { key: PromiseKey; icon: IconType }[] = [
  { key: "certified", icon: PiSealCheck },
  { key: "energized", icon: PiFlowerLotus },
  { key: "exchange", icon: PiArrowsClockwise },
  { key: "delivery", icon: PiTruck },
];

type Item = { title: string; detail: string };

const text = defineMessages({
  hi: {
    title: "प्रमाणित रत्न, रुद्राक्ष और माला",
    body: "हर रत्न के साथ उसका असली सर्टिफिकेट और असली फोटो। हर रुद्राक्ष श्री महाकाल धाम में ऊर्जित।",
    visitStore: "AstroGems स्टोर देखें",
    categories: {
      gem: { title: "रत्न", detail: "लैब सर्टिफाइड रत्न", alt: "प्राकृतिक पुखराज रत्न" },
      rudraksha: { title: "रुद्राक्ष", detail: "1 से 14 मुखी, नेपाल", alt: "पंचमुखी रुद्राक्ष माला" },
      bracelet: { title: "ब्रेसलेट", detail: "राशि और क्रिस्टल ब्रेसलेट", alt: "टाइगर आई ब्रेसलेट" },
      mala: { title: "करुंगली और माला", detail: "करुंगली, स्फटिक और तुलसी माला", alt: "रुद्राक्ष और करुंगली माला" },
    } satisfies Record<CategoryKey, Item & { alt: string }>,
    view: "देखें",
    newTab: "(AstroGems पर, नए टैब में खुलेगा)",
    promises: {
      certified: { title: "लैब सर्टिफाइड", detail: "हर ऑर्डर के साथ सर्टिफिकेट" },
      energized: { title: "मंदिर में ऊर्जित", detail: "श्री महाकाल धाम में" },
      exchange: { title: "7 दिन में बदलाव", detail: "टूटने या गलत मिलने पर" },
      delivery: { title: "बीमित डिलीवरी", detail: "पूरे भारत में, 3 से 6 दिन" },
    } satisfies Record<PromiseKey, Item>,
  },
  en: {
    title: "Certified gemstones, rudraksha and malas",
    body: "Every gemstone comes with its own certificate and real photos. Every rudraksha is energized at Shri Mahakal Dham.",
    visitStore: "Visit the AstroGems store",
    categories: {
      gem: { title: "Gemstones", detail: "Lab certified gemstones", alt: "A natural yellow sapphire (Pukhraj)" },
      rudraksha: { title: "Rudraksha", detail: "1 to 14 mukhi, from Nepal", alt: "A five mukhi rudraksha mala" },
      bracelet: { title: "Bracelets", detail: "Zodiac and crystal bracelets", alt: "A tiger eye bracelet" },
      mala: { title: "Karungali and malas", detail: "Karungali, sphatik and tulsi malas", alt: "A rudraksha and karungali mala" },
    },
    view: "View",
    newTab: "(on AstroGems, opens in a new tab)",
    promises: {
      certified: { title: "Lab certified", detail: "A certificate with every order" },
      energized: { title: "Energized at the temple", detail: "At Shri Mahakal Dham" },
      exchange: { title: "Exchange within 7 days", detail: "If it arrives broken or wrong" },
      delivery: { title: "Insured delivery", detail: "Across India, in 3 to 6 days" },
    },
  },
});

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

/** The AstroGems store: four categories with real product photos, the store's promises, and a link to the store. */
export default async function AstroGemsSection() {
  const t = await getT(text);

  return (
    <section aria-labelledby="gems-title" className="pb-16">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {/* The store's mark beside its name and the heading: 40px on phones, 48px from md up. */}
          <div className="flex items-center gap-3 md:gap-4">
            <AstroGemsMark size={48} className="h-10 w-10 md:h-12 md:w-12" />
            <div className="min-w-0">
              <p className="caption-3 text-brand-strong">AstroGems · Astro Shrine Store</p>
              <h2 id="gems-title" className="heading-5 md:heading-4 mt-1 max-w-[680px] text-ink">
                {t.title}
              </h2>
            </div>
          </div>
          <p className="body-6 mt-2 max-w-[680px] text-ink-soft">{t.body}</p>
        </div>
        <a
          href={ASTROGEMS_URL}
          {...external}
          className="button-md inline-flex w-fit items-center gap-2 rounded-xl bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98"
        >
          {t.visitStore}
          <PiArrowUpRight className="h-5 w-5" aria-hidden />
        </a>
      </Reveal>

      <Reveal as="ul" group className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {CATEGORIES.map(({ key, href, photo }) => (
          <RevealItem as="li" key={href} hover>
            <a
              href={href}
              {...external}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-card transition-colors hover:bg-surface-sunken"
            >
              <span className="relative block aspect-square overflow-hidden bg-surface-sunken">
                <Image
                  src={photo}
                  alt={t.categories[key].alt}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </span>
              <span className="flex flex-1 flex-col gap-1 p-3 md:p-4">
                <span className="title-3 text-ink">{t.categories[key].title}</span>
                <span className="caption-5 text-ink-soft">{t.categories[key].detail}</span>
                <span className="caption-3 mt-auto inline-flex items-center gap-1 pt-2 text-brand-strong">
                  {t.view}
                  <PiArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </span>
              <span className="sr-only">{t.newTab}</span>
            </a>
          </RevealItem>
        ))}
      </Reveal>

      <Reveal as="ul" group className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface-card p-4 md:grid-cols-4 md:p-6">
        {PROMISES.map(({ key, icon: Icon }) => (
          <RevealItem as="li" key={key} className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-sunken text-brand-strong">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="title-4 block text-ink">{t.promises[key].title}</span>
              <span className="caption-5 block text-ink-soft">{t.promises[key].detail}</span>
            </span>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  );
}
