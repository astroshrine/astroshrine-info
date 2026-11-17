import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { Page } from "./_console/ui";
import HomeView from "./_home/HomeView";

const text = defineMessages({
  hi: { title: "ज्योतिषी होम · AstroShrine" },
  en: { title: "Astrologer home · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getT(text);
  return { title, robots: { index: false, follow: false } };
}

export default function AstrologerHomePage() {
  return (
    <Page>
      <HomeView />
    </Page>
  );
}
