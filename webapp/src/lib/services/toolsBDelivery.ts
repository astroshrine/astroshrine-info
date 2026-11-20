import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";

// Delivery Muhurat & Newborn Kundli on the shared backend (/v1/delivery-muhurat), the same calls and shapes as
// the app's features/deliveryMuhurat. The server searches the doctor-approved windows, charges, casts the chart
// and writes the report. Searching and selecting a time can charge points (config.pricePoints); nothing here
// is called until the visitor presses the matching button.

export type Graha = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';
export const GRAHAS: readonly Graha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
export type SaptaGraha = Exclude<Graha, 'Rahu' | 'Ketu'>;
export const SAPTA_GRAHAS: readonly SaptaGraha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

export type Lang = 'hi' | 'en';
/** Bilingual string from the API. Hindi is Devanagari. */
export interface Bi {
  en: string;
  hi: string;
}
export interface Place {
  name: string;
  lat: number;
  lng: number;
  tz: string;
}
export interface Span {
  startMs: number;
  endMs: number;
}

export interface CalcMeta {
  engine: string;
  ayanamsa: 'lahiri';
  ayanamsaDeg: number;
  node: 'mean' | 'true';
  houseSystem: 'whole-sign';
  sunrise: string;
  calculatedAt: string;
}

export type Dignity = 'exalted' | 'moolatrikona' | 'own' | 'friend' | 'neutral' | 'enemy' | 'debilitated';

export interface PlanetPos {
  graha: Graha;
  lon: number;
  speed: number;
  sign: number;
  degInSign: number;
  nakshatra: number;
  pada: 1 | 2 | 3 | 4;
  house: number;
  retro: boolean;
  combust: boolean;
  dignity: Dignity;
}

export interface Chart {
  utcMs: number;
  place: Place;
  ascLon: number;
  ascSign: number;
  ascDegInSign: number;
  ascNakshatra: number;
  ascPada: 1 | 2 | 3 | 4;
  planets: Record<Graha, PlanetPos>;
  meta: CalcMeta;
}

export interface Panchang {
  utcMs: number;
  vara: number;
  varaName: Bi;
  tithi: {index: number; paksha: 'shukla' | 'krishna'; name: Bi; endMs: number};
  nakshatra: {index: number; pada: 1 | 2 | 3 | 4; name: Bi; lord: Graha; endMs: number};
  yoga: {index: number; name: Bi; endMs: number};
  karana: {index: number; name: Bi; endMs: number};
  sunrise: number;
  sunset: number;
  moonrise: number | null;
  moonset: number | null;
}

export interface VargaChart {
  div: number;
  name: Bi;
  signifies: Bi;
  ascSign: number;
  signs: Record<Graha, number>;
  timeSensitive: boolean;
}

export interface Ashtakavarga {
  bav: Record<SaptaGraha, number[]>;
  sav: number[];
  total: number;
  houseNotes: {area: string; house: number; bindus: number; note: Bi}[];
}

export interface Avakhada {
  varna: Bi;
  vashya: Bi;
  yoni: Bi;
  gana: Bi;
  nadi: Bi;
  rashi: Bi;
  rashiLord: Graha;
  nakshatra: Bi;
  nakshatraLord: Graha;
  pada: number;
  tatva: Bi;
  paya: {value: Bi; method: Bi};
  akshar: Bi;
  tithi: Bi;
  yoga: Bi;
  karana: Bi;
  vara: Bi;
}

export interface DashaPeriod {
  lord: Graha;
  startMs: number;
  endMs: number;
  children?: DashaPeriod[];
}
export interface Vimshottari {
  balance: {lord: Graha; years: number; months: number; days: number; fractionRemaining: number};
  mahadashas: DashaPeriod[];
}

export interface YogaHit {
  key: string;
  name: Bi;
  kind: string;
  grahas: Graha[];
  note: Bi;
  strength: number;
}

export interface FullChart {
  chart: Chart;
  panchang: Panchang;
  vargas: VargaChart[];
  ashtakavarga: Ashtakavarga;
  avakhada: Avakhada;
  dasha: Vimshottari;
  analysis: {yogas: YogaHit[]; doshas: {key: string; name: Bi; present: boolean; note: Bi}[]};
  highVargaNote: Bi;
}

// ---------------------------------------------------------------- search

export type ScoreComponent =
  | 'lagna'
  | 'moon'
  | 'key_houses'
  | 'dusthana'
  | 'kendra_trikona'
  | 'dignity'
  | 'navamsha'
  | 'yogas'
  | 'arishta'
  | 'dasha'
  | 'shadbala'
  | 'balance';
export const SCORE_COMPONENTS: readonly ScoreComponent[] = [
  'lagna',
  'moon',
  'key_houses',
  'dusthana',
  'kendra_trikona',
  'dignity',
  'navamsha',
  'yogas',
  'arishta',
  'dasha',
  'shadbala',
  'balance',
];

