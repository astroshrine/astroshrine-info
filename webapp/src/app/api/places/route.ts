import type { NextRequest } from "next/server";

/**
 * GET /api/places?q=ujj: place suggestions for the birth place popup, as the visitor types. This static route takes
 * precedence over the /api/[...path] proxy for this one path.
 *
 * Source: Photon (photon.komoot.io), OpenStreetMap data like the app's place picker, and made for search-as-you-type
 * (Nominatim's usage policy does not allow autocomplete). The request goes from this server, so the visitor's address
 * is never sent to a third party; answers are cached here for a day. Places only (cities, towns, villages...), biased
 * towards India. The time zone is not part of the answer: the browser derives it (see PlaceSearch).
 */

export type PlaceSuggestion = { label: string; name: string; lat: number; lon: number; countryCode: string };

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: { name?: string; state?: string; county?: string; country?: string; countrycode?: string; osm_value?: string };
};

const DAY_MS = 86_400_000;
const MAX_CACHE = 1000;
const cache = new Map<string, { at: number; places: PlaceSuggestion[] }>();

function toSuggestion(f: PhotonFeature): PlaceSuggestion | null {
  const p = f.properties ?? {};
  const [lon, lat] = f.geometry?.coordinates ?? [];
  if (!p.name || typeof lat !== "number" || typeof lon !== "number") return null;
  // "Ujjain, Madhya Pradesh, India": name, then the larger areas, without repeating a part.
  const parts = [p.name, p.county, p.state, p.country].filter((x, i, all): x is string => !!x && all.indexOf(x) === i);
  return { label: parts.join(", "), name: p.name, lat, lon, countryCode: (p.countrycode ?? "").toUpperCase() };
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().replace(/\s+/g, " ");
  if (q.length < 2 || q.length > 100) return Response.json([], { status: q.length > 100 ? 400 : 200 });

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < DAY_MS) return Response.json(hit.places, { headers: { "Cache-Control": "public, max-age=3600" } });

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "8");
  url.searchParams.set("lang", "en");
  url.searchParams.set("osm_tag", "place");
  // Centre of India: Indian places come first for short, ambiguous names.
  url.searchParams.set("lat", "22.5");
  url.searchParams.set("lon", "79");

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "AstroShrine-website (https://app.astroshrine.in)" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Photon answered ${res.status}`);
    const data = (await res.json()) as { features?: PhotonFeature[] };
    const seen = new Set<string>();
    const places = (data.features ?? [])
      .map(toSuggestion)
      .filter((p): p is PlaceSuggestion => !!p && !seen.has(p.label) && !!seen.add(p.label))
      .slice(0, 6);
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), places });
    return Response.json(places, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch (error) {
    console.error("[api/places]", error);
    return Response.json({ error: "Place suggestions are not available right now.", code: "PLACES_UNAVAILABLE" }, { status: 502 });
  }
}
