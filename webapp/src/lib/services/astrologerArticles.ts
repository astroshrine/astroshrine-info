import { api } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

// The astrologer's own articles (the astrologer app's AstroArticles and WriteArticle), on the shared backend.
// Everything an astrologer writes starts "pending" and reaches readers only once an admin approves it.
// Saving an edit sends even an approved article back to review.

export type ArticleStatus = "pending" | "approved" | "rejected";

/** The body is a block list: a paragraph, a heading, a bullet list or a quote per block. */
export type Block = { p?: string; h2?: string; ul?: string[]; quote?: string };

export type Article = {
  id: string;
  title: string;
  /** The stored category: the Hindi label from CATEGORIES. */
  category: string;
  coverImage: string | null;
  readMinutes: number | null;
  body: Block[];
  tags: string[];
  status: ArticleStatus;
  rejectReason: string | null;
  /** When an admin approved or rejected it (ISO), null while pending. */
  reviewedAt: string | null;
};

/** The same fixed list the app offers and the readers filter by; the value stored is the Hindi label. */
export const CATEGORIES = [
  { value: "करियर ज्योतिष", en: "Career Astrology" },
  { value: "विवाह ज्योतिष", en: "Marriage Astrology" },
  { value: "संपत्ति ज्योतिष", en: "Property Astrology" },
  { value: "व्यवसाय ज्योतिष", en: "Business Astrology" },
  { value: "पारिवारिक ज्योतिष", en: "Family Astrology" },
  { value: "प्रतियोगी परीक्षा ज्योतिष", en: "Competitive Exam Astrology" },
  { value: "यात्रा ज्योतिष", en: "Travel Astrology" },
  { value: "घरेलू वातावरण ज्योतिष", en: "Home Environment Astrology" },
] as const;

export const COVER_MAX_BYTES = 5 * 1024 * 1024;

type Raw = {
  id?: string;
  title?: string;
  category?: string;
  coverImage?: string | null;
  readMinutes?: number | null;
  body?: unknown;
  tags?: unknown;
  status?: string;
  rejectReason?: string | null;
  publishedAt?: string | null;
};

function toArticle(r: Raw): Article {
  const status: ArticleStatus = r.status === "approved" || r.status === "rejected" ? r.status : "pending";
  return {
    id: String(r.id ?? ""),
    title: String(r.title ?? ""),
    category: String(r.category ?? ""),
    coverImage: r.coverImage || null,
    readMinutes: typeof r.readMinutes === "number" && r.readMinutes > 0 ? r.readMinutes : null,
    body: Array.isArray(r.body) ? (r.body as Block[]) : [],
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    status,
    rejectReason: r.rejectReason || null,
    reviewedAt: r.publishedAt || null,
  };
}

/** GET /v1/astrologer/articles, newest first. */
export async function getMyArticles(signal?: AbortSignal): Promise<Article[]> {
  const res = await api<{ data?: Raw[] }>("/v1/astrologer/articles", { signal });
  return (Array.isArray(res?.data) ? res.data : []).filter((r) => r?.id).map(toArticle);
}

export type ArticleInput = { title: string; category: string; body: Block[]; coverImage?: string; tags: string[] };

/** POST /v1/astrologer/articles: lands in the admin review queue. */
export function createArticle(input: ArticleInput) {
  return api<unknown>("/v1/astrologer/articles", { method: "POST", body: input });
}

/** PATCH /v1/astrologer/articles/:id: always goes back to review, an approved one included. */
export function updateArticle(id: string, input: ArticleInput) {
  return api<unknown>(`/v1/astrologer/articles/${encodeURIComponent(id)}`, { method: "PATCH", body: input });
}

/** DELETE /v1/astrologer/articles/:id. */
export function deleteArticle(id: string) {
  return api<unknown>(`/v1/astrologer/articles/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** POST /v1/astrologer/articles/cover-image as multipart (field "file", an image up to 5 MB): the URL to store as coverImage. */
export async function uploadCover(file: File): Promise<string> {
  const { data } = await getSupabase().auth.getSession();
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/v1/astrologer/articles/cover-image", {
    method: "POST",
    headers: { Accept: "application/json", ...(data.session && { Authorization: `Bearer ${data.session.access_token}` }) },
    body,
  });
  const j = (await res.json().catch(() => null)) as { url?: string; message?: string; error?: string } | null;
  if (!res.ok || !j?.url) throw new Error(j?.message || j?.error || `Request failed (${res.status})`);
  return j.url;
}

// ─── The text the astrologer types <-> the block list ─────────────────────────────────────────────

/** "## heading", "- bullet", "> quote", anything else is a paragraph. Consecutive bullets form one list. */
export function textToBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("##")) blocks.push({ h2: line.replace(/^#+\s*/, "") });
    else if (/^[-*]\s+/.test(line)) {
      const item = line.replace(/^[-*]\s+/, "");
      const last = blocks[blocks.length - 1];
      if (last?.ul) last.ul.push(item);
      else blocks.push({ ul: [item] });
    } else if (line.startsWith(">")) blocks.push({ quote: line.replace(/^>\s*/, "") });
    else blocks.push({ p: line });
  }
  return blocks;
}

export function blocksToText(blocks: Block[]): string {
  return blocks
    .map((b) => (b.h2 ? `## ${b.h2}` : b.ul ? b.ul.map((li) => `- ${li}`).join("\n") : b.quote ? `> ${b.quote}` : b.p || ""))
    .filter(Boolean)
    .join("\n\n");
}

/** Roughly what the backend computes: about 200 words a minute. */
export function readMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
