/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadMuhuratEngine } from "@/lib/services/toolsBMuhurat";

// The Muhurat engine (UniversalMuhurta) in Hindi: the Sanskar logic reads its Hindi names and reasons and pairs
// them with English ones itself (names.ts). Loaded once, when the visitor starts a search; the module is large.
let UM: any = null;

export async function ensureEngine(): Promise<any> {
  return (UM ??= await loadMuhuratEngine("hi"));
}

/** The engine, once ensureEngine() has resolved. */
export function muhuratEngine(): any {
  if (!UM) throw new Error("The muhurat engine is not loaded yet");
  return UM;
}

/** Offset of an IANA zone from UTC in hours at a wall clock time (the app's tzHours). NaN for an unknown zone. */
export function tzHours(zone: string, date: string, time: string): number {
  if (/Kolkata|Calcutta/.test(zone)) return 5.5;
  try {
    const utc = Date.parse(`${date}T${time}:00Z`);
    const f = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" });
    const p: Record<string, number> = {};
    for (const x of f.formatToParts(utc)) p[x.type] = +x.value;
    return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - utc) / 36e5;
  } catch {
    return NaN;
  }
}
