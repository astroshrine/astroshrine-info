import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import StoreHome, { StoreSkeleton } from "./StoreHome";

const text = defineMessages({
  hi: {
    title: "स्टोर · पूजा, रत्न और रुद्राक्ष · AstroShrine",
    description: "AstroShrine स्टोर: श्री महाकाल धाम में आपके नाम से पूजा, और लैब सर्टिफाइड रत्न, रुद्राक्ष व माला। ऐप वाले account से ही।",
  },
  en: {
    title: "Store · Pujas, gemstones and rudraksha · AstroShrine",
    description: "The AstroShrine store: pujas performed in your name at Shri Mahakal Dham, and lab certified gemstones, rudraksha and malas. With the same account as the app.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, description: t.description, alternates: await languageAlternates("/store") };
}

export default function StorePage() {
  // StoreHome reads the URL (?tab, ?q, ?category), so it renders in the browser behind this boundary.
  return (
    <Suspense fallback={<StoreSkeleton />}>
      <StoreHome />
    </Suspense>
  );
}
