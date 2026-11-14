import { api, ApiError } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

// Chat with an astrologer, on the app's backend and with the app's rules (ChatApp / ChatManager /
// AstroProfileButtonLayout). Every call here needs a login. A chat is a time pack: one block of
// `blockMinutes` bought at the astrologer's per-minute chat price. Billing starts with the astrologer's
// first reply, an unused or unanswered pack is refunded by the server, and more time is bought in blocks.

// ─── Consult config and pricing ──────────────────────────────────────────────────────────────────

export type ConsultConfig = {
  /** The admin switch "free consultations": no prices, nothing charged. */
  free: boolean;
  /** The new user's one free chat, decided by the server. */
  freeChat: { available: boolean; minutes: number };
};

const NO_CONFIG: ConsultConfig = { free: false, freeChat: { available: false, minutes: 5 } };

/** Any error reads as "not free", so prices show as usual (the app's rule). */
export async function getConsultConfig(signal?: AbortSignal): Promise<ConsultConfig> {
  try {
    const r = await api<{ free?: boolean; freeChat?: { available?: boolean; minutes?: number } }>("/v1/booking/consult-config", { signal });
    return {
      free: r?.free === true,
      freeChat: { available: r?.freeChat?.available === true, minutes: Number(r?.freeChat?.minutes) || 5 },
    };
  } catch {
    return NO_CONFIG;
  }
}

export type ChatPricing = {
  free: boolean;
  freeChatAvailable: boolean;
  blockMinutes: number;
  /** What one block costs, in wallet points (1 point = ₹1). */
  blockPoints: number;
  ratePerMin: number;
};

/** The price to confirm before buying: GET /v1/booking/chat-pricing/:astrologerId. */
export async function getChatPricing(astrologerId: string): Promise<ChatPricing> {
  const p = await api<{
    free?: boolean;
    freeChat?: { available?: boolean };
    blockMinutes?: number;
    blockPoints?: number;
    sessionRate?: number;
    chatRatePerMin?: number;
  }>(`/v1/booking/chat-pricing/${encodeURIComponent(astrologerId)}`);
  const blockMinutes = Number(p?.blockMinutes) || 5;
  const ratePerMin = Number(p?.chatRatePerMin ?? 15);
  return {
    free: p?.free === true,
    freeChatAvailable: p?.freeChat?.available === true,
    blockMinutes,
    blockPoints: Math.ceil(Number(p?.blockPoints ?? p?.sessionRate ?? ratePerMin * blockMinutes) || 0),
    ratePerMin,
  };
}

/** Before buying: while the astrologer is in someone else's chat, until when (epoch ms) nobody else can book them. */
export async function getChatPrecheck(astrologerId: string): Promise<{ busyUntil: number | null }> {
  const r = await api<{ busyUntil?: number | null }>(`/v1/booking/chat/precheck/${encodeURIComponent(astrologerId)}`);
  const until = Number(r?.busyUntil);
  return { busyUntil: Number.isFinite(until) && until > Date.now() ? until : null };
}

/** Removed from this astrologer's waitlist a short while ago: until when they cannot book again, else null. */
export async function getRemovalCooldown(astrologerId: string): Promise<number | null> {
  try {
    const r = await api<{ until?: number }>(`/v1/booking/removal-cooldown/${encodeURIComponent(astrologerId)}`);
    const until = Number(r?.until);
    return Number.isFinite(until) && until > Date.now() ? until : null;
  } catch {
    return null;
  }
}

// ─── Packs ───────────────────────────────────────────────────────────────────────────────────────

export type PackStatus = "WAITING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED" | string;

