import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { toolMetadata } from "../_b/meta";
import BlindList from "./BlindList";

const text = defineMessages({
  hi: { title: "ब्लाइंड कुंडली · AstroShrine", description: "हस्तरेखा या मुख के संकेतों से कुंडली की भविष्यवाणी LOCK करें, फिर असली कुंडली से मिलाकर अंक पाएँ। ज्योतिषियों के लिए।" },
  en: { title: "Blind Kundli · AstroShrine", description: "Lock a kundli prediction from palm or face evidence, then compare it with the real chart and score it. For astrologers." },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/blind-kundli", t.title, t.description);
}

export default function Page() {
  return <BlindList />;
}
