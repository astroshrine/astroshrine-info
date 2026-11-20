import { api } from "@/lib/api";

// The astrologer console's home, on the shared backend (same calls the mobile app makes):
// presence heartbeat, Quick DND ("busy"), waiting customers, today's figures and the next booking.
// Every function takes the astrologer's id, which is the signed-in user's id.

const enc = encodeURIComponent;

// ─── Presence and status ─────────────────────────────────────────────────────────────────────────

export type AstrologerPresence = "online" | "busy" | "offline";

/** Heartbeat or the Offline switch: POST /v1/users/me/presence. */
export function sendPresence(online: boolean, source: "beat" | "switch") {
  return api<{ isOnline?: boolean; autoOffline?: boolean }>("/v1/users/me/presence", { method: "POST", body: { online, source } });
}

type RawStatus = { isOnline?: boolean; status?: string | null; nextAvailableAt?: number | null };

/** GET /v1/users/:id/status. The backend's four values collapse to the three the console switches between. */
export async function getStatus(id: string, signal?: AbortSignal): Promise<{ presence: AstrologerPresence; nextAvailableAt: number | null }> {
  const s = await api<RawStatus>(`/v1/users/${enc(id)}/status`, { signal });
  const status = s?.status ?? (s?.isOnline ? "online" : "offline");
  const presence: AstrologerPresence = status === "online" ? "online" : status === "busy" || status === "live" ? "busy" : "offline";
  return { presence, nextAvailableAt: typeof s?.nextAvailableAt === "number" ? s.nextAvailableAt : null };
}

// ─── Workday ─────────────────────────────────────────────────────────────────────────────────────

export type Workday = {
  /** Quick DND is on: the backend lists the astrologer as busy. */
  dnd: boolean;
  /** DND, or inside the rest hours. */
  onBreak: boolean;
  restActive: boolean;
  onlineMinutes: number;
  targetMinutes: number;
};

type RawWorkday = {
  settings?: { dndEnabled?: boolean };
  onBreak?: boolean;
  restActive?: boolean;
  today?: { onlineMinutes?: number; targetMinutes?: number };
};

/** GET /v1/astrologer/:id/workday. */
export async function getWorkday(id: string, signal?: AbortSignal): Promise<Workday> {
  const w = await api<RawWorkday>(`/v1/astrologer/${enc(id)}/workday`, { signal });
  return {
    dnd: w?.settings?.dndEnabled === true,
    onBreak: w?.onBreak === true,
    restActive: w?.restActive === true,
    onlineMinutes: Number(w?.today?.onlineMinutes) || 0,
    targetMinutes: Number(w?.today?.targetMinutes) || 0,
  };
}

/** POST /v1/astrologer/:id/workday/dnd. */
export function setDnd(id: string, enabled: boolean) {
  return api<unknown>(`/v1/astrologer/${enc(id)}/workday/dnd`, { method: "POST", body: { enabled } });
}

// ─── Waiting customers ───────────────────────────────────────────────────────────────────────────

export type WaitingKind = "chat" | "call";

export type Waiting = {
  /** Unique per row. */
  key: string;
  kind: WaitingKind;
  /** The customer's user id. */
  userId: string;
  /** Chat queue only: the paid chat's booking id (what removing the customer ends). */
  bookingId: string | null;
  name: string;
  photo: string | null;
  /** Epoch ms the customer started waiting, null when the backend did not say. */
  since: number | null;
  /** Chat queue only: 1 = next. */
  position: number | null;
  /** Call waitlist only: "audio" | "video" when the customer chose one. */
  subType: string | null;
};

type RawQueue = {
  items?: {
    position?: number;
    bookingId?: string;
    userId?: string;
    user?: { name?: string | null; avatar_url?: string | null } | null;
    waitingSinceMs?: number;
    waitedMs?: number;
  }[];
};

