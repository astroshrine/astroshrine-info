import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import HelpGuide from "./HelpGuide";

const text = defineMessages({
  hi: { title: "सहायता · ज्योतिषी कंसोल" },
  en: { title: "Help · Astrologer console" },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT(text)).title };
}

export default function Page() {
  return <HelpGuide />;
}
