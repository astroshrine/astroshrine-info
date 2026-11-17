import { api } from "@/lib/api";

// Integrated Reading (astrologer-only): one unified answer per question, weighed across kundli / dasha / gochar
// and numerology, computed on the server from the birth details. The same calls as the app's
// features/integratedReading/integratedReadingApi.ts. The palm, face, signature and Vastu sources of the app need
// other features (saved palm/face reports, a photo analysis); the website sends the kundli and numerology only,
// and the report says which sources were not included.

export type Lang = "en" | "hi";
export type Gender = "male" | "female" | "other";
export type MaritalStatus = "single" | "married" | "other";
export const MARITAL: MaritalStatus[] = ["single", "married", "other"];
export const GENDERS: Gender[] = ["male", "female", "other"];
export const MAX_QUESTIONS = 5;
export const CONSENT_TEXT_VERSION = "v1";
/** With nothing picked or typed, the app sends this many of the bank's most-asked questions. */
export const DEFAULT_QUESTIONS = 3;

export type Discipline = "astrology" | "palmistry" | "numerology" | "face" | "signature";
export type Confidence = "strong" | "medium" | "subtle";
export type AnswerFlag = "none" | "distress" | "reframed";
export type Answer = { question: string; conclusion: string; confidence: Confidence; basis: string; timing: string; suggestion: string; remedy: string; flag: AnswerFlag };
export type YearAhead = { impact: string; quarters: { period: string; good: string[]; challenges: string[] }[] };
export type Output = { intro: string; answers: Answer[]; summary: string; year_ahead?: YearAhead; remedies: string[]; closing: string };
export type Titles = {
  sections: Record<"intro" | "answers" | "summary" | "remedies" | "closing", string>;
  fields: Record<"conclusion" | "confidence" | "basis" | "timing" | "suggestion" | "remedy", string>;
  confidence: Record<Confidence, string>;
  disciplines: Record<Discipline, string>;
};
export type BankQuestion = { id: string; q: string; type?: string; level?: string; vastu?: boolean };
export type QuestionBank = {
  version: string;
  mostAsked: BankQuestion[];
  categories: { id: string; name: string; questions: BankQuestion[] }[];
};
export type Place = { name: string; lat: number; lng: number; tz: string };
export type Subject = { name: string; dob?: string; tob?: string; place?: Place; language: Lang; gender: Gender; maritalStatus: MaritalStatus };
export type IntegratedReading = {
  id: string;
  subject: Subject;
  questions: { id?: string; q: string }[];
  sourcesUsed: Discipline[];
  sourcesMissing: Discipline[];
  vastuUsed?: boolean;
  output: Output;
  titles: Titles;
  disclaimer: string;
  createdAt: string;
};
export type IntegratedReadingSummary = { id: string; name: string; createdAt: string };

export type CreateBody = {
  subject: Subject;
  consent: { accepted: true; textVersion: string };
  questions: ({ id: string } | { q: string })[];
};

const BASE = "/v1/integrated-reading";

/** GET /questions: static, in Hindi. */
export const fetchQuestionBank = (signal?: AbortSignal) => api<QuestionBank>(`${BASE}/questions`, { signal });

/** POST /reports: one long call. The server computes the sources and writes the whole reading (about a minute). */
export const createIntegratedReading = (body: CreateBody, signal?: AbortSignal) => api<IntegratedReading>(`${BASE}/reports`, { method: "POST", body, signal });

export const listIntegratedReadings = (offset = 0, limit = 20, signal?: AbortSignal) =>
  api<{ reports: IntegratedReadingSummary[]; hasMore: boolean }>(`${BASE}/reports?limit=${limit}&offset=${offset}`, { signal }).then((r) => ({
    reports: r?.reports ?? [],
    hasMore: !!r?.hasMore,
  }));

export const getIntegratedReading = (id: string, signal?: AbortSignal) => api<IntegratedReading>(`${BASE}/reports/${encodeURIComponent(id)}`, { signal });
export const deleteIntegratedReading = (id: string) => api<unknown>(`${BASE}/reports/${encodeURIComponent(id)}`, { method: "DELETE" });
