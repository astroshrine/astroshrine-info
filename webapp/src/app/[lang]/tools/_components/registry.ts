import type { IconType } from "react-icons";
import {
  PiBaby,
  PiBrain,
  PiCardsThree,
  PiCheckSquare,
  PiCompass,
  PiCompassRose,
  PiEyeSlash,
  PiFingerprint,
  PiFlame,
  PiFlowerLotus,
  PiHandPalm,
  PiHandPointing,
  PiHash,
  PiHouseLine,
  PiMagnifyingGlass,
  PiClockCountdown,
  PiSignature,
  PiSmiley,
  PiStack,
} from "react-icons/pi";
import { defineMessages } from "@/i18n/messages";

/** Every tool of the /tools section, in the index's order. Paths have no language: render them with @/i18n/Link. */
export type ToolSlug =
  | "numerology" | "tarot" | "palm-reading" | "face-reading" | "signature-analysis" | "palm-talent" | "dmit" | "mansik" | "jeevan"
  | "vastu" | "vastu-check" | "mahavastu" | "muhurat" | "sanskar-muhurat" | "delivery-muhurat" | "blind-kundli" | "khoya-paya"
  | "yagyopavit" | "integrated-reading";

export type ToolGroup = "readings" | "wellbeing" | "home" | "muhurat" | "kundli";

export const TOOLS: { slug: ToolSlug; icon: IconType; group: ToolGroup; astrologerOnly?: boolean }[] = [
  { slug: "numerology", icon: PiHash, group: "readings", astrologerOnly: true },
  { slug: "tarot", icon: PiCardsThree, group: "readings", astrologerOnly: true },
  { slug: "palm-reading", icon: PiHandPalm, group: "readings", astrologerOnly: true },
  { slug: "palm-talent", icon: PiHandPointing, group: "readings", astrologerOnly: true },
  { slug: "face-reading", icon: PiSmiley, group: "readings" },
  { slug: "signature-analysis", icon: PiSignature, group: "readings", astrologerOnly: true },
  { slug: "dmit", icon: PiFingerprint, group: "readings", astrologerOnly: true },
  { slug: "integrated-reading", icon: PiStack, group: "readings" },
  { slug: "mansik", icon: PiBrain, group: "wellbeing", astrologerOnly: true },
  { slug: "jeevan", icon: PiCompass, group: "wellbeing", astrologerOnly: true },
  { slug: "vastu", icon: PiHouseLine, group: "home" },
  { slug: "vastu-check", icon: PiCheckSquare, group: "home" },
  { slug: "mahavastu", icon: PiCompassRose, group: "home" },
  { slug: "muhurat", icon: PiClockCountdown, group: "muhurat" },
  { slug: "sanskar-muhurat", icon: PiFlowerLotus, group: "muhurat" },
  { slug: "delivery-muhurat", icon: PiBaby, group: "muhurat" },
  { slug: "yagyopavit", icon: PiFlame, group: "muhurat" },
  { slug: "blind-kundli", icon: PiEyeSlash, group: "kundli" },
  { slug: "khoya-paya", icon: PiMagnifyingGlass, group: "kundli" },
];

type ToolText = Record<ToolSlug, { name: string; blurb: string }>;

