import type { Locale } from "@/i18n/config";
import { defineMessages } from "@/i18n/messages";
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

const text = defineMessages({
  hi: { aiPack: "AI pack", subscription: "Subscription", recharge: "Wallet recharge", and: " और " },
  en: { aiPack: "AI pack", subscription: "Subscription", recharge: "Wallet recharge", and: " and " },
});

/** Where a promo applies, in the app's words and the page's language. */
export function promoUse(p: ActivePromo, locale: Locale) {
  const t = text[locale];
  return p.applicableTo
    .map((a) => (a === "AI_PACK" ? t.aiPack : a === "SUBSCRIPTION" ? t.subscription : t.recharge))
    .join(t.and);
}
