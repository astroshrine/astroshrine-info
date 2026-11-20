import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { toolMetadata } from "../../_b/meta";
import NewView from "./NewView";

const text = defineMessages({
  hi: { title: "नया समन्वित निर्णय · AstroShrine", description: "जन्म विवरण और प्रश्न भरकर संयुक्त रिपोर्ट बनाएं।" },
  en: { title: "New integrated reading · AstroShrine", description: "Enter the birth details and the questions to generate a combined reading." },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/integrated-reading/new", t.title, t.description);
}

export default function Page() {
  return <NewView />;
}
