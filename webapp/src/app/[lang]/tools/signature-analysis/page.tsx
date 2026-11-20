import type { Metadata } from "next";
import { getT, languageAlternates } from "@/i18n/server";
import { defineMessages } from "@/i18n/messages";
import ToolGate from "../_components/ToolGate";
import ToolHeader from "../_components/ToolHeader";
import { TOOL_TEXT } from "../_components/registry";
import SignatureView from "./SignatureView";

const text = defineMessages({
  hi: { title: "हस्ताक्षर विश्लेषण · AstroShrine", what: "हस्ताक्षर विश्लेषण" },
  en: { title: "Signature analysis · AstroShrine", what: "signature analysis" },
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getT(text)).title,
    description: (await getT(TOOL_TEXT))["signature-analysis"].blurb,
    alternates: await languageAlternates("/tools/signature-analysis"),
    robots: { index: false, follow: false },
  };
}

export default async function SignaturePage() {
  const t = await getT(text);
  const tool = (await getT(TOOL_TEXT))["signature-analysis"];
  return (
    <>
      <ToolHeader title={tool.name} intro={tool.blurb} />
      <ToolGate what={t.what}>
        <SignatureView />
      </ToolGate>
    </>
  );
}
