import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { PanelSkeleton } from "../_b/shell";
import { toolMetadata } from "../_b/meta";
import MuhuratView from "./MuhuratView";

const text = defineMessages({
  hi: {
    title: "सर्व-मुहूर्त निर्णायक · AstroShrine",
    description: "22 प्रकार के कार्यों का मुहूर्त: शास्त्रीय नियम-सारणी, चन्द्र-तारा बल, लग्न शुद्धि और ग्रेड 1-2-3 सूची। ज्योतिषियों के लिए।",
  },
  en: {
    title: "Sarva-Muhurat Nirnayak (Muhurat finder) · AstroShrine",
    description: "Muhurat for 22 kinds of karya: classical rule tables, Chandra and Tara bala, lagna shuddhi and a Grade 1-2-3 list. For astrologers.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/muhurat", t.title, t.description);
}

export default function MuhuratPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <MuhuratView />
    </Suspense>
  );
}
