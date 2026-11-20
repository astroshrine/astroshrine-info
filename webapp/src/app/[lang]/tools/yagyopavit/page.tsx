import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { PanelSkeleton } from "../_b/shell";
import { toolMetadata } from "../_b/meta";
import YagyopavitView from "./YagyopavitView";

const text = defineMessages({
  hi: {
    title: "यज्ञोपवीत मुहूर्त निर्णायक · AstroShrine",
    description: "उपनयन संस्कार का मुहूर्त: गुरु, सूर्य, चन्द्र बल और तारा शुद्धि, पंचांग और ग्रेड 1-2-3 मुहूर्त सूची। ज्योतिषियों के लिए।",
  },
  en: {
    title: "Yagyopavit (Upanayana) Muhurat finder · AstroShrine",
    description: "Muhurat for the Upanayana samskara: Guru, Surya and Chandra bala, Tara shuddhi, panchang and a Grade 1-2-3 muhurat list. For astrologers.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/yagyopavit", t.title, t.description);
}

export default function YagyopavitPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <YagyopavitView />
    </Suspense>
  );
}
