import Image from "next/image";
import type { IconType } from "react-icons";
import { PiArrowUpRight, PiCheckCircle, PiDrop, PiPlanet, PiSun } from "react-icons/pi";
import { Reveal, RevealItem } from "@/components/Reveal";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { PUJA_BOOKING_URL } from "@/lib/site";

// Puja booking happens on AstroShrine's temple site, Shri Amleshwar Mahakal Dham (shrimahakaldham.com). Every
// fact, name and photo below is taken from that site; prices are left out because they change there.

/** The full list of pujas on the temple site. */
const ALL_PUJAS_URL = "https://shrimahakaldham.com/temple";
/** A puja thali photo from the temple site (its "puja by purpose" picture). */
const PUJA_PHOTO = "https://shrimahakaldham.com/website-assets/assets/images/category/puja-by-purpose.jpg";

type KindKey = "dosha" | "graha" | "rudrabhishek";

const KINDS: { key: KindKey; icon: IconType }[] = [
  { key: "dosha", icon: PiPlanet },
  { key: "graha", icon: PiSun },
  { key: "rudrabhishek", icon: PiDrop },
];

const text = defineMessages({
  hi: {
    photoAlt: "पूजा की थाली: जलते दीये, गेंदे के फूल और अगरबत्ती",
    temple: "श्री अमलेश्वर महाकाल धाम",
    kicker: "पूजा बुकिंग · अमलेश्वर, रायपुर",
    title: "महाकाल की शरण में, आपके नाम और गोत्र से पूजा",
    body: "खारून नदी के तट पर स्थित स्वयंभू शिव की तपोभूमि, श्री अमलेश्वर महाकाल धाम में ज्योतिषाचार्य पंडित प्रियाशरण त्रिपाठी के साथ वैदिक विधि से पूजा।",
    kinds: {
      dosha: { title: "कुंडली दोष पूजा", detail: "कालसर्प, मांगलिक और पितृ दोष निवारण" },
      graha: { title: "ग्रह शांति पूजा", detail: "नवग्रह, शनि, मंगल, राहु और केतु शांति" },
      rudrabhishek: { title: "रुद्राभिषेक", detail: "जलाभिषेक और उद्देश्य अनुसार विशेष पूजा" },
    } satisfies Record<KindKey, { title: string; detail: string }>,
    promisesLabel: "श्री महाकाल धाम की सुविधाएं",
    promises: ["वैदिक पूजा", "अनुभवी आचार्य", "पूजा की फोटो/वीडियो", "ऑनलाइन बुकिंग"],
    book: "पूजा बुक करें",
    allPujas: "सभी पूजा देखें",
    note: "बुकिंग श्री महाकाल धाम की वेबसाइट पर, नए टैब में",
  },
  en: {
    photoAlt: "A puja thali with lit diyas, marigold flowers and incense sticks",
    temple: "Shri Amleshwar Mahakal Dham",
    kicker: "Puja booking · Amleshwar, Raipur",
    title: "Puja in your name and gotra, in the shelter of Mahakal",
    // The name as AstroShrine's own astrologer list spells it ("Pt Priya Sharan Tripathi").
    body: "Vedic puja with Jyotishacharya Pandit Priya Sharan Tripathi at Shri Amleshwar Mahakal Dham, the sacred land of Swayambhu Shiva on the banks of the Kharun river.",
    kinds: {
      dosha: { title: "Kundli dosha puja", detail: "Remedies for Kaal Sarp, Manglik and Pitra dosha" },
      graha: { title: "Graha shanti puja", detail: "Shanti for the Navagraha, Saturn, Mars, Rahu and Ketu" },
      rudrabhishek: { title: "Rudrabhishek", detail: "Jalabhishek and special pujas for a purpose" },
    },
    promisesLabel: "What Shri Mahakal Dham offers",
    promises: ["Vedic puja", "Experienced acharyas", "Photos and videos of the puja", "Online booking"],
    book: "Book a puja",
    allPujas: "See all pujas",
    note: "Booking is on the Shri Mahakal Dham website, in a new tab",
  },
});

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

/**
 * Puja booking, presented as a card that sends people to Shri Mahakal Dham (new tab): a photo, what the temple
 * offers, the main kinds of puja, and two links (book a puja, see every puja).
 */
export default async function PujaBookingSection() {
  const t = await getT(text);

  return (
    <section aria-labelledby="puja-title" className="pb-16">
      <Reveal className="group grid grid-cols-1 overflow-hidden rounded-3xl border border-line bg-surface-card lg:grid-cols-12">
        <div className="relative h-56 overflow-hidden sm:h-72 lg:order-2 lg:col-span-5 lg:h-auto">
          <Image
            src={PUJA_PHOTO}
            alt={t.photoAlt}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="caption-3 absolute left-4 top-4 rounded-xl bg-surface-card/90 px-3 py-1 text-ink backdrop-blur">
            {t.temple}
          </span>
        </div>

        <div className="flex flex-col gap-6 p-6 md:p-8 lg:col-span-7">
          <div>
            <p className="caption-3 text-brand-strong">{t.kicker}</p>
            <h2 id="puja-title" className="heading-5 md:heading-4 mt-2 max-w-[680px] text-ink">
              {t.title}
            </h2>
            <p className="body-6 mt-3 max-w-[680px] text-ink-soft">{t.body}</p>
          </div>

          <Reveal as="ul" group className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {KINDS.map(({ key, icon: Icon }) => (
              <RevealItem as="li" key={key} className="flex items-start gap-3 rounded-2xl bg-surface-sunken p-4 sm:flex-col">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="title-4 block text-ink">{t.kinds[key].title}</span>
                  <span className="caption-5 mt-1 block text-ink-soft">{t.kinds[key].detail}</span>
                </span>
              </RevealItem>
            ))}
          </Reveal>

          <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label={t.promisesLabel}>
            {t.promises.map((p) => (
              <li key={p} className="caption-1 inline-flex items-center gap-1 text-ink-soft">
                <PiCheckCircle className="h-4 w-4 text-success" aria-hidden />
                {p}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={PUJA_BOOKING_URL}
              {...external}
              className="button-md inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98"
            >
              {t.book}
              <PiArrowUpRight className="h-5 w-5" aria-hidden />
            </a>
            <a
              href={ALL_PUJAS_URL}
              {...external}
              className="button-sm inline-flex items-center gap-1 rounded-full px-2 py-2 text-ink-soft transition hover:text-ink"
            >
              {t.allPujas}
              <PiArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
            <span className="caption-5 text-ink-muted">{t.note}</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
