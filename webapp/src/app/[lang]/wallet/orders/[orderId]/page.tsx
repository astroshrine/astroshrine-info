import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import OrderStatus, { OrderSkeleton } from "./OrderStatus";

const text = defineMessages({
  hi: { title: "Recharge receipt · AstroShrine" },
  en: { title: "Recharge receipt · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getT(text);
  return { title, robots: { index: false, follow: false } };
}

// The order id is only known at request time, so it is read inside the Suspense boundary.
export default function RechargeOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      {params.then(({ orderId }) => (
        <OrderStatus orderId={orderId} />
      ))}
    </Suspense>
  );
}
