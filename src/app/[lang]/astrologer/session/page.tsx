import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import SessionView from "./_session/SessionView";

const text = defineMessages({
  hi: { title: "लाइव चैट और कुंडली टूल · AstroShrine ज्योतिषी" },
  en: { title: "Live chat and kundli tools · AstroShrine astrologer" },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title };
}

export default function SessionPage() {
  return (
    <Suspense>
      <SessionView />
    </Suspense>
  );
}
