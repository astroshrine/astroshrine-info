import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import SetupView from "./SetupView";

const text = defineMessages({
  hi: { title: "अपनी प्रोफ़ाइल तैयार करें · AstroShrine" },
  en: { title: "Set up your profile · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT(text)).title };
}

export default function SetupPage() {
  return <SetupView />;
}
