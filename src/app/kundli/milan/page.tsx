import type { Metadata } from "next";
import { Suspense } from "react";
import MilanView from "./MilanView";
import { CardSkeleton } from "../_components/ui";

export const metadata: Metadata = {
  title: "कुंडली मिलान: गुण मिलान · AstroShrine",
  description:
    "वर और कन्या की कुंडली से अष्टकूट गुण मिलान: 36 में से गुण, नाड़ी, भकूट, गण, योनि, रज्जु, वेध और मंगल दोष परिहार सहित, नवांश मिलान भी।",
};

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
