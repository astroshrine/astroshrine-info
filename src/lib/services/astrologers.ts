import { api } from "@/lib/api";
import {
  REVIEW_PAGE_SIZE,
  toAstrologerCard,
  toAstrologerProfile,
  toReview,
  type AstrologerCard,
  type AstrologerProfile,
  type RawAstrologer,
  type RawReview,
  type Review,
  type StatusInfo,
} from "./astrologerModel";

// Browser calls for the astrologer directory and profiles, through the /api proxy to the app's backend.
// Directory, profile, status and reviews are public; favourites and writing a review need a login.

const DIRECTORY = "/v1/astrologer-view/search/channelType/chat?query=";

/** Every listed astrologer (the same list as the app's Chat tab), already mapped. Public. */
export async function listAstrologers(signal?: AbortSignal): Promise<AstrologerCard[]> {
  const rows = await api<RawAstrologer[]>(DIRECTORY, { auth: false, signal });
  return Array.isArray(rows) ? rows.filter((r) => r?.id).map((r) => toAstrologerCard(r)) : [];
}

/** The server caps one status read at 100 ids. */
const MAX_STATUS_IDS = 100;

/**
 * Fresh availability for these astrologers: GET /v1/astrologer-view/status (public). The app re-reads it once a
 * minute while a list or profile is on screen, because a heartbeat that just stops has no event to push.
 */
export async function getStatuses(ids: string[], signal?: AbortSignal): Promise<Map<string, StatusInfo>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const out = new Map<string, StatusInfo>();
  for (let i = 0; i < unique.length; i += MAX_STATUS_IDS) {
    const batch = unique.slice(i, i + MAX_STATUS_IDS);
    const rows = await api<StatusInfo[]>(`/v1/astrologer-view/status?ids=${batch.map(encodeURIComponent).join(",")}`, {
      auth: false,
      signal,
    });
    for (const r of Array.isArray(rows) ? rows : []) if (r?.id) out.set(r.id, r);
  }
  return out;
}

/**
 * One astrologer's profile. Public. `view: true` counts a profile view, as the app's profile screen does;
 * the page sends it once per visit, from the browser (server renders and bots never count).
 */
export async function getAstrologerProfile(id: string, opts: { view?: boolean; signal?: AbortSignal } = {}): Promise<AstrologerProfile> {
  const raw = await api<RawAstrologer>(`/v1/astrologer-view/${encodeURIComponent(id)}${opts.view ? "?view=1" : ""}`, {
    auth: false,
    signal: opts.signal,
  });
  return toAstrologerProfile(raw);
}

/** A page of reviews, newest first. `after` is the last review's cursor. Public. */
export async function listReviews(id: string, after?: string, signal?: AbortSignal): Promise<Review[]> {
  const query = after ? `?key=${encodeURIComponent(after)}` : "";
  const rows = await api<RawReview[]>(`/v1/astrologer-view/${encodeURIComponent(id)}/profile/review/${query}`, {
    auth: false,
    signal,
  });
  return (Array.isArray(rows) ? rows : []).map(toReview).filter((r): r is Review => !!r);
}

export { REVIEW_PAGE_SIZE };

/** Rate an astrologer after a consultation: posted under the signed-in account's own name. */
export function addReview(id: string, rating: number, message: string) {
  return api<unknown>(`/v1/astrologer-view/${encodeURIComponent(id)}/profile/review/`, {
    method: "POST",
    body: { rating, message: message.trim() },
  });
}

// ─── Favourites (signed in) ─────────────────────────────────────────────────────────────────────

export async function getFavouriteIds(signal?: AbortSignal): Promise<Set<string>> {
  const res = await api<{ ids?: string[] }>("/v1/favourites/ids", { signal });
  return new Set(Array.isArray(res?.ids) ? res.ids : []);
}

/** Both are idempotent on the server, so a retry or double click cannot desync. */
export function setFavourite(astrologerId: string, on: boolean) {
  return api<unknown>(`/v1/favourites/${encodeURIComponent(astrologerId)}`, { method: on ? "POST" : "DELETE" });
}
