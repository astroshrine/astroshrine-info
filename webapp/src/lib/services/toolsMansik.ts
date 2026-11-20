import { api } from "@/lib/api";
import type { ToolPlace } from "./tools";

// Mansik Pravritti report and Jeevan Ghatna Margdarshan (React-native-app: features/mansik, features/jeevan).
// One POST each; the backend saves the report to /v1/tool-results itself and answers with its savedId.

export type ReportLang = "hinglish" | "english";

/** The backend's "year ahead" block that every AI reading can carry (src/services/yearAhead). */
export type YearQuarter = { period: string; good: string[]; challenges: string[] };
export type YearAhead = { impact: string; quarters: YearQuarter[] };

export type MansikCat =
  | "chinta" | "udaasi" | "mood_swing" | "overthinking_ocd" | "shak" | "dar" | "detachment" | "purane_dard_ka_asar" | "child_behaviour";
export type MansikSubject = { name: string; dob: string; tob?: string; place: ToolPlace; language: ReportLang; isChild: boolean };
export type MansikBody = {
  subject: MansikSubject;
  scores: Partial<Record<MansikCat, { pct: number; level: "halka" | "madhyam" | "zyada" }>>;
  flag_only_triggered: boolean;
  safety_triggered: boolean;
};
export type MansikOutput = {
  namaskar: string;
  swabhaav: string;
  samay: string;
  jawabon_se: string;
  upay: string[];
  disclaimer: string;
  support?: string;
  year_ahead?: YearAhead;
};
/** kundliOnly: built from birth details alone (the questionnaire skipped). */
export type MansikReport = {
  safety: boolean;
  output: MansikOutput | null;
  applicable: MansikCat[];
  createdAt: string;
  name?: string;
  kundliOnly?: boolean;
  savedId?: string;
};

/** POST /v1/mansik/reports (astrologer only; hourly cap -> 429). Can take a minute. */
export function createMansikReport(body: MansikBody, signal?: AbortSignal) {
  return api<MansikReport>("/v1/mansik/reports", { method: "POST", body, signal });
}

export type JeevanTopic = "T1" | "T2" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8" | "T9" | "T10" | "T11" | "T12" | "T13";
export type JeevanBody = {
  subject: { name: string; dob: string; tob?: string; place: ToolPlace; language: ReportLang; tobCertain: boolean };
  topic: JeevanTopic;
  answers: { q: string; a: string }[];
};
export type JeevanOutput = {
  warning?: string;
  namaskar: string;
  rujhaan: string;
  samay: string;
  jawabon_se: string;
  asli_kadam: string[];
  upay: string[];
  disclaimer: string;
  year_ahead?: YearAhead;
};
export type JeevanReport = {
  safety: boolean;
  topic: JeevanTopic;
  output: JeevanOutput | null;
  level?: string;
  createdAt: string;
  name?: string;
  kundliOnly?: boolean;
  savedId?: string;
};

/** POST /v1/jeevan/reports (astrologer only). */
export function createJeevanReport(body: JeevanBody, signal?: AbortSignal) {
  return api<JeevanReport>("/v1/jeevan/reports", { method: "POST", body, signal });
}
