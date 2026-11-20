import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import PanchangView from "./PanchangView";
import { CardSkeleton } from "../_components/ui";

const text = defineMessages({
  hi: {
    title: "आज का पंचांग · AstroShrine",
    description: "किसी भी दिन और जगह का पंचांग: तिथि, नक्षत्र, योग, करण, सूर्योदय, राहुकाल, यमगंड, गुलिक, अभिजित और चौघड़िया।",
  },
  en: {
    title: "Today's panchang · AstroShrine",
    description:
      "The panchang for any day and place: tithi, nakshatra, yoga, karana, sunrise, Rahu Kaal, Yamaganda, Gulika, Abhijit and Choghadiya.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, description: t.description, alternates: await languageAlternates("/kundli/panchang") };
}

export default function PanchangPage() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CardSkeleton rows={6} />
          <CardSkeleton rows={6} />
        </div>
      }
    >
      <PanchangView />
    </Suspense>
  );
}
