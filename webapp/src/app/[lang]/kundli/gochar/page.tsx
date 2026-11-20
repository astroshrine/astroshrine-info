import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import GocharView from "./GocharView";
import { CardSkeleton } from "../_components/ui";

const text = defineMessages({
  hi: {
    title: "गोचर: अगले 36 महीने · AstroShrine",
    description: "अगले 36 महीनों में गुरु, शनि, राहु और केतु किस राशि और भाव में रहेंगे, कब वक्री या मार्गी होंगे, साढ़ेसाती और ढैय्या।",
  },
  en: {
    title: "Transits: the next 36 months · AstroShrine",
    description:
      "Which sign and house Jupiter, Saturn, Rahu and Ketu will be in over the next 36 months, when they turn retrograde or direct, and Sade Sati and Dhaiya.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, description: t.description, alternates: await languageAlternates("/kundli/gochar") };
}

export default function GocharPage() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      }
    >
      <GocharView />
    </Suspense>
  );
}
