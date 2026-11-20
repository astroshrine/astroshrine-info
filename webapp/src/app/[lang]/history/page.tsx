import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import HistoryView from "./HistoryView";

const text = defineMessages({
  hi: { title: "पुराने सेशन और रिव्यू · AstroShrine" },
  en: { title: "Past sessions and reviews · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getT(text);
  return { title, robots: { index: false, follow: false } };
}

export default function HistoryPage() {
  // HistoryView reads ?astrologer from the URL, so it renders in the browser behind this boundary.
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto h-96 w-full max-w-3xl animate-pulse rounded-2xl bg-surface-sunken" />}>
      <HistoryView />
    </Suspense>
  );
}
