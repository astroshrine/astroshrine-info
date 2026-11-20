import { api, ApiError } from "./api";
import type { BirthInput, Chart } from "./jyotish";

// Typed calls to the AstroShrine backend, mirroring the mobile app's services/endpoints.ts.
// Livestream is not part of the website, so nothing here reads live rooms or livestream pricing.

// ─── Astrologers ────────────────────────────────────────────────────────────

type ChannelPrice = { rate?: number | null; offer?: number | null; offerRate?: number | null } | null | undefined;

/** The fields of a backend astrologer record the website uses. */
export type BackendAstrologer = {
  id: string;
  name: string;
  status?: string | null;
  ranking?: number;
  pricingData?: { chat?: ChannelPrice; call?: ChannelPrice };
  hostProfile?: {
    profilePic?: string | null;
    expertise?: string[];
    languages?: string[];
    experience?: number;
    rating?: number | null;
    totalReviews?: number;
  };
};

/** online and busy: on the app now. scheduled / offline: not reachable right now. */
export type Availability = "online" | "busy" | "offline";

export type PriceView = {
  /** Normal price per minute. */
  rate: number;
  /** What the user pays per minute (offer applied). */
  price: number;
  hasOffer: boolean;
};

export type Astrologer = {
  id: string;
  name: string;
  photo: string | null;
  expertise: string[];
  languages: string[];
  experience: number;
  rating: number | null;
  reviews: number;
  chat: PriceView;
  availability: Availability;
};

/** Defaults the backend bills when a channel has no rate (CHAT_RATE_PER_MIN). */
export const DEFAULT_CHAT_RATE = 15;

/**
 * What a user pays per minute, the same rule as the backend's billing (callBilling.effectiveRate)
 * and the app's utils/pricing.ts: the offer price when it is set and still matches the % offer,
 * else the rate less the % offer.
 */
export function priceOf(p: ChannelPrice, fallback: number): PriceView {
  const rate = Number(p?.rate) > 0 ? Number(p!.rate) : fallback;
  const offer = Math.min(Math.max(Number(p?.offer) || 0, 0), 100);
  const byPercent = Math.max(0, Math.round(rate * (1 - offer / 100)));
  const offerRate = Number(p?.offerRate);
  const price =
    offer > 0 && offerRate > 0 && offerRate < rate && Math.abs(offerRate - byPercent) <= 1 ? offerRate : byPercent;
  return { rate, price, hasOffer: price < rate };
}

function availabilityOf(status?: string | null): Availability {
  if (status === "online") return "online";
  // Someone in a session, or broadcasting, cannot take a chat until it ends: the app shows "Busy" too.
  if (status === "busy" || status === "live") return "busy";
  return "offline";
}

/** Maps a backend record to the website's model; used on the server (src/lib/services/astrologers.server.ts). */
export function toAstrologer(a: BackendAstrologer): Astrologer {
  const p = a.hostProfile ?? {};
  return {
    id: a.id,
    name: a.name,
    photo: p.profilePic || null,
    expertise: p.expertise ?? [],
    languages: p.languages ?? [],
    experience: Number(p.experience) || 0,
    rating: typeof p.rating === "number" && p.rating > 0 ? p.rating : null,
    reviews: Number(p.totalReviews) || 0,
    chat: priceOf(a.pricingData?.chat, DEFAULT_CHAT_RATE),
    availability: availabilityOf(a.status),
  };
}

/**
 * Astrologers listed for chat, online first (the backend's default order). Public: no sign-in needed.
 * Served by /api/astrologers from a server cache refreshed every 30 s: the backend's own list call
 * (GET /v1/astrologer-view/search/channelType/chat) takes ~3 s and sends ~190 KB, which made every
 * visitor wait. The route answers in milliseconds with only the mapped fields below.
 */
