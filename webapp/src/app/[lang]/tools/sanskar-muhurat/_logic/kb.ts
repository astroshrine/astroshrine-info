/* eslint-disable */
/**
 * Shastra Knowledge Base for Sanskar Muhurat (plan §2-3).
 * Rows come from GET /v1/sanskar-muhurat/kb (admin-edited), else the bundled seed.
 * Rows with condition null describe what the engine code enforces (DPJ-104); rows with a
 * condition are a tradition's differences, compiled onto the engine rule as ruleOverride.
 */
import { api } from '@/lib/api';
import seed from './sanskar-rules.json';

export type Sanskar = 'annaprashan' | 'mundan';
export type Effect = 'allow' | 'prefer' | 'avoid' | 'forbid';
export type Status = 'verified' | 'needs_review' | 'tradition_only';
export type Field = 'nakshatra' | 'tithi' | 'vaar' | 'lagna' | 'sun_sign' | 'age_months' | 'age_years';
export interface Condition {
  field: Field;
  in: number[];
  paksha?: 'shukla' | 'krishna' | 'any';
  gender?: 'M' | 'F' | 'any';
  mode?: 'only'; // age: this set replaces the engine's
}
export interface Source {
  granth: string | null;
  chapter: string | null;
  verse: string | null;
  page: string | null;
  sanskrit_text: string | null;
  hindi_meaning: string | null;
}
export interface Rule {
  rule_id: string;
  sanskar: Sanskar | 'common';
  category: string;
  condition: Condition | null;
  effect: Effect;
  weight: number;
  tradition_tag: string;
  text_hi: string;
  text_en: string;
  source: Source | null;
  verification_status: Status;
  reviewer: string | null;
  reviewed_at: string | null;
  notes: string | null;
  active: boolean;
}
export interface Content {
  content_id: string;
  sanskar: Sanskar | 'common';
  kind: 'sankalpa_template' | 'checklist';
  lang: string;
  version: number;
  body: any;
  verification_status: Status;
  reviewer: string | null;
  reviewed_at: string | null;
}
export type Weights = Record<'panchang' | 'nakshatra' | 'tarabala' | 'chandrabala' | 'lagna' | 'planetary' | 'tradition' | 'local', number>;
export interface Config {
  enabled: boolean;
  price_points: number;
  weights: Weights;
  toggles: {panchak: 'default' | 'reject' | 'none'; gandmool: boolean};
}
export interface Kb {
  version: number;
  rules: Rule[];
  content: Content[];
  config: Config;
  fromServer: boolean;
}
export type Bi = {hi: string; en: string};

export const BASE_TRADITION = 'DPJ-104';
export const SEED_KB: Kb = {...(seed as any), fromServer: false};

// Tradition tags are the KB's keys, entered in Hindi; English text shows these names (an unknown tag as it is).
const TAG_EN: Record<string, string> = {
  'नारद-कश्यप': 'Narada-Kashyapa',
  पराशर: 'Parashara',
  क्षेत्रीय: 'Regional',
  'DPJ-104 पृ.63/65 पाठ': 'DPJ-104 pp.63/65 reading',
  'मुहूर्त चिन्तामणि': 'Muhurta Chintamani',
  'गृह्यसूत्र-स्मृति': 'Grihyasutra-Smriti',
  'धर्मसिन्धु-निर्णयसिन्धु': 'Dharmasindhu-Nirnayasindhu',
  धर्मसिन्धु: 'Dharmasindhu',
};
export const tagName = (tag: string, lang: string) => (lang !== 'hi' && TAG_EN[tag]) || tag;

let cache: {at: number; kb: Kb} | null = null;
/** The server KB (5-minute cache), or the bundled seed when it can't be reached. */
export async function loadKb(): Promise<Kb> {
  if (cache && Date.now() - cache.at < 5 * 60e3) {
    return cache.kb;
  }
  try {
    const data: any = await api('/v1/sanskar-muhurat/kb');
    if (Array.isArray(data?.rules) && Array.isArray(data?.content) && data?.config) {
      const kb: Kb = {...data, config: {...SEED_KB.config, ...data.config}, fromServer: true};
      cache = {at: Date.now(), kb};
      return kb;
    }
  } catch {
    // offline, or the backend isn't deployed yet: the bundled seed
  }
  return SEED_KB;
}

