import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import ChartView from "./ChartView";
import { CardSkeleton } from "../_components/ui";

const text = defineMessages({
  hi: {
    title: "कुंडली चार्ट: सभी 16 वर्ग · AstroShrine",
    description:
      "लग्न (D1) से षष्ट्यंश (D60) तक सभी 16 वर्ग चार्ट, ग्रहों की राशि, अंश, नक्षत्र और भाव, विंशोत्तरी और योगिनी दशा, योग और दोष।",
  },
  en: {
    title: "Kundli chart: all 16 divisional charts · AstroShrine",
    description:
      "All 16 divisional charts from the Rashi chart (D1) to Shashtiamsha (D60), each planet's sign, degree, nakshatra and house, Vimshottari and Yogini dasha, yogas and doshas.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, description: t.description, alternates: await languageAlternates("/kundli/chart") };
}

export default function ChartPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ChartView />
    </Suspense>
  );
}

function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <CardSkeleton chart rows={2} />
      <CardSkeleton rows={8} />
    </div>
  );
}
