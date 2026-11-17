import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { toolMetadata } from "../_b/meta";
import VastuView from "./VastuView";

const text = defineMessages({
  hi: {
    title: "वास्तु चक्र · AstroShrine",
    description: "प्लॉट का नक्शा अपलोड करें, सीमा और उत्तर दिशा चिह्नित करें और 16 ज़ोन का वास्तु चक्र, कट-विस्तार और उपाय पाएं।",
  },
  en: {
    title: "Vastu Chakra · AstroShrine",
    description: "Upload a plot plan, mark its boundary and north, and get the 16-zone Vastu chakra with cuts, extensions and remedies.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/vastu", t.title, t.description);
}

export default function VastuPage() {
  return <VastuView />;
}
