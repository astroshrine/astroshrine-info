import type { Metadata } from "next";
import { getT, languageAlternates } from "@/i18n/server";
import { defineMessages } from "@/i18n/messages";
import ToolGate from "../_components/ToolGate";
import ToolHeader from "../_components/ToolHeader";
import { TOOL_TEXT } from "../_components/registry";
import MansikView from "./MansikView";

const text = defineMessages({
  hi: { title: "मानसिक प्रवृत्ति रिपोर्ट · AstroShrine", what: "मानसिक प्रवृत्ति रिपोर्ट" },
  en: { title: "Mansik Pravritti report · AstroShrine", what: "the Mansik Pravritti report" },
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getT(text)).title,
    description: (await getT(TOOL_TEXT))["mansik"].blurb,
    alternates: await languageAlternates("/tools/mansik"),
    robots: { index: false, follow: false },
  };
}

export default async function MansikPage() {
  const t = await getT(text);
  const tool = (await getT(TOOL_TEXT))["mansik"];
  return (
    <>
      <ToolHeader title={tool.name} intro={tool.blurb} />
      <ToolGate what={t.what}>
        <MansikView />
      </ToolGate>
    </>
  );
}