/** GET /v1/booking/chat/queue/mine: chat packs bought while the astrologer was busy, in order. */
export async function getChatQueue(signal?: AbortSignal): Promise<Waiting[]> {
  const q = await api<RawQueue>("/v1/booking/chat/queue/mine", { signal });
  const now = Date.now();
  return (Array.isArray(q?.items) ? q.items : [])
    .filter((i) => i?.bookingId)
    .map((i) => ({
      key: `chat-${i.bookingId}`,
      kind: "chat" as const,
      userId: i.userId ?? "",
      bookingId: i.bookingId ?? null,
      name: i.user?.name?.trim() || "",
      photo: i.user?.avatar_url || null,
      since: typeof i.waitingSinceMs === "number" ? i.waitingSinceMs : typeof i.waitedMs === "number" ? now - i.waitedMs : null,
      position: typeof i.position === "number" ? i.position : null,
      subType: null,
    }));
}

type RawWaitlistEntry = { id?: string; name?: string | null; subType?: string | null; waitlistJoinTs?: number };

/** GET /v1/channel/call/:id/waitlist: customers who asked for a call. */
export async function getCallWaitlist(id: string, signal?: AbortSignal): Promise<Waiting[]> {
  const rows = await api<RawWaitlistEntry[]>(`/v1/channel/call/${enc(id)}/waitlist`, { signal });
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r?.id)
    .map((r) => ({
      key: `call-${r.id}`,
      kind: "call" as const,
      userId: r.id!,
      bookingId: null,
      name: r.name?.trim() || "",
      photo: null,
      since: typeof r.waitlistJoinTs === "number" ? r.waitlistJoinTs : null,
      position: null,
      subType: r.subType || null,
    }));
}

/** DELETE /v1/channel/call/:id/waitlist/:userId {reason}: the astrologer removes a customer from their own waitlist. */
export function removeFromCallWaitlist(astrologerId: string, userId: string, reason: string) {
  return api<unknown>(`/v1/channel/call/${enc(astrologerId)}/waitlist/${enc(userId)}`, { method: "DELETE", body: { reason } });
}

/** POST /v1/booking/chat/:id/end: the astrologer takes a waiting chat off their line (the customer is refunded in full). */
export function removeQueuedChat(bookingId: string, reason: string) {
  return api<unknown>(`/v1/booking/chat/${enc(bookingId)}/end`, { method: "POST", body: { reason: "REMOVED_BY_ASTROLOGER", removalReason: reason } });
}

export type RemovalsToday = { used: number; limit: number; left: number | null };

/** GET /v1/channel/call/:id/waitlist/removal-reasons: how many removals are left today. null when the backend does not say. */
export async function getRemovalsToday(id: string, signal?: AbortSignal): Promise<RemovalsToday | null> {
  try {
    const r = await api<{ removalsToday?: { used?: number; limit?: number; left?: number | null } | null }>(`/v1/channel/call/${enc(id)}/waitlist/removal-reasons`, { signal });
    const t = r?.removalsToday;
    if (!t || !Number.isFinite(Number(t.limit))) return null;
    return { used: Number(t.used) || 0, limit: Number(t.limit), left: typeof t.left === "number" ? t.left : null };
  } catch {
    return null;
  }
}

/** The backend answers 429 with this code once the day's removals are used up. */
export const REMOVAL_LIMIT_CODE = "REMOVAL_LIMIT_REACHED";

/** The two reasons the astrologer app offers. Either way the astrologer describes what happened (5 characters at least). */
export type RemovalReason = "behaviour" | "other";
export const REMOVAL_MIN_DESCRIPTION = 5;

/** What is sent: "Inappropriate behaviour: <text>" (English label, for the admin panel) or just the text. */
export function removalReasonText(picked: RemovalReason, description: string): string {
  const d = description.replace(/\s+/g, " ").trim();
  return picked === "other" ? d : `Inappropriate behaviour: ${d}`;
}

// ─── Today ───────────────────────────────────────────────────────────────────────────────────────

export type Today = {
  sessions: number;
  minutes: number;
  /** Rupees earned today; null when the backend hides earnings from astrologers (it sends 0 then). */
  earned: number | null;
  /** Today's earnings minus yesterday's, in rupees. null when either day is missing or earnings are hidden. */
  vsYesterday: number | null;
};

type Bucket = { chat?: number; call?: number };
type RawEarnings = {
  daily?: { createTs?: number; channelTimeSpent?: Bucket; numberOfOrders?: Bucket; earnings?: Bucket }[];
};

