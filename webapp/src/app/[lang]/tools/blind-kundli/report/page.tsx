import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { toolMetadata } from "../../_b/meta";
import ReportView from "./ReportView";

const text = defineMessages({
  hi: { title: "लॉक की गई भविष्यवाणी · AstroShrine", description: "लॉक की गई ब्लाइंड कुंडली, उसकी जाँच और असली कुंडली से मिलान।" },
  en: { title: "Locked prediction · AstroShrine", description: "The locked blind kundli, its checks and the comparison with the real chart." },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/blind-kundli/report", t.title, t.description);
}

export default function Page() {
  return <ReportView />;
}
