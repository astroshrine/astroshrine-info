import type { Metadata } from "next";
import { PiArrowRight, PiLock } from "react-icons/pi";
import Link from "@/i18n/Link";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import { shareImages } from "@/lib/share";
import { TOOLS, TOOL_TEXT, type ToolGroup } from "./_components/registry";

const text = defineMessages({
  hi: {
    title: "ज्योतिष टूल · AstroShrine",
    description: "अंक ज्योतिष, टैरो, हस्त रेखा, मुख सामुद्रिक, हस्ताक्षर, DMIT, वास्तु, मुहूर्त और बहुत कुछ: AstroShrine ऐप वाले खाते से।",
    eyebrow: "Tools · Jyotish",
    heading: "ज्योतिष और मार्गदर्शन के टूल",
    intro: "वही टूल जो AstroShrine ऐप में हैं, अब वेबसाइट पर भी। उसी खाते से लॉगिन करें।",
    astroOnly: "केवल ज्योतिषी",
    groups: {
      readings: "रीडिंग और विश्लेषण",
      wellbeing: "मन और जीवन",
      home: "वास्तु",
      muhurat: "मुहूर्त और संस्कार",
      kundli: "कुंडली के विशेष टूल",
    },
    kundliLink: "जन्म कुंडली, गोचर, पंचांग और मिलान के लिए कुंडली पेज देखें",
  },
  en: {
    title: "Astrology tools · AstroShrine",
    description: "Numerology, tarot, palm reading, face reading, signature analysis, DMIT, vastu, muhurat and more, with the same account as the AstroShrine app.",
    eyebrow: "Tools · Jyotish",
    heading: "Tools for astrology and guidance",
    intro: "The same tools as in the AstroShrine app, now on the website. Log in with the same account.",
    astroOnly: "Astrologers only",
    groups: {
      readings: "Readings and analysis",
      wellbeing: "Mind and life",
      home: "Vastu",
      muhurat: "Muhurat and sanskars",
      kundli: "Special kundli tools",
    },
    kundliLink: "For birth charts, transits, panchang and matching, see the kundli pages",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return {
    title: t.title,
    description: t.description,
    alternates: await languageAlternates("/tools"),
    openGraph: { title: t.title, description: t.description, images: await shareImages() },
  };
}

const GROUP_ORDER: ToolGroup[] = ["readings", "wellbeing", "home", "muhurat", "kundli"];

export default async function ToolsIndexPage() {
  const t = await getT(text);
  const names = await getT(TOOL_TEXT);

  return (
    <div>
      <header className="max-w-2xl">
        <p className="caption-4 text-brand-strong">{t.eyebrow}</p>
        <h1 className="heading-4 hero-gradient-text mt-1 lg:heading-3">{t.heading}</h1>
        <p className="body-3 mt-3 text-ink-soft">{t.intro}</p>
      </header>

      <div className="mt-8 space-y-10">
        {GROUP_ORDER.map((group) => {
          const items = TOOLS.filter((x) => x.group === group);
          return (
            <section key={group} aria-labelledby={`g-${group}`}>
              <h2 id={`g-${group}`} className="heading-6 text-ink">
                {t.groups[group]}
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(({ slug, icon: Icon, astrologerOnly }) => (
                  <li key={slug}>
                    <Link
                      href={`/tools/${slug}`}
                      className="group flex h-full items-start gap-3 rounded-2xl border border-line bg-surface-card p-4 transition hover:border-line-strong hover:bg-surface-sunken active:scale-98"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-sunken text-brand-strong transition group-hover:bg-surface-card">
                        <Icon className="h-6 w-6" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="title-3 flex items-center justify-between gap-2 text-ink">
                          {names[slug].name}
                          <PiArrowRight
                            className="h-4 w-4 shrink-0 text-ink-muted transition group-hover:translate-x-1 group-hover:text-ink"
                            aria-hidden
                          />
                        </span>
                        <span className="caption-2 mt-1 block text-ink-soft">{names[slug].blurb}</span>
                        {astrologerOnly && (
                          <span className="caption-4 mt-2 inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-brand-strong">
                            <PiLock className="h-3 w-3" aria-hidden /> {t.astroOnly}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="body-6 mt-10 text-ink-soft">
        <Link href="/kundli" className="underline underline-offset-4 hover:text-ink">
          {t.kundliLink}
        </Link>
      </p>
    </div>
  );
}
