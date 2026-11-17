import { api, ApiError } from "@/lib/api";
import type { Sheet } from "@/lib/jyotish";
import { getOpenPackWith, listSessions, type ChatSession, type OpenPackSummary } from "@/lib/services/chat";

// The astrologer's side of a live chat, on the app's backend: the customer's birth details and kundli sheet
// (open only while a booking with them is live or recent), the kundli request card, the AI puja suggestion and
// remedies sent to the customer. The chat itself (messages, typing, ticks, clock, end) is in chat.ts and
// realtime.ts: the same endpoints the customer side uses.

/** GET /v1/booking/client-kundli/:userId (astrologers only; 403 without a live or recent booking). */
export type ClientBirth = {
  name: string;
  /** Epoch ms, null when the customer has not saved one. */
  dateTimeOfBirth: number | null;
  placeOfBirth: { displayValue?: string } | null;
  gender: string;
};
export function getClientBirth(userId: string, signal?: AbortSignal) {
  return api<ClientBirth>(`/v1/booking/client-kundli/${encodeURIComponent(userId)}`, { signal });
}

type Bi = { en: string; hi: string };
export type UpayFlag =
  | { code: "weak"; ratio: number }
  | { code: "debilitated" }
  | { code: "combust" }
  | { code: "dusthana"; house: number }
  | { code: "conjunct" | "aspected"; grahas: string[] };
export type UpayItem = {
  catalogue: string;
  id: string;
  name_hi: string;
  name_en: string | null;
  lines: [string, string][];
  cautions_hi?: string[];
  acharya_only?: boolean;
};
export type Upay = {
  time_known: boolean;
  doshas: { id: string; name_hi: string; name_en: string; conditions_met: string[]; conditions_met_hi: string[] }[];
  grahas: {
    graha: string;
    house: number | null;
    functional: string | null;
    dignity: string;
    shadbala_ratio: number | null;
    retro: boolean;
    flags: UpayFlag[];
    mantra: { text: string; text_hi: string | null; daily: string; special: string };
    daan: { item: string; day: string };
    vrat: { day: string; deity: string };
    lal_kitab: { khana: number; reading: Bi; upay: Bi[]; avoid: Bi[] } | null;
  }[];
  gemstones:
    | { available: false; reason: string }
    | {
        available: true;
        suitable: { graha: string; gem: string; upratna: string | null; functional: string; rules: number[]; flags: UpayFlag[] }[];
        not_advised: { graha: string; gem: string; upratna: string | null; reason: string }[];
      };
  remedies: { real_world_help_hi: string[]; withheld: { id: string; name_hi: string; name_en: string }[] };
};

/** The kundli sheet of the customer. GET /v1/jyotish/sheet/:userId: 404 birth_details_missing, 403 no booking. The astrologer also gets `upay`. */
export type ClientSheet = Sheet & { upay?: Upay };
export function fetchClientSheet(userId: string, signal?: AbortSignal) {
  return api<ClientSheet>(`/v1/jyotish/sheet/${encodeURIComponent(userId)}`, { signal });
}

/** Posts the "please add your birth details" card into the chat. POST /v1/chat/:id/kundli {kind: 'request'} */
export function requestClientKundli(chatId: string) {
  return api<unknown>(`/v1/chat/${encodeURIComponent(chatId)}/kundli`, { method: "POST", body: { kind: "request" } });
}

export type PujaSuggestion = {
  summary: string;
  problem_type: string;
  pujas: { name: string; price: number | null; priority: string; for_doshas: string[]; reason: string }[];
  no_puja_reason: string;
  gemstone: { decision: string; stones: { graha: string; gem: string; upratna: string | null; for: string; against: string }[]; reason: string };
  simple_alternatives: string[];
  practical_help: string[];
  missing_information: string[];
  final_status: string;
  acharya_review_required: boolean;
};
/** AI puja and gemstone suggestion for the customer's kundli. Nothing is posted to the chat. POST /v1/chat/:id/puja-suggest */
export function suggestPuja(chatId: string, problem: string, lang: "hi" | "en") {
  return api<PujaSuggestion>(`/v1/chat/${encodeURIComponent(chatId)}/puja-suggest`, { method: "POST", body: { problem, lang } });
}

