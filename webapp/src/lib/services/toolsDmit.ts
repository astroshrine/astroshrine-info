import { api } from "@/lib/api";

// DMIT on the shared backend (React-native-app: features/dmit/dmitApi.ts, app-backend routes/dmit). Astrologer-only.

export type Lang = "en" | "hi";
export type Pattern = "whorl" | "composite_whorl" | "ulnar_loop" | "radial_loop" | "arch";
export type FingerKey = "R1" | "R2" | "R3" | "R4" | "R5" | "L1" | "L2" | "L3" | "L4" | "L5";
export const FINGER_KEYS: FingerKey[] = ["R1", "R2", "R3", "R4", "R5", "L1", "L2", "L3", "L4", "L5"];
export const PATTERNS: Pattern[] = ["whorl", "composite_whorl", "ulnar_loop", "radial_loop", "arch"];
export const CONSENT_TEXT_VERSION = "v1";

export type FingerInput = { pattern: Pattern; ridgeCount: number };

export type DmitCreateBody = {
  subject: { name: string; dateOfBirth: string; gender?: string; language: Lang };
  fingers: Record<FingerKey, FingerInput>;
  atd: { left: number; right: number };
  consent: { accepted: true; textVersion: string; guardianName?: string };
};

export type FingerScore = { lobe: string; side: "left" | "right"; trait: string; pattern: Pattern; percent: number; band: string };
export type DmitScores = {
  trc: number;
  trcBand: string;
  atd: { left: number; right: number; band: string };
  fingers: Record<FingerKey, FingerScore>;
  brainDominance: { left: number; right: number };
  lobes: Record<string, number>;
  thoughtProcess: Record<string, number>;
  multipleIntelligence: Record<string, number>;
  multipleIntelligenceRank: Record<string, number>;
  kinestheticSplit: Record<string, number>;
  quotients: Record<string, number>;
  learningStyle: Record<string, number>;
  personality: { birds: Record<string, number>; primary: string; secondary: string };
  learnerType: Record<string, number>;
  leadership: Record<string, number>;
  riasec: Record<string, number>;
  stream: Record<string, number>;
  careerDomains: Record<string, number>;
  activities: Record<string, number>;
};

export type TextBlock = {
  description?: string;
  traits?: string[];
  strengths?: string[];
  watchOuts?: string[];
  tips?: string | string[];
  careerInterests?: string[];
  waysToDevelop?: string[];
  studyTips?: string[];
};
export type DmitContent = {
  birds: Record<string, TextBlock>;
  learnerType: Record<string, TextBlock>;
  intelligence: Record<string, TextBlock>;
  learningStyle: Record<string, TextBlock>;
  quotients: Record<string, TextBlock>;
  lobes: Record<string, TextBlock>;
  atdBand: Record<string, TextBlock>;
  trcBand: Record<string, TextBlock>;
  sectionIntros: Record<string, string>;
};

export type DmitReport = {
  id: string;
  subject: { name: string; dateOfBirth: string; gender?: string; language: Lang };
  scores: DmitScores;
  content: DmitContent;
  disclaimer: string;
  createdAt: string;
};
export type DmitReportSummary = { id: string; name: string; createdAt: string; topIntelligence: string | null };

/** POST /v1/dmit/reports: computed and stored by the backend; free. */
export const createDmitReport = (body: DmitCreateBody) => api<DmitReport>("/v1/dmit/reports", { method: "POST", body });

export async function listDmitReports(offset = 0, signal?: AbortSignal) {
  const r = await api<{ reports?: DmitReportSummary[]; hasMore?: boolean }>(`/v1/dmit/reports?limit=20&offset=${offset}`, { signal });
  return { reports: r?.reports ?? [], hasMore: !!r?.hasMore };
}
export const getDmitReport = (id: string, signal?: AbortSignal) => api<DmitReport>(`/v1/dmit/reports/${encodeURIComponent(id)}`, { signal });
export const deleteDmitReport = (id: string) => api<unknown>(`/v1/dmit/reports/${encodeURIComponent(id)}`, { method: "DELETE" });
export const dmitPrintPath = (id: string) => `/v1/dmit/reports/${encodeURIComponent(id)}/pdf`;
