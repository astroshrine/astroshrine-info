import { cacheLife } from "next/cache";
import { after } from "next/server";
import { toAstrologer, type Astrologer, type BackendAstrologer } from "@/lib/endpoints";
import {
  toAstrologerCard,
  toAstrologerProfile,
  toReview,
  type AstrologerCard,
  type AstrologerProfile,
  type RawAstrologer,
  type RawReview,
  type Review,
} from "./astrologerModel";

// Server-side reads for the public astrologer pages, so the directory and each profile arrive as real HTML
// (search engines, link previews, no empty first paint). Cached for a few minutes; the browser re-reads the
// live availability right after the page loads. Only mapped fields leave this file.

const ID = /^[\w-]{1,64}$/;

class NotFound extends Error {}

async function backendGet<T>(path: string): Promise<T> {
  const base = process.env.BACKEND_URL?.replace(/\/+$/, "");
  if (!base) throw new Error("BACKEND_URL is not set (see .env.example)");
  const res = await fetch(`${base}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 404) throw new NotFound(path);
  if (!res.ok) throw new Error(`Backend answered ${res.status} for ${path}`);
  return (await res.json()) as T;
}

/**
 * The backend's chat list (the app's Chat tab), fetched once for every page that shows astrologers: the
 * directory, profiles, the home page and the landing page. The backend takes ~3 s and sends ~190 KB, so the
 * list is served from this cache and refreshed in the background every 30 s (stale-while-revalidate). Names,
 * prices and ratings change rarely and pages re-read live availability in the browser, so a cached copy may be
 * served for up to a day without visitors; only after that does a visitor wait for the backend.
 * Raw rows stay on the server: only the mapped fields below are ever sent to a browser.
 */
async function getChatList(): Promise<unknown[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 86_400 });
  const rows = await backendGet<unknown>("/v1/astrologer-view/search/channelType/chat?query=");
  return Array.isArray(rows) ? rows.filter((r) => (r as { id?: string } | null)?.id) : [];
}

/**
 * The astrologer directory (the app's Chat tab list), mapped. Throws when the backend cannot be reached.
 * Cached too (same lifetime as getChatList): the mapping reads the current time (an astrologer seen in the last
 * 12 h counts as online when no status was sent), and under Cache Components the time may only be read inside
 * a cache or after a dynamic access, never while prerendering. The browser re-reads live availability anyway.
 */
export async function getDirectory(): Promise<AstrologerCard[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 86_400 });
  return (await getChatList()).map((r) => toAstrologerCard(r as RawAstrologer));
}

/**
 * The same list for the home and landing pages (and anything using `listChatAstrologers`), mapped to the
 * website's model so phone numbers and waitlists never reach the browser. Shares getChatList's cache.
 */
export async function getChatAstrologers(): Promise<Astrologer[]> {
  return (await getChatList()).map((r) => toAstrologer(r as BackendAstrologer));
}

/**
 * One astrologer's entry from the directory: everything the top of the profile page and the chat panel need
 * (name, photo, rating, experience, languages, price, status). Instant: it comes from the shared list cache.
 * null when they are not listed or the list is unavailable (the page then waits for the full profile).
 */
export async function getDirectoryCard(id: string): Promise<AstrologerCard | null> {
  if (!ID.test(id)) return null;
  try {
    return (await getDirectory()).find((a) => a.id === id) ?? null;
  } catch {
    return null;
  }
}

/** How many of a list's first astrologers get their profile pre-loaded (the ones people click). */
const WARM_PROFILES = 12;

/**
 * After a list of astrologers has been sent, pre-load the profiles of the first few into the profile cache, so
 * opening one is instant too. Runs after the response (it never delays the list). Cached profiles cost nothing;
 * a missing or stale one is fetched once, so the backend sees at most a dozen profile reads per few minutes.
 * Call it from a request (Server Component or Route Handler), never from inside a cached function.
 */
export function warmProfiles(ids: string[]) {
  const first = ids.slice(0, WARM_PROFILES);
  if (first.length === 0) return;
  after(async () => {
    await Promise.allSettled(first.map((id) => getProfilePageData(id)));
  });
}

/** `reviews` is null when they could not be read here: the browser loads them instead. */
export type ProfilePageData = { profile: AstrologerProfile; reviews: Review[] | null };

/**
 * One astrologer's full profile (about, photos, stats) with the first page of reviews. null when there is no
 * such astrologer; throws when the backend cannot be reached (the page then loads it in the browser instead).
 *
 * The backend's profile call takes ~1.8 s, so: the profile, the reviews (~0.6 s) and the directory entry are
 * read in parallel, and the result is cached for everyone. After the first visit a profile is served from the
 * cache for up to a day without visitors and refreshed in the background every 5 minutes (availability is
 * re-read live in the browser, so a cached profile never shows a stale "online").
 */
export async function getProfilePageData(id: string): Promise<ProfilePageData | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 86_400 });
  if (!ID.test(id)) return null;

  const [rawResult, reviewsResult, listResult] = await Promise.allSettled([
    backendGet<RawAstrologer>(`/v1/astrologer-view/${encodeURIComponent(id)}`),
    backendGet<RawReview[]>(`/v1/astrologer-view/${encodeURIComponent(id)}/profile/review/`),
    getDirectory(),
  ]);

  if (rawResult.status === "rejected") {
    if (rawResult.reason instanceof NotFound) return null;
    throw rawResult.reason;
  }
  const raw = rawResult.value;
  if (!raw?.id) return null;

  let profile = toAstrologerProfile(raw);
  // The profile record has no rating: the directory entry carries it.
  const listed = listResult.status === "fulfilled" ? listResult.value.find((a) => a.id === id) : undefined;
  if (listed) profile = { ...profile, rating: listed.rating, reviews: listed.reviews };

  const reviews =
    reviewsResult.status === "fulfilled"
      ? (Array.isArray(reviewsResult.value) ? reviewsResult.value : []).map(toReview).filter((r): r is Review => !!r)
      : null;

  return { profile, reviews };
}