export type PackState = {
  bookingId: string;
  status?: PackStatus;
  timeBased?: boolean;
  secondsAllowed?: number;
  /** The clock starts with the astrologer's first reply. */
  timerStarted?: boolean;
  startedAt?: number | null;
  expiresAt?: number | null;
  secondsRemaining?: number;
  expired?: boolean;
  blockMinutes?: number;
  blockPoints?: number;
  ratePerMin?: number;
  /** Bought while consultations were free: extends for nothing. */
  free?: boolean;
  /** The new user's free chat, still in its free minutes. */
  freeChat?: boolean;
  /** The astrologer left the chat: the clock stands still at secondsRemaining. */
  paused?: boolean;
  questionsAllowed?: number;
  questionsRemaining?: number;
  /** In line behind a busy astrologer (WAITING). */
  queuePosition?: number | null;
  queueLength?: number;
  queueWaitMs?: number | null;
  queueWaitAt?: number;
  endReason?: string;
};

const TIMING_KEYS = [
  "status",
  "timeBased",
  "secondsAllowed",
  "timerStarted",
  "startedAt",
  "expiresAt",
  "secondsRemaining",
  "expired",
  "blockMinutes",
  "blockPoints",
  "ratePerMin",
  "free",
  "freeChat",
  "paused",
  "questionsAllowed",
  "questionsRemaining",
  "endReason",
] as const;

/** Copies the known pack fields from a server answer (status read, start, extend or a ChatClockChanged event). */
export function packFields(src: Record<string, unknown> | null | undefined): Partial<PackState> {
  const out: Record<string, unknown> = {};
  if (!src) return out;
  for (const k of TIMING_KEYS) if (src[k] !== undefined) out[k] = src[k];
  return out as Partial<PackState>;
}

export const OPEN_PACK_STATUSES = ["WAITING", "CONFIRMED", "IN_PROGRESS"];
export const isPackOpen = (status?: string) => !!status && OPEN_PACK_STATUSES.includes(status);

/** Over: completed, cancelled (refunded) or expired. Its clock must not run any more. */
export function packEnded(p?: PackState | null): boolean {
  const s = String(p?.status || "").toUpperCase();
  return s === "COMPLETED" || s.startsWith("CANCELLED") || s === "EXPIRED";
}

/** Live seconds left on a time pack (full block before the clock starts, 0 once over). `now` is on the server's clock. */
export function secondsLeft(p: PackState | null | undefined, now: number): number {
  if (!p?.timeBased || packEnded(p)) return 0;
  if (p.paused) return Math.max(p.secondsRemaining || 0, 0);
  if (!p.timerStarted || !p.expiresAt) return p.secondsAllowed || 0;
  return Math.max(Math.ceil((p.expiresAt - now) / 1000), 0);
}

