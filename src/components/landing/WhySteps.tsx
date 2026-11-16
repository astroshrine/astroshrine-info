import { Reveal } from "@/components/Reveal";
import { defineMessages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";

const text = defineMessages({
  hi: {
    whyEyebrow: "ज्योतिष को समझें",
    whyTitle: "ज्योतिष की ज़रूरत क्यों?",
    why: [
      "कभी-कभी जीवन अपनी ही गति से चलता लगता है। वैदिक ज्योतिष देखता है कि आपके जन्म के समय ग्रह कहाँ थे, और आज उनकी चाल आपके दिनों को कैसे प्रभावित करती है।",
      "अच्छी सलाह आपके चुनाव छीनती नहीं। वह आपकी ताकत दिखाती है, कठिन समय के लिए तैयार करती है और प्रेम, काम, परिवार और धन के बड़े फ़ैसलों के लिए सही समय चुनने में मदद करती है।",
      "AstroShrine के साथ यह मार्गदर्शन घर बैठे, किसी भी समय, ध्यान से परखे गए ज्योतिषियों से मिलता है।",
    ],
    stepsEyebrow: "कैसे काम करता है",
    stepsTitle: "ऑनलाइन परामर्श कैसे होता है",
    steps: [
      { title: "साइन अप", body: "मोबाइल नंबर से, एक मिनट में।" },
      { title: "जन्म विवरण", body: "जन्म की तारीख, समय और स्थान।" },
      { title: "ज्योतिषी चुनें", body: "विषय, भाषा और शुल्क के अनुसार।" },
      { title: "चैट या कॉल", body: "हर बार निजी और सुरक्षित।" },
    ],
  },
  en: {
    whyEyebrow: "Understand astrology",
    whyTitle: "Why do you need astrology?",
    why: [
      "Sometimes life seems to move on its own schedule. Vedic astrology studies where the planets were at the moment you were born, and how their movement today shapes your days.",
      "A good reading does not take away your choices. It helps you see your strengths, prepare for hard phases and choose the right time for big decisions in love, work, family and money.",
      "With AstroShrine, this guidance is available from home, any time, from astrologers we have checked carefully.",
    ],
    stepsEyebrow: "How it works",
    stepsTitle: "How an online consultation works",
    steps: [
      { title: "Sign up", body: "With your mobile number in a minute." },
      { title: "Birth details", body: "Date, time and place of birth." },
      { title: "Pick astrologer", body: "By topic, language and price." },
      { title: "Chat or call", body: "Private and secure, every time." },
    ],
  },
});

const eyebrow = "font-display text-sm font-medium tracking-[.02em] text-brand-strong";
const h2 = "mt-2.5 font-display text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] text-ink md:text-[38px]";

/** "Why do you need astrology?" beside the four steps of an online consultation (the design's two-column block). */
export default async function WhySteps() {
  const t = text[await getLocale()];
  return (
    <section aria-label={t.whyTitle} className="pb-16 md:pb-[104px]">
      <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-2 lg:gap-[72px]">
        <Reveal>
          <p className={eyebrow}>{t.whyEyebrow}</p>
          <h2 className={h2}>{t.whyTitle}</h2>
          {t.why.map((p) => (
            <p key={p} className="mt-4 text-base leading-[1.8] text-ink-soft">
              {p}
            </p>
          ))}
        </Reveal>
        <Reveal>
          <p className={eyebrow}>{t.stepsEyebrow}</p>
          <h2 className={h2}>{t.stepsTitle}</h2>
          <ol className="relative mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-0">
            <span aria-hidden className="absolute top-[34px] right-[12%] left-[12%] hidden border-t-2 border-dashed border-brand sm:block" />
            {t.steps.map((s, i) => (
              <li key={s.title} className="relative text-center sm:px-4">
                <span className="relative z-10 mx-auto mb-5 grid h-[68px] w-[68px] place-items-center rounded-full border-2 border-brand bg-surface-card font-display text-[22px] font-semibold text-ink">
                  {i + 1}
                </span>
                <b className="mb-1.5 block text-[19px] text-ink">{s.title}</b>
                <span className="text-[15px] text-ink-soft">{s.body}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
