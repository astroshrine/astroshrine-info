import type { Metadata } from "next";
import { Suspense } from "react";
import GocharView from "./GocharView";
import { CardSkeleton } from "../_components/ui";

export const metadata: Metadata = {
  title: "गोचर: अगले 36 महीने · AstroShrine",
  description: "अगले 36 महीनों में गुरु, शनि, राहु और केतु किस राशि और भाव में रहेंगे, कब वक्री या मार्गी होंगे, साढ़ेसाती और ढैय्या।",
};

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
