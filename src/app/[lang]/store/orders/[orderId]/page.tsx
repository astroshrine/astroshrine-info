import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import OrderDetail from "./OrderDetail";
import { Skeleton } from "../../ui";

const text = defineMessages({
  hi: { title: "ऑर्डर · AstroShrine स्टोर" },
  en: { title: "Order · AstroShrine store" },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, robots: { index: false, follow: false } };
}

// The order id is only known at request time, so it is read inside the Suspense boundary.
export default function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-8 h-96 w-full max-w-3xl" />}>
      {params.then(({ orderId }) => (
        <OrderDetail orderId={orderId} />
      ))}
    </Suspense>
  );
}
