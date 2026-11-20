import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import WelcomeView from "./WelcomeView";

const text = defineMessages({
  hi: { title: "ज्योतिषियों के लिए · AstroShrine" },
  en: { title: "For astrologers · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT(text)).title, robots: { index: false, follow: false } };
}

export default function Page() {
  return <WelcomeView />;
}
