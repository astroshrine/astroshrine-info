import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import { shareImages } from "@/lib/share";
import ToolGate from "../_components/ToolGate";
import ToolHeader from "../_components/ToolHeader";
import { TOOL_TEXT } from "../_components/registry";
import NumerologyView from "./NumerologyView";

const text = defineMessages({
  hi: {
    title: "अंक ज्योतिष · AstroShrine",
    description: "नाम और जन्म तिथि से मूलांक, भाग्यांक, नामांक, लो-शू ग्रिड, व्यक्तिगत वर्ष और जीवन-क्षेत्र का फलादेश।",
    intro: "जातक का नाम और जन्म तिथि भरें: मूलांक, भाग्यांक, नामांक, लो-शू ग्रिड, मोबाइल व फ़र्म नामांक और चुने क्षेत्र का फलादेश, स्रोत सहित। गणना आपके ब्राउज़र में होती है।",
    what: "अंक ज्योतिष",
  },
  en: {
    title: "Numerology · AstroShrine",
    description: "Mulank, Bhagyank, name number, Lo Shu grid, personal year and a phaladesh for a chosen area of life, from a name and date of birth.",
    intro: "Enter the client's name and date of birth: Mulank, Bhagyank, name number, Lo Shu grid, mobile and firm numbers and a phaladesh for the chosen area, with its sources. The calculation runs in your browser.",
    what: "numerology",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return {
    title: t.title,
    description: t.description,
    alternates: await languageAlternates("/tools/numerology"),
    robots: { index: false, follow: false },
    openGraph: { title: t.title, description: t.description, images: await shareImages() },
  };
}

export default async function NumerologyPage() {
  const t = await getT(text);
  const names = await getT(TOOL_TEXT);
  return (
    <>
      <ToolHeader title={names.numerology.name} intro={t.intro} />
      <ToolGate what={t.what}>
        <NumerologyView />
      </ToolGate>
    </>
  );
}