/** Names and one-line descriptions. Other tools' pages read their own title from here too. */
export const TOOL_TEXT = defineMessages<ToolText>({
  hi: {
    numerology: { name: "अंक ज्योतिष", blurb: "नाम और जन्म तिथि से मूलांक, भाग्यांक, नाम और मोबाइल अंक, और साल का फलादेश" },
    tarot: { name: "टैरो", blurb: "78 पत्तों से स्प्रेड बनाएँ, हर पत्ते का अर्थ और सवाल का रुझान" },
    "palm-reading": { name: "हस्त रेखा", blurb: "दोनों हाथों की रेखाओं और पर्वतों पर विस्तृत रिपोर्ट" },
    "face-reading": { name: "मुख सामुद्रिक", blurb: "चेहरे की तस्वीर से आकृति, लक्षण और स्वभाव की रिपोर्ट" },
    "signature-analysis": { name: "हस्ताक्षर विश्लेषण", blurb: "एक तस्वीर से हस्ताक्षर की ढलान, दबाव, गति और स्वभाव" },
    "palm-talent": { name: "हस्त रेखा प्रतिभा", blurb: "पहले बनी प्रतिभा रिपोर्टें खोलें और प्रिंट करें" },
    dmit: { name: "DMIT", blurb: "उँगलियों के पैटर्न से बच्चे की बुद्धि, सीखने की शैली और करियर रुझान" },
    mansik: { name: "मानसिक प्रवृत्ति रिपोर्ट", blurb: "प्रश्नावली और कुंडली से मन की प्रवृत्तियों पर मार्गदर्शन" },
    jeevan: { name: "जीवन घटना मार्गदर्शन", blurb: "जीवन की किसी घटना पर सवालों और कुंडली से मार्गदर्शन" },
    vastu: { name: "वास्तु", blurb: "घर या दुकान का वास्तु विश्लेषण" },
    "vastu-check": { name: "वास्तु जाँच", blurb: "तस्वीर और दिशा से कमरे की वास्तु जाँच" },
    mahavastu: { name: "महावास्तु", blurb: "महावास्तु पद्धति से भवन का विश्लेषण" },
    muhurat: { name: "मुहूर्त", blurb: "किसी भी काम के लिए शुभ मुहूर्त" },
    "sanskar-muhurat": { name: "संस्कार मुहूर्त", blurb: "नामकरण, मुंडन, विवाह जैसे संस्कारों का मुहूर्त" },
    "delivery-muhurat": { name: "प्रसव मुहूर्त", blurb: "शिशु के जन्म के लिए शुभ समय और नवजात कुंडली" },
    "blind-kundli": { name: "ब्लाइंड कुंडली", blurb: "जन्म विवरण अज्ञात होने पर भी कुंडली का मार्गदर्शन" },
    "khoya-paya": { name: "खोया-पाया", blurb: "खोई चीज़ की दिशा और मिलने की संभावना" },
    yagyopavit: { name: "यज्ञोपवीत", blurb: "यज्ञोपवीत संस्कार का शुभ मुहूर्त" },
    "integrated-reading": { name: "समेकित रीडिंग", blurb: "हस्त, मुख और हस्ताक्षर की रीडिंग एक रिपोर्ट में" },
  },
  en: {
    numerology: { name: "Numerology", blurb: "Mulank, Bhagyank, name and mobile numbers and the year ahead, from a name and date of birth" },
    tarot: { name: "Tarot", blurb: "Draw a spread from 78 cards, with the meaning of each card and a lean for your question" },
    "palm-reading": { name: "Palm reading", blurb: "A detailed report on the lines and mounts of both hands" },
    "face-reading": { name: "Face reading", blurb: "A report on face shape, features and temperament from a face photo" },
    "signature-analysis": { name: "Signature analysis", blurb: "Slant, pressure, speed and temperament from one photo of a signature" },
    "palm-talent": { name: "Palm talent reports", blurb: "Open and print the talent reports made earlier" },
    dmit: { name: "DMIT", blurb: "A child's intelligences, learning style and career leanings from fingerprint patterns" },
    mansik: { name: "Mansik Pravritti report", blurb: "Guidance on tendencies of the mind, from a questionnaire and the kundli" },
    jeevan: { name: "Jeevan Ghatna guidance", blurb: "Guidance on a life event, from a few questions and the kundli" },
    vastu: { name: "Vastu", blurb: "Vastu analysis of a home or shop" },
    "vastu-check": { name: "Vastu check", blurb: "Check a room's vastu from a photo and its direction" },
    mahavastu: { name: "Mahavastu", blurb: "Analyse a building with the Mahavastu method" },
    muhurat: { name: "Muhurat", blurb: "Auspicious times for any task" },
    "sanskar-muhurat": { name: "Sanskar muhurat", blurb: "Muhurat for naming, mundan, marriage and other sanskars" },
    "delivery-muhurat": { name: "Delivery muhurat", blurb: "Auspicious times for a birth, and the newborn's kundli" },
    "blind-kundli": { name: "Blind kundli", blurb: "Kundli guidance even when the birth details are not known" },
    "khoya-paya": { name: "Khoya-Paya", blurb: "Direction and chances of finding a lost item" },
    yagyopavit: { name: "Yagyopavit", blurb: "Auspicious muhurat for the sacred thread ceremony" },
    "integrated-reading": { name: "Integrated reading", blurb: "Palm, face and signature readings in one report" },
  },
});
