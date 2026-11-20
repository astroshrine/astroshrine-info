import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import ToolGate from "../_components/ToolGate";
import ToolHeader from "../_components/ToolHeader";
import { TOOL_TEXT } from "../_components/registry";
import { ReportSkeleton } from "../_reportkit/kit";
import PalmReadingView from "./PalmReadingView";

const text = defineMessages({
  hi: { title: "हस्त रेखा · AstroShrine", what: "हस्त रेखा रिपोर्ट" },
  en: { title: "Palm reading · AstroShrine", what: "palm reading reports" },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  const n = (await getT(TOOL_TEXT))["palm-reading"];
  return { title: t.title, description: n.blurb, alternates: await languageAlternates("/tools/palm-reading"), robots: { index: false, follow: false } };
}

export default async function PalmReadingPage() {
  const t = await getT(text);
  const n = (await getT(TOOL_TEXT))["palm-reading"];
  return (
    <>
      <ToolHeader title={n.name} intro={n.blurb} />
      <ToolGate what={t.what}>
        <Suspense fallback={<ReportSkeleton />}>
          <PalmReadingView />
        </Suspense>
      </ToolGate>
    </>
  );
}
