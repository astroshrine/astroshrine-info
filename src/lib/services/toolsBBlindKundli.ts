import { api } from "@/lib/api";

// Blind Kundli (astrologer-only): check -> LOCK (stored, immutable) -> one-time reveal against the real chart.
// The same calls as the app's features/blindKundli/blindKundliApi.ts. Rashi level only; no degrees anywhere.

export const GRAHAS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"] as const;
export type BkGraha = (typeof GRAHAS)[number];
/** Ketu is never entered: the server puts it 180° from Rahu. */
export const ENTERED = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu"] as const;
export type Entered = (typeof ENTERED)[number];
export type Confidence = "low" | "medium" | "high";
export type Source = "palm" | "face";
export type Mode = "rashi" | "house";

export type Check = { name: string; ok: boolean; detail: string };
export type CheckResult = { ok: boolean; precision: string; checks: Check[]; birth_windows: { from: string; to: string }[] };
export type Placement = { rashi: number; confidence: Confidence; evidence: { source: Source; note: string }[]; derived?: true };
export type Cluster = { house: number; rashi: number; members: BkGraha[] };
export type Item = { key: "Lagna" | BkGraha; predicted: number; actual: number; match: boolean; predicted_house?: number; actual_house?: number; house_match?: boolean };
export type Comparison = {
  items: Item[];
  bhava: { house: number; predicted: { rashi: number; planets: BkGraha[] }; actual: { rashi: number; planets: BkGraha[] }; rashi_match: boolean; common: BkGraha[] }[];
  clusters: (Cluster & { together: boolean; same_rashi: boolean })[];
  score: { points: number; max: number };
  house_matches: { points: number; max: number };
  cluster_score: { points: number; max: number };
  chance: { method: string; expected_points: number; p_value: number; samples: number };
};
export type Prediction = {
  id: string;
  label: string | null;
  locked_at: string;
  hash: string;
  hash_valid: boolean;
  statement: string;
  prediction: { lagna: Placement; planets: Record<BkGraha, Placement> };
  kundli: { lagna: number; clusters: Cluster[] };
  checks: CheckResult;
  revealed_at: string | null;
  actual: null | { lagna: { rashi: number }; planets: Record<BkGraha, { rashi: number; house: number }>; warnings?: string[] };
  comparison: Comparison | null;
};
export type Summary = { id: string; label: string | null; locked_at: string; revealed_at: string | null; score: { points: number; max: number } | null };
export type Birth = { date: string; time: string; tz: string; lat: number; lon: number };

const BASE = "/v1/blind-kundli";

/** POST /check: the server's astronomical check of the table. Stores nothing. */
export const checkBlindKundli = (body: object) => api<CheckResult>(`${BASE}/check`, { method: "POST", body });
/** POST /predictions: LOCKs the prediction. It can never be changed afterwards. */
export const lockBlindKundli = (body: object) => api<Prediction>(`${BASE}/predictions`, { method: "POST", body });
export const listBlindKundli = (signal?: AbortSignal) => api<{ predictions: Summary[] }>(`${BASE}/predictions?limit=50`, { signal }).then((r) => r.predictions ?? []);
export const getBlindKundli = (id: string, signal?: AbortSignal) => api<Prediction>(`${BASE}/predictions/${encodeURIComponent(id)}`, { signal });
/** POST /predictions/:id/reveal: compares once against the real chart of this birth. */
export const revealBlindKundli = (id: string, birth: Birth) => api<Prediction>(`${BASE}/predictions/${encodeURIComponent(id)}/reveal`, { method: "POST", body: { birth } });

// ─── The form, pure ─────────────────────────────────────────────────────────────

export type Row = { value: number | null; confidence: Confidence; source: Source; note: string };
export type Form = { label: string; mode: Mode; lagna: Row; planets: Record<Entered, Row> };

export const opp = (r: number) => ((r + 5) % 12) + 1;
export const rashiFromHouse = (lagna: number, house: number) => ((lagna + house - 2) % 12) + 1;
export const houseOf = (rashi: number, lagna: number) => ((rashi - lagna + 12) % 12) + 1;

export const emptyRow = (): Row => ({ value: null, confidence: "low", source: "palm", note: "" });
export const emptyForm = (): Form => ({
  label: "",
  mode: "house",
  lagna: emptyRow(),
  planets: Object.fromEntries(ENTERED.map((g) => [g, emptyRow()])) as Form["planets"],
});

/** Rashi of every graha the form fixes so far (house mode needs the lagna first); Ketu follows Rahu. */
export function rashisOf(f: Form): Partial<Record<BkGraha, number>> {
  const out: Partial<Record<BkGraha, number>> = {};
  for (const g of ENTERED) {
    const v = f.planets[g].value;
    if (v == null) continue;
    if (f.mode === "rashi") out[g] = v;
    else if (f.lagna.value != null) out[g] = rashiFromHouse(f.lagna.value, v);
  }
  if (out.Rahu) out.Ketu = opp(out.Rahu);
  return out;
}

export const missing = (f: Form): string[] => [...(f.lagna.value == null ? ["Lagna"] : []), ...ENTERED.filter((g) => f.planets[g].value == null)];

const slot = (r: Row) => ({ confidence: r.confidence, evidence: r.note.trim() ? [{ source: r.source, note: r.note.trim() }] : [] });

/** POST /check and /predictions body. */
export const bodyOf = (f: Form) => ({
  ...(f.label.trim() ? { label: f.label.trim() } : {}),
  lagna: { rashi: f.lagna.value, ...slot(f.lagna) },
  planets: Object.fromEntries(ENTERED.map((g) => [g, { [f.mode]: f.planets[g].value, ...slot(f.planets[g]) }])),
});

/** Houses for NorthIndianChart from a lagna and the grahas' rashis. */
export function chartHouses(lagna: number, rashis: Partial<Record<BkGraha, number>>) {
  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const rashi = rashiFromHouse(lagna, house);
    return { house, rashi, planets: GRAHAS.filter((g) => rashis[g] === rashi).map((graha) => ({ graha, retro: false })) };
  });
}
