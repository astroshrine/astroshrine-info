import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import KpView from "./KpView";
import { CardSkeleton } from "../_components/ui";

const text = defineMessages({
  hi: {
    title: "KP प्रश्न कुंडली · AstroShrine",
    description: "KP प्रश्न: 1 से 249 के बीच एक अंक से इसी पल की प्रश्न कुंडली, लग्न, भाव संधि, शासक ग्रह और चार स्तर के कारक ग्रह।",
  },
  en: {
    title: "KP Prashna horary chart · AstroShrine",
    description:
      "KP Prashna: a horary chart for this moment from one number between 1 and 249, with the Ascendant, house cusps, ruling planets and significators at four levels.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, description: t.description, alternates: await languageAlternates("/kundli/kp") };
}

export default function KpPage() {
  return (
    <Suspense fallback={<CardSkeleton rows={5} />}>
      <KpView />
    </Suspense>
  );
}
