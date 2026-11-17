// Order and booking status words as the backend writes them, mapped to a label key and a tone.

export type Tone = "success" | "warning" | "danger" | "neutral";

export type StatusKey = "paymentPending" | "paymentFailed" | "placed" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded" | "completed" | "processing";

/** A product order: the payment decides first (an unpaid order is not an order yet), then the order status. */
export function orderStatus(o: { payment_status?: string | null; order_status?: string | null }): { key: StatusKey; tone: Tone } {
  const pay = (o.payment_status || "").toLowerCase();
  const st = (o.order_status || "").toLowerCase();
  if (st === "cancelled") return { key: pay === "refunded" ? "refunded" : "cancelled", tone: "neutral" };
  if (pay === "refunded") return { key: "refunded", tone: "neutral" };
  if (pay === "failed") return { key: "paymentFailed", tone: "danger" };
  if (pay !== "paid") return { key: "paymentPending", tone: "warning" };
  if (st === "delivered") return { key: "delivered", tone: "success" };
  if (st === "shipped") return { key: "shipped", tone: "success" };
  if (st === "confirmed" || st === "processing") return { key: "confirmed", tone: "success" };
  return { key: "placed", tone: "success" };
}

/** A puja booking: payment PENDING, PAID, FAILED, REFUNDED; booking PENDING, CONFIRMED, COMPLETED, CANCELLED. */
export function bookingStatus(b: { payment_status?: string | null; booking_status?: string | null }): { key: StatusKey; tone: Tone } {
  const pay = (b.payment_status || "").toUpperCase();
  const st = (b.booking_status || "").toUpperCase();
  if (st === "CANCELLED") return { key: pay === "REFUNDED" ? "refunded" : "cancelled", tone: "neutral" };
  if (pay === "REFUNDED") return { key: "refunded", tone: "neutral" };
  if (pay === "FAILED") return { key: "paymentFailed", tone: "danger" };
  if (pay !== "PAID") return { key: "paymentPending", tone: "warning" };
  if (st === "COMPLETED") return { key: "completed", tone: "success" };
  if (st === "CONFIRMED") return { key: "confirmed", tone: "success" };
  return { key: "processing", tone: "success" };
}

export const TONE_CLASS: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-neutral-soft text-ink-soft",
};
