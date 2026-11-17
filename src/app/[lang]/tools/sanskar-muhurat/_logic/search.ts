/* eslint-disable */
/**
 * Sanskar Muhurat search (plan §4) on the device's UniversalMuhurta engine.
 * find() → user filters → best window per day → top 5 → edge-minute recheck (§14) → cards.
 */
import {muhuratEngine} from './engine';
import {
  BASE_TRADITION,
  compileTradition,
  rulesFor,
  stripCitations,
  tagName,
  traditionsOf,
  verdictsFor,
  type Bi,
  type Condition,
  type Facts,
  type Kb,
  type Rule,
  type Sanskar,
  type VerdictKey,
  type Weights,
} from './kb';
type LagnaRows = any;
import {GRAHA_EN, KARANA_EN, NAK_EN, ORD_EN, RASHI_EN, TARA_EN, VAAR_EN, YOGA_EN, tithiEn} from './names';

export interface Birth {
  date: string; // YYYY-MM-DD at the birthplace
  time: string | null; // HH:MM, null = unknown
  tz: number; // hours east of UTC at the birth
  lat: number;
  lon: number;
  place: string;
}
export interface Child {
  name: string;
  gender: 'M' | 'F';
  birth: Birth;
  isEldest: boolean;
}
export interface Venue {
  name: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  tz: number; // hours east of UTC on the ritual dates
}
export type TimeBand = 'any' | 'morning' | 'afternoon' | {from: string; to: string};
export interface Family {
  mode: 'default' | 'oddYear' | 'custom';
  ages: number[]; // custom: months (annaprashan) or years (mundan) of life
  note: string;
}
export interface SearchInput {
  sanskar: Sanskar;
  child: Child;
  motherExpecting: boolean; // mundan only; the neutral optional question
  venue: Venue;
  from: string;
  to: string;
  weekdays: number[] | null; // null = all
  timeBand: TimeBand;
  tradition: string;
  family: Family;
  relaxed?: boolean; // drops weekday/time-band preferences and the forenoon limit — never a nishedha
  lang?: 'hi' | 'en'; // of the lagna table's reasons (default hi)
}
export type CheckStatus = 'pass' | 'uncertain' | 'fail';
export interface Check {
  item: Bi;
  status: CheckStatus;
  note?: Bi;
}
export interface Candidate {
  id: string;
  sanskar: Sanskar;
  date: string;
  vaarIdx: number;
  start: string;
  end: string;
  startMin: number; // minutes after local midnight, after the recheck
  endMin: number;
  durMin: number;
  best: string; // HH:MM, the best moment inside the window (the engine's highest-scoring sample)
  bestMin: number;
  grade: number;
  score: number; // the engine's (DPJ-104)
  weighted: number; // the sub-scores with the admin weights
  subScores: Record<keyof Weights, number>;
  tithi: Bi;
  paksha: 'shukla' | 'krishna';
  tn: number; // 1..15 within the paksha
  nakshatra: Bi;
  nakIdx: number;
  pada: string; // '2' or '2 → 3'
  yoga: Bi;
  karana: Bi;
  lagna: Bi;
  lagSign: number;
  moonSign: Bi;
  sunSign: number;
  maas: {amanta: number; purnimanta: number; adhik: boolean};
  chandrabala: {house: number; status: Bi};
  tarabala: {count: number; tara: number; name: Bi};
  planets: Bi[];
  why: Bi[];
  limits: Bi[];
  age: {n: number; unit: 'months' | 'years'; ok: boolean; family: boolean; allowed: number[]};
  verdicts: {tradition: string; verdict: VerdictKey; rules: Rule[]}[];
  base: {tradition: string; grade: number};
  flags: Bi[]; // each one prints VERIFICATION REQUIRED
  checks: Check[];
  relaxed: boolean;
  sunrise: string;
  sunset: string;
  kaal: {rahu: string; yama: string; gulik: string; bhadra: string[]};
  span: {s: number; e: number}; // the window in UTC ms
  lagnaRows?: LagnaRows | null; // the day's full lagna table (the common rule, lagnaSaarani.ts via UM.lagnaDay)
}
export interface SearchResult {
  input: SearchInput;
  candidates: Candidate[];
  fixedReject: string[];
  excluded: {reason: string; days: number}[];
  windowsFound: number;
  searchedTo: string; // the range is capped at MAX_DAYS
  engine: string;
}

