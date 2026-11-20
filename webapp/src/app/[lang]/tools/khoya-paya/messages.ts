import { defineMessages } from "@/i18n/messages";

// Strings of the app's khoyaPaya screen (translation/{hi,en}.json), with the web page's own labels.
export const text = defineMessages({
  hi: {
  "title": "खोया-पाया प्रश्न",
  "intro": "खोई वस्तु के बारे में पूछें। कुंडली ठीक उसी क्षण की बनेगी जब आप ‘पूछें’ दबाएंगे।",
  "item": "क्या खोया है?",
  "itemPlaceholder": "जैसे — सोने की अंगूठी, गाड़ी की चाबी",
  "categoryLabel": "श्रेणी",
  "category": {
    "jewellery": "आभूषण",
    "phone_electronics": "फ़ोन / इलेक्ट्रॉनिक्स",
    "documents": "दस्तावेज़",
    "cash_wallet": "नकद / बटुआ",
    "keys": "चाबियाँ",
    "vehicle": "वाहन",
    "pet": "पालतू जानवर",
    "clothes_bag": "कपड़े / बैग",
    "other": "अन्य"
  },
  "lostWhen": "कब खोया?",
  "precision": {
    "exact": "सही समय",
    "approximate": "लगभग",
    "unknown": "पता नहीं"
  },
  "pickTime": "तारीख़ व समय चुनें",
  "lastSeen": "आख़िरी बार कहाँ देखा? (वैकल्पिक)",
  "lastSeenPlaceholder": "जैसे — शयनकक्ष, ऑफ़िस बैग",
  "theft": "चोरी की आशंका",
  "place": "प्रश्न कहाँ से पूछा जा रहा है?",
  "needItem": "वस्तु का नाम लिखें और प्रश्न का स्थान चुनें।",
  "needTime": "खोने का समय चुनें, या “पता नहीं” चुनें।",
  "ask": "पूछें",
  "asking": "कुंडली देखी जा रही है…",
  "askAgain": "नया प्रश्न",
  "askedAt": "कुंडली {{time}} की",
  "verdict": {
    "likely_found": "मिलने की संभावना",
    "delayed": "देर से मिलेगा",
    "partial": "आंशिक रूप से या प्रयास से",
    "unlikely": "मिलना कठिन"
  },
  "confidence": {
    "high": "उच्च विश्वास",
    "medium": "मध्यम विश्वास",
    "low": "कम विश्वास"
  },
  "whereToLook": "कहाँ खोजें",
  "distance": {
    "inside_home": "घर के अंदर",
    "nearby": "आस-पास",
    "far": "दूर"
  },
  "direction": {
    "east": "पूर्व",
    "south": "दक्षिण",
    "west": "पश्चिम",
    "north": "उत्तर",
    "unclear": "दिशा स्पष्ट नहीं"
  },
  "timing": "कब तक",
  "searchTips": "खोज के सुझाव",
  "theftTitle": "यदि चोरी हुई है",
  "howJudged": "कैसे निर्णय लिया",
  "supports": {
    "recovery": "मिलने के पक्ष में",
    "loss": "हानि की ओर",
    "neutral": "तटस्थ"
  },
  "lochan": "लोचन नक्षत्र",
  "prayer": "वैकल्पिक प्रार्थना",
  "limitations": "सीमाएँ",
  "policeTitle": "पुलिस में रिपोर्ट करें",
  "policeBody": "फ़ोन, वाहन, दस्तावेज़ या चोरी की आशंका में पुलिस में शिकायत (FIR) दर्ज करें। फ़ोन के लिए SIM बंद करवाएँ और सरकारी CEIR पोर्टल पर IMEI दर्ज करें।",
  "ceir": "CEIR पोर्टल खोलें",
  "disclaimer": "यह ज्योतिष शास्त्र पर आधारित मार्गदर्शन है, गारंटी नहीं। कीमती सामान, दस्तावेज़ या फ़ोन चोरी होने पर तुरंत पुलिस में शिकायत दर्ज करें।",
  "error": {
    "rateLimited": "इस घंटे बहुत प्रश्न हो गए। कृपया बाद में पूछें।",
    "failed": "कुंडली नहीं पढ़ी जा सकी। कृपया फिर कोशिश करें।"
  },
  "verdictTitle": "निर्णय",
  "saved": "सहेजा गया",
  "eyebrow": "ज्योतिषी टूल · प्रश्न",
  "pageTitle": "खोया-पाया प्रश्न · AstroShrine",
  "pageDesc": "खोई वस्तु कहाँ और कब मिलेगी, प्रश्न के क्षण की कुंडली से।",
  "what": "खोया-पाया प्रश्न",
  "lostAtLabel": "खोने का समय",
  "theftHint": "चोरी की आशंका हो तो नीचे दिए सुझाव पुलिस रिपोर्ट के साथ अपनाएं।",
  "placeHint": ""
},
  en: {
  "title": "Khoya-Paya Prashna",
  "intro": "Ask about a lost item. The chart is cast for the moment you press Ask.",
  "item": "What was lost?",
  "itemPlaceholder": "e.g. gold ring, car keys",
  "categoryLabel": "Category",
  "category": {
    "jewellery": "Jewellery",
    "phone_electronics": "Phone / electronics",
    "documents": "Documents",
    "cash_wallet": "Cash / wallet",
    "keys": "Keys",
    "vehicle": "Vehicle",
    "pet": "Pet",
    "clothes_bag": "Clothes / bag",
    "other": "Other"
  },
  "lostWhen": "When was it lost?",
  "precision": {
    "exact": "Exact time",
    "approximate": "Approximate",
    "unknown": "Don't know"
  },
  "pickTime": "Choose date & time",
  "lastSeen": "Last seen where? (optional)",
  "lastSeenPlaceholder": "e.g. bedroom, office bag",
  "theft": "Theft suspected",
  "place": "Where is the question asked from?",
  "needItem": "Enter the item and choose where the question is asked from.",
  "needTime": "Choose when it was lost, or pick “Don't know”.",
  "ask": "Ask",
  "asking": "Reading the chart…",
  "askAgain": "New question",
  "askedAt": "Chart cast for {{time}}",
  "verdict": {
    "likely_found": "Likely to be found",
    "delayed": "Delayed",
    "partial": "Partly, or with effort",
    "unlikely": "Unlikely"
  },
  "confidence": {
    "high": "High confidence",
    "medium": "Medium confidence",
    "low": "Low confidence"
  },
  "whereToLook": "Where to look",
  "distance": {
    "inside_home": "Inside the home",
    "nearby": "Nearby",
    "far": "Far away"
  },
  "direction": {
    "east": "East",
    "south": "South",
    "west": "West",
    "north": "North",
    "unclear": "Direction unclear"
  },
  "timing": "When",
  "searchTips": "Search tips",
  "theftTitle": "If it was stolen",
  "howJudged": "How we judged",
  "supports": {
    "recovery": "supports recovery",
    "loss": "points to loss",
    "neutral": "neutral"
  },
  "lochan": "Lochan nakshatra",
  "prayer": "Optional prayer",
  "limitations": "Limitations",
  "policeTitle": "Report it to the police",
  "policeBody": "For a phone, vehicle, documents or a suspected theft, file a police complaint (FIR). For a phone, also block the SIM and report the IMEI on the government CEIR portal.",
  "ceir": "Open the CEIR portal",
  "disclaimer": "This is guidance based on Jyotish shastra, not a guarantee. If valuables, documents or a phone are stolen, file a police complaint at once.",
  "error": {
    "rateLimited": "Too many questions this hour. Please try again later.",
    "failed": "Could not read the chart. Please try again."
  },
  "verdictTitle": "Verdict",
  "saved": "Saved",
  "eyebrow": "Astrologer tool · Prashna",
  "pageTitle": "Khoya-Paya Prashna (lost and found) · AstroShrine",
  "pageDesc": "Where and when a lost item may be found, from the chart of the moment you ask.",
  "what": "Khoya-Paya Prashna",
  "lostAtLabel": "Time it was lost",
  "theftHint": "If you suspect theft, follow the advice below along with a police report.",
  "placeHint": ""
},
});
