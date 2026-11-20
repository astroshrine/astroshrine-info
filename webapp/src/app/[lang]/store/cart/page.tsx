import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import CartView from "./CartView";

const text = defineMessages({
  hi: { title: "कार्ट · AstroShrine स्टोर" },
  en: { title: "Cart · AstroShrine store" },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, robots: { index: false, follow: false } };
}

export default function CartPage() {
  return <CartView />;
}
