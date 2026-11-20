import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import MilanView from "./MilanView";
import { CardSkeleton } from "../_components/ui";

const text = defineMessages({
  hi: {
    title: "कुंडली मिलान: गुण मिलान · AstroShrine",
    description:
      "वर और कन्या की कुंडली से अष्टकूट गुण मिलान: 36 में से गुण, नाड़ी, भकूट, गण, योनि, रज्जु, वेध और मंगल दोष परिहार सहित, नवांश मिलान भी।",
  },
  en: {
    title: "Kundli matching: Guna Milan · AstroShrine",
    description:
      "Ashtakoot Guna Milan from the groom's and bride's kundlis: gunas out of 36, Nadi, Bhakoot, Gana, Yoni, Rajju, Vedha and Mangal doshas with their cancellations, and Navamsha matching.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, description: t.description, alternates: await languageAlternates("/kundli/milan") };
}

export default function MilanPage() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CardSkeleton rows={5} />
          <CardSkeleton rows={5} />
        </div>
      }
    >
      <MilanView />
    </Suspense>
  );
}