const KARYA: Record<Sanskar, string> = {annaprashan: 'ANNAPRASHAN', mundan: 'MUNDAN'};
const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (min: number) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;
const toMin = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
const dayNo = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 864e5;
const bi = (hi: string, en: string): Bi => ({hi, en});
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export const ageUnit = (s: Sanskar) => (s === 'annaprashan' ? 'months' : 'years');

/** The family's own age convention as engine atoms, printed as "परिवार की परंपरा अनुसार". */
export function familyAtoms(inp: Pick<SearchInput, 'sanskar' | 'family'>): Condition[] {
  const field = inp.sanskar === 'annaprashan' ? 'age_months' : 'age_years';
  if (inp.family.mode === 'oddYear' && inp.sanskar === 'mundan') {
    return [{field, gender: 'any', in: [1, 3, 5, 7, 9, 11], mode: 'only'}];
  }
  if (inp.family.mode === 'custom' && inp.family.ages.length) {
    return [{field, gender: 'any', in: inp.family.ages, mode: 'only'}];
  }
  return [];
}

/** Everything UM.find / UM.evaluate need, shared by the search and the recheck. */
export function engineArgs(inp: SearchInput, kb: Kb) {
  const UM = muhuratEngine();
  const karya = KARYA[inp.sanskar];
  const atoms = [...rulesFor(kb, inp.sanskar).filter(r => r.condition && r.tradition_tag === inp.tradition), ...familyAtoms(inp)];
  let ruleOverride = compileTradition(UM, UM.RULES[karya], atoms, kb.config.toggles);
  if (inp.relaxed) {
    ruleOverride = {...(ruleOverride || {}), time: 'day'};
  }
  const b = inp.child.birth;
  return {
    UM,
    karya,
    ruleOverride,
    rule: {...UM.RULES[karya], ...(ruleOverride || {})},
    persons: [{role: 'child', name: inp.child.name, birth: {date: b.date, time: b.time || undefined, tz: b.tz, lat: b.lat, lon: b.lon}}],
    extra: {
      gender: inp.child.gender,
      isEldest: inp.child.isEldest ? 'Y' : 'N',
      pregnancyMonths: inp.sanskar === 'mundan' && inp.motherExpecting ? 1 : 0,
    },
    place: {lat: inp.venue.lat, lon: inp.venue.lon, tz: inp.venue.tz},
  };
}

/* ---------- reasons, bilingual ---------- */

