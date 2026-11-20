import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import { shareImages } from "@/lib/share";
import ToolGate from "../_components/ToolGate";
import ToolHeader from "../_components/ToolHeader";
import { TOOL_TEXT } from "../_components/registry";
import TarotView from "./TarotView";

const text = defineMessages({
  hi: {
    title: "टैरो · AstroShrine",
    description: "78 पत्तों का टैरो: 7 स्प्रेड, हर पत्ते का अर्थ, हाँ/ना संकेत, जन्म-कार्ड और स्रोत सहित फलादेश।",
    intro: "प्रश्न और स्प्रेड चुनें, यहीं डेक शफ़ल करें या अपने डेक के कार्ड दर्ज करें। कार्ड-दर-कार्ड अर्थ, समग्र संकेत और स्रोत सहित फलादेश। गणना आपके ब्राउज़र में होती है।",
    what: "टैरो",
  },
  en: {
    title: "Tarot · AstroShrine",
    description: "A 78-card tarot tool: 7 spreads, the meaning of every card, a yes/no lean, the birth card and a phaladesh with its sources.",
    intro: "Pick the question and the spread, shuffle the deck here or enter cards from your own deck. Card-by-card meanings, an overall reading and a phaladesh with its sources. The calculation runs in your browser.",
    what: "tarot",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return {
    title: t.title,
    description: t.description,
    alternates: await languageAlternates("/tools/tarot"),
    robots: { index: false, follow: false },
    openGraph: { title: t.title, description: t.description, images: await shareImages() },
  };
}

export default async function TarotPage() {
  const t = await getT(text);
  const names = await getT(TOOL_TEXT);
  return (
    <>
      <ToolHeader title={names.tarot.name} intro={t.intro} />
      <ToolGate what={t.what}>
        <TarotView />
      </ToolGate>
    </>
  );
}
