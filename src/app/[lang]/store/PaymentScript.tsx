"use client";

import { useEffect } from "react";
import Script from "next/script";
import { RAZORPAY_CHECKOUT_SRC, isCheckoutLoaded } from "@/lib/services/razorpay";

export type ScriptState = "loading" | "ready" | "error";

/** Loads Razorpay Checkout where a payment can start (the same script, and wrapper, as /wallet). */
export default function PaymentScript({ onState }: { onState: (state: ScriptState) => void }) {
  useEffect(() => {
    if (isCheckoutLoaded()) onState("ready");
  }, [onState]);
  return <Script src={RAZORPAY_CHECKOUT_SRC} onReady={() => onState("ready")} onError={() => onState("error")} />;
}
