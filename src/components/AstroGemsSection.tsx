import Image from "next/image";
import type { IconType } from "react-icons";
import { PiArrowUpRight, PiArrowsClockwise, PiSealCheck, PiTruck, PiFlowerLotus } from "react-icons/pi";
import { Reveal, RevealItem } from "@/components/Reveal";
import { ASTROGEMS_URL } from "@/lib/site";

// AstroGems (astrogems.astroshrine.in) is AstroShrine's store. The categories, photos and promises below are taken
// from it and each link was checked; prices and seasonal offers are left out because they change there.

const STORE = new URL(ASTROGEMS_URL).origin;

const CATEGORIES: { title: string; detail: string; href: string; photo: string; alt: string }[] = [
  {
    title: "रत्न",
    detail: "लैब सर्टिफाइड रत्न",
    href: `${STORE}/collections/gem`,
    photo: `${STORE}/products/natural-pukhraj-5-25-ct-ceylon.jpg`,
    alt: "प्राकृतिक पुखराज रत्न",
  },
  {
    title: "रुद्राक्ष",
    detail: "1 से 14 मुखी, नेपाल",
    href: `${STORE}/collections/rudraksha`,
    photo: `${STORE}/products/5-mukhi-rudraksha-mala-108-beads.jpg`,
    alt: "पंचमुखी रुद्राक्ष माला",
  },
  {
    title: "ब्रेसलेट",
    detail: "राशि और क्रिस्टल ब्रेसलेट",
    href: `${STORE}/collections/bracelet`,
    photo: `${STORE}/products/tiger-eye-power-bracelet.jpg`,
    alt: "टाइगर आई ब्रेसलेट",
  },
  {
    title: "करुंगली और माला",
    detail: "करुंगली, स्फटिक और तुलसी माला",
    href: `${STORE}/collections/mala`,
    photo: `${STORE}/products/divya-raksha-rudraksha-karungali-mala.jpg`,
    alt: "रुद्राक्ष और करुंगली माला",
  },
];

const PROMISES: { icon: IconType; title: string; detail: string }[] = [
  { icon: PiSealCheck, title: "लैब सर्टिफाइड", detail: "हर ऑर्डर के साथ सर्टिफिकेट" },
  { icon: PiFlowerLotus, title: "मंदिर में ऊर्जित", detail: "श्री महाकाल धाम में" },
  { icon: PiArrowsClockwise, title: "7 दिन में बदलाव", detail: "टूटने या गलत मिलने पर" },
  { icon: PiTruck, title: "बीमित डिलीवरी", detail: "पूरे भारत में, 3 से 6 दिन" },
];

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

/** The AstroGems store: four categories with real product photos, the store's promises, and a link to the store. */
export default function AstroGemsSection() {
  return (
    <section aria-labelledby="gems-title" className="pb-16">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="caption-3 text-brand-strong">AstroGems · Astro Shrine Store</p>
          <h2 id="gems-title" className="heading-5 md:heading-4 mt-1 max-w-[680px] text-ink">
            प्रमाणित रत्न, रुद्राक्ष और माला
          </h2>
          <p className="body-6 mt-2 max-w-[680px] text-ink-soft">
            हर रत्न के साथ उसका असली सर्टिफिकेट और असली फोटो। हर रुद्राक्ष श्री महाकाल धाम में ऊर्जित।
          </p>
        </div>
        <a
          href={ASTROGEMS_URL}
          {...external}
          className="button-md inline-flex w-fit items-center gap-2 rounded-full bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98"
        >
          AstroGems स्टोर देखें
          <PiArrowUpRight className="h-5 w-5" aria-hidden />
        </a>
      </Reveal>

      <Reveal as="ul" group className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {CATEGORIES.map((c) => (
          <RevealItem as="li" key={c.href} hover>
            <a
              href={c.href}
              {...external}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-card transition-colors hover:bg-surface-sunken"
            >
              <span className="relative block aspect-square overflow-hidden bg-surface-sunken">
                <Image
                  src={c.photo}
                  alt={c.alt}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </span>
              <span className="flex flex-1 flex-col gap-1 p-3 md:p-4">
                <span className="title-3 text-ink">{c.title}</span>
                <span className="caption-5 text-ink-soft">{c.detail}</span>
                <span className="caption-3 mt-auto inline-flex items-center gap-1 pt-2 text-brand-strong">
                  देखें
                  <PiArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </span>
              <span className="sr-only">(AstroGems पर, नए टैब में खुलेगा)</span>
            </a>
          </RevealItem>
        ))}
      </Reveal>

      <Reveal as="ul" group className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface-card p-4 md:grid-cols-4 md:p-6">
        {PROMISES.map(({ icon: Icon, title, detail }) => (
          <RevealItem as="li" key={title} className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-sunken text-brand-strong">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="title-4 block text-ink">{title}</span>
              <span className="caption-5 block text-ink-soft">{detail}</span>
            </span>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  );
}
