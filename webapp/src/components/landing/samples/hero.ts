// Hero copy. The chart's chips and house texts describe the labelled SAMPLE chart; every figure in the stat box
// is live (useAstrologerDirectory), so nothing here claims numbers or activity that did not happen.

import { defineMessages } from "@/i18n/messages";

export const HERO_SAMPLE = defineMessages({
  hi: {
    deva: "॥ ज्योतिष · मार्गदर्शन ॥",
    lead: "सत्यापित astrologers से जुड़िए, जो आपकी कुंडली पढ़कर आपकी भाषा में जवाब देते हैं।",
    chat: "Astrologer से chat करें",
    kundli: "अपनी कुंडली बनाएं",
    trust: ["सत्यापित astrologers", "निजी chat", "24×7 सहायता"],
    statsLabel: "AstroShrine के आंकड़े",
    stats: {
      astrologers: "सत्यापित astrologers",
      online: "अभी online",
      rating: "औसत rating",
      reviews: "Reviews",
    },
    online: (n: string) => `${n} astrologers अभी online`,
    chartLabel: "नमूना जन्म कुंडली",
    chartAria: "नमूना उत्तर भारतीय कुंडली। किसी भाव को चुनकर जानिए वह किस बारे में है।",
    chartEyebrow: "जन्म कुंडली",
    chartTitle: "जन्म कुंडली चार्ट",
    chartPill: "उत्तर भारतीय · D1",
    chipLagna: "लग्न",
    chipLagnaValue: "मेष 12°",
    chipMoon: "चंद्र नक्षत्र",
    chipMoonValue: "पुष्य",
    infoHint: "किसी भी भाव को छूकर देखिए।",
    bhava: "भाव",
    houses: [
      ["लग्न", "स्वयं, शरीर और व्यक्तित्व"],
      ["धन", "धन, परिवार और वाणी"],
      ["सहज", "साहस, भाई-बहन और प्रयास"],
      ["सुख", "घर, माता और सुख"],
      ["पुत्र", "संतान, विद्या और प्रेम"],
      ["रिपु", "स्वास्थ्य, ऋण और शत्रु"],
      ["कलत्र", "विवाह और साझेदारी"],
      ["आयु", "आयु और अचानक बदलाव"],
      ["भाग्य", "भाग्य, धर्म और गुरु"],
      ["कर्म", "करियर और प्रतिष्ठा"],
      ["लाभ", "लाभ, आय और मित्र"],
      ["व्यय", "खर्च, यात्रा और मोक्ष"],
    ] as [string, string][],
    quickLabel: "मुख्य सेवाएं",
    quick: [
      { title: "Astrologer से chat", body: "सत्यापित astrologers से तुरंत text परामर्श।", action: "Chat शुरू करें" },
      { title: "Astrologer को call", body: "अपने समय पर निजी voice call बुक करें।", action: "Call बुक करें" },
      { title: "दैनिक राशिफल", body: "आज का आपका फल, सभी 12 राशियों के लिए।", action: "आज का पढ़ें" },
      { title: "कुंडली", body: "ग्रहों और दशा के साथ पूरी जन्म कुंडली।", action: "कुंडली बनाएं" },
    ],
  },
  en: {
    deva: "॥ ज्योतिष · मार्गदर्शन ॥",
    lead: "Connect with verified astrologers who read your Kundli and answer in your language.",
    chat: "Chat with astrologer",
    kundli: "Make your kundli",
    trust: ["Verified astrologers", "Private chats", "24×7 support"],
    statsLabel: "AstroShrine in numbers",
    stats: {
      astrologers: "Verified astrologers",
      online: "Online now",
      rating: "Average rating",
      reviews: "Reviews",
    },
    online: (n) => `${n} astrologers online now`,
    chartLabel: "Sample birth chart",
    chartAria: "Sample North Indian Kundli chart. Select a house to learn what it covers.",
    chartEyebrow: "जन्म कुंडली",
    chartTitle: "Birth chart",
    chartPill: "North Indian · D1",
    chipLagna: "Lagna",
    chipLagnaValue: "Mesh 12°",
    chipMoon: "Moon nakshatra",
    chipMoonValue: "Pushya",
    infoHint: "Tap any house to explore.",
    bhava: "bhava",
    houses: [
      ["Lagna", "Self, body and personality"],
      ["Dhan", "Wealth, family and speech"],
      ["Sahaj", "Courage, siblings and effort"],
      ["Sukh", "Home, mother and comfort"],
      ["Putra", "Children, learning and romance"],
      ["Ripu", "Health, debts and rivals"],
      ["Kalatra", "Marriage and partnerships"],
      ["Ayu", "Longevity and sudden change"],
      ["Bhagya", "Luck, dharma and teachers"],
      ["Karma", "Career and reputation"],
      ["Labh", "Gains, income and friends"],
      ["Vyaya", "Expenses, travel and moksha"],
    ],
    quickLabel: "Main services",
    quick: [
      { title: "Chat with astrologer", body: "Instant text consultation with verified astrologers.", action: "Start chat" },
      { title: "Call astrologer", body: "Book a private voice call at a time that suits you.", action: "Book a call" },
      { title: "Daily horoscope", body: "Your reading for today, for all 12 rashis.", action: "Read today" },
      { title: "Kundli", body: "Detailed birth chart with planets and dasha.", action: "Make kundli" },
    ],
  },
});

/** Planet marks on the sample chart, by house (house 1 first). Same in both languages. */
export const CHART_PLANETS = [["La", "Su"], ["Me"], [], ["Mo"], ["Ju"], [], ["Ve"], ["Ra"], [], ["Sa"], ["Ma"], ["Ke"]];

export const ASTRO_SAMPLE = defineMessages({
  hi: {
    kicker: "हमारे ज्योतिषी",
    title: "अभी उपलब्ध astrologers",
    lead: "हर एक हमारी योग्यता जाँच, panel interview और live session audit पास कर चुका है।",
    seeAll: "सभी astrologers देखें",
    topics: ["सभी", "करियर", "प्रेम", "विवाह", "धन", "स्वास्थ्य"],
    empty: "इस श्रेणी में अभी कोई astrologer उपलब्ध नहीं है।",
  },
  en: {
    kicker: "हमारे ज्योतिषी",
    title: "Astrologers available now",
    lead: "Each one has cleared our qualification check, panel interview and live session audit.",
    seeAll: "See all astrologers",
    topics: ["All", "Career", "Love", "Marriage", "Money", "Health"],
    empty: "No astrologer is available in this category right now.",
  },
});

/** Words in an astrologer's expertise that put them under a tab (index matches `topics`, 0 = All). */
export const TOPIC_WORDS: (RegExp | null)[] = [
  null,
  /career|job|business|profession|करियर|नौकरी|व्यापार/i,
  /love|tarot|relationship|romance|प्रेम|टैरो/i,
  /marriage|matching|milan|kundli matching|vivah|विवाह|मिलान/i,
  /money|finance|wealth|numerolog|vastu|gem|धन|वास्तु|रत्न/i,
  /health|healing|medical|स्वास्थ्य/i,
];
