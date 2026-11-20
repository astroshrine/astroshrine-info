import { api } from "@/lib/api";
import type { PalmNarrative, PalmScores, YearAhead } from "./toolsPalmTalent";

// Palm Reading (Hast Rekha) reports on the shared backend (React-native-app: features/palmReading/palmReadingApi.ts).
// Astrologer-only. Creating a reading needs the app's on-device hand analysis (MediaPipe on the phone camera), so the
// website only lists, opens, completes, prints and deletes the readings made in the app.

export const SECTION_KEYS = [
  "overall", "handShape", "life", "head", "heart", "fate", "sun", "mercury", "marriage", "travel", "marks", "fingers",
  "thumb", "mounts", "comparison", "strengths", "attention", "ahead", "closing",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export type Polarity = "good" | "bad" | "mixed";

/** One rule the backend matched; `text` is the server-written traditional reading. */
export type RuleMatch = { hand: "left" | "right"; feature: string; property: string; value: string; section: SectionKey; text: string; polarity?: Polarity };

export type PalmReadingReport = {
  id: string;
  subject: { name: string; language: "en" | "hi"; dateOfBirth?: string; gender?: string };
  status: "analysed" | "ready";
  matches: RuleMatch[];
  comparison: { similarities: string[]; differences: string[] } | null;
  sections:
    | (Record<SectionKey, string> & {
        year_ahead?: YearAhead;
        talent?: { scores: PalmScores; narrative: Omit<PalmNarrative, "year_ahead" | "lookingAhead">; patternSource?: Record<string, string> };
      })
    | null;
  disclaimer: string;
  createdAt: string;
  generatedAt: string | null;
};
export type PalmReadingSummary = { id: string; name: string; status: "analysed" | "ready"; createdAt: string };

export async function listPalmReadings(offset = 0, signal?: AbortSignal) {
  const r = await api<{ reports?: PalmReadingSummary[]; hasMore?: boolean }>(`/v1/palm-reading/reports?limit=20&offset=${offset}`, { signal });
  return { reports: r?.reports ?? [], hasMore: !!r?.hasMore };
}
export const getPalmReading = (id: string, signal?: AbortSignal) => api<PalmReadingReport>(`/v1/palm-reading/reports/${encodeURIComponent(id)}`, { signal });
/** POST .../generate: writes the reading of an analysed report (AI, can take a minute). */
export const generatePalmReading = (id: string) => api<PalmReadingReport>(`/v1/palm-reading/reports/${encodeURIComponent(id)}/generate`, { method: "POST", body: {} });
export const deletePalmReading = (id: string) => api<unknown>(`/v1/palm-reading/reports/${encodeURIComponent(id)}`, { method: "DELETE" });
export const palmReadingPrintPath = (id: string) => `/v1/palm-reading/reports/${encodeURIComponent(id)}/pdf`;
