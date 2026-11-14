import type { Metadata } from "next";
import { Suspense } from "react";
import ChartView from "./ChartView";
import { CardSkeleton } from "../_components/ui";

export const metadata: Metadata = {
  title: "कुंडली चार्ट: सभी 16 वर्ग · AstroShrine",
  description:
    "लग्न (D1) से षष्ट्यंश (D60) तक सभी 16 वर्ग चार्ट, ग्रहों की राशि, अंश, नक्षत्र और भाव, विंशोत्तरी और योगिनी दशा, योग और दोष।",
};

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