// ponytail: the engine's reasons are Hindi; these cover what ANNAPRASHAN/MUNDAN produce. Anything else shows the Hindi in both languages.
const DOSHA_EN: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/जन्म तारा/, () => 'Janma tara (the day’s nakshatra falls in the child’s own tara group)'],
  [/लग्न में पाप ग्रह \((.+)\)/, m => `A malefic (${GRAHA_EN[m[1]] || m[1]}) in the muhurat lagna`],
  [/चन्द्र (\S+) भाव — मध्यम बल/, () => 'Middling Chandrabala (Moon in the 2nd, 5th or 9th from the child’s Moon)'],
  [/^(\S+) योग$/, m => `${YOGA_EN[muhuratEngine().YOGA.indexOf(m[1])] || m[1]} yoga — an inauspicious yoga`],
  [/कृष्ण पक्ष \(शुक्ल श्रेष्ठ\)/, () => 'Dark fortnight — the bright fortnight is preferred'],
  [/कृष्ण पक्ष उत्तरार्ध/, () => 'Second half of the dark fortnight'],
  [/मध्यम तिथि/, () => 'A middling tithi for this samskara'],
  [/मध्यम नक्षत्र/, () => 'A middling nakshatra for this samskara'],
  [/मध्यम वार/, () => 'A middling weekday for this samskara'],
  [/लग्न — मध्यम/, () => 'A middling lagna for this samskara'],
  [/जन्म नक्षत्र/, () => 'The child’s birth nakshatra'],
  [/जन्म-मास/, () => 'The child’s birth month'],
  [/जन्म तिथि/, () => 'The child’s birth tithi'],
  [/दग्ध योग/, () => 'Dagdha yoga (weekday–tithi combination)'],
  [/^पंचक/, () => 'Panchak'],
  [/गण्डान्त/, () => 'Nakshatra gandanta'],
  [/चन्द्र षष्ठ/, () => 'Moon in the 6th from the child’s Moon (avoided in some views)'],
  [/परिघ योग/, () => 'First half of Parigha yoga'],
  [/होलाष्टक/, () => 'Holashtak'],
  [/पितृ/, () => 'Pitru paksha'],
  [/क्षय तिथि/, () => 'Kshaya tithi (a tithi is skipped this day)'],
  [/वृद्धि तिथि/, () => 'Vriddhi tithi'],
  [/दो नक्षत्र/, () => 'Two nakshatra junctions on this day'],
  [/गुरु बल/, () => 'Weak Jupiter strength'],
];
const PLUS_EN: [RegExp, string][] = [
  [/शुभ ग्रह केन्द्र\/त्रिकोण/, 'Benefics in kendra/trikona houses of the muhurat chart'],
  [/पाप ग्रह उपचय/, 'Malefics in upachaya houses (3/6/11)'],
  [/सर्वार्थसिद्धि/, 'Sarvartha Siddhi yoga'],
  [/अमृतसिद्धि/, 'Amrita Siddhi yoga'],
  [/रवि योग/, 'Ravi yoga'],
  [/सिद्ध योग/, 'Siddha yoga (weekday–tithi)'],
  [/अभिजित्/, 'Abhijit muhurta'],
  [/जन्मराशि में चन्द्र/, 'Moon in the child’s janma rashi'],
];
export function doshaBi(s: string): Bi {
  const hi = stripCitations(s.replace(/^[^:]+:\s*/, ''));
  for (const [re, f] of DOSHA_EN) {
    const m = hi.match(re);
    if (m) {
      return bi(hi, f(m));
    }
  }
  return bi(hi, hi);
}
const plusBi = (s: string): Bi => bi(stripCitations(s), PLUS_EN.find(([re]) => re.test(s))?.[1] || stripCitations(s));

/* ---------- search ---------- */

export const MAX_DAYS = 400;
const spanDays = (inp: SearchInput) => Math.min(MAX_DAYS, Math.max(1, dayNo(inp.to) - dayNo(inp.from) + 1));
const addDays = (d: string, n: number) => new Date((dayNo(d) + n) * 864e5).toISOString().slice(0, 10);
const findRange = (a: ReturnType<typeof engineArgs>, from: string, days: number) =>
  a.UM.find({karya: a.karya, place: {...a.place}, persons: a.persons, extra: a.extra, from, days, ruleOverride: a.ruleOverride});

export function searchMuhurat(inp: SearchInput, kb: Kb): SearchResult {
  const args = engineArgs(inp, kb);
  return finish(inp, kb, args, findRange(args, inp.from, spanDays(inp)));
}

/** The same search in 31-day chunks, yielding to the UI between them (a year takes seconds on a phone). */
export async function searchMuhuratAsync(
  inp: SearchInput,
  kb: Kb,
  onProgress?: (done: number, total: number) => void,
  cancelled?: () => boolean,
): Promise<SearchResult | null> {
  const args = engineArgs(inp, kb);
  const total = spanDays(inp);
  const raw: any = {results: [], rejectedDays: [], dayLog: [], fixedReject: [], engine: ''};
  let passed = false;
  for (let d = 0; d < total; d += 31) {
    const r = findRange(args, addDays(inp.from, d), Math.min(31, total - d));
    // a whole-range block (mother expecting) can lift in a later chunk, once the child turns five
    if (r.fixedReject?.length) {
      raw.fixedReject.push(...r.fixedReject);
      raw.rejectedDays.push(...Array.from({length: Math.min(31, total - d)}, () => ({reasons: [r.fixedReject[0]]})));
    } else {
      passed = true;
    }
    raw.results.push(...(r.results || []));
    raw.rejectedDays.push(...(r.rejectedDays || []));
    raw.dayLog.push(...(r.dayLog || []));
    raw.engine = r.engine || raw.engine;
    onProgress?.(Math.min(d + 31, total), total);
    await new Promise(res => setTimeout(res, 0));
    if (cancelled?.()) {
      return null;
    }
  }
  raw.fixedReject = passed ? [] : [...new Set(raw.fixedReject)];
  return finish(inp, kb, args, raw);
}

