import { api, ApiError } from "@/lib/api";
import { priceOf, type PriceView } from "@/lib/endpoints";
import type { RawAstrologer } from "./astrologerModel";

// Scheduled consultations (the app's "Book" flow and My Bookings): pick a day and a slot from the
// astrologer's own schedule, pay from the wallet, join at the time. All on /v1/booking, signed in.
// The server decides everything that matters (slot still free, astrologer online, balance, refund tier).

/** The server reads booking dates and times as wall-clock in this zone (BOOKING_TZ, India). */
export const BOOKING_UTC_OFFSET = "+05:30";
/** A booking can be made for today and the next 7 days. */
export const BOOKING_DAYS_AHEAD = 7;
/** A call opens this long before its start; a booked call always lasts at most CALL_SESSION_MINUTES. */
export const JOIN_EARLY_MINUTES = 5;
/** Shortest booked session; the picker offers 5-minute steps up to the slot's length. */
export const MIN_BOOKING_MINUTES = 5;

export type BookingChannel = "call" | "chat";

export type Slot = {
  start: string;
  end: string;
  durationMinutes: number;
  channel: "call" | "chat" | "both";
  available: boolean;
};

export type BookingStatus =
  | "WAITING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED_BY_USER"
  | "CANCELLED_BY_ASTRO"
  | "CANCELLED_BY_ADMIN"
  | "EXPIRED"
  | string;

export type Booking = {
  id: string;
  astrologerId: string;
  /** Empty when the backend did not send a name. */
  astrologerName: string;
  /** YYYY-MM-DD in booking time. */
  date: string;
  /** HH:MM in booking time. */
  start: string;
  end: string;
  durationMinutes: number;
  channel: BookingChannel;
  status: BookingStatus;
  pointsCharged: number;
  pointsRefunded: number;
  questionsAllowed: number;
  questionsUsed: number;
  createdAt: number;
};

type RawBooking = {
  id?: string;
  astrologer_id?: string;
  booking_date?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  channel_type?: string;
  status?: string;
  points_charged?: number;
  points_refunded?: number;
  chat_questions_allowed?: number;
  chat_questions_used?: number;
  created_at?: string;
  astrologer?: { display_name?: string | null } | null;
};

const hhmm = (v: unknown) => String(v ?? "").substring(0, 5);

function toBooking(r: RawBooking): Booking | null {
  if (!r?.id || !r.astrologer_id || !r.booking_date) return null;
  return {
    id: r.id,
    astrologerId: r.astrologer_id,
    astrologerName: r.astrologer?.display_name?.trim() || "",
    date: String(r.booking_date).substring(0, 10),
    start: hhmm(r.start_time),
    end: hhmm(r.end_time),
    durationMinutes: Number(r.duration_minutes) || 0,
    channel: r.channel_type === "call" ? "call" : "chat",
    status: r.status || "",
    pointsCharged: Number(r.points_charged) || 0,
    pointsRefunded: Number(r.points_refunded) || 0,
    questionsAllowed: Number(r.chat_questions_allowed) || 0,
    questionsUsed: Number(r.chat_questions_used) || 0,
    createdAt: Date.parse(r.created_at ?? "") || 0,
  };
}

/** The user's own bookings, newest first (the server returns up to 50). */
export async function listMyBookings(signal?: AbortSignal): Promise<Booking[]> {
  const rows = await api<RawBooking[]>("/v1/booking/my-bookings", { signal });
  return (Array.isArray(rows) ? rows : []).map(toBooking).filter((b): b is Booking => !!b);
}

// ─── Time helpers (booking time = India) ────────────────────────────────────────────────────────

/** Epoch ms of a booking's date and time. */
export const bookingInstant = (date: string, time: string) => Date.parse(`${date}T${hhmm(time)}:00${BOOKING_UTC_OFFSET}`);

/** YYYY-MM-DD in booking time, `offsetDays` from today. */
export function bookingDay(offsetDays = 0, now = Date.now()): string {
  return new Date(now + offsetDays * 86_400_000 + 5.5 * 3_600_000).toISOString().substring(0, 10);
}

/** The next BOOKING_DAYS_AHEAD + 1 days, starting today. */
export const bookableDays = (now = Date.now()) => Array.from({ length: BOOKING_DAYS_AHEAD + 1 }, (_, i) => bookingDay(i, now));

