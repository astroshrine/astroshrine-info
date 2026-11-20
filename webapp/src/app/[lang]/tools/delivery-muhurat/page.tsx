import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import ToolHeader from "../_components/ToolHeader";
import { toolMetadata } from "../_b/meta";
import DeliveryView from "./DeliveryView";

const text = defineMessages({
  hi: {
    title: "डिलीवरी मुहूर्त और नवजात कुंडली",
    intro: "डॉक्टर के बताए समय-खंडों के भीतर सबसे अच्छे तीन मुहूर्त, नवजात की कुंडली और पूरी रिपोर्ट। ज्योतिष चिकित्सा सलाह का विकल्प नहीं है।",
  },
  en: {
    title: "Delivery Muhurat and newborn kundli",
    intro: "The best three muhurats inside the time windows your doctor has approved, the newborn's kundli and a full report. Astrology never replaces medical advice.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/delivery-muhurat", `${t.title} · AstroShrine`, t.intro);
}

export default async function DeliveryMuhuratPage() {
  const t = await getT(text);
  return (
    <>
      <ToolHeader title={t.title} intro={t.intro} />
      <DeliveryView />
    </>
  );
}