/** Sends a written remedy to the customer (only to someone who consulted you). POST /v1/astrologer/:id/remedies */
export function sendTextRemedy(astrologerId: string, userId: string, note: string) {
  return api<unknown>(`/v1/astrologer/${encodeURIComponent(astrologerId)}/remedies`, { method: "POST", body: { userId, kind: "text", note } });
}

export type SentRemedy = { id?: string; userId: string; userName?: string; kind: string; itemName?: string; note?: string; createdAt?: string | number };
export async function listSentRemedies(astrologerId: string, signal?: AbortSignal): Promise<SentRemedy[]> {
  const r = await api<{ remedies?: SentRemedy[] }>(`/v1/astrologer/${encodeURIComponent(astrologerId)}/remedies`, { signal });
  return Array.isArray(r?.remedies) ? r.remedies : [];
}

// ─── Which chats the astrologer has ──────────────────────────────────────────────────────────────

export type ChatChoice = {
  chatId: string;
  clientId: string;
  name: string;
  ppUrl?: string;
  pack: OpenPackSummary | null;
  /** Waiting in my line (a paid pack the customer bought while I was busy). */
  waiting: boolean;
  /** The customer wrote after I last read. */
  unread: boolean;
  lastActive: number;
};

/** The customer in a conversation: the participant that is not me. */
export const clientOf = (s: ChatSession, selfId: string) => s.users.find((u) => u.id && u.id !== selfId) ?? null;

/** My conversations with the state of each one's open chat pack, running ones first. Reads at most `limit` of the latest. */
export async function listMyChats(selfId: string, signal?: AbortSignal, limit = 20): Promise<ChatChoice[]> {
  const [sessions, queue] = await Promise.all([
    listSessions(selfId, signal),
    api<{ items?: { userId?: string }[] }>("/v1/booking/chat/queue/mine", { signal }).catch((error) => {
      if (signal?.aborted) throw error;
      return null;
    }),
  ]);
  const waitingUsers = new Set((queue?.items ?? []).map((i) => i.userId).filter(Boolean));
  const rows = sessions
    .map((s) => ({ s, client: clientOf(s, selfId) }))
    .filter((r): r is { s: ChatSession; client: NonNullable<ReturnType<typeof clientOf>> } => !!r.client)
    .map((r) => ({ ...r, lastActive: Math.max(r.client.lastReceived || 0, r.s.users.find((u) => u.id === selfId)?.lastRead || 0) }))
    .sort((a, b) => b.lastActive - a.lastActive)
    .slice(0, limit);
  const choices = await Promise.all(
    rows.map(async ({ s, client, lastActive }): Promise<ChatChoice> => {
      let pack: OpenPackSummary | null = null;
      try {
        const p = await getOpenPackWith(client.id, signal);
        if (p) pack = { bookingId: p.bookingId, status: String(p.status ?? ""), timerStarted: !!p.timerStarted };
      } catch (error) {
        if (signal?.aborted) throw error;
      }
      return {
        chatId: s.id,
        clientId: client.id,
        name: client.name || "",
        ppUrl: client.ppUrl,
        pack,
        waiting: waitingUsers.has(client.id) || pack?.status === "WAITING",
        unread: (client.lastReceived || 0) > (s.users.find((u) => u.id === selfId)?.lastRead || 0),
        lastActive,
      };
    }),
  );
  const rank = (c: ChatChoice) => (c.pack?.status === "IN_PROGRESS" ? 0 : c.waiting ? 1 : c.pack ? 2 : 3);
  return choices.sort((a, b) => rank(a) - rank(b) || b.lastActive - a.lastActive);
}

export const isForbidden = (error: unknown) => error instanceof ApiError && error.status === 403;
export const isMissing = (error: unknown) => error instanceof ApiError && error.status === 404;
