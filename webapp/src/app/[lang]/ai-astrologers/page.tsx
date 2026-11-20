import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import AiAstrologersView from "./AiAstrologersView";

const text = defineMessages({
  hi: {
    title: "AI ज्योतिषी · AstroShrine",
    description: "AI ज्योतिषी से अपने सवाल पूछें: विवाह, करियर, धन, घर और बहुत कुछ। हर जवाब AI देता है, और यह साफ़ लिखा रहता है।",
  },
  en: {
    title: "AI astrologers · AstroShrine",
    description: "Ask AI astrologers about marriage, career, money, home and more. Every answer comes from an AI, and it is always labelled.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getT(text);
  return { title, description, robots: { index: false, follow: false } };
}

export default function AiAstrologersPage() {
  return <AiAstrologersView />;
}
