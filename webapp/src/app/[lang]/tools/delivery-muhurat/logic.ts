import { INTL_LOCALE, type Locale } from "@/i18n/config";
import type { ApprovedWindow, Bi, DmRequest, Hospital, Lang, Parent, RequestDraft } from "@/lib/services/toolsBDelivery";

// Pure helpers of the Delivery Muhurat flow, from the app's features/deliveryMuhurat/logic.ts.

export type StepNo = 1 | 2 | 3 | 4 | 5 | 6;
export const STEP_KEYS = ["mother", "medical", "hospital", "muhurat", "chart", "report"] as const;

/** With a single medically fixed time there is nothing to search: 03 Hospital goes straight to 05 Birth Chart. */
export const nextStep = (step: StepNo, singleFixed: boolean): StepNo => (step === 3 && singleFixed ? 5 : Math.min(step + 1, 6)) as StepNo;
export const prevStep = (step: StepNo, singleFixed: boolean): StepNo => (step === 5 && singleFixed ? 3 : Math.max(step - 1, 1)) as StepNo;

/** Where a saved request reopens. `step` is the last completed step. */
export function resumeStep(r: Pick<DmRequest, "status" | "step" | "singleFixedTime" | "selectedReportId">): StepNo {
  switch (r.status) {
    case "searching":
    case "candidates_ready":
      return 4;
    case "time_selected":
      return 5;
    case "report_generating":
    case "report_ready":
      return 6;
    case "failed":
      return r.selectedReportId ? 6 : r.singleFixedTime ? 3 : 4;
    default:
      return Math.max(1, Math.min((r.step ?? 0) + 1, r.singleFixedTime ? 3 : 4)) as StepNo;
  }
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const LOCAL = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/** Wall-clock minutes of a "YYYY-MM-DDTHH:mm[:ss]" string. Windows are compared, never converted. */
export const localMinutes = (local: string) => {
  const [d, t] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  return Date.UTC(y, m - 1, day, h, mi) / 60000;
};

export type InvalidKey =
  | "name" | "dob" | "tob" | "birthplace" | "country" | "deliveryType" | "windowsNone" | "windowsTooMany" | "windowIncomplete"
  | "windowOrder" | "windowsTooLong" | "fixedTime" | "fixedReason" | "doctorConfirm" | "hospitalName" | "hospitalCity"
  | "hospitalLocation" | "locationConfirm";

export function parentError(p?: Parent): InvalidKey | null {
  if (!p?.name?.trim()) return "name";
  if (!DATE.test(p.dob ?? "")) return "dob";
  if (!TIME.test(p.tob ?? "")) return "tob";
  if (!p.birthplace) return "birthplace";
  return p.country?.trim() ? null : "country";
}

export function windowsError(ws: ApprovedWindow[] | undefined, maxWindowDays: number): InvalidKey | null {
  if (!ws?.length) return "windowsNone";
  if (ws.length > 10) return "windowsTooMany";
  if (ws.some((w) => !LOCAL.test(w.startLocal) || !LOCAL.test(w.endLocal))) return "windowIncomplete";
  if (ws.some((w) => localMinutes(w.startLocal) >= localMinutes(w.endLocal))) return "windowOrder";
  const total = ws.reduce((s, w) => s + localMinutes(w.endLocal) - localMinutes(w.startLocal), 0);
  return total > maxWindowDays * 1440 ? "windowsTooLong" : null;
}

export function medicalError(d: RequestDraft, maxWindowDays: number): InvalidKey | null {
  if (!d.delivery?.type) return "deliveryType";
  if (d.singleFixedTime) {
    if (!LOCAL.test(d.singleFixedTime.local ?? "")) return "fixedTime";
    if (!d.singleFixedTime.reason) return "fixedReason";
  } else {
    const w = windowsError(d.windows, maxWindowDays);
    if (w) return w;
  }
  return d.doctorConfirmed === true ? null : "doctorConfirm";
}

export function hospitalError(h?: Hospital): InvalidKey | null {
  if (!h?.name?.trim()) return "hospitalName";
  if (!h.city?.trim() || !h.country?.trim()) return "hospitalCity";
  const located = Number.isFinite(h.lat) && Number.isFinite(h.lng) && Math.abs(h.lat) <= 90 && Math.abs(h.lng) <= 180 && !!h.tz?.trim();
  if (!located || (h.lat === 0 && h.lng === 0)) return "hospitalLocation";
  return h.confirmed ? null : "locationConfirm";
}

export function stepError(step: StepNo, d: RequestDraft, maxWindowDays: number): InvalidKey | null {
  if (step === 1) return parentError(d.mother);
  if (step === 2) return medicalError(d, maxWindowDays);
  if (step === 3) return hospitalError(d.hospital);
  return null;
}

export function firstInvalidStep(d: RequestDraft, maxWindowDays: number): StepNo {
  return (([1, 2, 3] as StepNo[]).find((n) => stepError(n, d, maxWindowDays)) ?? 6) as StepNo;
}

export const draftFrom = ({ id, step, mother, delivery, hospital, windows, singleFixedTime, doctorConfirmed }: DmRequest): RequestDraft => ({
  id, step, mother, delivery, hospital, windows, singleFixedTime, doctorConfirmed,
});

/** POST /requests body for a Next on `step`: the resume point never moves back and half-filled rows are held back. */
export function draftPayload(d: RequestDraft, step: StepNo): RequestDraft {
  const he = hospitalError(d.hospital);
  const fixed = d.singleFixedTime;
  return {
    ...d,
    step: Math.max(d.step ?? 0, step),
    hospital: !he || he === "locationConfirm" ? d.hospital : undefined,
    windows: d.windows?.filter((w) => LOCAL.test(w.startLocal) && LOCAL.test(w.endLocal)),
    singleFixedTime: fixed && !LOCAL.test(fixed.local) ? undefined : fixed,
  };
}

/** A time outside every approved window gives a hypothetical chart, never a muhurat. Half-open, as on the server. */
export const insideWindows = (local: string, ws: ApprovedWindow[] = []) =>
  ws.some((w) => localMinutes(w.startLocal) <= localMinutes(local) && localMinutes(local) < localMinutes(w.endLocal));

export const pickBi = (b: Bi | undefined | null, lang: Lang) => (b ? (lang === "hi" ? b.hi || b.en : b.en || b.hi) : "");

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-11-11" as "11 Nov 2026" (or the Hindi month) in the page's language. The data stays ISO. */
export const dateLabel = (ymd: string | null | undefined, locale: Locale): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd ?? "");
  if (!m) return ymd ?? "";
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};

/** "13:05" as "1:05 PM". */
export const hm12 = (hhmm?: string | null): string => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm ?? "");
  if (!m) return hhmm ?? "";
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
};
export const hm12All = (text: string): string => text.replace(/\b\d{1,2}:\d{2}\b/g, hm12);

/** Offset of the hospital's wall clock from UTC at the birth instant. */
export const offsetMsOf = (birthLocal: string, utcMs: number) => localMinutes(birthLocal) * 60000 - utcMs;
export function wallClock(utcMs: number, offsetMs: number) {
  const d = new Date(utcMs + offsetMs);
  return { date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` };
}

/** Degrees in a sign as d°m′. */
export const dms = (deg: number) => {
  const total = Math.round(deg * 60);
  return `${Math.floor(total / 60)}°${pad(total % 60)}′`;
};
