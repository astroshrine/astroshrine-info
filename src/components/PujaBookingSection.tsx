import Image from "next/image";
import type { IconType } from "react-icons";
import { PiArrowUpRight, PiCheckCircle, PiDrop, PiPlanet, PiSun } from "react-icons/pi";
import { Reveal, RevealItem } from "@/components/Reveal";
import { PUJA_BOOKING_URL } from "@/lib/site";

// Puja booking happens on AstroShrine's temple site, Shri Amleshwar Mahakal Dham (shrimahakaldham.com). Every
// fact, name and photo below is taken from that site; prices are left out because they change there.

/** The full list of pujas on the temple site. */
const ALL_PUJAS_URL = "https://shrimahakaldham.com/temple";
/** A puja thali photo from the temple site (its "puja by purpose" picture). */
const PUJA_PHOTO = "https://shrimahakaldham.com/website-assets/assets/images/category/puja-by-purpose.jpg";

const KINDS: { icon: IconType; title: string; detail: string }[] = [
  { icon: PiPlanet, title: "कुंडली दोष पूजा", detail: "कालसर्प, मांगलिक और पितृ दोष निवारण" },
  { icon: PiSun, title: "ग्रह शांति पूजा", detail: "नवग्रह, शनि, मंगल, राहु और केतु शांति" },
  { icon: PiDrop, title: "रुद्राभिषेक", detail: "जलाभिषेक और उद्देश्य अनुसार विशेष पूजा" },
];

const PROMISES = ["वैदिक पूजा", "अनुभवी आचार्य", "पूजा की फोटो/वीडियो", "ऑनलाइन बुकिंग"];

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

/**
 * Puja booking, presented as a card that sends people to Shri Mahakal Dham (new tab): a photo, what the temple
 * offers, the main kinds of puja, and two links (book a puja, see every puja).
 */
export default function PujaBookingSection() {
  return (
    <section aria-labelledby="puja-title" className="pb-16">
      <Reveal className="group grid grid-cols-1 overflow-hidden rounded-3xl border border-line bg-surface-card lg:grid-cols-12">
        <div className="relative h-56 overflow-hidden sm:h-72 lg:order-2 lg:col-span-5 lg:h-auto">
          <Image
            src={PUJA_PHOTO}
            alt="पूजा की थाली: जलते दीये, गेंदे के फूल और अगरबत्ती"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="caption-3 absolute left-4 top-4 rounded-full bg-surface-card/90 px-3 py-1 text-ink backdrop-blur">
            श्री अमलेश्वर महाकाल धाम
          </span>
        </div>

        <div className="flex flex-col gap-6 p-6 md:p-8 lg:col-span-7">
          <div>
            <p className="caption-3 text-brand-strong">पूजा बुकिंग · अमलेश्वर, रायपुर</p>
            <h2 id="puja-title" className="heading-5 md:heading-4 mt-2 max-w-[680px] text-ink">
              महाकाल की शरण में, आपके नाम और गोत्र से पूजा
            </h2>
            <p className="body-6 mt-3 max-w-[680px] text-ink-soft">
              खारून नदी के तट पर स्थित स्वयंभू शिव की तपोभूमि, श्री अमलेश्वर महाकाल धाम में ज्योतिषाचार्य पंडित प्रियाशरण
              त्रिपाठी के साथ वैदिक विधि से पूजा।
            </p>
          </div>

          <Reveal as="ul" group className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {KINDS.map(({ icon: Icon, title, detail }) => (
              <RevealItem as="li" key={title} className="flex items-start gap-3 rounded-2xl bg-surface-sunken p-4 sm:flex-col">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="title-4 block text-ink">{title}</span>
                  <span className="caption-5 mt-1 block text-ink-soft">{detail}</span>
                </span>
              </RevealItem>
            ))}
          </Reveal>

          <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="श्री महाकाल धाम की सुविधाएं">
            {PROMISES.map((p) => (
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
              className="button-md inline-flex items-center gap-2 rounded-full bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98"
            >
              पूजा बुक करें
              <PiArrowUpRight className="h-5 w-5" aria-hidden />
            </a>
            <a
              href={ALL_PUJAS_URL}
              {...external}
              className="button-sm inline-flex items-center gap-1 rounded-full px-2 py-2 text-ink-soft transition hover:text-ink"
            >
              सभी पूजा देखें
              <PiArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
            <span className="caption-5 text-ink-muted">बुकिंग श्री महाकाल धाम की वेबसाइट पर, नए टैब में</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
