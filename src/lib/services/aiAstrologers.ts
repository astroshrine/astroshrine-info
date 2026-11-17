import { api, ApiError } from "@/lib/api";

// AI astrologers (the app's AiAstrologersScreen and AI chat): a list of AI personas from /v1/ai-personas, and the
// chat itself on /v1/ai-astrology. Always labelled AI. Each question is charged from the wallet by the server.
// The app streams answers over a WebSocket; the website uses the plain POST /chat, which answers the same text in one go.

export type Persona = {
  id: string;
  slug: string;
  name_en: string;
  name_hi: string;
  topic_en: string;
  topic_hi: string;
  icon: string;
  photo_url: string | null;
  sort_order: number;
  /** What this persona needs from you: "birth" (birth chart), "name", "face_report" (a face reading from the app). */
  needs: string[];
};

export type AiLang = "en" | "hi" | "hinglish";

export async function listPersonas(signal?: AbortSignal): Promise<Persona[]> {
  const r = await api<{ personas?: Persona[] }>("/v1/ai-personas", { signal });
  return (Array.isArray(r?.personas) ? r.personas : []).filter((p) => p?.id).sort((a, b) => a.sort_order - b.sort_order);
}

export type ChatReply =
  | { kind: "answer"; sessionId: string; messageId: string; content: string; blocked: boolean }
  /** The question belongs to another AI astrologer: nothing was answered or charged. */
  | { kind: "redirect"; persona: Persona };

type RawReply = { sessionId?: string; messageId?: string; content?: string; wasBlocked?: boolean; redirect?: Persona };

export async function sendAiMessage(p: {
  personaId: string;
  message: string;
  sessionId?: string;
  lang: AiLang;
  /** Ask this persona anyway after a redirect offer. */
  noRedirect?: boolean;
  signal?: AbortSignal;
}): Promise<ChatReply> {
  const r = await api<RawReply>("/v1/ai-astrology/chat", {
    method: "POST",
    body: { sessionId: p.sessionId, message: p.message, lang: p.lang, personaId: p.personaId, ...(p.noRedirect && { noRedirect: true }) },
    signal: p.signal,
  });
  if (r?.redirect) return { kind: "redirect", persona: r.redirect };
  if (!r?.content) throw new ApiError(502, "The AI astrologer sent no answer");
  return { kind: "answer", sessionId: r.sessionId ?? p.sessionId ?? "", messageId: r.messageId ?? "", content: r.content, blocked: r.wasBlocked === true };
}

export type AiSession = { id: string; title: string; personaId: string | null; lastMessageAt: number; totalMessages: number };

type RawSession = { id?: string; title?: string; personaId?: string | null; lastMessageAt?: string; createdAt?: string; totalMessages?: number; status?: string };

export async function listAiSessions(signal?: AbortSignal): Promise<AiSession[]> {
  const r = await api<{ sessions?: RawSession[] }>("/v1/ai-astrology/sessions?limit=50", { signal });
  return (Array.isArray(r?.sessions) ? r.sessions : [])
    .filter((s) => s?.id && s.status !== "deleted")
    .map((s) => ({
      id: s.id!,
      title: s.title?.trim() || "",
      personaId: s.personaId ?? null,
      lastMessageAt: Date.parse(s.lastMessageAt ?? s.createdAt ?? "") || 0,
      totalMessages: Number(s.totalMessages) || 0,
    }))
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}

export type AiMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: number; feedback?: "positive" | "negative" };

type RawMessage = { id?: string; role?: string; content?: string; createdAt?: string; feedback?: "positive" | "negative" };

/** A session's messages, oldest first. */
export async function listAiMessages(sessionId: string, signal?: AbortSignal): Promise<{ messages: AiMessage[]; personaId: string | null }> {
  const r = await api<{ messages?: RawMessage[]; personaId?: string | null }>(`/v1/ai-astrology/session/${encodeURIComponent(sessionId)}/messages?limit=100`, { signal });
  const messages = (Array.isArray(r?.messages) ? r.messages : [])
    .filter((m) => m?.id && (m.role === "user" || m.role === "assistant") && m.content)
    .map((m) => ({ id: m.id!, role: m.role as "user" | "assistant", content: m.content!, createdAt: Date.parse(m.createdAt ?? "") || 0, feedback: m.feedback }))
    .sort((a, b) => a.createdAt - b.createdAt);
  return { messages, personaId: r?.personaId ?? null };
}

export function sendAiFeedback(messageId: string, feedback: "positive" | "negative") {
  return api<unknown>("/v1/ai-astrology/feedback", { method: "POST", body: { messageId, feedback } });
}

export function deleteAiSession(sessionId: string) {
  return api<unknown>(`/v1/ai-astrology/session/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}

/** Whether a birth chart is saved for the AI (some personas need it). */
export async function hasBirthChart(signal?: AbortSignal): Promise<boolean> {
  try {
    await api<unknown>("/v1/ai-astrology/chart", { signal });
    return true;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return false;
    throw e;
  }
}

export function saveBirthChart(p: { birthDate: string; birthTime: string; birthPlace: string; latitude: number; longitude: number; timezone: string }) {
  return api<unknown>("/v1/ai-astrology/chart", { method: "POST", body: p });
}

/** The server's reason for a failed question, if it is one the person can act on. */
export function chatErrorKind(e: unknown): "balance" | "rate" | "long" | "other" {
  if (e instanceof ApiError) {
    if (e.status === 402) return "balance";
    if (e.status === 429) return "rate";
    if (e.status === 413 || e.status === 400) return "long";
  }
  return "other";
}

export const MAX_QUESTION = 2000;