function finish(inp: SearchInput, kb: Kb, args: ReturnType<typeof engineArgs>, r: any): SearchResult {
  const excluded = new Map<string, number>();
  const exclude = (reason: string) => excluded.set(reason, (excluded.get(reason) || 0) + 1);
  for (const d of r.rejectedDays || []) {
    exclude(stripCitations(d.reasons[0]));
  }
  for (const d of r.dayLog || []) {
    exclude(stripCitations(d.reason));
  }
  const result = (candidates: Candidate[]): SearchResult => ({
    input: inp,
    candidates,
    fixedReject: (r.fixedReject || []).map(stripCitations),
    excluded: [...excluded].map(([reason, n]) => ({reason, days: n})).sort((a, b) => b.days - a.days),
    windowsFound: (r.results || []).length,
    searchedTo: addDays(inp.from, spanDays(inp) - 1),
    engine: r.engine || 'UniversalMuhurta',
  });
  if (r.fixedReject?.length) {
    return result([]);
  }

  const band = inp.relaxed ? 'any' : inp.timeBand;
  const kept: any[] = [];
  for (const w of r.results) {
    if (w.detail.dosha.some((s: string) => s.includes('ग्रहण'))) {
      exclude('सम्भावित ग्रहण-दिवस');
      continue;
    } // eclipse day: a hard exclusion (§6.1)
    if (!inp.relaxed && inp.weekdays && !inp.weekdays.includes(w.vaarIdx)) {
      exclude('पसंदीदा वार नहीं');
      continue;
    }
    let s = w.startH * 60,
      e = w.endH * 60;
    if (band !== 'any') {
      const [a, b] = band === 'morning' ? [0, 720] : band === 'afternoon' ? [720, 1440] : [toMin(band.from), toMin(band.to)];
      s = Math.max(s, a);
      e = Math.min(e, b);
    }
    if (e - s < 15) {
      exclude('पसंदीदा समय-खण्ड से बाहर');
      continue;
    }
    kept.push({...w, startH: s / 60, endH: e / 60});
  }

  const weights = kb.config.weights;
  const rules = rulesFor(kb, inp.sanskar),
    traditions = traditionsOf(kb, inp.sanskar);
  const cards = kept.map(w => buildCard(w, inp, args, rules, traditions, weights));
  // the best window of each day, then the best days
  const byDay = new Map<string, Candidate>();
  const rank = (a: Candidate, b: Candidate) => a.grade - b.grade || b.weighted - a.weighted || b.durMin - a.durMin;
  for (const c of cards) {
    if (!byDay.has(c.date) || rank(c, byDay.get(c.date)!) < 0) {
      byDay.set(c.date, c);
    }
  }
  const top: Candidate[] = [];
  for (const c of [...byDay.values()].sort(rank)) {
    if (top.length >= 5) {
      break;
    }
    const t = recheck(c, args, inp.venue.tz);
    if (t) {
      top.push(t);
    }
  }
  return result(top);
}

