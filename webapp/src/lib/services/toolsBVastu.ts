import { api, ApiError } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { getWalletConfig, type WalletConfig } from "@/lib/services/wallet";
import type { AnalysisRequest, Element, Industry, PropertyType, Pt, RemedyType, ZoneId, ZoneStatus } from "@/lib/vastu/engine";

// 16-zone Vastu Chakra on the shared backend (/v1/vastu), the same calls as the app's vastuService.ts. The
// website draws the plot and computes the zone geometry in the browser (src/lib/vastu/engine.ts, the app's own
// engine); the server charges where it is paid, asks Claude to interpret the geometry and keeps the reports.

export type Bilingual = { en: string; hi: string };
export type Verdict = "good" | "bad" | "mixed" | "neutral";
export type Remedy = Bilingual & { type?: RemedyType };
export type Finding = { zone: ZoneId; element: Element; verdict: Verdict; impact: Bilingual; remedies: Remedy[]; priority: number };
export type Analysis = {
  analysisId: string;
  findings: Finding[];
  summary: Bilingual;
  priorityOrder: ZoneId[];
  pointsCharged?: number;
  pointsBalance?: number;
};
export type ReportSummary = { id: string; title?: string; summary?: Bilingual; createdAt: string; createdByRole?: string; planImageUrl?: string };
/** A saved report. Geometry is copied server-side from the stored analysis request. */
export type SavedReport = ReportSummary & {
  analysisId?: string;
  polygon: Pt[];
  centre: Pt;
  centreAuto?: Pt;
  northOffset: number;
  propertyType?: PropertyType;
  industry?: Industry;
  items: AnalysisRequest["items"];
  zones: Array<{ zone: ZoneId; coveragePct: number; status: ZoneStatus; element: Element }>;
  findings: Finding[];
  priorityOrder?: ZoneId[];
};

/** What the wallet config says about Vastu: whether customers may use it and what a report costs (points). */
export type VastuAccess = { customerEnabled: boolean; price: number };

/** GET /v1/wallet/config: the flag `vastu_customer_enabled` and `vastu_report_points`, as the app reads them. */
export async function getVastuAccess(signal?: AbortSignal): Promise<VastuAccess> {
  const cfg = (await getWalletConfig(signal)) as WalletConfig & { vastu_customer_enabled?: boolean; vastu_report_points?: number };
  return { customerEnabled: cfg.vastu_customer_enabled === true, price: Number(cfg.vastu_report_points) || 0 };
}

/** POST /v1/vastu/analyze. Charges the wallet where the report is paid (402 insufficient_balance when it cannot). The call takes up to ~75 s. */
export const analyzeVastu = (body: AnalysisRequest) => api<Analysis>("/v1/vastu/analyze", { method: "POST", body });

/** POST /v1/vastu/plan-image (multipart, field "image"; JPEG, PNG or WebP, at most 5 MB). `url` is signed for 7 days. */
export async function uploadPlanImage(file: File): Promise<{ url: string; path: string }> {
  const send = async (token: string | null) => {
    const form = new FormData();
    form.append("image", file, file.name);
    return fetch("/api/v1/vastu/plan-image", {
      method: "POST",
      headers: { Accept: "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      body: form,
      cache: "no-store",
    });
  };
  const sb = getSupabase().auth;
  let res = await send((await sb.getSession()).data.session?.access_token ?? null);
  if (res.status === 401) res = await send((await sb.refreshSession()).data.session?.access_token ?? null);
  const body = (await res.json().catch(() => null)) as { url?: string; path?: string; error?: string } | null;
  if (!res.ok || !body?.url || !body.path) throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`);
  return { url: body.url, path: body.path };
}

/** POST /v1/vastu/reports: keeps an analysis in the account's saved reports. */
export const saveVastuReport = (body: { analysisId: string; title?: string; planImagePath?: string; planImageUrl?: string }) =>
  api<{ reportId: string }>("/v1/vastu/reports", { method: "POST", body }).then((r) => r.reportId);

export const VASTU_PAGE_SIZE = 20;
export const listVastuReports = (offset = 0, signal?: AbortSignal) =>
  api<{ reports?: ReportSummary[]; hasMore?: boolean }>(`/v1/vastu/reports?limit=${VASTU_PAGE_SIZE}&offset=${offset}`, { signal }).then((r) => ({
    reports: r?.reports ?? [],
    hasMore: !!r?.hasMore,
  }));

export const getVastuReport = (id: string) => api<SavedReport>(`/v1/vastu/reports/${encodeURIComponent(id)}`);

export const PLAN_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PLAN_IMAGE_MAX = 5 * 1024 * 1024;

export type VastuErrorKey = "insufficientBalance" | "rateLimited" | "disabled" | "failed";
export function vastuErrorKey(e: unknown): VastuErrorKey {
  if (e instanceof ApiError) {
    if (e.status === 402 || e.message === "insufficient_balance") return "insufficientBalance";
    if (e.status === 429) return "rateLimited";
    if (e.status === 403) return "disabled";
  }
  return "failed";
}
