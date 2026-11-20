import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import ToolGate from "../_components/ToolGate";
import ToolHeader from "../_components/ToolHeader";
import { TOOL_TEXT } from "../_components/registry";
import { ReportSkeleton } from "../_reportkit/kit";
import DmitView from "./DmitView";

const text = defineMessages({
  hi: { title: "DMIT रिपोर्ट · AstroShrine", what: "DMIT रिपोर्ट" },
  en: { title: "DMIT report · AstroShrine", what: "DMIT reports" },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  const n = (await getT(TOOL_TEXT)).dmit;
  return { title: t.title, description: n.blurb, alternates: await languageAlternates("/tools/dmit"), robots: { index: false, follow: false } };
}

export default async function DmitPage() {
  const t = await getT(text);
  const n = (await getT(TOOL_TEXT)).dmit;
  return (
    <>
      <ToolHeader title={n.name} intro={n.blurb} />
      <ToolGate what={t.what}>
        <Suspense fallback={<ReportSkeleton />}>
          <DmitView />
        </Suspense>
      </ToolGate>
    </>
  );
}
