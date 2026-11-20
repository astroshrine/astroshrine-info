import type { Metadata } from "next";
import { getT, languageAlternates } from "@/i18n/server";
import { defineMessages } from "@/i18n/messages";
import ToolGate from "../_components/ToolGate";
import ToolHeader from "../_components/ToolHeader";
import { TOOL_TEXT } from "../_components/registry";
import JeevanView from "./JeevanView";

const text = defineMessages({
  hi: { title: "जीवन घटना मार्गदर्शन · AstroShrine", what: "जीवन घटना मार्गदर्शन" },
  en: { title: "Jeevan Ghatna guidance · AstroShrine", what: "the Jeevan Ghatna guidance" },
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getT(text)).title,
    description: (await getT(TOOL_TEXT))["jeevan"].blurb,
    alternates: await languageAlternates("/tools/jeevan"),
    robots: { index: false, follow: false },
  };
}

export default async function JeevanPage() {
  const t = await getT(text);
  const tool = (await getT(TOOL_TEXT))["jeevan"];
  return (
    <>
      <ToolHeader title={tool.name} intro={tool.blurb} />
      <ToolGate what={t.what}>
        <JeevanView />
      </ToolGate>
    </>
  );
}
