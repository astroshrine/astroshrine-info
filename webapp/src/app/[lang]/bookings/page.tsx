import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import BookingsView from "./BookingsView";

const text = defineMessages({
  hi: { title: "मेरी अपॉइंटमेंट · AstroShrine" },
  en: { title: "My appointments · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getT(text);
  return { title, robots: { index: false, follow: false } };
}

export default function BookingsPage() {
  return <BookingsView />;
}
