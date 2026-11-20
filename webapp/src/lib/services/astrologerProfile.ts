import { api } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { toReview, type Review } from "./astrologerModel";

// The astrologer's own profile, rates and workday, on the shared backend (the astrologer app's
// EditAstroProfile, RateOfferCard and workday card). Every write is for the signed-in astrologer only.

type RawPrice = { rate?: number | null; offer?: number | null; offerRate?: number | null; changedAt?: string | null } | null;

export type OwnAstrologer = {
  id: string;
  name: string;
  photo: string | null;
  expertise: string[];
  languages: string[];
  experience: number;
  aboutMe: string;
  rating: number | null;
  reviews: number;
  orders: number;
  pricing: { chat: RawPrice; call: RawPrice };
};

type RawOwn = {
  id?: string;
  name?: string | null;
  display_name?: string | null;
  pricingData?: { chat?: RawPrice; call?: RawPrice } | null;
  hostProfile?: {
    profilePic?: string | null;
    expertise?: string[] | null;
    languages?: string[] | null;
    experience?: number | null;
    aboutMe?: string | null;
    rating?: number | null;
    totalReviews?: number | null;
    orders?: number | null;
  } | null;
};

const strings = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string" && s.trim() !== "") : []);

export async function getOwnAstrologer(id: string, signal?: AbortSignal): Promise<OwnAstrologer> {
  const raw = await api<RawOwn>(`/v1/astrologer/${encodeURIComponent(id)}`, { signal });
  const p = raw?.hostProfile ?? {};
  const rating = Number(p.rating);
  return {
    id: raw?.id || id,
    name: (raw?.display_name || raw?.name || "").trim(),
    photo: p.profilePic || null,
    expertise: strings(p.expertise),
    languages: strings(p.languages),
    experience: Number(p.experience) || 0,
    aboutMe: String(p.aboutMe || ""),
    rating: rating > 0 ? rating : null,
    reviews: Number(p.totalReviews) || 0,
    orders: Number(p.orders) || 0,
    pricing: { chat: raw?.pricingData?.chat ?? null, call: raw?.pricingData?.call ?? null },
  };
}

// ─── Profile ───────────────────────────────────────────────────────────────────

export const NAME_MIN = 2;
export const NAME_MAX = 50;

export type ProfileInput = { name: string; experience: number; aboutMe: string; expertise: string[]; languages: string[] };

/** POST /v1/astrologer/:id/profile/profile-data: name 2-50 characters; about, expertise and experience are required. */
export function saveProfile(id: string, input: ProfileInput) {
  return api<{ name: string }>(`/v1/astrologer/${encodeURIComponent(id)}/profile/profile-data`, {
    method: "POST",
    body: {
      name: input.name,
      profile: { experience: input.experience, aboutMe: input.aboutMe, expertise: input.expertise, languages: input.languages },
    },
  });
}

/** POST /v1/astrologer/:id/profile/profile-pic as multipart (field "file"); returns nothing the page needs, reload the profile. */
export async function uploadPhoto(id: string, file: File): Promise<void> {
  const { data } = await getSupabase().auth.getSession();
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`/api/v1/astrologer/${encodeURIComponent(id)}/profile/profile-pic`, {
    method: "POST",
    headers: { Accept: "application/json", ...(data.session && { Authorization: `Bearer ${data.session.access_token}` }) },
    body,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string; message?: string; err?: string };
      message = j.error || j.message || j.err || message;
    } catch {}
    throw new Error(message);
  }
}

// ─── Rates ─────────────────────────────────────────────────────────────────────

export const RATE_MIN = 1;
export const RATE_MAX = 1000;
export const PRICING_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type ChannelPriceInput = { rate: number; offerRate: number | null };

/** PUT /v1/astrologer/:id/pricing. A 429 (code PricingCooldown) means a change is too soon: reload the profile and read nextPricingChange. */
export function savePricing(id: string, body: { chat?: ChannelPriceInput; call?: ChannelPriceInput }) {
  return api<{ pricingData: { chat?: RawPrice; call?: RawPrice } }>(`/v1/astrologer/${encodeURIComponent(id)}/pricing`, { method: "PUT", body });
}

/** When the astrologer may change their rates again, from the newest `changedAt` over the channels; null when they may now. */
export function nextPricingChange(pricing: OwnAstrologer["pricing"], now = Date.now()): number | null {
  const times = [pricing.chat?.changedAt, pricing.call?.changedAt].map((t) => Date.parse(String(t))).filter((t) => Number.isFinite(t));
  if (!times.length) return null;
  const next = Math.max(...times) + PRICING_COOLDOWN_MS;
  return next > now ? next : null;
}

// ─── Workday ───────────────────────────────────────────────────────────────────

export type WorkdaySettings = {
  dailyTargetMinutes: number;
  dndEnabled: boolean;
  restEnabled: boolean;
  restStart: string | null;
  restEnd: string | null;
  /** Auto Boost: listed higher in the astrologer list. Missing on old backends. */
  boostChat?: boolean;
  boostCall?: boolean;
};

export type Workday = {
  settings: WorkdaySettings;
  onBreak: boolean;
  today: { onlineMinutes: number; targetMinutes: number; progress: number };
  last7Days: { day: string; onlineMinutes: number }[];
  daysTargetMet: number;
};

export const TARGET_MIN = 30;
export const TARGET_MAX = 1440;

export const getWorkday = (id: string, signal?: AbortSignal) => api<Workday>(`/v1/astrologer/${encodeURIComponent(id)}/workday`, { signal });

/** PUT /v1/astrologer/:id/workday/settings. Times are HH:MM in IST; rest hours need a start and an end that differ. Send only the fields being changed (the backend merges), e.g. {boostChat}. */
export const saveWorkdaySettings = (id: string, body: Partial<Pick<WorkdaySettings, "dailyTargetMinutes" | "restEnabled" | "restStart" | "restEnd" | "boostChat" | "boostCall">>) =>
  api<WorkdaySettings>(`/v1/astrologer/${encodeURIComponent(id)}/workday/settings`, { method: "PUT", body });

// ─── Reviews ───────────────────────────────────────────────────────────────────

/** The newest reviews (up to a page), GET /v1/astrologer/:id/profile/review. */
export async function getReviews(id: string, signal?: AbortSignal): Promise<Review[]> {
  const rows = await api<unknown[]>(`/v1/astrologer/${encodeURIComponent(id)}/profile/review`, { signal });
  return (Array.isArray(rows) ? rows : [])
    .map((r) => toReview(r as Parameters<typeof toReview>[0]))
    .filter((r): r is Review => r !== null)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 10);
}

/** POST /v1/astrologer/:id/profile/review/reply/:userId/:ts {message}: a public reply under one review. */
export function replyToReview(id: string, review: Review, message: string) {
  const userId = review.key.slice(review.key.indexOf("#") + 1);
  return api<unknown>(`/v1/astrologer/${encodeURIComponent(id)}/profile/review/reply/${encodeURIComponent(userId)}/${review.ts}`, {
    method: "POST",
    body: { message },
  });
}
