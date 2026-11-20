import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import OffersView from "./OffersView";

const text = defineMessages({
  hi: { title: "ऑफ़र · AstroShrine" },
  en: { title: "Offers · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getT(text);
  return { title, robots: { index: false } };
}

export default function OffersPage() {
  return <OffersView />;
}
