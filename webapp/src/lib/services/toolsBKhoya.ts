import { api } from "@/lib/api";

// Khoya-Paya (lost and found) Prashna: the app's khoyaPayaService. The server casts the chart for the moment of
// asking, has it judged (capped at 60 s there), and saves the reading to the account's tool results.
// Astrologers only (403 astrologers_only otherwise). POST /v1/prashna/khoya-paya

export const CATEGORIES = ["jewellery", "phone_electronics", "documents", "cash_wallet", "keys", "vehicle", "pet", "clothes_bag", "other"] as const;
export type Category = (typeof CATEGORIES)[number];
export const PRECISIONS = ["exact", "approximate", "unknown"] as const;
export type Precision = (typeof PRECISIONS)[number];

export type KhoyaPayaRequest = {
  user_input: {
    item: string;
    category: Category;
    /** Wall-clock time at the place, "YYYY-MM-DDTHH:mm"; null when unknown. */
    lost_at: string | null;
    lost_at_precision: Precision;
    last_seen_place: string | null;
    theft_suspected: boolean;
    language: "hi" | "en";
  };
  place: { city: string; lat: number; lon: number; tz: string };
};

export type KhoyaPayaReading = {
  verdict: "likely_found" | "delayed" | "partial" | "unlikely";
  confidence: "high" | "medium" | "low";
  summary: string;
  location: { distance: "inside_home" | "nearby" | "far"; direction: "east" | "south" | "west" | "north" | "unclear"; place_type: string; reasoning: string };
  timing: { range: string; reasoning: string } | null;
  lochan_result: { category: "andha" | "mand" | "madhya" | "sulochan"; meaning: string } | null;
  theft_analysis: { general_indication: string; action_advice: string } | null;
  rules_applied: { rule: string; finding: string; supports: "recovery" | "loss" | "neutral" }[];
  search_tips: string[];
  optional_prayer: string | null;
  limitations: string[];
  disclaimer: string;
  asked_at: string;
  loss_nakshatra: string | null;
  /** The saved result's id (the server saves every reading itself). */
  savedId?: string;
};

export function askKhoyaPaya(body: KhoyaPayaRequest, signal?: AbortSignal) {
  return api<KhoyaPayaReading>("/v1/prashna/khoya-paya", { method: "POST", body, signal });
}

export const CEIR_URL = "https://www.ceir.gov.in";

/** The police / CEIR card shows for these whatever the reading says. */
export const needsPoliceCard = (category: Category, theftSuspected: boolean) =>
  theftSuspected || category === "phone_electronics" || category === "vehicle" || category === "documents";