export async function listChatAstrologers(signal?: AbortSignal): Promise<Astrologer[]> {
  // A plain fetch, not api(): api() always sends `cache: "no-store"`, and a no-cache request makes Next.js
  // skip the server cache and wait the full ~3 s for the backend again. Without it, the browser may also
  // reuse the response for 15 s (the route's Cache-Control).
  const res = await fetch("/api/astrologers", { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new ApiError(res.status, `Astrologers could not be loaded (${res.status})`);
  const rows: unknown = await res.json();
  return Array.isArray(rows) ? (rows as Astrologer[]) : [];
}

// ─── Wallet ─────────────────────────────────────────────────────────────────

export type WalletBalance = {
  /** The wallet the app shows and bills from (1 point = ₹1). */
  points_balance: number;
  inr_balance: number;
};

/** GET /v1/wallet/balance (signed in). */
export function getWalletBalance(signal?: AbortSignal) {
  return api<WalletBalance>("/v1/wallet/balance", { signal });
}

// ─── User ───────────────────────────────────────────────────────────────────

/**
 * Birth place as stored in users.profile. The app's place picker saves `geolocation: {lat, lng}`;
 * older profiles have `geoLocation: {lat, long}`. `timezone` is optional (the backend assumes Asia/Kolkata).
 */
export type ProfilePlace = {
  displayValue?: string | null;
  geolocation?: { lat?: number; lng?: number; timezone?: string } | null;
  geoLocation?: { lat?: number; long?: number; timezone?: string } | null;
  timezone?: string | null;
};

export type BackendUser = {
  id: string;
  name?: string | null;
  role?: string | null;
  points_balance?: number | null;
  profile?: {
    phoneNumber?: string | null;
    email?: string | null;
    profilePic?: string | null;
    /** The birth moment, epoch ms (0 or missing = not set). */
    dateTimeOfBirth?: number | null;
    placeOfBirth?: ProfilePlace | null;
    gender?: string | null;
  } | null;
};

/**
 * Creates the users row on first sign-in, or updates it, exactly as the app does after OTP
 * (PUT /v1/user-supabase/:id), so an account made on the website is the same account in the app.
 */
export function initUser(id: string, phone: string | null | undefined) {
  const profile: Record<string, string> = {};
  if (phone) profile.phoneNumber = `+${phone.replace(/^\+/, "")}`;
  return api<unknown>(`/v1/user-supabase/${encodeURIComponent(id)}`, { method: "PUT", body: { profile } });
}

/** GET /v1/user-supabase/:id (only your own record). */
export function getUser(id: string, signal?: AbortSignal) {
  return api<BackendUser>(`/v1/user-supabase/${encodeURIComponent(id)}`, { signal });
}

// ─── Kundli ─────────────────────────────────────────────────────────────────

export type GeocodedPlace = { latitude: number; longitude: number; timezone: string; formattedAddress: string };

/**
 * Birth place name -> coordinates and IANA time zone, the same backend geocoder the app's birth forms use.
 * POST /v1/ai-astrology/geocode (signed in, free). One best match; 404 when nothing is found.
 */
export function geocodePlace(placeName: string, signal?: AbortSignal) {
  return api<GeocodedPlace>("/v1/ai-astrology/geocode", { method: "POST", body: { placeName }, signal });
}

/**
 * The full birth chart: lagna, grahas, D1..D60 vargas, running dashas, yogas and doshas. Pure computation on the
 * backend's Swiss Ephemeris engine: nothing is stored and no points are charged (60 requests / minute / user).
 * POST /v1/jyotish/chart (signed in), the call behind the app's "Kundli" screen.
 */
export function generateChart(birth: BirthInput, signal?: AbortSignal) {
  return api<Chart>("/v1/jyotish/chart", { method: "POST", body: { birth }, signal });
}

export type SavedBirth = { dateTimeOfBirth: number; place: string; lat: number; lon: number; tz: string };

/**
 * Saves these birth details as the account's own (users.profile), in the format the app's profile editor writes.
 * The app's "My Kundli" sheet, AI astrologer and booked astrologers read them from there.
 * POST /v1/user-supabase/:id/profile/profile-data merges `profile` into the stored one; the name is left alone.
 */
export function saveBirthDetails(userId: string, b: SavedBirth) {
  return api<BackendUser>(`/v1/user-supabase/${encodeURIComponent(userId)}/profile/profile-data`, {
    method: "POST",
    body: {
      profile: {
        dateTimeOfBirth: b.dateTimeOfBirth,
        placeOfBirth: { displayValue: b.place, geolocation: { lat: b.lat, lng: b.lon }, timezone: b.tz },
      },
    },
  });
}

/** The app's gender values (GenderRadioButton): M or F. */
export type Gender = "M" | "F";

export type ProfileEdit = {
  name: string;
  email: string | null;
  gender: Gender;
  dateTimeOfBirth: number;
  place: { name: string; lat: number; lon: number; tz: string };
};

/**
 * Saves the profile form, as the app's EditProfileUI does: the display name plus email, gender and birth details,
 * merged into users.profile (POST /v1/user-supabase/:id/profile/profile-data; the phone number and photo stay).
 */
export function saveProfile(userId: string, p: ProfileEdit) {
  return api<BackendUser>(`/v1/user-supabase/${encodeURIComponent(userId)}/profile/profile-data`, {
    method: "POST",
    body: {
      name: p.name,
      profile: {
        ...(p.email ? { email: p.email } : {}),
        gender: p.gender,
        dateTimeOfBirth: p.dateTimeOfBirth,
        placeOfBirth: { displayValue: p.place.name, geolocation: { lat: p.place.lat, lng: p.place.lon }, timezone: p.place.tz },
      },
    },
  });
}

/**
 * The saved birth moment in epoch ms, or null when none is saved. The backend writes 0 (or nothing) for "not set";
 * any other finite value is a real date. Births before 1970 are NEGATIVE: checking `> 0` hid them (the home page kept
 * asking an account born in the 1960s for details it already had).
 */
export function birthMs(user: BackendUser | null | undefined): number | null {
  const raw = user?.profile?.dateTimeOfBirth;
  if (raw === null || raw === undefined || (raw as unknown) === "") return null;
  const ms = Number(raw);
  return Number.isFinite(ms) && ms !== 0 ? ms : null;
}

/**
 * Whether a customer account has what the app asks for at sign-up (name, birth date and time, birth place). The app
 * sends anyone without them to its details form before home; the website does the same after login.
 */
export function profileComplete(user: BackendUser | null | undefined) {
  const p = user?.profile;
  return !!user?.name?.trim() && birthMs(user) !== null && !!p?.placeOfBirth?.displayValue?.trim();
}

/**
 * Recomputes the stored birth chart the AI astrologer reads, as the app does right after saving birth details.
 * POST /v1/ai-astrology/chart (signed in, free).
 */
export function refreshAiBirthChart(b: { date: string; time: string; place: string; lat: number; lon: number; tz: string }) {
  return api<unknown>("/v1/ai-astrology/chart", {
    method: "POST",
    body: { birthDate: b.date, birthTime: b.time, birthPlace: b.place, latitude: b.lat, longitude: b.lon, timezone: b.tz },
  });
}