export const rulesFor = (kb: Kb, s: Sanskar) => kb.rules.filter(r => r.active !== false && (r.sanskar === s || r.sanskar === 'common'));
export const contentFor = (kb: Kb, s: Sanskar, kind: Content['kind']) =>
  kb.content.find(c => c.kind === kind && c.sanskar === s) || kb.content.find(c => c.kind === kind && c.sanskar === 'common');

/** Traditions the user can follow: the base first, then every tag that has a machine-readable rule. */
export function traditionsOf(kb: Kb, s: Sanskar): string[] {
  const tags = rulesFor(kb, s)
    .filter(r => r.condition && r.tradition_tag !== BASE_TRADITION)
    .map(r => r.tradition_tag);
  return [BASE_TRADITION, ...new Set(tags)];
}

/* ---------- Citations (brief §1): only a verified row may print its source ---------- */

export const PENDING: Bi = {
  hi: 'पारंपरिक मान्यता — ग्रंथ संदर्भ सत्यापन हेतु लंबित',
  en: 'Traditional practice — textual reference pending verification',
};
export const TRADITION_ONLY: Bi = {
  hi: 'प्रचलित परंपरा — ग्रंथ संदर्भ उपलब्ध नहीं',
  en: 'Widely followed practice — no textual reference available',
};

/** The printable reference, or null unless a reviewer marked the row verified. */
export function citationOf(r: Rule): {ref: string; sanskrit: string | null; meaning: string | null} | null {
  const s = r.source;
  if (r.verification_status !== 'verified' || !s?.granth) {
    return null;
  }
  const ref = [s.granth, s.chapter && `अध्याय ${s.chapter}`, s.verse && `श्लोक ${s.verse}`, s.page && `पृ. ${s.page}`].filter(Boolean).join(', ');
  return {ref, sanskrit: s.sanskrit_text, meaning: s.hindi_meaning};
}
export const sourceLabel = (r: Rule): Bi => {
  const c = citationOf(r);
  return c ? {hi: c.ref, en: c.ref} : r.verification_status === 'tradition_only' ? TRADITION_ONLY : PENDING;
};

