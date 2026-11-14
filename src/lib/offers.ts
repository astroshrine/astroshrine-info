import { api } from "./api";

/** An active wallet promo code, as the app's Offers screen shows it (admin-created, real data only). */
export type ActivePromo = {
  code: string;
  description: string | null;
  discountPercentage: number;
  maxDiscountInr: number | null;
  minRechargeInr: number;
  expiresAt: string | null;
  applicableTo: string[];
};

/** GET /v1/wallet/promo/active (signed in). */
export async function listActivePromos(signal?: AbortSignal): Promise<ActivePromo[]> {
  const data = await api<{ promos?: ActivePromo[] }>("/v1/wallet/promo/active", { signal });
  return Array.isArray(data?.promos) ? data.promos : [];
}

/** Where a promo applies, in the app's words. */
export function promoUse(p: ActivePromo) {
  return p.applicableTo
    .map((a) => (a === "AI_PACK" ? "AI pack" : a === "SUBSCRIPTION" ? "Subscription" : "Wallet recharge"))
    .join(" और ");
}
