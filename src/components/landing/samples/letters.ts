// SAMPLE COPY taken from the design file. Replace with real data before launch.
import type { Locale } from "@/i18n/config";

/** One testimonial letter: the note, the person's name as shown, and their city. */
export type Letter = { text: string; name: string; city: string };

/** The average rating line shown beside the letters (sample figure from the design). */
export const SAMPLE_RATING = "4.8";

export const SAMPLE_LETTERS: Record<Locale, Letter[]> = {
  en: [
    {
      text: "After graduation I was anxious about work. The timing I was given turned out right, and I joined a company I like within months.",
      name: "Amar T.",
      city: "Pune",
    },
    { text: "Our Kundli milan was explained so patiently that both families felt at ease before the wedding.", name: "Sakshi K.", city: "Nagpur" },
    { text: "Polite, honest and in simple Hindi. The first chat helped me choose the right astrologer.", name: "Rohit V.", city: "Raipur" },
    { text: "The Vastu changes for our shop were easy to make, and the place simply feels calmer now.", name: "Pallavi M.", city: "Lucknow" },
  ],
  hi: [
    {
      text: "ग्रेजुएशन के बाद मुझे नौकरी की चिंता थी। जो समय बताया गया वह सही निकला, और कुछ ही महीनों में मुझे पसंद की कंपनी में काम मिल गया।",
      name: "अमर टी.",
      city: "पुणे",
    },
    { text: "हमारा कुंडली मिलान इतने धैर्य से समझाया गया कि शादी से पहले दोनों परिवार निश्चिंत हो गए।", name: "साक्षी के.", city: "नागपुर" },
    { text: "विनम्र, ईमानदार और सरल हिंदी में। पहली चैट से ही मुझे सही ज्योतिषी चुनने में मदद मिली।", name: "रोहित वी.", city: "रायपुर" },
    { text: "हमारी दुकान के वास्तु बदलाव करना आसान था, और अब जगह में सचमुच ज़्यादा शांति लगती है।", name: "पल्लवी एम.", city: "लखनऊ" },
  ],
};

/** The chat shown in the footer's phone picture: who is talking, and each message (sample copy from the design). */
export const SAMPLE_FOOTER_CHAT = {
  astrologer: "Neha Sharma",
  initials: "NS",
  messages: [
    { from: "user", text: "Namaste ji, meri job kab tak lagegi?", time: "9:38" },
    { from: "astrologer", text: "Namaste! Apni janam tithi, samay aur sthan bata dijiye.", time: "9:39" },
    { from: "user", text: "12 Mar 1998, 6:40 AM, Raipur", time: "9:40" },
    { from: "astrologer", text: "Aapki kundli dekh rahi hoon…", time: "9:41" },
  ],
} as const;