const sum = (b?: Bucket) => (Number(b?.chat) || 0) + (Number(b?.call) || 0);

/** GET /v1/astrologer/:id/earnings: the newest daily bucket is today (IST midnight to now). */
export async function getToday(id: string, signal?: AbortSignal): Promise<Today> {
  const e = await api<RawEarnings>(`/v1/astrologer/${enc(id)}/earnings`, { signal });
  const daily = Array.isArray(e?.daily) ? e.daily : [];
  const today = daily.reduce<(typeof daily)[number] | null>((best, d) => (!best || (d.createTs ?? 0) > (best.createTs ?? 0) ? d : best), null);
  const earned = sum(today?.earnings);
  // Yesterday is the bucket about a day before today's, and today's must be recent (an old newest bucket means no sales today yet).
  const DAY = 86_400_000;
  const fresh = today?.createTs !== undefined && Date.now() - today.createTs < DAY;
  const prev = fresh ? daily.find((d) => d.createTs !== undefined && Math.abs(today!.createTs! - d.createTs - DAY) < 4 * 3_600_000) : undefined;
  return {
    vsYesterday: earned > 0 && prev ? Math.round(earned - sum(prev.earnings)) : null,
    sessions: sum(today?.numberOfOrders),
    minutes: Math.round(sum(today?.channelTimeSpent) / 60_000),
    earned: earned > 0 ? Math.round(earned) : null,
  };
}

/** The astrologer's average rating from their public profile, null when there is none yet. */
export async function getRating(id: string, signal?: AbortSignal): Promise<number | null> {
  const a = await api<{ hostProfile?: { rating?: number | null } | null }>(`/v1/astrologer-view/${enc(id)}`, { auth: false, signal });
  const r = Number(a?.hostProfile?.rating);
  return Number.isFinite(r) && r > 0 ? r : null;
}

// ─── Bookings ────────────────────────────────────────────────────────────────────────────────────

export type Booking = {
  id: string;
  kind: WaitingKind;
  userId: string;
  name: string;
  durationMinutes: number | null;
  /** Epoch ms of the start (IST wall time), null when the booking has no time. */
  startsAt: number | null;
  status: string;
};

type RawBooking = {
  id?: string;
  status?: string;
  channel_type?: string;
  user_id?: string;
  booking_date?: string;
  start_time?: string;
  duration_minutes?: number | null;
  user?: { name?: string | null } | null;
};

/** The backend's booking times are IST wall time (BOOKING_TZ). */
function istMs(date?: string, time?: string): number | null {
  if (!date || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}/.test(time)) return null;
  const ms = Date.parse(`${date}T${time.slice(0, 5).padStart(5, "0")}:00+05:30`);
  return Number.isNaN(ms) ? null : ms;
}

/** GET /v1/booking/my-appointments: from today on, nearest first. Includes chats that are running now. */
export async function getBookings(signal?: AbortSignal): Promise<Booking[]> {
  const rows = await api<RawBooking[]>("/v1/booking/my-appointments", { signal });
  return (Array.isArray(rows) ? rows : [])
    .filter((b) => b?.id)
    .map((b) => ({
      id: b.id!,
      kind: b.channel_type === "call" ? ("call" as const) : ("chat" as const),
      userId: b.user_id ?? "",
      name: b.user?.name?.trim() || "",
      durationMinutes: typeof b.duration_minutes === "number" ? b.duration_minutes : null,
      startsAt: istMs(b.booking_date, b.start_time),
      status: b.status ?? "",
    }));
}

/** The soonest confirmed booking that has not started yet. */
export function nextBooking(bookings: Booking[], now: number): Booking | null {
  return (
    bookings
      .filter((b) => b.status === "CONFIRMED" && b.startsAt !== null && b.startsAt >= now)
      .sort((a, b) => (a.startsAt ?? 0) - (b.startsAt ?? 0))[0] ?? null
  );
}

/** Chats that are running right now. */
export const activeChats = (bookings: Booking[]) => bookings.filter((b) => b.kind === "chat" && b.status === "IN_PROGRESS");
