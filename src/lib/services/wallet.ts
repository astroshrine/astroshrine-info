import { api } from "@/lib/api";

// Wallet and recharge on the shared backend, the same calls the mobile app makes
// (React-native-app: components/wallet/*, modal/PricelistModal.tsx, services/endpoints.ts).
// Amounts are rupees; the wallet balance is points ("coins"), 1 point = ₹1 at points_per_rupee 1.

// ─── Types ──────────────────────────────────────────────────────────────────

export type RechargeTier = { inr: number; label?: string };

/** The wallet_config row (admin panel → Wallet). Only the fields the website uses. */
export type WalletConfig = {
  points_per_rupee: number;
  points_per_question: number;
  min_recharge_inr: number;
  /** Amounts above the minimum go in these steps (minimum 100, step 50: 100, 150, 200 …); 0 / absent = any. */
  recharge_step_inr?: number | null;
  max_recharge_inr: number;
  recharge_tiers?: RechargeTier[] | null;
  bonus_percentage: number;
  gst_percentage: number;
  is_active: boolean;
};

export type WalletTransaction = {
  id: string;
  /** CREDIT or DEBIT. */
  type: string;
  amount: number;
  balance_after: number;
  description?: string | null;
  /** RECHARGE, ADMIN_OFFER, BOOKING, BOOKING_REFUND, … */
  reference_type?: string | null;
  /** For RECHARGE: the Razorpay order id. */
  reference_id?: string | null;
  created_at?: string | null;
  status?: string | null;
};

export type TransactionsPage = { transactions: WalletTransaction[]; total: number; limit: number; offset: number };

export type PromoValidation = {
  valid: boolean;
  discountAmount?: number | null;
  finalAmount?: number | null;
  message?: string | null;
};

/** POST /v1/wallet/recharge/initiate: a Razorpay order created by the backend. */
export type RechargeOrder = {
  orderId: string;
  /** What the user pays, GST included (rupees). */
  amount: number;
  originalAmount: number;
  gstAmount: number;
  gstPct: number;
  currency: string;
  pointsToCredit: number;
  bonusPoints: number;
  discount: number;
  /** The Razorpay key id (public). Never a secret. */
  razorpayKey: string;
};

export type RechargeConfirmation = { success: boolean; pointsCredited?: number; newBalance?: number };

/** Metadata the backend stores on a wallet recharge order (razorpay_orders.payment_details[0]). */
export type RechargeMeta = {
  type?: string;
  originalAmount?: number;
  gstAmount?: number;
  gstPct?: number;
  totalPayable?: number;
  pointsToCredit?: number;
  promoCode?: string | null;
  discountAmount?: number;
  bonusPoints?: number;
};

/** GET /v1/order/:orderId (own orders only). */
export type RechargeOrderState = {
  razorPayOrderId?: string;
  /** CREATED, PAID, FAILED or CANCELLED. */
  status?: string;
  /** Rupees, GST included. */
  amount?: number;
  createTs?: number;
  paymentDetails?: Array<RechargeMeta & { paymentId?: string; status?: string; timestamp?: number }> | null;
};

// ─── Calls ──────────────────────────────────────────────────────────────────

/** GET /v1/wallet/config (signed in). */
export function getWalletConfig(signal?: AbortSignal) {
  return api<WalletConfig>("/v1/wallet/config", { signal });
}

export const TRANSACTIONS_PAGE_SIZE = 20;

/** GET /v1/wallet/transactions, newest first. */
export function getTransactions(offset: number, signal?: AbortSignal) {
  return api<TransactionsPage>(`/v1/wallet/transactions?limit=${TRANSACTIONS_PAGE_SIZE}&offset=${offset}`, { signal });
}

/** POST /v1/wallet/promo/validate: checks a code for a recharge amount without using it. */
export function validatePromo(code: string, amount: number) {
  return api<PromoValidation>("/v1/wallet/promo/validate", { method: "POST", body: { code, amount } });
}

/** POST /v1/wallet/recharge/initiate: the backend creates the Razorpay order and returns the key id. */
export function initiateRecharge(amount: number, promoCode?: string) {
  return api<RechargeOrder>("/v1/wallet/recharge/initiate", {
    method: "POST",
    body: promoCode ? { amount, promoCode } : { amount },
  });
}

/** POST /v1/wallet/recharge/confirm: verifies Razorpay's signature on the backend and credits the points. */
export function confirmRecharge(payment: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
  return api<RechargeConfirmation>("/v1/wallet/recharge/confirm", { method: "POST", body: payment });
}

/** GET /v1/order/:orderId: the order's status (the webhook may mark it PAID after confirm). */
export function getRechargeOrder(orderId: string, signal?: AbortSignal) {
  return api<RechargeOrderState>(`/v1/order/${encodeURIComponent(orderId)}`, { signal });
}

/**
 * PATCH /v1/order/:orderId → CANCELLED when the user closes checkout without paying, as the app does.
 * Best effort: the backend refuses it for a captured payment, and a failure here changes nothing for the user.
 */
