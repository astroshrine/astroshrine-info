import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { toolMetadata } from "../../_b/meta";
import NewView from "./NewView";

const text = defineMessages({
  hi: { title: "नई ब्लाइंड भविष्यवाणी · AstroShrine", description: "लग्न और आठ ग्रह भरें, खगोलीय जाँच करें और भविष्यवाणी LOCK करें।" },
  en: { title: "New blind prediction · AstroShrine", description: "Enter the lagna and eight grahas, run the astronomical check and lock the prediction." },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/blind-kundli/new", t.title, t.description);
}

export default function Page() {
  return <NewView />;
}
