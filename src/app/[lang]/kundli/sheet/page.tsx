import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import SheetView from "./SheetView";

const text = defineMessages({
  hi: {
    title: "मेरी विस्तृत कुंडली · AstroShrine",
    description:
      "खाते में सहेजे जन्म विवरण से पूरी कुंडली शीट: लग्न, भाव चलित, चंद्र और नवांश चार्ट, आज का गोचर, शड्बल, कारक, अष्टकवर्ग और पूरी दशा।",
  },
  en: {
    title: "My detailed kundli · AstroShrine",
    description:
      "The full kundli sheet from the birth details saved in your account: Lagna, Bhava chalit, Moon and Navamsha charts, today's transits, Shadbala, karakas, Ashtakavarga and the complete dasha.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, description: t.description, alternates: await languageAlternates("/kundli/sheet") };
}

export default function SheetPage() {
  return <SheetView />;
}