// The engine's reason strings carry "(DPJ-104 पृ.65)"-style references and quoted Sanskrit;
// those print only through a verified KB row.
const REF = /(DPJ-104|UOU|पृ\.|\bMC\b|BVR|\bDP\b|FINAL-v2|चिन्ताहरण|मीमांसा|श्लोक|अध्याय|रामाचार्य)/;
export function stripCitations(s: string): string {
  let out = s;
  for (let i = 0; i < 3; i++) {
    out = out.replace(/\s*\(([^()]*)\)/g, (m, inner) => (REF.test(inner) ? '' : m));
  } // nested parens: inner first
  return out
    .replace(/\s*["“][^"”]*[ऀ-ॿ][^"”]*["”]/g, '')
    .replace(/\s*[—-]\s*(DPJ-104|MC|BVR|DP)\b[^;,।]*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/* ---------- Citation guard for AI text (brief §1) ---------- */

const VERSE_MARK = /(॥|।।|\|\||श्लोक|अध्याय|सूत्र\s*\d|shloka|sloka|\bverse\b|\bchapter\b|\bsutra\s*\d)/i;
// "(2.47)", "[3:12]", "पृ. 12", "p. 12" — month lists like 6/8/10 stay allowed
const VERSE_NO = /[([]\s*\d{1,3}\s*[.:]\s*\d{1,3}\s*[)\]]|पृ\.\s*\d|\bpp?\.\s*\d/i;
// Granth names an AI reply must not bring in unless they are in the supplied facts.
const BOOKS = [
  'मुहूर्त चिन्तामणि',
  'मुहूर्त चिंतामणि',
  'muhurta chintamani',
  'muhurtha chintamani',
  'muhurtha',
  'b.v. raman',
  'bv raman',
  'बी.वी. रमन',
  'पाराशर',
  'पराशर',
  'parashara',
  'bphs',
  'नारद',
  'narada',
  'वसिष्ठ',
  'vasishtha',
  'गर्ग',
  'garga',
  'कश्यप',
  'kashyapa',
  'गृह्यसूत्र',
  'grihya',
  'पारस्कर',
  'paraskara',
  'आश्वलायन',
  'ashvalayana',
  'मनुस्मृति',
  'manusmriti',
  'धर्मसिन्धु',
  'dharmasindhu',
  'निर्णयसिन्धु',
  'nirnayasindhu',
  'मुहूर्त मार्तण्ड',
  'muhurta martanda',
  'ज्योतिर्निबन्ध',
  'jyotirnibandha',
  'फलदीपिका',
  'phaladeepika',
  'बृहत्संहिता',
  'brihat samhita',
  'dpj-104',
  'मुहूर्त विचार',
  'रत्नमाला',
  'ratnamala',
  'पीयूषधारा',
  'piyushadhara',
  'कालप्रकाशिका',
  'purana',
  'पुराण',
  'स्मृति',
  'smriti',
  'संहिता',
  'samhita',
];
export function citationGuard(text: string, facts: string): {ok: boolean; reasons: string[]} {
  const reasons: string[] = [];
  const m = text.match(VERSE_MARK);
  if (m) {
    reasons.push(`verse/citation marker "${m[0]}"`);
  }
  if (VERSE_NO.test(text)) {
    reasons.push('verse or page number');
  }
  const t = text.toLowerCase(),
    f = facts.toLowerCase();
  for (const b of BOOKS) {
    if (t.includes(b) && !f.includes(b)) {
      reasons.push(`book not in facts: ${b}`);
    }
  }
  return {ok: !reasons.length, reasons};
}

/* ---------- Tradition compiler (plan §2) ---------- */

export interface Facts {
  nakIdx: number;
  paksha: 'shukla' | 'krishna';
  tn: number; // 1..15 within the paksha
  vaarIdx: number;
  lagSign: number;
  sunSign: number;
  ageMonths: number | null; // n-th month of life
  ageYears: number | null;
  gender: 'M' | 'F';
}

const range = (n: number) => Array.from({length: n}, (_, i) => i);
const CLS: Record<Effect, 'uttam' | 'madhyam' | 'varjit'> = {allow: 'uttam', prefer: 'uttam', avoid: 'madhyam', forbid: 'varjit'};

/**
 * The engine rule (UM.RULES[karya]) with the atoms applied, as a ruleOverride for UM.find/evaluate.
 * undefined when there is nothing to apply. avoid on sun_sign/age has no middle class and is ignored.
 */
export function compileTradition(UM: any, rule: any, atoms: (Condition | Rule)[], toggles?: Config['toggles']): any {
  const conds = atoms
    .map(a => ('rule_id' in a ? {c: a.condition, e: a.effect} : {c: a, e: 'allow' as Effect}))
    .filter((x): x is {c: Condition; e: Effect} => !!x.c);
  const blocks = toggles && toggles.panchak !== 'default' ? {panchak: toggles.panchak === 'reject' ? 'reject' : 'none'} : null;
  if (toggles?.gandmool) {
    conds.push({c: {field: 'nakshatra', in: [0, 8, 9, 17, 18, 26]}, e: 'forbid'});
  }
  if (!conds.length && !blocks) {
    return undefined;
  }

  const nak = range(27).map(n => UM.nakClass(rule, n));
  const tithi = {
    shukla: range(15).map(i => UM.tithiClass(rule, {tn: i + 1, paksha: 'शुक्ल'})),
    krishna: range(15).map(i => UM.tithiClass(rule, {tn: i + 1, paksha: 'कृष्ण'})),
  };
  const vaar = range(7).map(v => (({shubh: 'uttam', madhyam: 'madhyam', varjit: 'varjit'} as any)[UM.vaarClass(rule, v)]));
  const L = rule.lagna || {};
  const lagna = range(12).map(s => ((L.varjit || []).includes(s) ? 'varjit' : (L.madhyam || []).includes(s) ? 'madhyam' : 'uttam'));
  const sr = rule.sunSign || {};
  const sun = range(12).map(s => !((sr.allowed && !sr.allowed.includes(s)) || (sr.forbidden || []).includes(s)));
  const age = rule.age ? {M: [...rule.age.byGender.M], F: [...rule.age.byGender.F]} : null;
  const touched = new Set<Field | 'age'>();
  const ageField = rule.age?.kind === 'months' ? 'age_months' : rule.age?.kind === 'years' ? 'age_years' : null;

  for (const {c, e} of conds) {
    const cls = CLS[e];
    if (c.field === 'nakshatra') {
      c.in.forEach(n => (nak[n] = cls));
    }
    if (c.field === 'vaar') {
      c.in.forEach(n => (vaar[n] = cls));
    }
    if (c.field === 'lagna') {
      c.in.forEach(n => (lagna[n] = cls));
    }
    if (c.field === 'tithi') {
      for (const pk of ['shukla', 'krishna'] as const) {
        if (!c.paksha || c.paksha === 'any' || c.paksha === pk) {
          c.in.forEach(n => (tithi[pk][n - 1] = cls));
        }
      }
    }
    if (c.field === 'sun_sign' && e !== 'avoid') {
      c.in.forEach(n => (sun[n] = e !== 'forbid'));
    }
    if (c.field === ageField && age && e !== 'avoid') {
      for (const g of ['M', 'F'] as const) {
        if (c.gender && c.gender !== 'any' && c.gender !== g) {
          continue;
        }
        const rest = age[g].filter(n => !c.in.includes(n));
        age[g] = e === 'forbid' ? rest : c.mode === 'only' ? [...c.in] : [...rest, ...c.in].sort((a, b) => a - b);
      }
      touched.add('age');
    } else {
      touched.add(c.field);
    }
  }
  const pick = (arr: string[], k: string) => arr.map((c, i) => (c === k ? i : -1)).filter(i => i >= 0);
  const o: any = {};
  if (touched.has('nakshatra')) {
    o.nak = {uttam: pick(nak, 'uttam'), madhyam: pick(nak, 'madhyam')};
  }
  if (touched.has('tithi')) {
    const one = (a: string[]) => ({
      uttam: pick(a, 'uttam').map(i => i + 1),
      madhyam: pick(a, 'madhyam').map(i => i + 1),
      varjit: pick(a, 'varjit').map(i => i + 1),
    });
    o.tithi = {shukla: one(tithi.shukla), krishna: one(tithi.krishna)};
  }
  if (touched.has('vaar')) {
    o.vaar = {shubh: pick(vaar, 'uttam'), madhyam: pick(vaar, 'madhyam'), varjit: pick(vaar, 'varjit')};
  }
  if (touched.has('lagna')) {
    o.lagna = {...L, uttam: pick(lagna, 'uttam'), madhyam: pick(lagna, 'madhyam'), varjit: pick(lagna, 'varjit')};
  }
  if (touched.has('sun_sign')) {
    o.sunSign = {allowed: range(12).filter(s => sun[s])};
  }
  if (touched.has('age') && age) {
    o.age = {...rule.age, byGender: age};
  }
  if (blocks) {
    o.blocks = blocks;
  }
  return o;
}

/* ---------- Per-candidate verdicts (brief §6.5) ---------- */

export type VerdictKey = 'shubh' | 'madhyam' | 'nishiddh' | 'none';
export const VERDICT: Record<VerdictKey, Bi> = {
  shubh: {hi: 'शुभ', en: 'Favourable'},
  madhyam: {hi: 'मध्यम', en: 'Middling'},
  nishiddh: {hi: 'निषिद्ध', en: 'Forbidden'},
  none: {hi: 'कोई भिन्न नियम नहीं', en: 'No differing rule'},
};

/** 'hit' when the fact is in the set, 'miss' for an 'only' age set that leaves it out, null when the atom doesn't apply. */
export function matchAtom(c: Condition, f: Facts): 'hit' | 'miss' | null {
  const v: Record<Field, number | null> = {
    nakshatra: f.nakIdx,
    tithi: c.paksha && c.paksha !== 'any' && c.paksha !== f.paksha ? null : f.tn,
    vaar: f.vaarIdx,
    lagna: f.lagSign,
    sun_sign: f.sunSign,
    age_months: f.ageMonths,
    age_years: f.ageYears,
  };
  const x = v[c.field];
  if (x == null || (c.gender && c.gender !== 'any' && c.gender !== f.gender)) {
    return null;
  }
  if (c.in.includes(x)) {
    return 'hit';
  }
  return c.mode === 'only' ? 'miss' : null;
}

export function verdictsFor(rules: Rule[], traditions: string[], f: Facts): {tradition: string; verdict: VerdictKey; rules: Rule[]}[] {
  return traditions
    .filter(t => t !== BASE_TRADITION)
    .map(t => {
      const hits: {r: Rule; e: Effect}[] = [];
      for (const r of rules) {
        if (r.tradition_tag !== t || !r.condition) {
          continue;
        }
        const m = matchAtom(r.condition, f);
        if (m === 'hit') {
          hits.push({r, e: r.effect});
        }
        if (m === 'miss') {
          hits.push({r, e: 'avoid'});
        } // outside the tradition's age set: a warning, as in the engine
      }
      const verdict: VerdictKey = hits.some(h => h.e === 'forbid')
        ? 'nishiddh'
        : hits.some(h => h.e === 'avoid')
        ? 'madhyam'
        : hits.length
        ? 'shubh'
        : 'none';
      return {tradition: t, verdict, rules: hits.map(h => h.r)};
    });
}
