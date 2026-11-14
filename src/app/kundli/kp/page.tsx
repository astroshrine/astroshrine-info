import type { Metadata } from "next";
import { Suspense } from "react";
import KpView from "./KpView";
import { CardSkeleton } from "../_components/ui";

export const metadata: Metadata = {
  title: "KP प्रश्न कुंडली · AstroShrine",
  description: "KP प्रश्न: 1 से 249 के बीच एक अंक से इसी पल की प्रश्न कुंडली, लग्न, भाव संधि, शासक ग्रह और चार स्तर के कारक ग्रह।",
};

export default function KpPage() {
  return (
    <Suspense fallback={<CardSkeleton rows={5} />}>
      <KpView />
    </Suspense>
  );
}
