import { api } from "@/lib/api";

// Remedies an astrologer suggests to a past client (the astrologer app's AstroRemediesScreen and SuggestRemedyScreen).

export type RemedyKind = "product" | "puja" | "text";

export type SentRemedy = {
  id: string;
  userId: string;
  userName: string;
  kind: RemedyKind;
  itemName: string;
  note: string;
  createdAt: string;
  seenAt: string | null;
};

export type Client = { id: string; name: string; sessions: number };
export type Item = { id: string; name: string; price: number | null };

export const NOTE_MAX = 1000;

const arr = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** GET /v1/astrologer/:id/remedies: newest first, up to 100. */
export async function getSentRemedies(id: string, signal?: AbortSignal): Promise<SentRemedy[]> {
  const res = await api<{ remedies?: unknown }>(`/v1/astrologer/${encodeURIComponent(id)}/remedies`, { signal });
  return arr(res?.remedies).map((r) => ({
    id: str(r.id),
    userId: str(r.userId),
    userName: str(r.userName),
    kind: (["product", "puja", "text"].includes(str(r.kind)) ? r.kind : "text") as RemedyKind,
    itemName: str(r.itemName),
    note: str(r.note),
    createdAt: str(r.createdAt),
    seenAt: str(r.seenAt) || null,
  }));
}

/** The astrologer's clients (top spenders and loyal ones, without repeats): the only people a remedy can go to. */
export async function getClients(id: string, signal?: AbortSignal): Promise<Client[]> {
  const get = (segment: string) => api<{ clients?: unknown }>(`/v1/astrologer/${encodeURIComponent(id)}/clients?segment=${segment}`, { signal });
  const [a, b] = await Promise.all([get("top"), get("loyal")]);
  const seen = new Set<string>();
  return [...arr(a?.clients), ...arr(b?.clients)]
    .map((c) => ({ id: str(c.id), name: str(c.name) || "User", sessions: Number(c.sessions) || 0 }))
    .filter((c) => c.id && !seen.has(c.id) && !!seen.add(c.id));
}

/** GET /v1/products?search=: store products ({data: [...]}). */
export async function searchProducts(search: string, signal?: AbortSignal): Promise<Item[]> {
  const q = search.trim();
  const res = await api<{ data?: unknown }>(`/v1/products${q ? `?search=${encodeURIComponent(q)}` : ""}`, { signal });
  return arr(res?.data)
    .filter((p) => p.id && p.is_active !== false)
    .map((p) => ({ id: String(p.id), name: str(p.name) || str(p.title), price: Number(p.price) || null }))
    .filter((p) => p.name)
    .slice(0, 40);
}

/** GET /v1/pujas: active pujas, filtered by name here (the endpoint has no search). */
export async function getPujas(signal?: AbortSignal): Promise<Item[]> {
  const res = await api<unknown>(`/v1/pujas`, { signal });
  const rows = Array.isArray(res) ? res : (res as { data?: unknown })?.data;
  return arr(rows)
    .map((p) => ({ id: String(p.id ?? ""), name: str(p.title) || str(p.name), price: Number(p.price) || null }))
    .filter((p) => p.id && p.name);
}

/** POST /v1/astrologer/:id/remedies. A product or puja needs an itemId, advice needs a note; the client must have consulted you (else 403). */
export function suggestRemedy(id: string, body: { userId: string; kind: RemedyKind; itemId?: string | null; note?: string }) {
  return api<unknown>(`/v1/astrologer/${encodeURIComponent(id)}/remedies`, { method: "POST", body });
}
