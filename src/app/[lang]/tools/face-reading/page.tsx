import type { Metadata } from "next";
import { getT, languageAlternates } from "@/i18n/server";
import { defineMessages } from "@/i18n/messages";
import ToolGate from "../_components/ToolGate";
import ToolHeader from "../_components/ToolHeader";
import { TOOL_TEXT } from "../_components/registry";
import FaceView from "./FaceView";

const text = defineMessages({
  hi: { title: "मुख सामुद्रिक · AstroShrine", what: "मुख सामुद्रिक" },
  en: { title: "Face reading · AstroShrine", what: "face reading" },
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getT(text)).title,
    description: (await getT(TOOL_TEXT))["face-reading"].blurb,
    alternates: await languageAlternates("/tools/face-reading"),
    robots: { index: false, follow: false },
  };
}

export default async function FacePage() {
  const t = await getT(text);
  const tool = (await getT(TOOL_TEXT))["face-reading"];
  return (
    <>
      <ToolHeader title={tool.name} intro={tool.blurb} />
      <ToolGate what={t.what} astrologerOnly={false}>
        <FaceView />
      </ToolGate>
    </>
  );
}