export function cancelRechargeOrder(orderId: string) {
  return api<unknown>(`/v1/order/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    body: { op: "REPLACE", path: "status", value: "CANCELLED" },
  }).catch(() => undefined);
}

const EMAIL_DEFAULTS = {
  order_created: {
    subject: "Order Created",
    html: "<p>Your order has been created successfully. We are processing it.</p>",
  },
  payment_success: {
    subject: "Payment Successful",
    html: "<p>Your payment was successful. Thank you for your purchase.</p>",
  },
  payment_failed: {
    subject: "Payment Failed",
    html: "<p>Your payment could not be completed. Please try again later.</p>",
  },
} as const;

/**
 * The transactional email the app triggers at each payment step (POST /v1/notifications/email/trigger,
 * sent to the signed-in user only). Fire and forget: email must never block or fail a payment.
 */
export function sendPaymentEmail(trigger: keyof typeof EMAIL_DEFAULTS, data: { orderId: string; amount: number }) {
  void api("/v1/notifications/email/trigger", {
    method: "POST",
    body: { trigger, ...EMAIL_DEFAULTS[trigger], data },
  }).catch(() => undefined);
}

// ─── Business rules (same as the app and the backend) ────────────────────────

/** The app's list when wallet_config has no usable tiers (PricelistModal FALLBACK_TIERS). */
const FALLBACK_TIERS: RechargeTier[] = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 15000, 20000, 25000].map(
  (inr) => ({ inr }),
);

const GENERATED_STEPS = 12;

/**
 * The recharge amounts on offer, as the app computes them (utils/rechargeTiers.ts):
 * nothing below the minimum; with a step only minimum + n × step; the admin's tiers that fit, else the
 * minimum and the next steps, else the fallback list; sorted, no duplicates.
 * One addition: amounts above max_recharge_inr are left out, since the backend refuses them.
 */
export function rechargeTiers(config: WalletConfig | null | undefined): RechargeTier[] {
  const min = Math.max(Number(config?.min_recharge_inr) || 0, 0);
  const step = Math.max(Number(config?.recharge_step_inr) || 0, 0);
  const max = Number(config?.max_recharge_inr) || 0;
  const fits = (inr: number) => inr >= min && (step <= 0 || Number.isInteger((inr - min) / step));
  const withinMax = (inr: number) => max <= 0 || inr <= max;

  const raw: RechargeTier[] = Array.isArray(config?.recharge_tiers) ? config.recharge_tiers : [];
  const seen = new Set<number>();
  let tiers = raw
    .map((t) => ({ ...t, inr: Number(t?.inr) }))
    .filter((t) => t.inr > 0 && fits(t.inr) && !seen.has(t.inr) && seen.add(t.inr));
  if (!tiers.length && step > 0 && min > 0) {
    tiers = Array.from({ length: GENERATED_STEPS }, (_, i) => ({ inr: min + i * step }));
  }
  if (!tiers.length) {
    tiers = FALLBACK_TIERS.filter((t) => fits(t.inr));
    if (!tiers.length) tiers = FALLBACK_TIERS;
  }
  const allowed = tiers.filter((t) => withinMax(t.inr));
  return (allowed.length ? allowed : tiers).sort((a, b) => a.inr - b.inr);
}

/**
 * Points a recharge credits, by the backend's own formula (WalletService.initiateRecharge):
 * round(inr × points_per_rupee) + round(inr × bonus% / 100). The promo discount lowers the price, not the points.
 */
export function pointsFor(config: WalletConfig | null | undefined, inr: number) {
  const ppr = Number(config?.points_per_rupee) || 1;
  const bonusPct = Number(config?.bonus_percentage) || 0;
  const base = Math.round(inr * ppr);
  const bonus = bonusPct > 0 ? Math.round((inr * bonusPct) / 100) : 0;
  return { base, bonus, total: base + bonus };
}

/** The backend charges config.gst_percentage, or 18 when it is unset or 0. */
export function gstPercent(config: WalletConfig | null | undefined) {
  return Number(config?.gst_percentage) || 18;
}

/** Price breakdown for a recharge, rounded exactly as the backend rounds it. */
export function priceBreakdown(amount: number, promo: PromoValidation | null, gstPct: number) {
  const discount = promo?.valid ? Number(promo.discountAmount) || 0 : 0;
  const finalAmount = promo?.valid && Number(promo.finalAmount) >= 0 ? Number(promo.finalAmount) : amount - discount;
  const gst = Math.round(finalAmount * gstPct) / 100;
  const payable = Math.round((finalAmount + gst) * 100) / 100;
  return { amount, discount, gst, gstPct, payable };
}

export const isCreditTx = (tx: WalletTransaction) => tx.type?.toUpperCase() === "CREDIT" || tx.reference_type === "RECHARGE";
export const isBonusTx = (tx: WalletTransaction) => tx.reference_type === "ADMIN_OFFER";

export type TxFilter = "all" | "earned" | "spent" | "bonus";
export const TX_FILTERS: TxFilter[] = ["all", "earned", "spent", "bonus"];

export function matchesFilter(tx: WalletTransaction, filter: TxFilter) {
  if (filter === "all") return true;
  if (filter === "bonus") return isBonusTx(tx);
  return filter === "earned" ? isCreditTx(tx) && !isBonusTx(tx) : !isCreditTx(tx);
}

// ─── Formatting ─────────────────────────────────────────────────────────────

/** Whole coins, Indian grouping: 1,25,000. */
export const formatCoins = (n: number) => Math.floor(Number(n) || 0).toLocaleString("en-IN");

/** A transaction amount as the app prints it: whole, or one decimal. */
export const formatTxAmount = (n: number) => {
  const v = Math.abs(Number(n) || 0);
  return v % 1 === 0 ? v.toLocaleString("en-IN") : v.toLocaleString("en-IN", { maximumFractionDigits: 1 });
};

/** Rupees with paise: ₹1,180.00 */
export const formatRupees = (n: number) =>
  `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Rupees without paise when whole: ₹500 */
export const formatRupeesShort = (n: number) =>
  `₹${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export const formatDateTime = (value: string | number | null | undefined) =>
  value ? DATE_TIME.format(new Date(value)) : "";
