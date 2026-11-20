import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import OrdersView from "./OrdersView";
import { Skeleton } from "../ui";

const text = defineMessages({
  hi: { title: "मेरे ऑर्डर · AstroShrine स्टोर" },
  en: { title: "My orders · AstroShrine store" },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, robots: { index: false, follow: false } };
}

export default function OrdersPage() {
  // OrdersView reads the URL (?tab), so it renders in the browser behind this boundary.
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-8 h-96 w-full max-w-6xl" />}>
      <OrdersView />
    </Suspense>
  );
}
