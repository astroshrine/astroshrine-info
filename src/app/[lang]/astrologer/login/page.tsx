import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { defineMessages } from "@/i18n/messages";
import LoginPanel from "./LoginPanel";

const text = defineMessages({
  hi: { title: "ज्योतिषी साइन इन · AstroShrine" },
  en: { title: "Astrologer sign in · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT(text)).title };
}

export default function Page() {
  return <LoginPanel />;
}
