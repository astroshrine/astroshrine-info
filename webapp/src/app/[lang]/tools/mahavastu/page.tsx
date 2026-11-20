import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { toolMetadata } from "../_b/meta";
import MahaVastuView from "./MahaVastuView";

const text = defineMessages({
  hi: {
    title: "वास्तु चक्र (महावास्तु) · AstroShrine",
    description: "ज्योतिषियों के लिए: नक्शे पर कक्ष और उपकरण रखें, स्थल सर्वे भरें और 45 देवताओं का स्कोर, दोष और उपाय पाएं।",
  },
  en: {
    title: "Vastu Chakra (MahaVastu) · AstroShrine",
    description: "For astrologers: place rooms and equipment on the plan, fill in the site survey and get the 45-devta score, doshas and remedies.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/mahavastu", t.title, t.description);
}

export default function MahaVastuPage() {
  return <MahaVastuView />;
}
