import { api } from "@/lib/api";

// The astrologer console's earnings: GET /v1/astrologer/:id/earnings (daily / weekly / monthly buckets) and
// GET /v1/astrologer/:id/order (one row per paid session). Both are readable only by the astrologer themselves.
// The backend sends rupee amounts as 0 while its SHOW_ASTROLOGER_EARNINGS switch is off; orders and time always come.

export type Channels = { livestream: number; call: number; chat: number };

export type EarningsBucket = {
  /** Start of the bucket (IST midnight), ms. */
  createTs: number;
  /** Milliseconds per channel. */
  channelTimeSpent: Channels;
  numberOfOrders: Channels;
  earnings: Channels;
};

export type EarningsResponse = { daily: EarningsBucket[]; weekly: EarningsBucket[]; monthly: EarningsBucket[] };

export type OrderRow = {
  customerId: string;
  customerName?: string;
  orderTs: number;
  /** chat, call or livestream (gifts). */
  orderType: string;
  subOrderType: string;
  amount: number;
  /** Milliseconds. */
  timeSpent: number;
};

export type Period = "day" | "week" | "month";

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const channels = (c: Partial<Channels> | undefined): Channels => ({ livestream: num(c?.livestream), call: num(c?.call), chat: num(c?.chat) });
const buckets = (list: unknown): EarningsBucket[] =>
  (Array.isArray(list) ? (list as EarningsBucket[]) : [])
    .map((b) => ({
      createTs: num(b?.createTs),
      channelTimeSpent: channels(b?.channelTimeSpent),
      numberOfOrders: channels(b?.numberOfOrders),
      earnings: channels(b?.earnings),
    }))
    .sort((a, b) => a.createTs - b.createTs);

export async function getEarnings(astrologerId: string, signal?: AbortSignal): Promise<EarningsResponse> {
  const raw = await api<Partial<EarningsResponse>>(`/v1/astrologer/${encodeURIComponent(astrologerId)}/earnings`, { signal });
  return { daily: buckets(raw?.daily), weekly: buckets(raw?.weekly), monthly: buckets(raw?.monthly) };
}

/** Sessions with a customer between two instants (the backend needs 13-digit millisecond timestamps), newest first. */
export async function getOrders(astrologerId: string, startTs: number, endTs: number, signal?: AbortSignal): Promise<OrderRow[]> {
  const rows = await api<OrderRow[]>(
    `/v1/astrologer/${encodeURIComponent(astrologerId)}/order?startTs=${Math.trunc(startTs)}&endTs=${Math.trunc(endTs)}`,
    { signal },
  );
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r && num(r.orderTs) > 0)
    .map((r) => ({ ...r, orderTs: num(r.orderTs), amount: num(r.amount), timeSpent: num(r.timeSpent) }))
    .sort((a, b) => b.orderTs - a.orderTs);
}

/** The website covers chat and calls; gifts in a livestream are not shown. */
export const bucketOrders = (b: EarningsBucket) => b.numberOfOrders.chat + b.numberOfOrders.call;
export const bucketMinutes = (b: EarningsBucket) => Math.round((b.channelTimeSpent.chat + b.channelTimeSpent.call) / 60_000);
export const bucketAmount = (b: EarningsBucket) => b.earnings.chat + b.earnings.call;

/**
 * True when the backend is hiding rupee amounts: sessions exist but every amount is 0. (A genuinely free week has
 * no sessions, so it is not mistaken for hidden.)
 */
export function amountsHidden(data: EarningsResponse): boolean {
  const all = [...data.daily, ...data.weekly, ...data.monthly];
  return all.some((b) => bucketOrders(b) > 0) && all.every((b) => bucketAmount(b) === 0);
}
