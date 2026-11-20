import type { CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import { grahaAbbr, type ChartHouse, type Graha, type Sheet, type SheetRow } from "@/lib/jyotish";
import type { ChartCell } from "./DesignChart";

/** Plain-data helpers over the kundli sheet for the session's kundli tools. Nothing here is invented: it all reads the sheet. */

export const SIGN_LORD: Graha[] = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];

/** The dot colour of each planet in the tables. */
export const GRAHA_COLOR: Record<string, string> = {
  Sun: "#E4572E",
  Moon: "#8E93A6",
  Mars: "#C0392B",
  Mercury: "#1F8A4C",
  Jupiter: "#FFAE00",
  Venus: "#D16A93",
  Saturn: "#3B5BA5",
  Rahu: "#5B4B8A",
  Ketu: "#8A5A00",
  Lagna: "#FFAE00",
};
/** Text on a badge of that colour. */
export const badgeInk = (graha: string) => (graha === "Jupiter" || graha === "Lagna" ? "#14213D" : "#FFFFFF");

export const lagnaRow = (s: Sheet) => s.rows.find((r) => r.graha === "Lagna")!;
export const rowOf = (s: Sheet, g: Graha) => s.rows.find((r) => r.graha === g);
/** House (1..12) of a sign counted from a base sign. */
export const houseFrom = (rashi: number, base: number) => ((rashi - base + 12) % 12) + 1;
export const houseOf = (s: Sheet, r: SheetRow) => houseFrom(r.rashi, lagnaRow(s).rashi);
/** Whole degrees from a "12°14'08"" string. */
export const degOf = (dms: string) => parseInt(dms, 10) || 0;
/** The houses a graha rules for this ascendant. */
export const housesRuledBy = (s: Sheet, g: Graha) => Array.from({ length: 12 }, (_, i) => i + 1).filter((h) => SIGN_LORD[(lagnaRow(s).rashi - 1 + h - 1) % 12] === g);
/** Longitude of a row, from its sign and degrees. */
export const lonOf = (r: SheetRow) => (r.rashi - 1) * 30 + (parseInt(r.dms, 10) || 0) + (parseInt(r.dms.split("°")[1] ?? "0", 10) || 0) / 60;

const noRetro = (g: string) => g === "Rahu" || g === "Ketu" || g === "Lagna";
const ASC_STYLE: CSSProperties = { color: "var(--color-brand-strong)" };

/** D1 with the degrees, as the design writes them. */
export function d1Cells(s: Sheet, locale: Locale, asc: string, retro: string): ChartCell[] {
  const lagna = lagnaRow(s).rashi;
  return Array.from({ length: 12 }, (_, i) => {
    const sign = ((lagna - 1 + i) % 12) + 1;
    return {
      sign,
      items: s.rows
        .filter((r) => r.rashi === sign)
        .map((r) => ({
          ab: (r.graha === "Lagna" ? asc : grahaAbbr(r.graha, locale)) + (r.retro && !noRetro(r.graha) ? ` (${retro})` : ""),
          deg: `${degOf(r.dms)}°`,
          style: r.graha === "Lagna" ? ASC_STYLE : undefined,
        })),
    };
  });
}

/** The ready-made charts of the sheet (Moon chart, navamsha), with the ascendant added to the Moon chart. */
export function houseCells(houses: ChartHouse[], locale: Locale, retroOf: (graha: Graha) => string, asc?: { rashi: number; label: string }): ChartCell[] {
  return houses.map((h) => ({
    sign: h.rashi,
    items: [
      ...(asc && asc.rashi === h.rashi ? [{ ab: asc.label, style: ASC_STYLE }] : []),
      ...h.planets.map((p) => ({ ab: grahaAbbr(p.graha, locale) + (p.retro && !noRetro(p.graha) ? retroOf(p.graha) : "") })),
    ],
  }));
}

/** The Sarvashtakavarga bindus written in the houses, green from 28, red under 25. */
export function savCells(s: Sheet): ChartCell[] {
  const lagna = lagnaRow(s).rashi;
  return Array.from({ length: 12 }, (_, i) => {
    const sign = ((lagna - 1 + i) % 12) + 1;
    const b = s.sav[sign - 1] ?? 0;
    return { sign, items: [{ ab: String(b), style: { color: b >= 28 ? "var(--color-success)" : b < 25 ? "var(--color-danger)" : "var(--color-ink)", fontSize: "1.25em" } }] };
  });
}

/** Whole years, months and days of a decimal number of years (the balance of the dasha at birth). */
export function ymd(years: number) {
  const totalDays = Math.round(years * 365.25);
  const y = Math.floor(totalDays / 365.25);
  const rest = totalDays - Math.round(y * 365.25);
  const m = Math.floor(rest / 30.44);
  const d = Math.max(0, Math.round(rest - m * 30.44));
  return { y, m, d };
}

export type PeriodState = "pre" | "done" | "run" | "up";
export const periodState = (p: { start: string; end: string }, now: number, birth: string): PeriodState => {
  const end = Date.parse(p.end);
  if (end <= Date.parse(`${birth}T00:00:00Z`)) return "pre";
  if (end <= now) return "done";
  return Date.parse(p.start) <= now ? "run" : "up";
};
export const percentDone = (p: { start: string; end: string }, now: number) => {
  const a = Date.parse(p.start);
  const b = Date.parse(p.end);
  return Math.max(0, Math.min(100, Math.round(((now - a) / (b - a)) * 100)));
};

/** The 12 months after `now`: every dasha period of any level that starts in them, in order. */
export type DashaChange = { at: string; lords: string[] };
export function dashaChanges(s: Sheet, now: number, months = 12): DashaChange[] {
  const to = new Date(now);
  to.setMonth(to.getMonth() + months);
  const out: DashaChange[] = [];
  const walk = (nodes: Sheet["dasha"]["vimshottari"]["periods"], chain: string[]) => {
    for (const n of nodes) {
      const at = Date.parse(n.start);
      const lords = [...chain, n.lord];
      if (at > now && at <= to.getTime()) out.push({ at: n.start, lords });
      if (n.sub?.length && Date.parse(n.end) > now && at <= to.getTime()) walk(n.sub, lords);
    }
  };
  walk(s.dasha.vimshottari.periods, []);
  return out.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/** "12:50 am" in English, "रात 12:50" in Hindi (the design's way of writing the time). */
export function clockText(locale: Locale, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const mm = String(m).padStart(2, "0");
  const h12 = h % 12 || 12;
  if (locale === "hi") return `${h < 4 ? "रात" : h < 12 ? "सुबह" : h < 16 ? "दोपहर" : h < 20 ? "शाम" : "रात"} ${h12}:${mm}`;
  return `${h12}:${mm} ${h >= 12 ? "pm" : "am"}`;
}

/** The first part of a place name: "Hyderabad, Telangana 500001, India" becomes "Hyderabad". */
export const cityOf = (place: string) => place.split(",")[0]?.trim() ?? "";

/** "UTC +5:30" for a time zone at a moment. */
export function utcOffsetText(tz: string, ms: number) {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(new Date(ms)).find((p) => p.type === "timeZoneName")?.value ?? "";
    const m = /GMT([+-])(\d{2}):(\d{2})/.exec(part);
    if (!m) return "UTC";
    return `UTC ${m[1]}${Number(m[2])}${m[3] === "00" ? "" : `:${m[3]}`}`;
  } catch {
    return "";
  }
}