export interface ScoreBreakdown {
  component: ScoreComponent;
  score: number;
  weight: number;
  points: number;
  computed: boolean;
  notes: Bi[];
}
export interface ChartSummary {
  ascSign: number;
  ascDegInSign: number;
  moonSign: number;
  nakshatra: number;
  pada: 1 | 2 | 3 | 4;
  keyPlanets: {graha: Graha; sign: number; house: number; dignity: Dignity; retro: boolean; combust: boolean}[];
  d9AscSign: number;
  d9MoonSign: number;
  yogas: {key: string; name: Bi}[];
  dashaAtBirth: {lord: Graha; balanceYears: number};
}
export interface Candidate {
  id?: string;
  rank: 1 | 2 | 3;
  birthUtcMs: number;
  birthLocal: string; // hospital wall clock "YYYY-MM-DDTHH:mm:ss"
  totalScore: number; // 0..100 — an astrological rank, never "best"
  breakdown: ScoreBreakdown[];
  softPenalties: {key: string; label: Bi; points: number}[];
  panchang: Panchang;
  chartSummary: ChartSummary;
  whyChosen: Bi;
  whyNotBetter: Bi;
  relaxed: boolean;
  lagnaTable?: DayLagnaTable; // brief §15; absent on candidates searched before it existed
}
/** One lagna of the candidate's day at the hospital. Information only: never selectable. */
export interface LagnaRow {
  sign: number;
  startMs: number;
  endMs: number;
  time: string; // "HH:MM–HH:MM", hospital wall clock
  cls: 'shreshth' | 'madhyam' | 'varjit';
  notes: Bi[];
  out: boolean; // wholly outside the doctor-approved windows
  here: boolean; // holds this candidate's time
}
export interface DayLagnaTable {
  sunrise: number;
  nextSunrise: number;
  best: Bi; // shreshth lagnas inside the approved windows
  rows: LagnaRow[];
}
export interface RejectionSummary {
  key: string;
  label: Bi;
  minutes: number;
}

// ---------------------------------------------------------------- report

export type ReportKind = 'muhurat' | 'doctor_fixed' | 'manual_in_window' | 'hypothetical';
export interface NameEntry {
  name: string;
  nameHi: string;
  gender: 'boy' | 'girl' | 'unisex';
  meaningEn: string;
  meaningHi: string;
  style: 'traditional' | 'modern';
}
export type ReportSectionKey =
  | 'education'
  | 'career'
  | 'wealth'
  | 'marriage_family'
  | 'spirituality'
  | 'health_tendencies'
  | 'strengths_guidance'
  | 'final_summary';
export const REPORT_SECTIONS: readonly ReportSectionKey[] = [
  'education',
  'career',
  'wealth',
  'marriage_family',
  'spirituality',
  'health_tendencies',
  'strengths_guidance',
  'final_summary',
];
export interface ReportJson {
  language: Lang;
  kind: ReportKind;
  title: string;
  birth: {utcMs: number; local: string; place: Place};
  parents: {mother: string; father: string};
  houses: {house: number; title: string; paragraphs: string[]}[];
  sections: Record<ReportSectionKey, string[]>;
  careerDomains: string[];
  dashaTimeline: {lord: Graha; startMs: number; endMs: number; ageFrom: number; ageTo: number; themes: string}[];
  names: {syllables: Bi[]; boy: NameEntry[]; girl: NameEntry[]};
  disclaimer: string;
}

// ---------------------------------------------------------------- API (plan §4)

export type PregnancyStatus = 'first' | 'second_plus' | 'other';
export interface Parent {
  name: string;
  dob: string; // YYYY-MM-DD
  tob: string | null; // HH:mm; null = time unknown
  birthplace: Place | null;
  country: string;
  currentCity?: string; // mother only
  pregnancyStatus?: PregnancyStatus; // mother only
  lastDeliveryDate?: string | null; // YYYY-MM-DD; mother only, relevant when pregnancyStatus is second_plus
}
export type DeliveryType = 'normal' | 'planned_c_section' | 'elective_c_section';
export type FixedReason = 'doctor_fixed' | 'emergency' | 'only_one_possible';
export interface Hospital {
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  tz: string;
  address?: string;
  confirmed: boolean;
}
export interface ApprovedWindow {
  startLocal: string; // YYYY-MM-DDTHH:mm, hospital wall clock
  endLocal: string;
}
export interface RequestDraft {
  id?: string;
  step?: number; // last completed step (1..6)
  mother?: Parent;
  delivery?: {type: DeliveryType; expectedDate?: string};
  hospital?: Hospital;
  windows?: ApprovedWindow[];
  singleFixedTime?: {local: string; reason: FixedReason} | null;
  doctorConfirmed?: boolean;
}
export type RequestStatus =
  | 'draft'
  | 'searching'
  | 'candidates_ready'
  | 'time_selected'
  | 'report_generating'
  | 'report_ready'
  | 'failed';