function buildCard(w: any, inp: SearchInput, args: ReturnType<typeof engineArgs>, rules: Rule[], traditions: string[], weights: Weights): Candidate {
  const {UM, rule} = args;
  const tz = inp.venue.tz;
  const jdAt = (h: number) => UM.julianDay(w.Y, w.M, w.D, h - tz);
  const p0 = UM.panchangAt(jdAt(w.startH), w.Y),
    p1 = UM.panchangAt(jdAt(w.endH), w.Y);
  const d = w.detail;
  const paksha: 'shukla' | 'krishna' = p0.paksha === 'शुक्ल' ? 'shukla' : 'krishna';
  const person = (d.persons || [])[0] || {};
  const cb = person.chandra || {house: 0, status: '—'};
  const tb = person.tara || {count: 0, tara: 0, name: '—'};

  // age at the ritual: the n-th month / year of life, as the engine counts
  const days = dayNo(w.date) - dayNo(inp.child.birth.date);
  const unit = ageUnit(inp.sanskar);
  const n = unit === 'months' ? Math.floor(days / 30.4375) + 1 : Math.floor(days / 365.25) + 1;
  const allowed: number[] = rule.age?.byGender?.[inp.child.gender] || [];
  const family = familyAtoms(inp).length > 0;
  const age = {n, unit, ok: !allowed.length || allowed.includes(n), family, allowed} as Candidate['age'];

  const facts: Facts = {
    nakIdx: p0.nakIdx,
    paksha,
    tn: p0.tn,
    vaarIdx: w.vaarIdx,
    lagSign: w.lagSign,
    sunSign: p0.sunSign,
    ageMonths: unit === 'months' ? n : null,
    ageYears: unit === 'years' ? n : null,
    gender: inp.child.gender,
  };
  const verdicts = verdictsFor(rules, traditions, facts);

  const nakCls = UM.nakClass(rule, p0.nakIdx),
    tithiCls = UM.tithiClass(rule, p0),
    vaarCls = UM.vaarClass(rule, w.vaarIdx);
  const why: Bi[] = [];
  const limits: Bi[] = [];
  if (nakCls === 'uttam') {
    why.push(bi(`${p0.nakName} नक्षत्र — इस संस्कार हेतु प्रशस्त`, `${NAK_EN[p0.nakIdx]} nakshatra is favoured for this samskara`));
  }
  if (tithiCls === 'uttam') {
    why.push(bi(`${p0.paksha} ${p0.tithiName} — प्रशस्त तिथि`, `${tithiEn(paksha, p0.tn)} is a favoured tithi`));
  }
  if (vaarCls === 'shubh') {
    why.push(bi(`${UM.VAAR[w.vaarIdx]} — शुभ वार`, `${VAAR_EN[w.vaarIdx]} is a favourable weekday`));
  }
  if (tb.tara && !tb.bad && !tb.janma) {
    why.push(bi(`तारा बल: ${tb.name} तारा (${tb.tara}वीं) — अनुकूल`, `Tarabala: ${TARA_EN[tb.tara - 1]} tara (${tb.tara}) — favourable`));
  }
  if (cb.status === 'शुभ') {
    why.push(
      bi(
        `चन्द्र बल: शिशु की जन्मराशि से ${cb.house}वाँ भाव — शुभ`,
        `Chandrabala: Moon in the ${ORD_EN[cb.house]} from the child’s Moon — favourable`,
      ),
    );
  }
  if (paksha === 'shukla') {
    why.push(bi('शुक्ल पक्ष', 'Bright fortnight (shukla paksha)'));
  }
  for (const s of d.plus || []) {
    why.push(plusBi(s));
  }
  if (age.ok && allowed.length) {
    why.push(
      family
        ? bi(
            `आयु ${n}वाँ ${unit === 'months' ? 'मास' : 'वर्ष'} — परिवार की परंपरा अनुसार`,
            `Age: ${ORD_EN[n] || n + 'th'} ${unit === 'months' ? 'month' : 'year'} — as per the family’s tradition`,
          )
        : bi(
            `आयु ${n}वाँ ${unit === 'months' ? 'मास' : 'वर्ष'} — शास्त्रोक्त अवधि में`,
            `Age: ${ORD_EN[n] || n + 'th'} ${unit === 'months' ? 'month' : 'year'} — within the customary period`,
          ),
    );
  }
  for (const s of d.dosha || []) {
    if (!/^आयु /.test(s)) {
      limits.push(doshaBi(s));
    }
  }
  if (!age.ok) {
    limits.push(
      bi(
        `आयु ${n}वाँ ${unit === 'months' ? 'मास' : 'वर्ष'} — ${family ? 'परिवार की परंपरा' : 'प्रचलित नियम'} में ${allowed.join('/')}`,
        `Age: ${n} ${unit === 'months' ? 'month' : 'year'} of life — ${family ? 'the family’s tradition' : 'the usual rule'} gives ${allowed.join(
          '/',
        )}`,
      ),
    );
  }
  for (const v of verdicts) {
    if (v.verdict === 'nishiddh' || v.verdict === 'madhyam') {
      limits.push(
        bi(
          `${v.tradition} मत: ${v.verdict === 'nishiddh' ? 'निषिद्ध' : 'मध्यम'} — ${v.rules.map(r => r.text_hi).join('; ')}`,
          `${tagName(v.tradition, 'en')} view: ${v.verdict === 'nishiddh' ? 'forbidden' : 'middling'} — ${v.rules.map(r => r.text_en).join('; ')}`,
        ),
      );
    }
  }
  if (inp.relaxed) {
    limits.push(
      bi('शिथिल खोज: वार/समय की पसंद व पूर्वाह्न-नियम हटाए गए', 'Relaxed search: weekday/time preferences and the forenoon rule were dropped'),
    );
  }

  const planets: Bi[] = [bi(`लग्नेश: ${d.lagnesh}`, `Lagna lord: ${GRAHA_EN[d.lagnesh] || d.lagnesh}`)];
  for (const s of [...(d.plus || []), ...(d.dosha || [])]) {
    if (/ग्रह/.test(s)) {
      planets.push(/शुभ|उपचय/.test(s) ? plusBi(s) : doshaBi(s));
    }
  }

  const clsScore = (c: string) => (c === 'uttam' || c === 'shubh' ? 100 : c === 'madhyam' ? 60 : 0);
  const has = (re: RegExp) => [...(d.plus || []), ...(d.dosha || [])].some((s: string) => re.test(s));
  const localWarn = (d.dosha || []).filter((s: string) => /पंचक|होलाष्टक|पितृ|क्षय तिथि|वृद्धि तिथि|दो नक्षत्र|गण्डान्त/.test(s)).length;
  const counted = verdicts.filter(v => v.verdict !== 'none');
  const subScores: Candidate['subScores'] = {
    panchang: Math.round((clsScore(tithiCls) + clsScore(vaarCls) + ([0, 5, 8, 9, 12, 14].includes(p0.yogaIdx) ? 60 : 100)) / 3),
    nakshatra: clsScore(nakCls),
    tarabala: tb.janma ? 60 : tb.tara ? 100 : 0,
    chandrabala: cb.status === 'शुभ' ? 100 : cb.status === 'मध्यम' ? 60 : 0,
    lagna: rule.lagna?.madhyam?.includes(w.lagSign) ? 60 : 100,
    planetary: Math.max(
      0,
      Math.min(100, 70 + (has(/शुभ ग्रह केन्द्र/) ? 15 : 0) + (has(/पाप ग्रह उपचय/) ? 15 : 0) - (has(/लग्न में पाप ग्रह/) ? 30 : 0)),
    ),
    tradition: counted.length
      ? Math.round(
          (100 * counted.filter(v => v.verdict === 'shubh').length + 60 * counted.filter(v => v.verdict === 'madhyam').length) / counted.length,
        )
      : 100,
    local: Math.max(0, 100 - 20 * localWarn),
  };
  const wsum = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const weighted = Math.round((Object.keys(subScores) as (keyof Weights)[]).reduce((a, k) => a + subScores[k] * (weights[k] ?? 1), 0) / wsum);

  const flags: Bi[] = [];
  if (!inp.child.birth.time) {
    flags.push(
      bi(
        'जन्म-समय अज्ञात — जन्म-लग्न आधारित जाँच (लग्न से अष्टम) नहीं हो सकी',
        'Birth time unknown — the janma-lagna checks (8th from the birth lagna) were skipped',
      ),
    );
    const b = inp.child.birth,
      jd = (h: number) => UM.julianDay(+b.date.slice(0, 4), +b.date.slice(5, 7), +b.date.slice(8, 10), h - b.tz);
    const a = UM.panchangAt(jd(0), +b.date.slice(0, 4)),
      z = UM.panchangAt(jd(23.99), +b.date.slice(0, 4));
    if (a.nakIdx !== z.nakIdx) {
      flags.push(
        bi(
          `जन्म दिवस में चन्द्र नक्षत्र बदलता है (${a.nakName} → ${z.nakName}) — तारा बल व जन्म-नक्षत्र जाँच अनिश्चित`,
          `The Moon changes nakshatra on the birth date (${NAK_EN[a.nakIdx]} → ${
            NAK_EN[z.nakIdx]
          }) — Tarabala and the birth-nakshatra check are uncertain`,
        ),
      );
    }
    if (a.moonSign !== z.moonSign) {
      flags.push(
        bi(
          `जन्म दिवस में चन्द्र राशि बदलती है (${UM.RASHI[a.moonSign]} → ${UM.RASHI[z.moonSign]}) — चन्द्र बल अनिश्चित`,
          `The Moon changes sign on the birth date (${RASHI_EN[a.moonSign]} → ${RASHI_EN[z.moonSign]}) — Chandrabala is uncertain`,
        ),
      );
    }
  }

  const dp = UM.dailyPanchang(w.date, {...args.place});
  const lm = UM.lunarMonthInfo(jdAt(w.startH), w.Y);
  return {
    id: `${inp.sanskar}-${w.date}-${Math.round(w.startH * 60)}`,
    sanskar: inp.sanskar,
    date: w.date,
    vaarIdx: w.vaarIdx,
    start: hhmm(Math.ceil(w.startH * 60 - 1e-6)),
    end: hhmm(Math.floor(w.endH * 60 + 1e-6)),
    startMin: Math.ceil(w.startH * 60 - 1e-6),
    endMin: Math.floor(w.endH * 60 + 1e-6),
    durMin: Math.round((w.endH - w.startH) * 60),
    // find()'s best moment, kept inside the window after the time-band clip
    bestMin: clamp(Math.round(w.bestH * 60), Math.ceil(w.startH * 60 - 1e-6), Math.floor(w.endH * 60 + 1e-6)),
    best: hhmm(clamp(Math.round(w.bestH * 60), Math.ceil(w.startH * 60 - 1e-6), Math.floor(w.endH * 60 + 1e-6))),
    grade: w.grade,
    score: w.score,
    weighted,
    subScores,
    tithi: bi(`${p0.paksha} ${p0.tithiName}`, tithiEn(paksha, p0.tn)),
    paksha,
    tn: p0.tn,
    nakshatra: bi(p0.nakName, NAK_EN[p0.nakIdx]),
    nakIdx: p0.nakIdx,
    pada: p0.pada === p1.pada ? String(p0.pada) : `${p0.pada} → ${p1.pada}`,
    yoga:
      p0.yogaIdx === p1.yogaIdx
        ? bi(p0.yogaName, YOGA_EN[p0.yogaIdx])
        : bi(`${p0.yogaName} → ${p1.yogaName}`, `${YOGA_EN[p0.yogaIdx]} → ${YOGA_EN[p1.yogaIdx]}`),
    karana:
      p0.karana === p1.karana
        ? bi(p0.karana, KARANA_EN[p0.karana] || p0.karana)
        : bi(`${p0.karana} → ${p1.karana}`, `${KARANA_EN[p0.karana]} → ${KARANA_EN[p1.karana]}`),
    lagna: bi(UM.RASHI[w.lagSign], RASHI_EN[w.lagSign]),
    lagSign: w.lagSign,
    moonSign: bi(UM.RASHI[p0.moonSign], RASHI_EN[p0.moonSign]),
    sunSign: p0.sunSign,
    maas: {amanta: lm.monthIdx, purnimanta: paksha === 'krishna' ? (lm.monthIdx + 1) % 12 : lm.monthIdx, adhik: !!lm.adhik},
    chandrabala: {house: cb.house, status: bi(cb.status, cb.status === 'शुभ' ? 'Favourable' : cb.status === 'मध्यम' ? 'Middling' : cb.status)},
    tarabala: {count: tb.count, tara: tb.tara, name: bi(tb.name, TARA_EN[tb.tara - 1] || '—')},
    planets,
    why,
    limits,
    age,
    verdicts,
    base: {tradition: BASE_TRADITION, grade: w.grade},
    flags,
    checks: [],
    relaxed: !!inp.relaxed,
    sunrise: dp.sunrise,
    sunset: dp.sunset,
    kaal: {rahu: dp.rahuKaal, yama: dp.yamaganda, gulik: dp.gulik, bhadra: dp.bhadra || []},
    span: {s: 0, e: 0}, // set by the recheck
  };
}

