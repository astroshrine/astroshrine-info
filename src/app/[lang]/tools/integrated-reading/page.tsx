import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { toolMetadata } from "../_b/meta";
import IntegratedList from "./IntegratedList";

const text = defineMessages({
  hi: { title: "समन्वित निर्णय · AstroShrine", description: "हर प्रश्न का एक संयुक्त उत्तर, कुंडली, दशा, गोचर और अंकज्योतिष को तौलकर। ज्योतिषियों के लिए।" },
  en: { title: "Integrated Reading · AstroShrine", description: "One combined answer per question, weighed across the kundli, dasha, transits and numerology. For astrologers." },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/integrated-reading", t.title, t.description);
}

export default function Page() {
  return <IntegratedList />;
}
