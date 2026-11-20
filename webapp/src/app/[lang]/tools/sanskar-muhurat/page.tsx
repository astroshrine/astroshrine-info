import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import ToolHeader from "../_components/ToolHeader";
import { toolMetadata } from "../_b/meta";
import SanskarView from "./SanskarView";

const text = defineMessages({
  hi: {
    title: "संस्कार मुहूर्त: अन्नप्राशन और मुंडन",
    intro: "बच्चे की कुंडली, संस्कार स्थल और आपकी परंपरा के अनुसार उपलब्ध मुहूर्त, हर विकल्प के कारण और सीमाओं के साथ।",
  },
  en: {
    title: "Sanskar Muhurat: Annaprashan and Mundan",
    intro: "Available muhurats from the child's birth chart, the ritual venue and your tradition, every option with its reasons and limitations.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/sanskar-muhurat", `${t.title} · AstroShrine`, t.intro);
}

export default async function SanskarMuhuratPage() {
  const t = await getT(text);
  return (
    <>
      <ToolHeader title={t.title} intro={t.intro} />
      <SanskarView />
    </>
  );
}
