import type { Metadata } from "next";
import { Suspense } from "react";
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
import { PRIVACY_URL } from "@/lib/site";

// Motion design (Framer Motion, landing-page-design B7): the hero copy arrives line by line and the
// sample chart assembles itself on load; sections rise in once as they scroll into view; cards lift on
// hover; the steps track draws itself; live figures count up. Transform and opacity only, one base curve,
// and reduced motion turns movement into plain fades (MotionConfig in AppShell + the CSS rule in globals.css).

// Public landing page (layout A: classic hero plus sections). One offer, one audience, one action:
// a free birth chart in Hindi, for people who want their kundli without guesswork → "मुफ़्त कुंडली बनाएं".

const TITLE = "मुफ़्त जन्म कुंडली हिंदी में · AstroShrine";
const DESCRIPTION =
  "जन्म तिथि, समय और स्थान से मुफ़्त जन्म कुंडली: लग्न और नवांश चार्ट, नौ ग्रहों की स्थिति, विंशोत्तरी दशा, योग और दोष। AstroShrine ऐप वाले account से।";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  // openGraph / twitter replace the layout's objects (shallow merge), so the shared fields are repeated here.
  openGraph: { type: "website", siteName: "AstroShrine", locale: "hi_IN", title: TITLE, description: DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const PRIMARY_CTA = "मुफ़्त कुंडली बनाएं";

/** Card icon tiles turn and grow slightly when their card is hovered (CSS, transform only). */
const iconHover = "transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110";

const SOLUTIONS = [
  {
    icon: PiMapPin,
    title: "जगह अपने आप",
    body: "शहर का नाम लिखिए। अक्षांश, देशांतर और समय क्षेत्र अपने आप भर जाते हैं।",
  },
  {
    icon: PiClock,
    title: "समय पता न हो तब भी",
    body: "“समय ज्ञात नहीं” चुनिए। कुंडली दोपहर 12:00 से बनती है और साफ़ बताती है कि लग्न और नवांश तब भरोसेमंद नहीं।",
  },
  {
    icon: PiCalculator,
    title: "सटीक गणना",
    body: "Swiss Ephemeris पर निरयन गणना, लहिरी अयनांश के साथ।",
  },
];

const BENEFITS = [
  {
    icon: PiSquaresFour,
    title: "लग्न, नवांश और सभी वर्ग चार्ट",
    body: "उत्तर भारतीय शैली में D1 से D60 तक सभी 16 वर्ग चार्ट, एक क्लिक में बदलें। हर भाव में राशि का अंक और उसमें बैठे ग्रह।",
  },
  {
    icon: PiPlanet,
    title: "नौ ग्रहों की पूरी स्थिति",
    body: "राशि, अंश, नक्षत्र, पद और भाव, साथ में उच्च, नीच, वक्री और अस्त की जानकारी।",
  },
  {
    icon: PiHourglassMedium,
    title: "अभी कौन सी दशा चल रही है",
    body: "विंशोत्तरी महादशा, अंतर्दशा और प्रत्यंतर, शुरुआत और अंत की तारीखों के साथ।",
  },
  {
    icon: PiSparkle,
    title: "योग और दोष",
    body: "कौन से योग बनते हैं, और मांगलिक या काल सर्प जैसे दोष हैं या नहीं।",
  },
  {
    icon: PiUserCircle,
    title: "ऐप वाला ही account",
    body: "जन्म जानकारी एक बार सेव कीजिए। ऐप की “मेरी कुंडली” और AI ज्योतिषी भी वही इस्तेमाल करते हैं।",
  },
];

const STEPS = [
  { title: "मोबाइल नंबर से लॉगिन", body: "OTP से लॉगिन कीजिए। नया नंबर हो तो account अपने आप बन जाता है।" },
  {
    title: "जन्म विवरण डालिए",
    body: "नाम, जन्म तिथि, समय और शहर। जगह खोजते ही अक्षांश, देशांतर और समय क्षेत्र भर जाते हैं।",
  },
  {
    title: "कुंडली देखिए",
    body: "चार्ट, ग्रह स्थिति, दशा, योग और दोष एक ही पेज पर। चाहें तो जानकारी अपनी प्रोफ़ाइल में सेव कीजिए।",
  },
];

const FAQ = [
  { q: "क्या कुंडली सच में मुफ़्त है?", a: "हाँ। कुंडली बनाने पर आपके wallet से कोई पॉइंट नहीं कटता।" },
  {
    q: "कुंडली बनाने के लिए क्या चाहिए?",
    a: "नाम, जन्म तिथि, जन्म समय और जन्म स्थान। लॉगिन के लिए एक मोबाइल नंबर, जिस पर OTP आएगा।",
  },
  {
    q: "जन्म का सही समय पता न हो तो?",
    a: "“समय ज्ञात नहीं” चुनिए। कुंडली दोपहर 12:00 के समय से बनेगी, और पेज पर साफ़ लिखा होगा कि लग्न, भाव और नवांश तब भरोसेमंद नहीं हैं।",
  },
  {
    q: "गणना किस पद्धति से होती है?",
    a: "निरयन (sidereal) पद्धति से, लहिरी अयनांश के साथ। ग्रहों की स्थिति Swiss Ephemeris से निकाली जाती है।",
  },
  {
    q: "क्या ऐप डाउनलोड करना ज़रूरी है?",
    a: "नहीं। कुंडली इसी वेबसाइट पर बनती है। AstroShrine ऐप वाला मोबाइल नंबर हो तो वही account यहाँ भी चलता है।",
  },
  {
    q: "मेरी जन्म जानकारी कहाँ सेव होती है?",
    a: "सिर्फ़ कुंडली बनाने से कुछ सेव नहीं होता। “यह मेरी अपनी कुंडली है” चुनने पर ही जानकारी आपकी प्रोफ़ाइल में सेव होती है, ताकि ऐप में भी वही कुंडली दिखे।",
  },
  {
    q: "क्या परिवार के किसी सदस्य की कुंडली बना सकते हैं?",
    a: "हाँ। उनका नाम और जन्म विवरण डालिए। बस “यह मेरी अपनी कुंडली है” वाला विकल्प न चुनें, ताकि आपकी प्रोफ़ाइल की जानकारी न बदले।",
  },
  { q: "क्या ऐप और वेबसाइट का wallet अलग है?", a: "नहीं। दोनों में एक ही account और एक ही wallet balance है।" },
  {
    q: "Astrologer से बात कैसे करें?",
    a: "Astrologers पेज पर हर astrologer की rating, अनुभव और chat का प्रति मिनट शुल्क दिखता है। Astrologer चुनकर chat शुरू कीजिए। शुल्क आपके wallet से कटता है।",
  },
];

const RISK_REVERSAL = ["कुंडली बनाने पर कोई पॉइंट नहीं कटता", "ऐप की ज़रूरत नहीं, सब कुछ इसी वेबसाइट पर", "जन्म जानकारी तभी सेव होती है जब आप चुनें"];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />

      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        {/* 1. Hero */}
        <section aria-labelledby="hero-title" className="grid grid-cols-1 items-center gap-12 pb-24 pt-8 lg:grid-cols-5 lg:pt-16">
          <HeroIntro
            className="lg:col-span-3"
            eyebrow="मुफ़्त जन्म कुंडली"
            lines={["अपनी जन्म कुंडली मुफ़्त बनाइए,", "लग्न से दशा तक, हिंदी में"]}
            body="जन्म तिथि, समय और स्थान डालिए। लग्न कुंडली, नवांश, नौ ग्रहों की स्थिति, विंशोत्तरी दशा, योग और दोष एक ही पेज पर मिलेंगे। कुंडली बनाने पर कोई पॉइंट नहीं कटता।"
            cta={{ href: "/kundli", label: PRIMARY_CTA }}
          />
          <HeroChart className="lg:col-span-2" />
        </section>

        {/* 2. Problem to solution */}
        <section aria-labelledby="problem-title" className="grid grid-cols-1 gap-12 pb-24 lg:grid-cols-2">
          <Reveal>
            <p className="caption-3 text-brand-strong">सही कुंडली की शुरुआत</p>
            <h2 id="problem-title" className="heading-5 md:heading-4 mt-3 max-w-[680px] text-ink">
              जन्म का समय और जगह जितने सटीक, कुंडली उतनी सही
            </h2>
            <p className="body-3 mt-4 max-w-[680px] text-ink-soft">
              लग्न लगभग हर दो घंटे में बदल जाता है, और शहर बदलते ही अक्षांश, देशांतर और समय क्षेत्र भी बदलते हैं। इनमें छोटी
              सी चूक पूरी कुंडली बदल सकती है। इसलिए यहाँ ये बातें अपने आप संभाली जाती हैं।
            </p>
          </Reveal>
          <Reveal as="ul" group className="flex flex-col gap-4">
            {SOLUTIONS.map(({ icon: Icon, title, body }) => (
              <RevealItem as="li" key={title} hover className="group flex items-start gap-4 rounded-2xl border border-line bg-surface-card p-6">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-sunken text-brand-strong ${iconHover}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="title-3 block text-ink">{title}</span>
                  <span className="body-6 mt-1 block text-ink-soft">{body}</span>
                </span>
              </RevealItem>
            ))}
          </Reveal>
        </section>

        {/* 3. Benefits */}
        <section aria-labelledby="benefits-title" className="pb-24">
          <Reveal>
            <h2 id="benefits-title" className="heading-5 md:heading-4 max-w-[680px] text-ink">
              आपकी कुंडली में क्या मिलेगा
            </h2>
          </Reveal>
          <Reveal as="ul" group className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, body }, i) => (
              <RevealItem
                as="li"
                key={title}
                hover
                className={`group flex flex-col gap-4 rounded-2xl border border-line bg-surface-card p-6 ${i === 0 ? "lg:col-span-2" : ""}`}
              >
                <span className={`grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-ink ${iconHover}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="title-2 block text-ink">{title}</span>
                  <span className="body-6 mt-2 block text-ink-soft">{body}</span>
                </span>
              </RevealItem>
            ))}
          </Reveal>
        </section>
      </div>

      {/* B11. Tagline reveal */}
      <section aria-label="AstroShrine का वादा" className="py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <TaglineReveal
            className="heading-4 md:heading-3 max-w-[680px] text-ink"
            // A no-break space keeps the phrase "सोच समझकर" on one line (B5: break where the thought breaks).
            lines={["ग्रहों की चाल समझिए,", "अपने समय को पहचानिए,", "और हर फ़ैसला सोच समझकर लीजिए।"]}
          />
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        {/* 4. How it works */}
        <section aria-labelledby="steps-title" className="pb-24">
          <Reveal>
            <h2 id="steps-title" className="heading-5 md:heading-4 text-ink">
              तीन कदम में आपकी कुंडली
            </h2>
          </Reveal>
          <StepsTimeline items={STEPS} />
        </section>

        {/* 5. Proof: live data only */}
        <section aria-labelledby="proof-title" className="pb-24">
          <Reveal>
            <h2 id="proof-title" className="heading-5 md:heading-4 text-ink">
              AstroShrine के astrologers
            </h2>
            <p className="body-6 mt-2 max-w-[680px] text-ink-soft">
              ये आंकड़े, ratings और profiles सीधे AstroShrine की astrologers सूची से आते हैं।
            </p>
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
              अक्सर पूछे जाने वाले सवाल
            </h2>
            <p className="body-6 mt-2 text-ink-soft">
              आपकी जानकारी कैसे रखी जाती है, यह{" "}
              <a href={PRIVACY_URL} className="rounded-sm text-brand-strong underline underline-offset-4 transition hover:text-ink">
                Privacy policy
              </a>{" "}
              में लिखा है।
            </p>
          </Reveal>
          <Reveal as="ul" group className="flex flex-col gap-2 lg:col-span-2">
            {FAQ.map(({ q, a }) => (
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
        <FinalCta
          title="अपनी कुंडली आज ही देखिए"
          body="जन्म तिथि, समय और स्थान, बस इतना चाहिए। चार्ट, ग्रह, दशा, योग और दोष एक ही पेज पर।"
          cta={{ href: "/kundli", label: PRIMARY_CTA }}
          promises={RISK_REVERSAL}
        />
      </div>
    </>
  );
}
