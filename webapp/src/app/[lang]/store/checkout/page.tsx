import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import CheckoutView from "./CheckoutView";
import { Skeleton } from "../ui";

const text = defineMessages({
  hi: { title: "चेकआउट · AstroShrine स्टोर" },
  en: { title: "Checkout · AstroShrine store" },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, robots: { index: false, follow: false } };
}

export default function CheckoutPage() {
  // CheckoutView reads the URL (?buy for "buy now"), so it renders in the browser behind this boundary.
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-8 h-96 w-full max-w-5xl" />}>
      <CheckoutView />
    </Suspense>
  );
}
