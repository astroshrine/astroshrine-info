import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { toolMetadata } from "../../_b/meta";
import ReportView from "./ReportView";

const text = defineMessages({
  hi: { title: "समन्वित निर्णय रिपोर्ट · AstroShrine", description: "एक समन्वित निर्णय की रिपोर्ट।" },
  en: { title: "Integrated reading · AstroShrine", description: "One integrated reading." },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/integrated-reading/report", t.title, t.description);
}

export default function Page() {
  return <ReportView />;
}
