import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { toolMetadata } from "../_b/meta";
import VastuCheckView from "./VastuCheckView";

const text = defineMessages({
  hi: {
    title: "वास्तु जाँच · AstroShrine",
    description: "घर या फैक्ट्री के सवालों के जवाब दें और वास्तु सूचकांक, दोष, बिना तोड़फोड़ के उपाय और ज़ोन-मंत्र की रिपोर्ट पाएं।",
  },
  en: {
    title: "Vastu Check · AstroShrine",
    description: "Answer questions about a home or factory and get a Vastu index, faults, remedies without demolition and zone mantras.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/vastu-check", t.title, t.description);
}

export default function VastuCheckPage() {
  return <VastuCheckView />;
}
