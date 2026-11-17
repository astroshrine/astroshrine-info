import { api } from "@/lib/api";
import type { DmitScores } from "./toolsDmit";

// Palm Talent reports on the shared backend (React-native-app: features/palmTalent/palmTalentApi.ts). Astrologer-only and
// read-only: new talent reports are part of Palm Reading, so the backend answers 410 to creation.

export type YearQuarter = { period: string; good: string[]; challenges: string[] };
export type YearAhead = { impact: string; quarters: YearQuarter[] };

/** The fingerprint-only sections are null on reports made from a palm photo alone. */
export type PalmScores = Omit<DmitScores, "atd" | "trcBand" | "trc" | "fingers" | "personality" | "learnerType" | "quotients" | "learningStyle"> & {
  personality: DmitScores["personality"] | null;
  learnerType: DmitScores["learnerType"] | null;
  quotients: DmitScores["quotients"] | null;
  learningStyle: DmitScores["learningStyle"] | null;
  fingers: Record<string, { lobe: string; side: string; trait: string; pattern: string | null; percent: number; band: string }>;
  fingerprintBased?: boolean;
};

export type PalmNarrative = {
  personality: string;
  intelligence: Record<string, string>;
  quotients?: Record<string, string>;
  learningStyle?: Record<string, string>;
  acquiringMethods?: Record<string, string>;
  careers: string;
  activities: string;
  summary: string;
  lookingAhead?: string;
  year_ahead?: YearAhead;
};
export type PalmContent = PalmNarrative & { patternSource?: Record<string, string> };

export type PalmTalentReport = {
  id: string;
  subject: { name: string; dateOfBirth: string; gender: string; language: "en" | "hi" };
  hand: "left" | "right";
  status: "awaiting_review" | "ready";
  scores: PalmScores | null;
  content: PalmContent | null;
  disclaimer: string;
  createdAt: string;
};
export type PalmTalentSummary = { id: string; name: string; status: "awaiting_review" | "ready"; createdAt: string };

/** True only when the fingerprint-only sections came from real fingertip photos (not guessed from the hand shape). */
export function hasFingerprintSections(scores: PalmScores, content: Pick<PalmContent, "patternSource">): boolean {
  if (scores.fingerprintBased === false) return false;
  return Object.values(content.patternSource ?? {}).some((s) => s === "fingertip_photo");
}

export async function listPalmTalentReports(offset = 0, signal?: AbortSignal) {
  const r = await api<{ reports?: PalmTalentSummary[]; hasMore?: boolean }>(`/v1/palm-talent/reports?limit=20&offset=${offset}`, { signal });
  return { reports: r?.reports ?? [], hasMore: !!r?.hasMore };
}
export const getPalmTalentReport = (id: string, signal?: AbortSignal) => api<PalmTalentReport>(`/v1/palm-talent/reports/${encodeURIComponent(id)}`, { signal });
export const deletePalmTalentReport = (id: string) => api<unknown>(`/v1/palm-talent/reports/${encodeURIComponent(id)}`, { method: "DELETE" });
export const palmTalentPrintPath = (id: string) => `/v1/palm-talent/reports/${encodeURIComponent(id)}/pdf`;
