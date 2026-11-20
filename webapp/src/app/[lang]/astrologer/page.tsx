import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import FrontGate from "./_console/FrontGate";

const text = defineMessages({
  hi: { title: "ज्योतिषियों के लिए · AstroShrine" },
  en: { title: "For astrologers · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getT(text);
  return { title, robots: { index: false, follow: false } };
}

export default function AstrologerHomePage() {
  return (
    <FrontGate />
  );
}