/** "18:30" as "6:30 pm". */
export function clockLabel(time: string): string {
  const [h, m] = hhmm(time).split(":").map(Number);
  if (!Number.isFinite(h)) return time;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

/** Minutes from `from` to the booking's start (negative once it has begun). */
export const minutesUntil = (b: Pick<Booking, "date" | "start">, now = Date.now()) => (bookingInstant(b.date, b.start) - now) / 60_000;

const OPEN: BookingStatus[] = ["WAITING", "CONFIRMED", "IN_PROGRESS"];
export const isOpen = (b: Pick<Booking, "status">) => OPEN.includes(b.status);
export const isCancelled = (b: Pick<Booking, "status">) => b.status.startsWith("CANCELLED");

/** A scheduled booking that can still be cancelled: the server only cancels CONFIRMED ones. */
export const canCancel = (b: Pick<Booking, "status" | "channel">) => b.status === "CONFIRMED";

/**
 * The refund the server gives for a cancel by the user right now (BookingService.cancelBooking):
 * more than 60 minutes before the start 100%, 16 to 60 minutes 50%, later nothing.
 */
export function refundPercent(b: Pick<Booking, "date" | "start">, now = Date.now()): 100 | 50 | 0 {
  const m = minutesUntil(b, now);
  return m > 60 ? 100 : m > 15 ? 50 : 0;
}

/**
 * Whether the join button works yet. Calls: only on the day, from JOIN_EARLY_MINUTES before the start until the end.
 * Chats are open question packs: always joinable while the booking is open.
 */
export function joinState(b: Booking, now = Date.now()): "open" | "early" | "over" | "na" {
  if (!isOpen(b)) return "na";
  if (b.channel === "chat") return "open";
  const start = bookingInstant(b.date, b.start);
  const end = bookingInstant(b.date, b.end);
  if (now > end) return "over";
  return now >= start - JOIN_EARLY_MINUTES * 60_000 ? "open" : "early";
}

// ─── Slots and booking ──────────────────────────────────────────────────────────────────────────

type RawSlot = { start?: string; end?: string; duration_minutes?: number; channel_type?: string; available?: boolean };

/** Free and taken slots of one astrologer on one day (YYYY-MM-DD). Past slots of today are already left out. */
export async function getSlots(astrologerId: string, date: string, signal?: AbortSignal): Promise<Slot[]> {
  const r = await api<{ slots?: RawSlot[] }>(`/v1/booking/slots/${encodeURIComponent(astrologerId)}?date=${encodeURIComponent(date)}`, { signal });
  return (Array.isArray(r?.slots) ? r.slots : [])
    .filter((s) => s?.start && s.end)
    .map((s) => ({
      start: hhmm(s.start),
      end: hhmm(s.end),
      durationMinutes: Number(s.duration_minutes) || 0,
      channel: s.channel_type === "call" ? "call" : s.channel_type === "chat" ? "chat" : "both",
      available: s.available !== false,
    }));
}

/** Minutes the picker offers for a slot: 5-minute steps from MIN_BOOKING_MINUTES up to the slot's length. */
export function durationOptions(slotMinutes: number): number[] {
  const max = Math.max(slotMinutes, 0);
  if (max <= MIN_BOOKING_MINUTES) return max ? [max] : [];
  const steps: number[] = [];
  for (let m = MIN_BOOKING_MINUTES; m < max; m += 5) steps.push(m);
  steps.push(max);
  return steps;
}

/** What the website knows of the astrologer's prices, for the estimate on the confirm step. */
export type BookingRates = { call: PriceView; chat: PriceView };

const FALLBACK_CALL_RATE = 20;
const FALLBACK_CHAT_RATE = 15;

export async function getBookingRates(astrologerId: string, signal?: AbortSignal): Promise<BookingRates> {
  const raw = await api<RawAstrologer>(`/v1/astrologer-view/${encodeURIComponent(astrologerId)}`, { auth: false, signal });
  return { call: priceOf(raw?.pricingData?.call, FALLBACK_CALL_RATE), chat: priceOf(raw?.pricingData?.chat, FALLBACK_CHAT_RATE) };
}

export type BookResult = { bookingId: string; pointsCharged: number; astrologerName: string; questionsAllowed: number };

/** Charges the wallet and confirms the slot. Errors carry the server's reason (ApiError.code: ASTROLOGER_OFFLINE, ASTROLOGER_LIVE). */
export async function bookSlot(p: { astrologerId: string; date: string; startTime: string; channel: BookingChannel; durationMinutes: number }): Promise<BookResult> {
  const r = await api<{ booking?: { id?: string }; pointsCharged?: number; astrologerName?: string; chatQuestionsAllowed?: number }>("/v1/booking/book", {
    method: "POST",
    body: { astrologerId: p.astrologerId, date: p.date, startTime: p.startTime, channelType: p.channel, durationMinutes: p.durationMinutes },
  });
  if (!r?.booking?.id) throw new ApiError(500, "The booking was not created");
  return {
    bookingId: r.booking.id,
    pointsCharged: Number(r.pointsCharged) || 0,
    astrologerName: r.astrologerName ?? "",
    questionsAllowed: Number(r.chatQuestionsAllowed) || 0,
  };
}

export type CancelResult = { refundedPoints: number; refundPercent: number };

/** Cancels a CONFIRMED booking; the refund follows refundPercent() above. */
export async function cancelBooking(bookingId: string, reason?: string): Promise<CancelResult> {
  const r = await api<{ refundAmount?: number; refundPercent?: number; pointsRefunded?: number }>(`/v1/booking/cancel/${encodeURIComponent(bookingId)}`, {
    method: "POST",
    body: { reason },
  });
  return { refundedPoints: Number(r?.refundAmount ?? r?.pointsRefunded) || 0, refundPercent: Number(r?.refundPercent) || 0 };
}

export const statusCodeOf = (e: unknown) => (e instanceof ApiError ? e.status : undefined);
export const errorCodeOf = (e: unknown) => (e instanceof ApiError ? e.code : undefined);
export const messageOf = (e: unknown) => (e instanceof ApiError ? e.message : "");
