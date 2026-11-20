import { api } from "@/lib/api";

// The astrologer's own discount codes (the astrologer app's AstroCoupons). Responses are wrapped as {data}.

export type CouponScope = "puja" | "stone" | "puja_stone";
export type CouponStatus = "active" | "paused" | "expired" | "disabled";

export type Coupon = {
  code: string;
  title: string;
  scope: CouponScope;
  /** Discount in basis points (500 = 5%). */
  bps: number;
  endsAt: string | null;
  usesPerUser: number;
  status: CouponStatus;
  uses: number;
  sales: number;
};

/** Backend limits: 3 active at once, ends within 90 days, 4-16 letters or digits. Caps are per scope: puja 15%, stone 10%. */
export const MAX_ACTIVE = 3;
export const MAX_DAYS = 90;
export const CODE_RE = /^[A-Z0-9]{4,16}$/;
export const SCOPE_CAP_PERCENT: Record<CouponScope, number> = { puja: 15, stone: 10, puja_stone: 10 };

type Raw = Record<string, unknown> & { stats?: Record<string, unknown> };
const status = (v: unknown): CouponStatus => (["active", "paused", "expired", "disabled"].includes(String(v)) ? (v as CouponStatus) : "disabled");
const scope = (v: unknown): CouponScope => (["puja", "stone", "puja_stone"].includes(String(v)) ? (v as CouponScope) : "puja_stone");

const toCoupon = (c: Raw): Coupon => ({
  code: String(c.code ?? ""),
  title: typeof c.title === "string" ? c.title : "",
  scope: scope(c.scope),
  bps: Number(c.value) || 0,
  endsAt: typeof c.ends_at === "string" ? c.ends_at : null,
  usesPerUser: Number(c.uses_per_user) || 1,
  status: status(c.status),
  uses: Number(c.stats?.uses) || 0,
  sales: Number(c.stats?.sales) || 0,
});

export async function getCoupons(signal?: AbortSignal): Promise<Coupon[]> {
  const res = await api<{ data?: unknown }>("/v1/astrologer/coupons", { signal });
  return (Array.isArray(res?.data) ? (res.data as Raw[]) : []).map(toCoupon).filter((c) => c.code);
}

export type NewCoupon = { code: string; scope: CouponScope; percent: number; endsAt: Date; usesPerUser: number; title: string };

/** POST /v1/astrologer/coupons. The percentage is sent as basis points. */
export async function createCoupon(input: NewCoupon): Promise<Coupon> {
  const res = await api<{ data: Raw }>("/v1/astrologer/coupons", {
    method: "POST",
    body: {
      code: input.code,
      scope: input.scope,
      value: Math.round(input.percent * 100),
      ends_at: input.endsAt.toISOString(),
      uses_per_user: input.usesPerUser,
      ...(input.title && { title: input.title }),
    },
  });
  return toCoupon(res.data);
}

/** PATCH /v1/astrologer/coupons/:code: pause, resume or end (expired is final). */
export async function setCouponStatus(code: string, next: "active" | "paused" | "expired"): Promise<void> {
  await api<unknown>(`/v1/astrologer/coupons/${encodeURIComponent(code)}`, { method: "PATCH", body: { status: next } });
}
