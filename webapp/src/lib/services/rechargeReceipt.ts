import type { RechargeOrder, WalletTransaction } from "./wallet";

// What a recharge receipt shows besides its status. The backend's status route (GET /v1/wallet/recharge/:id/status)
// answers only PAID / PENDING / FAILED, so the amounts come from where this tab saw them: the order the wallet page
// created (and how Razorpay Checkout ended), or the credit in the transaction list. Kept in sessionStorage (this tab
// only, gone when it closes) and tied to the signed-in user, so another account on the same browser never reads it.

/** How Checkout ended, when the payment was made in this tab. */
export type CheckoutResult =
  /** Razorpay took the payment. `confirmed`: the backend's confirm answered that the points are credited. */
  | { kind: "paid"; confirmed: boolean }
  /** An attempt failed and the window was then closed. `reason`: Razorpay's description, when it gave one. */
  | { kind: "failed"; reason: string | null };

export type RechargeReceipt = {
  userId: string;
  orderId: string;
  /** Rupees paid, GST included. */
  total: number | null;
  /** The pack's amount, before promo and GST. */
  originalAmount: number | null;
  /** Promo discount in rupees; null when a promo was used but its amount is not known. */
  discount: number | null;
  promoCode: string | null;
  gstAmount: number | null;
  gstPct: number | null;
  /** Points the recharge credits, bonus included. */
  coins: number | null;
  bonus: number;
  paymentId: string | null;
  /** When it was paid (ms). */
  paidAt: number | null;
  checkout?: CheckoutResult;
};

const key = (orderId: string) => `astroshrine:recharge:${orderId}`;

const num = (value: unknown) => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** "Wallet recharge ₹118" → 118. */
function rupeesIn(text: string | null | undefined) {
  const match = /₹\s*([\d,]+(?:\.\d+)?)/.exec(text ?? "");
  return match ? num(match[1].replace(/,/g, "")) : null;
}

export function readRechargeReceipt(orderId: string, userId: string | null | undefined): RechargeReceipt | null {
  if (!userId) return null;
  try {
    const raw = sessionStorage.getItem(key(orderId));
    const value = raw ? (JSON.parse(raw) as RechargeReceipt) : null;
    return value && value.orderId === orderId && value.userId === userId ? value : null;
  } catch {
    return null;
  }
}

export function saveRechargeReceipt(receipt: RechargeReceipt) {
  try {
    sessionStorage.setItem(key(receipt.orderId), JSON.stringify(receipt));
  } catch {
    // Storage blocked or full: the receipt page then shows the status from the backend alone.
  }
}

/** From the order POST /v1/wallet/recharge/initiate returned, before Checkout opens. */
export function receiptFromOrder(userId: string, order: RechargeOrder, promoCode: string | null): RechargeReceipt {
  return {
    userId,
    orderId: order.orderId,
    total: num(order.amount),
    originalAmount: num(order.originalAmount),
    discount: num(order.discount) ?? 0,
    promoCode,
    gstAmount: num(order.gstAmount),
    gstPct: num(order.gstPct),
    coins: num(order.pointsToCredit),
    bonus: num(order.bonusPoints) ?? 0,
    paymentId: null,
    paidAt: null,
  };
}

/** Before a recharge's receipt opens from the transaction list: its amounts, unless this tab already has them. */
export function rememberRechargeCredit(userId: string, tx: WalletTransaction) {
  const receipt = receiptFromTransaction(userId, tx);
  if (receipt && readRechargeReceipt(receipt.orderId, userId)?.total == null) saveRechargeReceipt(receipt);
}

/** From the RECHARGE credit in the transaction list (null for any other transaction). */
export function receiptFromTransaction(userId: string, tx: WalletTransaction): RechargeReceipt | null {
  if (tx.reference_type !== "RECHARGE" || !tx.reference_id) return null;
  const meta = tx.metadata && typeof tx.metadata === "object" ? tx.metadata : {};
  const total = rupeesIn(tx.description);
  const originalAmount = num(meta.originalAmount);
  const promoCode = typeof meta.promoCode === "string" && meta.promoCode ? meta.promoCode : null;
  // Without a promo, whatever was paid above the pack's amount is the GST.
  const gstAmount = !promoCode && total != null && originalAmount != null && total >= originalAmount ? round2(total - originalAmount) : null;
  const paidAt = tx.created_at ? Date.parse(tx.created_at) : NaN;
  return {
    userId,
    orderId: tx.reference_id,
    total,
    originalAmount,
    discount: promoCode ? null : 0,
    promoCode,
    gstAmount,
    gstPct: null,
    coins: num(tx.amount),
    bonus: num(tx.bonus_amount) ?? num(meta.bonusPoints) ?? 0,
    paymentId: typeof meta.razorpayPaymentId === "string" && meta.razorpayPaymentId ? meta.razorpayPaymentId : null,
    paidAt: Number.isFinite(paidAt) ? paidAt : null,
  };
}
