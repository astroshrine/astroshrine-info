/* eslint-disable */
/**
 * Secondary panchang cross-check (brief §2.1, plan §5): the AstroShrine ephemeris service, via
 * POST /v1/sanskar-muhurat/crosscheck, at each candidate's printed start and end minute. Every
 * difference is shown with both values and marks the candidate VERIFICATION REQUIRED — at a window
 * edge any categorical difference can change the verdict.
 */
import { api } from '@/lib/api';
import {muhuratEngine} from './engine';
import type {Bi} from './kb';
import {KARANA_EN, NAK_EN, RASHI_EN, YOGA_EN, tithiEn} from './names';
import type {Candidate, Venue} from './search';

export interface Angas {
  tithiIdx: number; // 0..29
  nakIdx: number;
  pada: number;
  yogaIdx: number;
  karanaIdx: number; // 0..59
  lagnaSign: number | null;
}
export interface CrossRow {
  field: Bi;
  at: 'start' | 'end';
  primary: Bi;
  secondary: Bi;
  same: boolean;
}
export interface CrossCheck {
  available: boolean;
  source: string;
  rows: CrossRow[];
  mismatch: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

/** The primary (on-device) values at a local minute of the venue. */
export function primaryAt(date: string, min: number, v: Pick<Venue, 'lat' | 'lon' | 'tz'>): Angas {
  const UM = muhuratEngine();
  const Y = +date.slice(0, 4);
  const jd = UM.julianDay(Y, +date.slice(5, 7), +date.slice(8, 10), min / 60 - v.tz);
  const p = UM.panchangAt(jd, Y),
    tt = UM.jdTT(jd, Y);
  const asc = (((UM.ascendantTropical(jd, tt, v.lon, v.lat).asc - UM.ayanamsa(tt)) % 360) + 360) % 360;
  return {tithiIdx: p.tithiIdx, nakIdx: p.nakIdx, pada: p.pada, yogaIdx: p.yogaIdx, karanaIdx: p.karanaIdx, lagnaSign: Math.floor(asc / 30)};
}

const KARANA_MOV = ['बव', 'बालव', 'कौलव', 'तैतिल', 'गर', 'वणिज', 'विष्टि'];
const karanaHi = (k: number) => (k === 0 ? 'किंस्तुघ्न' : k >= 57 ? ['शकुनि', 'चतुष्पद', 'नाग'][k - 57] : KARANA_MOV[(k - 1) % 7]);
const FIELDS: {key: keyof Angas; label: Bi; name: (x: number) => Bi}[] = [
  {
    key: 'tithiIdx',
    label: {hi: 'तिथि', en: 'Tithi'},
    name: x => {
      const UM = muhuratEngine();
      return {hi: `${x < 15 ? 'शुक्ल' : 'कृष्ण'} ${UM.TITHI[x]}`, en: tithiEn(x < 15 ? 'shukla' : 'krishna', (x % 15) + 1)};
    },
  },
  {key: 'nakIdx', label: {hi: 'नक्षत्र', en: 'Nakshatra'}, name: x => ({hi: muhuratEngine().NAK[x], en: NAK_EN[x]})},
  {key: 'pada', label: {hi: 'पद', en: 'Pada'}, name: x => ({hi: String(x), en: String(x)})},
  {key: 'yogaIdx', label: {hi: 'योग', en: 'Yoga'}, name: x => ({hi: muhuratEngine().YOGA[x], en: YOGA_EN[x]})},
  {key: 'karanaIdx', label: {hi: 'करण', en: 'Karana'}, name: x => ({hi: karanaHi(x), en: KARANA_EN[karanaHi(x)]})},
  {key: 'lagnaSign', label: {hi: 'लग्न', en: 'Lagna'}, name: x => ({hi: muhuratEngine().RASHI[x], en: RASHI_EN[x]})},
];

/** Pure comparison, one row per field and edge; a field the service didn't return is left out. */
export function compare(primary: {start: Angas; end: Angas}, secondary: {start: Partial<Angas> | null; end: Partial<Angas> | null}): CrossRow[] {
  const rows: CrossRow[] = [];
  for (const at of ['start', 'end'] as const) {
    const s = secondary[at];
    if (!s) {
      continue;
    }
    for (const f of FIELDS) {
      const a = primary[at][f.key],
        b = s[f.key];
      if (a == null || b == null) {
        continue;
      }
      rows.push({field: f.label, at, primary: f.name(a), secondary: f.name(b), same: a === b});
    }
  }
  return rows;
}

export const UNAVAILABLE = (source = 'AstroShrine ephemeris service'): CrossCheck => ({available: false, source, rows: [], mismatch: false});

/** One request for every candidate's start and end (at most 12 instants). */
export async function crossCheck(cands: Candidate[], venue: Venue): Promise<Record<string, CrossCheck>> {
  const list = cands.slice(0, 6);
  if (!list.length) {
    return {}; // no candidate, nothing to check (the service takes 1-12 instants)
  }
  const instants = list.flatMap(c => [
    {date: c.date, time: hhmm(c.startMin)},
    {date: c.date, time: hhmm(c.endMin)},
  ]);
  let data: any;
  try {
    data = await api('/v1/sanskar-muhurat/crosscheck', {method: 'POST', body: {lat: venue.lat, lon: venue.lon, tz: venue.tz, instants}});
  } catch {
    data = null;
  }
  const out: Record<string, CrossCheck> = {};
  list.forEach((c, i) => {
    if (!data?.available) {
      out[c.id] = UNAVAILABLE(data?.source);
      return;
    }
    const at = (k: number) => {
      const r = data.results?.[k];
      return r?.ok ? r : null;
    };
    const rows = compare(
      {start: primaryAt(c.date, c.startMin, venue), end: primaryAt(c.date, c.endMin, venue)},
      {start: at(2 * i), end: at(2 * i + 1)},
    );
    out[c.id] = rows.length ? {available: true, source: data.source, rows, mismatch: rows.some(r => !r.same)} : UNAVAILABLE(data.source);
  });
  return out;
}

/** The candidate with the cross-check's flag and §14 check row. */
export function withCrossCheck(c: Candidate, x: CrossCheck): Candidate {
  const flags = x.mismatch
    ? [...c.flags, {hi: 'पंचांग स्रोतों में भिन्नता — दोनों मान नीचे दिए हैं', en: 'The panchang sources differ — both values are shown below'}]
    : c.flags;
  const check = {
    item: {hi: 'द्वितीय स्रोत से पंचांग मिलान', en: 'Panchang cross-check with the second source'},
    status: (x.available ? (x.mismatch ? 'uncertain' : 'pass') : 'uncertain') as 'pass' | 'uncertain',
    note: x.available
      ? undefined
      : {hi: 'द्वितीय स्रोत उपलब्ध नहीं — केवल प्राथमिक गणना', en: 'Secondary cross-check unavailable — primary computation only'},
  };
  return {...c, flags, checks: [...c.checks.filter(k => k.item.en !== check.item.en), check]};
}
