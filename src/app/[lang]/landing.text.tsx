import type { ReactNode } from "react";
import { defineMessages } from "@/i18n/messages";

// The landing page's text (src/app/[lang]/page.tsx), kept here because there is a lot of it.
// The Hindi page sells a free kundli in Hindi; the English page sells the same free kundli and does not repeat
// "in Hindi", since the whole site, the kundli included, can be read in English.

type Card = { title: string; body: string };

export type SolutionKey = "place" | "time" | "accuracy";
export type BenefitKey = "charts" | "planets" | "dasha" | "yogas" | "account";

export const LANDING_TEXT = defineMessages({
  hi: {
    meta: {
      title: "मुफ़्त जन्म कुंडली हिंदी में · AstroShrine",
      description:
        "जन्म तिथि, समय और स्थान से मुफ़्त जन्म कुंडली: लग्न और नवांश चार्ट, नौ ग्रहों की स्थिति, विंशोत्तरी दशा, योग और दोष। AstroShrine ऐप वाले account से।",
    },
    cta: "मुफ़्त कुंडली बनाएं",
    hero: {
      eyebrow: "मुफ़्त जन्म कुंडली",
      lines: ["अपनी जन्म कुंडली मुफ़्त बनाइए,", "लग्न से दशा तक, हिंदी में"],
      body: "जन्म तिथि, समय और स्थान डालिए। लग्न कुंडली, नवांश, नौ ग्रहों की स्थिति, विंशोत्तरी दशा, योग और दोष एक ही पेज पर मिलेंगे। कुंडली बनाने पर कोई पॉइंट नहीं कटता।",
    },
    problem: {
      kicker: "सही कुंडली की शुरुआत",
      title: "जन्म का समय और जगह जितने सटीक, कुंडली उतनी सही",
      body: "लग्न लगभग हर दो घंटे में बदल जाता है, और शहर बदलते ही अक्षांश, देशांतर और समय क्षेत्र भी बदलते हैं। इनमें छोटी सी चूक पूरी कुंडली बदल सकती है। इसलिए यहाँ ये बातें अपने आप संभाली जाती हैं।",
    },
    solutions: {
      place: {
        title: "जगह अपने आप",
        body: "शहर का नाम लिखिए। अक्षांश, देशांतर और समय क्षेत्र अपने आप भर जाते हैं।",
      },
      time: {
        title: "समय पता न हो तब भी",
        body: "“समय ज्ञात नहीं” चुनिए। कुंडली दोपहर 12:00 से बनती है और साफ़ बताती है कि लग्न और नवांश तब भरोसेमंद नहीं।",
      },
      accuracy: {
        title: "सटीक गणना",
        body: "Swiss Ephemeris पर निरयन गणना, लहिरी अयनांश के साथ।",
      },
    } satisfies Record<SolutionKey, Card>,
    benefitsTitle: "आपकी कुंडली में क्या मिलेगा",
    benefits: {
      charts: {
        title: "लग्न, नवांश और सभी वर्ग चार्ट",
        body: "उत्तर भारतीय शैली में D1 से D60 तक सभी 16 वर्ग चार्ट, एक क्लिक में बदलें। हर भाव में राशि का अंक और उसमें बैठे ग्रह।",
      },
      planets: {
        title: "नौ ग्रहों की पूरी स्थिति",
        body: "राशि, अंश, नक्षत्र, पद और भाव, साथ में उच्च, नीच, वक्री और अस्त की जानकारी।",
      },
      dasha: {
        title: "अभी कौन सी दशा चल रही है",
        body: "विंशोत्तरी महादशा, अंतर्दशा और प्रत्यंतर, शुरुआत और अंत की तारीखों के साथ।",
      },
      yogas: {
        title: "योग और दोष",
        body: "कौन से योग बनते हैं, और मांगलिक या काल सर्प जैसे दोष हैं या नहीं।",
      },
      account: {
        title: "ऐप वाला ही account",
        body: "जन्म जानकारी एक बार सेव कीजिए। ऐप की “मेरी कुंडली” और AI ज्योतिषी भी वही इस्तेमाल करते हैं।",
      },
    } satisfies Record<BenefitKey, Card>,
    taglineLabel: "AstroShrine का वादा",
    // A no-break space keeps the phrase "सोच समझकर" on one line (B5: break where the thought breaks).
    tagline: ["ग्रहों की चाल समझिए,", "अपने समय को पहचानिए,", "और हर फ़ैसला सोच समझकर लीजिए।"],
    stepsTitle: "तीन कदम में आपकी कुंडली",
    steps: [
      { title: "मोबाइल नंबर से लॉगिन", body: "OTP से लॉगिन कीजिए। नया नंबर हो तो account अपने आप बन जाता है।" },
      {
        title: "जन्म विवरण डालिए",
        body: "नाम, जन्म तिथि, समय और शहर। जगह खोजते ही अक्षांश, देशांतर और समय क्षेत्र भर जाते हैं।",
      },
      {
        title: "कुंडली देखिए",
        body: "चार्ट, ग्रह स्थिति, दशा, योग और दोष एक ही पेज पर। चाहें तो जानकारी अपनी प्रोफ़ाइल में सेव कीजिए।",
      },
    ],
    proofTitle: "AstroShrine के astrologers",
    proofBody: "ये आंकड़े, ratings और profiles सीधे AstroShrine की astrologers सूची से आते हैं।",
    faqTitle: "अक्सर पूछे जाने वाले सवाल",
    privacyLink: "Privacy policy",
    privacy: (link: ReactNode) => <>आपकी जानकारी कैसे रखी जाती है, यह {link} में लिखा है।</>,
    faq: [
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
    ],
    finalTitle: "अपनी कुंडली आज ही देखिए",
    finalBody: "जन्म तिथि, समय और स्थान, बस इतना चाहिए। चार्ट, ग्रह, दशा, योग और दोष एक ही पेज पर।",
    promises: ["कुंडली बनाने पर कोई पॉइंट नहीं कटता", "ऐप की ज़रूरत नहीं, सब कुछ इसी वेबसाइट पर", "जन्म जानकारी तभी सेव होती है जब आप चुनें"],
  },
  en: {
    meta: {
      title: "Free Kundli online: your Vedic birth chart · AstroShrine",
      description:
        "A free birth chart from your date, time and place of birth: Ascendant and Navamsha charts, the positions of the nine planets, Vimshottari Dasha, yogas and doshas. With your AstroShrine app account.",
    },
    cta: "Make your free Kundli",
    hero: {
      eyebrow: "Free Kundli",
      lines: ["Make your birth chart for free,", "from Ascendant to Dasha"],
      body: "Enter your date, time and place of birth. Your Lagna chart, Navamsha, the positions of the nine planets, Vimshottari Dasha, yogas and doshas, all on one page. Making a Kundli costs no points.",
    },
    problem: {
      kicker: "Where an accurate Kundli begins",
      title: "The more exact your birth time and place, the more accurate your Kundli",
      body: "The Ascendant changes about every two hours, and latitude, longitude and time zone change from one city to the next. A small slip in any of them can change the whole chart. So these are handled for you here.",
    },
    solutions: {
      place: {
        title: "Place filled in for you",
        body: "Type the name of your city. Latitude, longitude and time zone fill in on their own.",
      },
      time: {
        title: "Even without a birth time",
        body: "Choose the option for an unknown birth time. The chart is made for 12:00 noon and says clearly that the Ascendant and Navamsha are then not reliable.",
      },
      accuracy: {
        title: "Precise calculation",
        body: "Sidereal (nirayana) calculation on the Swiss Ephemeris, with Lahiri ayanamsa.",
      },
    },
    benefitsTitle: "What your Kundli shows",
    benefits: {
      charts: {
        title: "Ascendant, Navamsha and every divisional chart",
        body: "All 16 divisional charts from D1 to D60 in the North Indian style, one click apart. Each house shows its sign number and the planets placed in it.",
      },
      planets: {
        title: "Full positions of the nine planets",
        body: "Sign, degree, Nakshatra, pada and house, with exalted, debilitated, retrograde and combust status.",
      },
      dasha: {
        title: "Which Dasha is running now",
        body: "Vimshottari Mahadasha, Antardasha and Pratyantar, with their start and end dates.",
      },
      yogas: {
        title: "Yogas and doshas",
        body: "Which yogas form, and whether doshas such as Manglik or Kaal Sarp are present.",
      },
      account: {
        title: "Same account as the app",
        body: "Save your birth details once. The app's “My Kundli” and AI Astrologer use them too.",
      },
    },
    taglineLabel: "AstroShrine's promise",
    // A no-break space keeps "with care" together on the last line.
    tagline: ["Understand how the planets move,", "know the time you are in,", "and make every decision with care."],
    stepsTitle: "Your Kundli in three steps",
    steps: [
      { title: "Log in with your mobile number", body: "Log in with an OTP. A new number gets an account automatically." },
      {
        title: "Enter your birth details",
        body: "Name, date and time of birth, and city. Latitude, longitude and time zone fill in as soon as you pick the place.",
      },
      {
        title: "See your Kundli",
        body: "Charts, planet positions, Dasha, yogas and doshas on one page. Save the details to your profile if you like.",
      },
    ],
    proofTitle: "Astrologers on AstroShrine",
    proofBody: "These figures, ratings and profiles come straight from AstroShrine's list of astrologers.",
    faqTitle: "Frequently asked questions",
    privacyLink: "Privacy policy",
    privacy: (link) => <>Our {link} explains how your information is kept.</>,
    faq: [
      { q: "Is the Kundli really free?", a: "Yes. Making a Kundli takes no points from your wallet." },
      {
        q: "What do I need to make a Kundli?",
        a: "Your name, date of birth, time of birth and place of birth. To log in, a mobile number that can receive an OTP.",
      },
      {
        q: "What if I don't know my exact birth time?",
        a: "Choose the option for an unknown birth time. The chart will be made for 12:00 noon, and the page will say clearly that the Ascendant, houses and Navamsha are then not reliable.",
      },
      {
        q: "Which system is used for the calculations?",
        a: "The sidereal (nirayana) system, with Lahiri ayanamsa. Planet positions are calculated with the Swiss Ephemeris.",
      },
      {
        q: "Do I need to download the app?",
        a: "No. The Kundli is made right here on the website. If you use the AstroShrine app, the same mobile number and account work here too.",
      },
      {
        q: "Where are my birth details saved?",
        a: "Making a Kundli does not save anything by itself. Your details are saved to your profile only when you mark the Kundli as your own, so the app shows the same Kundli.",
      },
      {
        q: "Can I make a Kundli for a family member?",
        a: "Yes. Enter their name and birth details. Just don't mark it as your own Kundli, so your profile details stay as they are.",
      },
      { q: "Is the wallet on the website separate from the app?", a: "No. Both use the same account and the same wallet balance." },
      {
        q: "How do I talk to an astrologer?",
        a: "The Astrologers page shows each astrologer's rating, experience and chat price per minute. Choose an astrologer and start a chat. The charge is taken from your wallet.",
      },
    ],
    finalTitle: "See your Kundli today",
    finalBody: "Your date, time and place of birth is all it takes. Charts, planets, Dasha, yogas and doshas on one page.",
    promises: ["Making a Kundli costs no points", "No app needed, everything is on this website", "Birth details are saved only when you choose"],
  },
});
