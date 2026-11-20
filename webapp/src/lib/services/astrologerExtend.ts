import { api, ApiError } from "@/lib/api";
import { packFields, type PackState } from "@/lib/services/chat";

// A customer's request for more chat time, answered by the astrologer. Same calls as the app's ChatApp:
// the pending request is read once (and again when the realtime event is missed), Accept charges the customer's
// block and restarts both clocks, Decline charges nothing.

export type ExtendRequest = {
  bookingId: string;
  /** Epoch ms the request was made and when it lapses (about two minutes). */
  requestedAt: number;
  expiresAt: number;
  minutes: number;
  /** Points the block costs the customer, when the server says (the realtime event does, the read does not). */
  cost?: number;
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Reads a request from either the GET answer or a ChatExtendRequested event; null when it is not a live one. */
export function toExtendRequest(raw: unknown, now = Date.now()): ExtendRequest | null {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const bookingId = typeof r.bookingId === "string" ? r.bookingId : "";
  const requestedAt = num(r.requestedAt) ?? now;
  const expiresAt = num(r.expiresAt) ?? requestedAt + 120_000;
  if (!bookingId || expiresAt <= now) return null;
  return { bookingId, requestedAt, expiresAt, minutes: num(r.minutes) ?? 5, cost: num(r.cost) };
}

/** GET /v1/booking/chat/extend-request/with-user/:userId (astrologers only; 404 = nothing pending). */
export async function getPendingExtend(userId: string, signal?: AbortSignal): Promise<ExtendRequest | null> {
  try {
    return toExtendRequest(await api<unknown>(`/v1/booking/chat/extend-request/with-user/${encodeURIComponent(userId)}`, { signal }));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Why an answer failed: the request lapsed or was answered elsewhere, the customer cannot pay, or anything else. */
export type ExtendFailure = "expired" | "answered" | "noBalance" | "other";
export function extendFailureOf(error: unknown): ExtendFailure {
  const code = error instanceof ApiError ? error.code : undefined;
  if (code === "ExtendRequestExpired") return "expired";
  if (code === "ExtendRequestAnswered") return "answered";
  if (code === "InsufficientBalance" || (error instanceof ApiError && error.status === 402)) return "noBalance";
  return "other";
}

/** POST .../extend/accept (the new clock comes back, and as ChatClockChanged) or .../extend/decline. */
export async function answerExtend(bookingId: string, accept: boolean): Promise<Partial<PackState> | null> {
  const r = await api<Record<string, unknown>>(`/v1/booking/chat/${encodeURIComponent(bookingId)}/extend/${accept ? "accept" : "decline"}`, { method: "POST", body: {} });
  return accept ? packFields(r) : null;
}
