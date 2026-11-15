// Razorpay Standard Checkout on the web. The script is loaded with next/script where a payment can start
// (see /wallet); this file only wraps the global it defines. The key id comes from the backend's order
// response, so no Razorpay setting lives in the website's code or environment.

export const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export type RazorpayPayment = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailure = { error?: { description?: string; reason?: string } };

type RazorpayOptions = {
  key: string;
  /** Paise. */
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (payment: RazorpayPayment) => void;
  modal?: { ondismiss?: () => void; escape?: boolean; confirm_close?: boolean };
};

type RazorpayInstance = {
  open(): void;
  on(event: "payment.failed", handler: (response: RazorpayFailure) => void): void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export const isCheckoutLoaded = () => typeof window !== "undefined" && typeof window.Razorpay === "function";

export type CheckoutOutcome =
  | { kind: "paid"; payment: RazorpayPayment }
  /**
   * The window was closed without a successful payment. `failed`: an attempt failed before that (a closed window
   * with no attempt is a cancellation); `reason`: Razorpay's description of the last failure, when it gave one.
   */
  | { kind: "closed"; failed: boolean; reason: string | null };

/**
 * Opens Checkout and settles once: "paid" from Razorpay's success handler, or "closed" when the user
 * closes the window. A failed attempt keeps the window open so the user can retry inside it; that it
 * failed, and why, is remembered and returned if they then close the window.
 */
export function openCheckout(options: Omit<RazorpayOptions, "handler" | "modal">): Promise<CheckoutOutcome> {
  return new Promise((resolve, reject) => {
    const Razorpay = window.Razorpay;
    if (typeof Razorpay !== "function") {
      reject(new Error("Razorpay checkout is not loaded"));
      return;
    }

    let settled = false;
    let failed = false;
    let reason: string | null = null;
    const settle = (outcome: CheckoutOutcome) => {
      if (settled) return;
      settled = true;
      resolve(outcome);
    };

    const checkout = new Razorpay({
      ...options,
      handler: (payment) => settle({ kind: "paid", payment }),
      modal: {
        escape: true,
        // Razorpay asks "are you sure?" before closing a window the user has started paying in.
        confirm_close: true,
        ondismiss: () => settle({ kind: "closed", failed, reason }),
      },
    });
    checkout.on("payment.failed", (response) => {
      failed = true;
      reason = response?.error?.description || response?.error?.reason || null;
    });
    checkout.open();
  });
}

/** The brand gold from the design tokens, for Checkout's accent colour (Razorpay needs a hex value). */
export function brandColor() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--core-gold-400").trim();
  return /^#[0-9a-f]{3,8}$/i.test(value) ? value : "#fbbf24";
}