export function formatClock(sec: number): string {
  const s = Math.max(Math.floor(sec), 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export type StartChatResult = { pack: PackState; waiting: boolean; reused: boolean; freeChat: boolean };

type StartAnswer = Record<string, unknown> & {
  booking?: { id?: string };
  waiting?: boolean;
  reused?: boolean;
  freeChat?: boolean;
  queue?: { position?: number | null; length?: number; estimatedWaitMs?: number | null } | null;
};

/**
 * Buys one block (or reopens an open pack with this astrologer, free of charge): POST /v1/booking/chat/start.
 * Refusals keep the server's code: CHAT_OFF, ASTROLOGER_OFFLINE, ASTROLOGER_LIVE, ASTROLOGER_IN_CHAT,
 * FREE_CHAT_IN_USE (409), REMOVED_COOLDOWN (403) and low balance (402). Nothing is charged on a refusal.
 */
export async function startChat(astrologerId: string): Promise<StartChatResult> {
  const r = await api<StartAnswer>("/v1/booking/chat/start", { method: "POST", body: { astrologerId } });
  const bookingId = r?.booking?.id;
  if (!bookingId) throw new ApiError(500, "चैट शुरू नहीं हो सकी");
  return {
    pack: {
      bookingId,
      ...packFields(r),
      queuePosition: r.queue?.position ?? null,
      queueLength: r.queue?.length,
      queueWaitMs: r.queue?.estimatedWaitMs ?? null,
      queueWaitAt: Date.now(),
    },
    waiting: r.waiting === true,
    reused: r.reused === true,
    freeChat: r.freeChat === true,
  };
}

/** GET /v1/booking/chat-status/:bookingId (a read after the clock ran out also closes the pack on the server). */
export async function getPackStatus(bookingId: string, signal?: AbortSignal): Promise<PackState> {
  const r = await api<Record<string, unknown>>(`/v1/booking/chat-status/${encodeURIComponent(bookingId)}`, { signal });
  return { bookingId, ...packFields(r) };
}

/** The open pack with this astrologer, or null when there is none (404). */
export async function getOpenPackWith(astrologerId: string, signal?: AbortSignal): Promise<PackState | null> {
  try {
    const r = await api<Record<string, unknown> & { bookingId?: string }>(
      `/v1/booking/chat-pack/with-user/${encodeURIComponent(astrologerId)}`,
      { signal },
    );
    return r?.bookingId ? { bookingId: r.bookingId, ...packFields(r) } : null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export type QueueSpot = { position: number | null; length: number; estimatedWaitMs: number | null };

export async function getQueueSpot(bookingId: string, signal?: AbortSignal): Promise<QueueSpot> {
  const r = await api<{ position?: number | null; length?: number; estimatedWaitMs?: number | null }>(
    `/v1/booking/chat/queue/${encodeURIComponent(bookingId)}`,
    { signal },
  );
  return { position: r?.position ?? null, length: Number(r?.length) || 0, estimatedWaitMs: r?.estimatedWaitMs ?? null };
}

/** Leave the line while the pack is still Waiting: full refund. */
export function leaveQueue(bookingId: string) {
  return api<{ refundAmount?: number }>(`/v1/booking/chat/queue/${encodeURIComponent(bookingId)}/leave`, { method: "POST" });
}

export type ExtendAnswer = Partial<PackState> & { pending?: boolean; minutes?: number; requestExpiresAt?: number };

/**
 * Buy another block. `afterTimeOver`: the clock already ran out, so the server asks the astrologer first and
 * charges only if they accept (answer { pending: true, expiresAt }). Codes: InsufficientBalance (402),
 * FreeExtendUsed, ChatNotActive, ExtendWindowOver (409).
 */
export async function extendChat(bookingId: string, afterTimeOver: boolean): Promise<ExtendAnswer> {
  const r = await api<Record<string, unknown> & { pending?: boolean; minutes?: number; expiresAt?: number }>(
    `/v1/booking/chat/${encodeURIComponent(bookingId)}/extend`,
    { method: "POST", body: afterTimeOver ? { mode: "request" } : {} },
  );
  if (r?.pending) return { pending: true, minutes: Number(r.minutes) || 5, requestExpiresAt: Number(r.expiresAt) || Date.now() + 120_000 };
  return packFields(r);
}

/** End the chat: the unused part of the block comes back to the wallet. 409 = already over. */
export function endChat(bookingId: string) {
  return api<{ refundAmount?: number }>(`/v1/booking/chat/${encodeURIComponent(bookingId)}/end`, { method: "POST", body: {} });
}

export type QueueSummary = { length: number; estimatedWaitMs: number | null; watching: boolean };

/**
 * How many are waiting for this astrologer and the rough wait. (`watching` is the app's "notify me when free",
 * a phone push notification, which the website does not offer.)
 */
export async function getQueueSummary(astrologerId: string, signal?: AbortSignal): Promise<QueueSummary> {
  const r = await api<{ length?: number; estimatedWaitMs?: number | null; watching?: boolean }>(
    `/v1/booking/chat/queue/astrologer/${encodeURIComponent(astrologerId)}`,
    { signal },
  );
  return { length: Number(r?.length) || 0, estimatedWaitMs: r?.estimatedWaitMs ?? null, watching: r?.watching === true };
}

type RawBooking = {
  id: string;
  astrologer_id?: string;
  user_id?: string;
  channel_type?: string;
  status?: string;
  chat_seconds_allowed?: number | null;
  chat_started_at?: string | null;
  chat_expires_at?: string | null;
};

export type OpenPackSummary = { bookingId: string; status: string; timerStarted: boolean };

/**
 * Open chat packs by astrologer, for the chat list. GET /v1/booking/chat/active on newer servers,
 * my-bookings otherwise (the app's fallback). A running pack wins over a waiting one.
 */
export async function getOpenPacksByAstrologer(signal?: AbortSignal): Promise<Map<string, OpenPackSummary>> {
  let rows: RawBooking[] = [];
  try {
    rows = await api<RawBooking[]>("/v1/booking/chat/active", { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    const mine = await api<RawBooking[] | { data?: RawBooking[] }>("/v1/booking/my-bookings", { signal });
    rows = Array.isArray(mine) ? mine : mine?.data ?? [];
  }
  const byAstro = new Map<string, OpenPackSummary>();
  for (const b of Array.isArray(rows) ? rows : []) {
    if (b?.channel_type !== "chat" || !isPackOpen(b.status) || !b.astrologer_id) continue;
    const had = byAstro.get(b.astrologer_id);
    if (had && !(had.status !== "IN_PROGRESS" && b.status === "IN_PROGRESS")) continue;
    byAstro.set(b.astrologer_id, { bookingId: b.id, status: String(b.status), timerStarted: !!b.chat_started_at });
  }
  return byAstro;
}

// ─── Errors, with the app's rules ────────────────────────────────────────────────────────────────

export const codeOf = (error: unknown) => (error instanceof ApiError ? error.code : undefined);
export const statusOfError = (error: unknown) => (error instanceof ApiError ? error.status : undefined);

/**
 * The wallet could not pay: 402 InsufficientBalance, or an older server's "Insufficient balance. Need X pts,
 * have Y pts" / "Unable to deduct X points. Current balance: Y pts". Other 402s (time over...) are not this.
 */
export function lowBalanceInfo(error: unknown): { need?: number; balance?: number } | null {
  if (!(error instanceof ApiError)) return null;
  const msg = error.message;
  const looksLow = /insufficient (points |wallet )?balance|not enough points|unable to deduct/i.test(msg);
  if (error.code !== "InsufficientBalance" && !(error.status === 402 && looksLow)) return null;
  const num = (s?: string) => (s != null && Number.isFinite(Number(s)) ? Number(s) : undefined);
  return {
    need: num(/need\s+(\d+)/i.exec(msg)?.[1]) ?? num(/deduct\s+(\d+)/i.exec(msg)?.[1]),
    balance: num(/(?:have|balance:)\s*(\d+)/i.exec(msg)?.[1]),
  };
}

export const isRemovedCooldown = (error: unknown) => statusOfError(error) === 403 && codeOf(error) === "REMOVED_COOLDOWN";

/** The wallet's recharge panel, with the pack covering the shortfall preselected (1 point = ₹1). */
export const rechargeHref = (shortfall?: number) =>
  shortfall && shortfall > 0 ? `/wallet?amount=${Math.ceil(shortfall)}#recharge` : "/wallet#recharge";

// ─── Conversations and messages ──────────────────────────────────────────────────────────────────

export type SessionUser = { id: string; role?: string; lastRead?: number; lastReceived?: number; name?: string; ppUrl?: string };
export type ChatSession = { id: string; status?: string; userList?: string; users: SessionUser[] };

/** Human 1:1 chats only: assistant, support and AI conversations carry prefixed ids. */
export const isPeerChat = (s: ChatSession) => !/chatAssistant|case_|ai_/.test(s.userList || "");

/** The conversation between me and this astrologer (made by the server when the first chat was bought), or null. */
export async function findSession(selfId: string, peerId: string, signal?: AbortSignal): Promise<ChatSession | null> {
  const ids = [selfId, peerId].map(encodeURIComponent).join(",");
  const rows = await api<ChatSession[]>(`/v1/chat?users=${ids}&names=0`, { signal });
  return (Array.isArray(rows) ? rows : []).find((s) => s?.id) ?? null;
}

/** All my conversations with astrologers, with the participants' display names. */
export async function listSessions(selfId: string, signal?: AbortSignal): Promise<ChatSession[]> {
  const rows = await api<ChatSession[]>(`/v1/chat?users=${encodeURIComponent(selfId)}`, { signal });
  return (Array.isArray(rows) ? rows : []).filter((s) => s?.id && isPeerChat(s));
}

/** The peer wrote after I last read (compared on their lastReceived, as the app does). */
export function isUnread(s: ChatSession, selfId: string): boolean {
  const me = s.users.find((u) => u.id === selfId);
  const other = s.users.find((u) => u.id && u.id !== selfId);
  return !!other && (other.lastReceived || 0) > (me?.lastRead || 0);
}

export type MessageType = "text" | "image" | "video" | "audio" | "recording";

export type ChatMessage = {
  /** Stable key: the server's messageId, else sender and send time. */
  key: string;
  messageId?: string;
  sentBy: string;
  sentTs: number;
  type: MessageType | string;
  message: string;
  /** sent / delivered / seen, for my own messages. */
  status?: string;
  repliedTo?: { message?: string; type?: string; userId?: string } | null;
  /** Only on this device: still sending, or failed (with what to retry). */
  local?: "sending" | "failed";
  retry?: { text?: string; file?: File };
  error?: string;
};

type RawMessage = {
  messageId?: string;
  sentBy?: string;
  sentTs?: number | string;
  ts?: number;
  type?: string;
  message?: string;
  status?: string;
  hidden?: boolean;
  repliedTo?: { message?: string; type?: string; userId?: string } | null;
};

export function toMessage(m: RawMessage): ChatMessage | null {
  const sentTs = Number(m?.sentTs ?? m?.ts);
  if (!m?.sentBy || !Number.isFinite(sentTs) || m.hidden) return null;
  return {
    key: m.messageId || `${m.sentBy}#${sentTs}`,
    messageId: m.messageId,
    sentBy: m.sentBy,
    sentTs,
    type: m.type || "text",
    message: String(m.message ?? ""),
    status: m.status,
    repliedTo: m.repliedTo ?? null,
  };
}

const toMessages = (rows: unknown): ChatMessage[] =>
  (Array.isArray(rows) ? (rows as RawMessage[]) : []).map(toMessage).filter((m): m is ChatMessage => !!m);

/** Oldest first, one entry per message; a server copy replaces my local "sending" one. */
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byKey = new Map<string, ChatMessage>();
  for (const m of current) byKey.set(m.key, m);
  for (const m of incoming) {
    // The server copy of a message I sent: drop the local one (same sender and send time).
    const localKey = `${m.sentBy}#${m.sentTs}`;
    const local = byKey.get(localKey);
    if (local?.local && m.messageId) byKey.delete(localKey);
    const had = byKey.get(m.key);
    byKey.set(m.key, had ? { ...had, ...m, status: m.status ?? had.status } : m);
  }
  return [...byKey.values()].sort((a, b) => a.sentTs - b.sentTs);
}

/** The latest 50 messages, oldest first. */
export async function listLatestMessages(chatId: string, signal?: AbortSignal): Promise<ChatMessage[]> {
  const rows = await api<unknown>(`/v1/chat/${encodeURIComponent(chatId)}/messages`, { signal });
  return toMessages(rows).sort((a, b) => a.sentTs - b.sentTs);
}

/** Up to 50 messages sent before `beforeTs`, oldest first. */
export async function listMessagesBefore(chatId: string, beforeTs: number, signal?: AbortSignal): Promise<ChatMessage[]> {
  const rows = await api<unknown>(`/v1/chat/${encodeURIComponent(chatId)}/messages?key=${Math.floor(beforeTs)}`, { signal });
  return toMessages(rows).sort((a, b) => a.sentTs - b.sentTs);
}

/** Everything sent after `sinceTs` (a 13-digit epoch ms), oldest first: catching up after a dropped connection. */
export async function listMessagesSince(chatId: string, sinceTs: number, signal?: AbortSignal): Promise<ChatMessage[]> {
  if (!(sinceTs >= 1e12 && sinceTs < 1e13)) return listLatestMessages(chatId, signal);
  const rows = await api<unknown>(`/v1/chat/${encodeURIComponent(chatId)}/messages?timestamp=${Math.floor(sinceTs)}`, { signal });
  return toMessages(rows);
}

/** Longest text message the server takes. */
export const MAX_TEXT = 1024;
/** The backend refuses uploads above 8 MB. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const lastReceivedOf = (ts: number) => (ts >= 1e12 && ts < 1e13 ? Math.floor(ts) : 0);

/**
 * Send a text message. Answers with every message after `lastReceived` (mine included), oldest first.
 * Refusals: 402 NoActiveChatPack / ChatTimeOver, 403 ContactSharingNotAllowed (phone numbers and the like).
 */
export async function sendText(chatId: string, selfId: string, text: string, sentTs: number, lastReceived: number): Promise<ChatMessage[]> {
  const rows = await api<unknown>(`/v1/chat/${encodeURIComponent(chatId)}/messages`, {
    method: "POST",
    body: { message: text, messageType: "text", sentTs, sentBy: selfId, lastReceived: lastReceivedOf(lastReceived) },
  });
  return toMessages(rows);
}

/** Multipart upload through the proxy, with the same token handling as api(). */
async function postForm<T>(path: string, form: FormData): Promise<T> {
  const supabase = getSupabase();
  const send = (token: string | null) =>
    fetch(`/api${path}`, {
      method: "POST",
      headers: { Accept: "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      body: form,
      cache: "no-store",
    });
  let token = (await supabase.auth.getSession()).data.session?.access_token ?? null;
  let res = await send(token);
  if (res.status === 401 && token) {
    token = (await supabase.auth.refreshSession()).data.session?.access_token ?? null;
    if (token) res = await send(token);
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const body = (data && typeof data === "object" ? data : {}) as { error?: unknown; message?: unknown; code?: unknown };
    throw new ApiError(res.status, String(body.error || body.message || `Request failed (${res.status})`), typeof body.code === "string" ? body.code : undefined);
  }
  return data as T;
}

/** Send a photo (jpg, png, webp; up to 8 MB). Same answer and refusals as sendText. */
export async function sendImage(chatId: string, selfId: string, file: File, sentTs: number, lastReceived: number): Promise<ChatMessage[]> {
  const form = new FormData();
  form.append("messageType", "image");
  form.append("sentTs", String(sentTs));
  form.append("sentBy", selfId);
  form.append("lastReceived", String(lastReceivedOf(lastReceived)));
  form.append("message", file, file.name || "photo.jpg");
  return toMessages(await postForm<unknown>(`/v1/chat/${encodeURIComponent(chatId)}/messages`, form));
}

/** Best effort: the peer's ticks turn blue. */
export async function markSeen(chatId: string, messageIds: string[]) {
  if (!messageIds.length) return;
  try {
    await api(`/v1/chat/${encodeURIComponent(chatId)}/seen`, { method: "POST", body: { messageIds } });
  } catch {
    /* non-fatal */
  }
}

/** Best effort: "typing…" on the other side. */
export async function sendTyping(chatId: string, typing: boolean) {
  try {
    await api(`/v1/chat/${encodeURIComponent(chatId)}/typing`, { method: "POST", body: { typing } });
  } catch {
    /* non-fatal */
  }
}
