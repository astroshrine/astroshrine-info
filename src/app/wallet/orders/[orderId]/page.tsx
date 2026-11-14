import type { Metadata } from "next";
import { Suspense } from "react";
import OrderStatus, { OrderSkeleton } from "./OrderStatus";

export const metadata: Metadata = {
  title: "Recharge receipt · AstroShrine",
  robots: { index: false, follow: false },
};

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