export type DmRequest = RequestDraft & {
  id: string;
  status: RequestStatus;
  doctorConfirmedAt: string | null;
  relaxed: boolean;
  pointsCharged: number;
  error: string | null;
  selectedReportId: string | null;
  createdAt: string;
  updatedAt: string;
};
export type RequestSummary = Pick<DmRequest, 'id' | 'status' | 'step' | 'createdAt' | 'updatedAt' | 'selectedReportId'> & {
  motherName: string;
  hospitalName: string;
};
export type ReportStatus = 'chart_ready' | 'generating' | 'in_review' | 'ready' | 'failed';
export interface DmReport {
  id: string;
  requestId: string;
  kind: ReportKind;
  status: ReportStatus;
  languagesReady: Lang[];
  birthLocal: string;
  full: FullChart;
  report: ReportJson | null;
  disclaimer: Bi;
  generatedAt: string | null;
}
export interface DmConfig {
  enabled: boolean;
  pricePoints: number;
  disclaimer: Bi;
  maxWindowDays: number;
}
export interface CandidatesResponse {
  status: RequestStatus;
  relaxed: boolean;
  candidates: Candidate[];
  rejected: RejectionSummary[];
  scannedMinutes: number;
  noneReason?: Bi;
  disclaimer: Bi;
}
export interface SelectResponse {
  reportId: string;
  kind: ReportKind;
  full: FullChart;
  disclaimer: Bi;
}

// ─── Calls ──────────────────────────────────────────────────────────────────

const BASE = "/v1/delivery-muhurat";
const id = (s: string) => encodeURIComponent(s);

/** GET /config: open to every signed-in user. `enabled` false = not switched on for customers. */
export const getDmConfig = (signal?: AbortSignal) => api<DmConfig>(`${BASE}/config`, { signal });

export const listDmRequests = async (signal?: AbortSignal) => (await api<{ requests?: RequestSummary[] }>(`${BASE}/requests`, { signal }))?.requests ?? [];

export const getDmRequest = (requestId: string) => api<DmRequest>(`${BASE}/requests/${id(requestId)}`);

/** Creates the draft, or updates it when draft.id is set. */
export const saveDmRequest = (draft: RequestDraft) => api<DmRequest>(`${BASE}/requests`, { method: "POST", body: draft });

/** 202: the search runs as a job; poll getDmCandidates while status is "searching". May charge. */
export const startDmSearch = (requestId: string, relaxed = false) =>
  api<{ requestId: string; status: "searching" }>(`${BASE}/requests/${id(requestId)}/search`, { method: "POST", body: { relaxed } });

export const getDmCandidates = (requestId: string, signal?: AbortSignal) => api<CandidatesResponse>(`${BASE}/requests/${id(requestId)}/candidates`, { signal });

export const compareDmCandidates = (ids: string[]) => api<{ candidates: Candidate[]; disclaimer: Bi }>(`${BASE}/compare?ids=${encodeURIComponent(ids.join(","))}`);

/** A ranked candidate, or a wall-clock time (doctor-fixed / manual / hypothetical: the server decides the kind). */
export const selectDmTime = (requestId: string, body: { candidateId: string } | { fixedTimeLocal: string }) =>
  api<SelectResponse>(`${BASE}/requests/${id(requestId)}/select`, { method: "POST", body });

/** 202: poll getDmReport while status is "generating". */
export const generateDmReport = (requestId: string, language: Lang) =>
  api<{ reportId: string; status: ReportStatus }>(`${BASE}/requests/${id(requestId)}/report`, { method: "POST", body: { language } });

export const getDmReport = (reportId: string, lang?: Lang, signal?: AbortSignal) =>
  api<DmReport>(`${BASE}/reports/${id(reportId)}${lang ? `?lang=${lang}` : ""}`, { signal });

export type DmErrorKey =
  | "insufficientBalance"
  | "disabled"
  | "inReview"
  | "locked"
  | "singleFixedTime"
  | "jobRunning"
  | "notReady"
  | "rateLimited"
  | "validation"
  | "notFound"
  | "failed";

/** The error key (deliveryMuhurat.error.*) for a failed call, from the backend's status and error code. */
export function dmErrorKey(e: unknown): DmErrorKey {
  if (!(e instanceof ApiError)) return "failed";
  const code = e.message;
  if (e.status === 402 || code === "insufficient_balance") return "insufficientBalance";
  if (code === "in_review") return "inReview";
  if (code === "request_locked") return "locked";
  if (e.status === 403 || code === "delivery_muhurat_disabled") return "disabled";
  if (code === "single_fixed_time") return "singleFixedTime";
  if (code === "job_running") return "jobRunning";
  if (code === "not_ready") return "notReady";
  if (e.status === 429) return "rateLimited";
  if (e.status === 400) return "validation";
  if (e.status === 404) return "notFound";
  return "failed";
}
