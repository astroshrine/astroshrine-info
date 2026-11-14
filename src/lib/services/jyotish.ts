import { api } from "@/lib/api";
import type { BirthInput, BirthPlace, Graha, Horary, Panchang, Sheet, Transits } from "@/lib/jyotish";

// The backend Jyotish engine (/v1/jyotish, Swiss Ephemeris), the same calls as the app's jyotishApi.ts and
// kundliSheetApi.ts. All of them need a signed in user, store nothing and charge no points; the engine allows
// 60 requests a minute per user. The chart itself (POST /chart), the birth place lookup and saving the account's
// birth details are in src/lib/endpoints.ts (generateChart, geocodePlace, saveBirthDetails).

/** Gochar ahead: sign periods, retrograde stations and Sade Sati / Dhaiya. POST /v1/jyotish/transits */
export function fetchTransits(birth: BirthInput, months = 36, planets: Graha[] = ["Jupiter", "Saturn", "Rahu", "Ketu"], signal?: AbortSignal) {
  return api<Transits>("/v1/jyotish/transits", { method: "POST", body: { birth, months, planets }, signal });
}

/** Panchang of a date at a place: five angas, sunrise, kaal windows, choghadiya, month. POST /v1/jyotish/panchang */
export function fetchPanchang(date: string, place: BirthPlace, signal?: AbortSignal) {
  return api<Panchang>("/v1/jyotish/panchang", {
    method: "POST",
    body: { date, place: { lat: place.lat, lon: place.lon, tz: place.tz } },
    signal,
  });
}

/**
 * KP horary for the moment of asking. Sent as UTC, as the app does: the instant is what matters and the
 * server finds the local day. POST /v1/jyotish/kp/horary
 */
export function fetchHorary(number: number, place: BirthPlace, at = new Date(), signal?: AbortSignal) {
  const iso = at.toISOString();
  return api<Horary>("/v1/jyotish/kp/horary", {
    method: "POST",
    body: { number, date: iso.slice(0, 10), time: iso.slice(11, 19), lat: place.lat, lon: place.lon, tz: "UTC" },
    signal,
  });
}

/**
 * The detailed kundli sheet of the account's own birth details saved in its profile (shared with the app).
 * 404 { error: "birth_details_missing" } when none are saved. GET /v1/jyotish/sheet/:userId
 */
export function fetchOwnSheet(userId: string, signal?: AbortSignal) {
  return api<Sheet>(`/v1/jyotish/sheet/${encodeURIComponent(userId)}`, { signal });
}
