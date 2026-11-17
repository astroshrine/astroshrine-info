import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import JoinForm from "./JoinForm";

const text = defineMessages({
  hi: { title: "ज्योतिषी के रूप में जुड़ें · AstroShrine" },
  en: { title: "Join as an astrologer · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT(text)).title };
}

export default function Page() {
  return <JoinForm />;
}
