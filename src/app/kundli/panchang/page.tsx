import type { Metadata } from "next";
import { Suspense } from "react";
import PanchangView from "./PanchangView";
import { CardSkeleton } from "../_components/ui";

export const metadata: Metadata = {
  title: "आज का पंचांग · AstroShrine",
  description: "किसी भी दिन और जगह का पंचांग: तिथि, नक्षत्र, योग, करण, सूर्योदय, राहुकाल, यमगंड, गुलिक, अभिजित और चौघड़िया।",
};

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