/* ---------- §14 recheck: every printed minute boundary against the engine and the day's kaal ---------- */

const span = (s: string | null): [number, number] | null => {
  if (!s) {
    return null;
  }
  const [a, b] = s.split('–').map(toMin);
  return [a, b < a ? 1440 : b]; // a span past midnight: only its part in this day matters for a daytime window
};
export const overlaps = (c: Pick<Candidate, 'startMin' | 'endMin'>, s: string | null) => {
  const x = span(s);
  return !!x && c.startMin < x[1] && c.endMin > x[0];
};

function recheck(c: Candidate, args: ReturnType<typeof engineArgs>, tz: number): Candidate | null {
  const {UM, karya, persons, extra, place, ruleOverride} = args;
  const bad = (m: number) => !!UM.evaluate({karya, place: {...place}, persons, extra, ruleOverride, at: {date: c.date, time: hhmm(m)}}).result.reject;
  let s = c.startMin,
    e = c.endMin;
  while (s <= e && bad(s)) {
    s++;
  }
  while (e >= s && bad(e)) {
    e--;
  }
  const moved = s !== c.startMin || e !== c.endMin;
  const d0 = dayNo(c.date) * 864e5,
    ms = (m: number) => d0 + (m / 60 - tz) * 36e5;
  const bestMin = clamp(c.bestMin, s, e);
  const t: Candidate = {
    ...c,
    startMin: s,
    endMin: e,
    start: hhmm(s),
    end: hhmm(e),
    durMin: e - s,
    bestMin,
    best: hhmm(bestMin),
    span: {s: ms(s), e: ms(e)},
  };
  const kaalHit = (
    [
      ['राहुकाल', 'Rahu Kaal', c.kaal.rahu],
      ['यमगण्ड', 'Yamaganda', c.kaal.yama],
      ['गुलिक', 'Gulika', c.kaal.gulik],
    ] as const
  ).filter(([, , k]) => overlaps(t, k));
  const bhadraHit = c.kaal.bhadra.some(b => overlaps(t, b));
  const exclusionsOk = t.durMin >= 15 && !kaalHit.length && !bhadraHit;
  const birthKnown = !!persons[0].birth.time;
  t.checks = [
    {
      item: bi('जन्म-समय', 'Birth time'),
      status: birthKnown ? 'pass' : 'uncertain',
      note: birthKnown ? undefined : bi('अज्ञात — 12:00 माना गया', 'Unknown — 12:00 assumed'),
    },
    {item: bi('जन्म-स्थान व निर्देशांक', 'Birth place and coordinates'), status: validLatLon(persons[0].birth) ? 'pass' : 'fail'},
    {
      item: bi('कार्य-स्थान, निर्देशांक व समय-क्षेत्र', 'Venue, coordinates and timezone'),
      status: validLatLon(place) && Number.isFinite(place.tz) && Math.abs(place.tz) <= 14 ? 'pass' : 'fail',
    },
    {item: bi('सूर्योदय / सूर्यास्त', 'Sunrise / sunset'), status: c.sunrise && c.sunset ? 'pass' : 'fail'},
    {item: bi('तिथि, नक्षत्र, पद, लग्न', 'Tithi, nakshatra, pada, lagna'), status: 'pass'},
    {item: bi('तारा बल व चन्द्र बल', 'Tarabala and Chandrabala'), status: c.flags.length > (birthKnown ? 0 : 1) ? 'uncertain' : 'pass'},
    {
      item: bi(
        'मुहूर्त-खिड़की बनाम राहुकाल, यमगण्ड, गुलिक, भद्रा (अन्तिम मिनट तक)',
        'Window vs Rahu Kaal, Yamaganda, Gulika, Bhadra (to the minute)',
      ),
      status: exclusionsOk ? 'pass' : 'fail',
      note: moved ? bi('सीमा-मिनट की पुनर्जाँच से समय संकुचित किया गया', 'Narrowed by the boundary-minute recheck') : undefined,
    },
  ];
  // a hard fail never reaches the report: the window is dropped (§14 "block PDF and fix")
  return exclusionsOk ? t : null;
}
const validLatLon = (p: {lat: number; lon: number}) =>
  Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180 && !(p.lat === 0 && p.lon === 0);
