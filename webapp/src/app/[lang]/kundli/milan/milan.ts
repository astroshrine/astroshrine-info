/**
 * Kundli matching (Ashtakoot Guna Milan): the app's src/services/kundliMatch.ts, ported as is.
 *
 * Rules from the app (ported there from the offline gun milan tool): the eight koota scores, the dosha checks
 * with their parihar conditions, Mangal dosha from each full chart, the joint Mangal balance, the nishedh dwar
 * gate and the navamsha check. Changes: both charts come from the backend Jyotish engine (POST /v1/jyotish/chart,
 * Swiss Ephemeris, Lahiri) instead of the app's Panchang service / device ephemeris; each dosha also carries its
 * severity as a key, so the page can colour the tag in either language; the English says "ascendant" for lagna, the
 * website's term. Text stays bilingual inline ([en, hi] pairs and t(en, hi)), as in the app: the page passes its language.
 */

import type { Chart, Graha } from "@/lib/jyotish";

export type Lang = 'en' | 'hi';
export type Pair = [string, string]; // [en, hi]
export type Planet = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke';
export const PLANETS: Planet[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'];
/** rashi 0..11, deg within the rashi. */
export interface PlanetPos { lon: number; rashi: number; deg: number; retro: boolean }
export interface BirthChart { pl: Record<Planet, PlanetPos>; asc: number; lagna: number }

const CODE: Record<Graha, Planet> = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };
/** The engine's chart in the shape the matching rules read. */
export function birthChartOf(c: Chart): BirthChart {
  const pl = {} as Record<Planet, PlanetPos>;
  for (const [g, code] of Object.entries(CODE) as [Graha, Planet][]) {
    const p = c.planets[g];
    pl[code] = { lon: p.lon, rashi: p.rashi - 1, deg: p.deg_in_rashi, retro: p.retro };
  }
  return { pl, asc: c.lagna.lon, lagna: c.lagna.rashi - 1 };
}

export const KOOTAS = [
  {key: 'varna', name: 'Varna', max: 1},
  {key: 'vashya', name: 'Vashya', max: 2},
  {key: 'tara', name: 'Tara', max: 3},
  {key: 'yoni', name: 'Yoni', max: 4},
  {key: 'grahaMaitri', name: 'Graha Maitri', max: 5},
  {key: 'gana', name: 'Gana', max: 6},
  {key: 'bhakoot', name: 'Bhakoot', max: 7},
  {key: 'nadi', name: 'Nadi', max: 8},
] as const;

export const KUNDLI_MAX_SCORE = KOOTAS.reduce((s, k) => s + k.max, 0); // 36

/** Only the name is read; the chart is passed in. */
export interface BirthPerson {
  name: string;
}

export interface KootaScore {
  key: string;
  name: string;
  max: number;
  score: number;
  note: string;
}

/** A present dosha's state: cancelled, partly cancelled, not cancelled, or the match is not advised. */
export type SeverityKey = 'ok' | 'part' | 'bad' | 'tyajya';

export interface Dosha {
  name: string;
  present: boolean;
  severity: string;
  /** `severity` as a key ('' when the dosha is absent), for styling the tag in any language. */
  severityKey: SeverityKey | '';
  description: string;
  remedy: string;
}

export type VerdictKey = 'poor' | 'average' | 'good' | 'excellent';

export interface KundliMatchReport {
  kootas: KootaScore[];
  totalScore: number;
  maxScore: number;
  compatibilityPercent: number;
  chartScore: number;
  verdictKey: VerdictKey;
  /** Where the Moons sit, e.g. 'Groom: Bharani pada 1 (Aries), Bride: …'. */
  positions: string;
  /** Only set when a dosha is proven and the match is rejected outright. */
  summary: string;
  doshas: Dosha[];
  navamsha: NavamshaMatch;
}

/** One D9 check; the cells are the groom's and the bride's values. */
export interface D9Row {
  label: string;
  groom: string;
  bride: string;
  points: string;
}

/** The detailed page's navamsha score (Step 2, item 3): same checks, same 20 points. */
export interface NavamshaMatch {
  score: number;
  max: number;
  rows: D9Row[];
  notes: string[];
}

export function verdictFor(totalScore: number): VerdictKey {
  if (totalScore >= 33) return 'excellent';
  if (totalScore >= 25) return 'good';
  if (totalScore >= 18) return 'average';
  return 'poor';
}

// ===== Jyotish data =====
// i18n-ok: bilingual pairs
// prettier-ignore
export const NAK: Pair[] = [['Ashwini','अश्विनी'],['Bharani','भरणी'],['Krittika','कृत्तिका'],['Rohini','रोहिणी'],['Mrigashira','मृगशिरा'],['Ardra','आर्द्रा'],['Punarvasu','पुनर्वसु'],['Pushya','पुष्य'],['Ashlesha','आश्लेषा'],['Magha','मघा'],['Purva Phalguni','पूर्वाफाल्गुनी'],['Uttara Phalguni','उत्तराफाल्गुनी'],['Hasta','हस्त'],['Chitra','चित्रा'],['Swati','स्वाति'],['Vishakha','विशाखा'],['Anuradha','अनुराधा'],['Jyeshtha','ज्येष्ठा'],['Mula','मूल'],['Purva Ashadha','पूर्वाषाढ़ा'],['Uttara Ashadha','उत्तराषाढ़ा'],['Shravana','श्रवण'],['Dhanishta','धनिष्ठा'],['Shatabhisha','शतभिषा'],['Purva Bhadrapada','पूर्वाभाद्रपद'],['Uttara Bhadrapada','उत्तराभाद्रपद'],['Revati','रेवती']];
// i18n-ok: bilingual pairs
// prettier-ignore
export const RASHI: Pair[] = [['Aries','मेष'],['Taurus','वृषभ'],['Gemini','मिथुन'],['Cancer','कर्क'],['Leo','सिंह'],['Virgo','कन्या'],['Libra','तुला'],['Scorpio','वृश्चिक'],['Sagittarius','धनु'],['Capricorn','मकर'],['Aquarius','कुम्भ'],['Pisces','मीन']];
// i18n-ok: bilingual pairs
// prettier-ignore
export const PN: Record<Planet, Pair> = {Su:['Sun','सूर्य'],Mo:['Moon','चंद्र'],Ma:['Mars','मंगल'],Me:['Mercury','बुध'],Ju:['Jupiter','गुरु'],Ve:['Venus','शुक्र'],Sa:['Saturn','शनि'],Ra:['Rahu','राहु'],Ke:['Ketu','केतु']};
// i18n-ok: bilingual pairs
// prettier-ignore
const DIGN: Record<string, Pair> = {uchch:['exalted','उच्च'],neech:['debilitated','नीच'],swa:['own sign','स्वराशि'],mool:['moolatrikona','मूलत्रिकोण'],mitra:['friendly sign','मित्र राशि'],shatru:['enemy sign','शत्रु राशि'],sam:['neutral sign','सम राशि'],asta:['combust','अस्त'],vakri:['retrograde','वक्री'],vargottam:['vargottama','वर्गोत्तम']};
export const SIGN_LORD: Planet[] = ['Ma', 'Ve', 'Me', 'Mo', 'Su', 'Me', 'Ve', 'Ma', 'Ju', 'Sa', 'Sa', 'Ju'];
const OWN: Partial<Record<Planet, number[]>> = {Su: [4], Mo: [3], Ma: [0, 7], Me: [2, 5], Ju: [8, 11], Ve: [1, 6], Sa: [9, 10]};
const EXALT: Partial<Record<Planet, number>> = {Su: 0, Mo: 1, Ma: 9, Me: 5, Ju: 3, Ve: 11, Sa: 6};
// prettier-ignore
const FRIENDS: Partial<Record<Planet, [Planet[], Planet[]]>> = {Su:[['Mo','Ma','Ju'],['Ve','Sa']],Mo:[['Su','Me'],[]],Ma:[['Su','Mo','Ju'],['Me']],Me:[['Su','Ve'],['Mo']],Ju:[['Su','Mo','Ma'],['Me','Ve']],Ve:[['Me','Sa'],['Su','Mo']],Sa:[['Me','Ve'],['Su','Mo','Ma']]};
export const rel = (a: Planet, b: Planet) => (a === b ? 'F' : FRIENDS[a]![0].includes(b) ? 'F' : FRIENDS[a]![1].includes(b) ? 'E' : 'N');
const mutualFriends = (a: Planet, b: Planet) => a === b || (rel(a, b) === 'F' && rel(b, a) === 'F');
export const COMBUST: Partial<Record<Planet, number>> = {Mo: 12, Ma: 17, Me: 14, Ju: 11, Ve: 10, Sa: 15};
const NAK_LORD: Planet[] = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me'];
const GANA = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0];
// i18n-ok: bilingual pairs
const GANAN: Pair[] = [['Deva', 'देव'], ['Manushya', 'मनुष्य'], ['Rakshasa', 'राक्षस']];
const NADI = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2];
// i18n-ok: bilingual pairs
const NADIN: Pair[] = [['Aadi', 'आद्य'], ['Madhya', 'मध्य'], ['Antya', 'अंत्य']];
const YONI = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];
// i18n-ok: bilingual pairs
// prettier-ignore
const YONIN: Pair[] = [['Horse','अश्व'],['Elephant','गज'],['Sheep','मेष'],['Serpent','सर्प'],['Dog','श्वान'],['Cat','मार्जार'],['Rat','मूषक'],['Cow','गौ'],['Buffalo','महिष'],['Tiger','व्याघ्र'],['Deer','मृग'],['Monkey','वानर'],['Mongoose','नकुल'],['Lion','सिंह']];
// prettier-ignore
const YM = [[4,2,2,3,2,2,2,1,0,1,3,3,2,1],[2,4,3,3,2,2,2,2,3,1,2,3,2,0],[2,3,4,2,1,2,1,3,3,1,2,0,3,1],[3,3,2,4,2,1,1,1,1,2,2,2,0,2],[2,2,1,2,4,2,1,2,2,1,0,2,1,1],[2,2,2,1,2,4,0,2,2,1,3,3,2,1],[2,2,1,1,1,0,4,2,2,2,2,2,1,2],[1,2,3,1,2,2,2,4,3,0,3,2,2,1],[0,3,3,1,2,2,2,3,4,1,2,2,2,1],[1,1,1,2,1,1,2,0,1,4,1,1,2,1],[3,2,2,2,0,3,2,3,2,1,4,2,2,1],[3,3,0,2,2,3,2,2,2,1,2,4,3,2],[2,2,3,0,1,2,1,2,2,2,2,3,4,2],[1,0,1,2,1,1,2,1,1,1,1,2,2,4]];
const YONI_ENEMY = [[7, 9], [0, 8], [3, 12], [4, 10], [5, 6], [13, 1], [11, 2]];
// i18n-ok: bilingual pairs
const RAJJUN: Pair[] = [['Pada (feet)', 'पाद'], ['Kati/Uru (thigh)', 'कटि/ऊरु'], ['Nabhi (navel)', 'नाभि'], ['Kantha (neck)', 'कंठ'], ['Shiro (head)', 'शिरो']];
const rajjuOf = (n: number) => {
  const i = n % 9;
  return {r: [0, 1, 2, 3, 4, 3, 2, 1, 0][i], dir: i < 4 ? 'aroha' : i > 4 ? 'avaroha' : 'madhya'};
};
const VEDHA = [[0, 17], [1, 16], [2, 15], [3, 14], [4, 22], [5, 21], [6, 20], [7, 19], [8, 18], [9, 26], [10, 25], [11, 24], [12, 23], [4, 13], [13, 22]];
// Mrigashira (4), Chitra (13) and Dhanishta (22) obstruct one another as a triad.
const VARNA = [1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0];
// i18n-ok: bilingual pairs
const VARNAN: Pair[] = [['Brahmin', 'ब्राह्मण'], ['Kshatriya', 'क्षत्रिय'], ['Vaishya', 'वैश्य'], ['Shudra', 'शूद्र']];
type Vashya = 'C' | 'M' | 'J' | 'V' | 'K';
const vashyaOf = (lon: number): Vashya => {
  const r = Math.floor(lon / 30), d = lon % 30;
  return (['C', 'C', 'M', 'J', 'V', 'M', 'M', 'K', d < 15 ? 'M' : 'C', d < 15 ? 'C' : 'J', 'M', 'J'] as Vashya[])[r];
};
// i18n-ok: bilingual pairs
const VASHYAN: Record<Vashya, Pair> = {C: ['Chatushpad', 'चतुष्पद'], M: ['Manav', 'मानव'], J: ['Jalchar', 'जलचर'], V: ['Vanchar', 'वनचर'], K: ['Keet', 'कीट']};
// prettier-ignore
// Rows are the groom's (var) vashya, columns the bride's (kanya): koots() reads VASHYA_T[groom][bride].
const VASHYA_T: Record<Vashya, Record<Vashya, number>> = {C:{C:2,M:1,J:1,V:0.5,K:1},M:{C:0,M:2,J:0.5,V:0,K:1},J:{C:1,M:0.5,J:2,V:1,K:1},V:{C:0.5,M:0,J:1,V:2,K:0},K:{C:1,M:1,J:1,V:0,K:2}};
const GANA_T = [[6, 6, 1], [5, 6, 0], [1, 0, 6]]; // [boy][girl]
const MAITRI_T: Record<string, number> = {FF: 5, FN: 4, NF: 4, NN: 3, FE: 1, EF: 1, NE: 0.5, EN: 0.5, EE: 0};
const PADA = 360 / 108;
const navOf = (lon: number) => Math.floor(lon / PADA) % 12;
export const houseFrom = (sign: number, base: number) => ((sign - base + 12) % 12) + 1;
/** Moolatrikona span (sign, from°, to°), BPHS ch. 3. */
const MOOL: Partial<Record<Planet, [number, number, number]>> = {Su: [4, 0, 20], Mo: [1, 3, 30], Ma: [0, 0, 12], Me: [5, 15, 20], Ju: [8, 0, 10], Ve: [6, 0, 15], Sa: [10, 0, 20]};
/**
 * Dignity of a planet in a sign. With `deg` (degrees within the sign) it is
 * degree-aware: Mercury is exalted only in Virgo 0–15° (15–20 moolatrikona,
 * 20–30 own sign), the Moon only in Taurus 0–3° (3–30 moolatrikona), and each
 * planet's moolatrikona span returns 'mool'. Without `deg` it stays whole-sign.
 */
export function dignity(p: Planet, sign: number, deg?: number): string {
  if (!OWN[p]) return '';
  if (deg !== undefined) {
    const mt = MOOL[p];
    if (EXALT[p] === sign && !(mt && mt[0] === sign && deg >= mt[1])) return 'uchch';
    if (mt && mt[0] === sign && deg >= mt[1] && deg < mt[2]) return 'mool';
    if ((EXALT[p]! + 6) % 12 === sign) return 'neech';
    if (OWN[p]!.includes(sign)) return 'swa';
    const r = rel(p, SIGN_LORD[sign]);
    return r === 'F' ? 'mitra' : r === 'E' ? 'shatru' : 'sam';
  }
  if (EXALT[p] === sign) return 'uchch';
  if ((EXALT[p]! + 6) % 12 === sign) return 'neech';
  if (OWN[p]!.includes(sign)) return 'swa';
  const r = rel(p, SIGN_LORD[sign]);
  return r === 'F' ? 'mitra' : r === 'E' ? 'shatru' : 'sam';
}
function aspects(p: Planet, fromSign: number): number[] {
  const h = [7];
  if (p === 'Ma') h.push(4, 8);
  if (p === 'Ju') h.push(5, 9);
  if (p === 'Sa') h.push(3, 10);
  return h.map(x => (fromSign + x - 1) % 12);
}
const nakOfLon = (l: number) => {
  const p = Math.floor(l / PADA);
  return {nak: Math.floor(p / 4), charan: (p % 4) + 1};
};

// ===== Koota scores =====
export interface MoonPoint {
  nak: number;
  charan: number;
  lon: number;
  rashi: number;
}

export const moonPoint = (lon: number): MoonPoint => ({...nakOfLon(lon), lon, rashi: Math.floor(lon / 30)});
/** Moon at the middle of a pada — for when only the nakshatra is known. */
export const moonPointOf = (nak: number, charan: number) => moonPoint((nak * 4 + charan - 1 + 0.5) * PADA);

/** Standard ashtakoot scores; k = bride (kanya), v = groom (var). */
export function koots(k: MoonPoint, v: MoonPoint) {
  const kr = k.rashi, vr = v.rashi, kl = SIGN_LORD[kr], vl = SIGN_LORD[vr];
  const varna = VARNA[vr] <= VARNA[kr] ? 1 : 0;
  const kvs = vashyaOf(k.lon), vvs = vashyaOf(v.lon), vashya = VASHYA_T[vvs][kvs];
  const tOk = (a: number, b: number) => ![3, 5, 7].includes((((b - a + 27) % 27) % 9) + 1);
  const taraK = tOk(k.nak, v.nak), taraV = tOk(v.nak, k.nak), tara = 1.5 * +taraK + 1.5 * +taraV;
  const yoni = YM[YONI[k.nak]][YONI[v.nak]];
  const maitri = kl === vl ? 5 : MAITRI_T[rel(kl, vl) + rel(vl, kl)];
  const gana = GANA_T[GANA[v.nak]][GANA[k.nak]];
  const d1 = ((vr - kr + 12) % 12) + 1, d2 = ((kr - vr + 12) % 12) + 1, pair = [d1, d2].sort((a, b) => a - b).join('/');
  const bhakoot = ['2/12', '6/8', '5/9'].includes(pair) ? 0 : 7;
  const nadiSame = NADI[k.nak] === NADI[v.nak], nadi = nadiSame ? 0 : 8;
  return {varna, vashya, tara, yoni, maitri, gana, bhakoot, nadi, total: varna + vashya + tara + yoni + maitri + gana + bhakoot + nadi, kr, vr, kl, vl, pair, d1, d2, nadiSame, taraK, taraV, kvs, vvs};
}

// ===== Mangal dosha from one chart =====
interface PlanetInfo extends PlanetPos {
  house: number;
  nav: number;
  dig: string;
  tags: string[];
}
export type MangalLevel = 'none' | 'cancelled' | 'alp' | 'madhyam' | 'prabal';

// i18n-ok: bilingual pairs (every t(en, hi) carries both languages; `lang` picks one)
export function mangalOf(bc: BirthChart, lang: Lang) {
  const t = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  const pick = (p: Pair) => p[lang === 'hi' ? 1 : 0];
  const rn = (r: number) => pick(RASHI[r]);
  const dn = (x: string) => (DIGN[x] ? pick(DIGN[x]) : '');
  const P = bc.pl, L = bc.lagna;
  const juAspects = (s: number) => P.Ju.rashi === s || aspects('Ju', P.Ju.rashi).includes(s);
  const planets = {} as Record<Planet, PlanetInfo>;
  for (const p of PLANETS) {
    const x = P[p], tags: string[] = [], dg = dignity(p, x.rashi, x.lon - x.rashi * 30);
    if (['uchch', 'neech', 'swa', 'mool'].includes(dg)) tags.push(dg);
    if (COMBUST[p]) {
      let d = Math.abs(x.lon - P.Su.lon);
      if (d > 180) d = 360 - d;
      if (d < COMBUST[p]!) tags.push('asta');
    }
    if (x.retro) tags.push('vakri');
    if (navOf(x.lon) === x.rashi) tags.push('vargottam');
    planets[p] = {...x, house: houseFrom(x.rashi, L), nav: navOf(x.lon), dig: dg, tags};
  }
  const weak = (p: Planet) => planets[p].tags.includes('neech') || planets[p].tags.includes('asta');
  const MH = [1, 4, 7, 8, 12];
  const ma = planets.Ma;
  const src: Record<string, number> = {Lagna: houseFrom(ma.rashi, L), Chandra: houseFrom(ma.rashi, P.Mo.rashi), Shukra: houseFrom(ma.rashi, P.Ve.rashi)};
  const hits = Object.keys(src).filter(k => MH.includes(src[k]));
  const srcN = (k: string) => ({Lagna: t('Ascendant', 'लग्न'), Chandra: t('Moon', 'चंद्र'), Shukra: t('Venus', 'शुक्र')})[k];
  const par: ['full' | 'part', string][] = [];
  if (hits.length) {
    if ([0, 7].includes(ma.rashi)) par.push(['full', t('Mars in own sign (' + rn(ma.rashi) + ')', 'मंगल स्वराशि (' + rn(ma.rashi) + ') में')]);
    if (ma.rashi === 9) par.push(['full', t('Mars exalted (Capricorn)', 'मंगल उच्च (मकर) में')]);
    if ([4, 8, 11].includes(ma.rashi)) par.push(['part', t('Mars in friendly sign (' + rn(ma.rashi) + ') – minor remedy', 'मंगल मित्र राशि (' + rn(ma.rashi) + ') में – अल्प परिहार')]);
    if ([3, 4].includes(L)) par.push(['full', t(rn(L) + ' ascendant: Mars is yogakaraka/benefic', rn(L) + ' लग्न में मंगल योगकारक/शुभ')]);
    if ([9, 10].includes(L) && src.Lagna === 4) par.push(['part', t(rn(L) + ' ascendant, Mars in 4th (remedy, with difference of opinion)', rn(L) + ' लग्न में चतुर्थ मंगल (मत-भेद सहित परिहार)')]);
    if (juAspects(ma.rashi)) {
      const conj = P.Ju.rashi === ma.rashi, w = weak('Ju');
      par.push(['full', t('Jupiter ' + (conj ? 'conjoins' : 'aspects') + ' Mars' + (w ? ' (but Jupiter is weak, so the remedy is weak)' : ''), 'मंगल पर गुरु की ' + (conj ? 'युति' : 'दृष्टि') + (w ? ' (किंतु गुरु निर्बल, परिहार दुर्बल)' : ''))]);
    }
    if (P.Mo.rashi === ma.rashi) par.push(['full', t('Moon–Mars conjunction (Chandra-Mangal yoga)', 'चंद्र-मंगल युति (चंद्र-मंगल योग)')]);
    if (P.Ve.rashi === ma.rashi) par.push(['part', t('Venus–Mars conjunction (opinions differ: some call it a remedy, some say it adds to the dosha)', 'शुक्र-मंगल युति (मत-भेद: कुछ परिहार, कुछ दोषवर्धक मानते हैं)')]);
    if (P.Me.rashi === ma.rashi || aspects('Me', P.Me.rashi).includes(ma.rashi)) par.push(['part', t('Mercury conjoins/aspects Mars', 'मंगल पर बुध की युति/दृष्टि')]);
    if ([0, 7].includes(ma.nav)) par.push(['part', t('Mars in own sign in Navamsha', 'नवांश में मंगल स्वराशि में')]);
    const afflicted = ma.tags.filter(x => ['asta', 'vakri', 'neech'].includes(x));
    if (afflicted.length) par.push(['part', t('Mars is ' + afflicted.map(dn).join('/') + ', so its capacity to harm is reduced (opinions differ)', 'मंगल ' + afflicted.map(dn).join('/') + ', दोष-क्षमता न्यून (मत-भेद)')]);
    if (hits.length === 1 && !hits.includes('Lagna')) par.push(['part', t('Dosha arises only from ' + srcN(hits[0]) + ', so it is minor', 'दोष केवल ' + srcN(hits[0]) + ' से, अतः अल्प')]);
  }
  const caution = [1, 6].includes(L) && hits.length ? t('For Taurus/Libra ascendant Mars is a maraka, so the dosha counts more here.', 'वृष/तुला लग्न में मंगल मारकेश है, यहाँ दोष अधिक गिना जाता है।') : '';
  let level: MangalLevel = 'none';
  if (hits.length) {
    level = par.some(x => x[0] === 'full') ? 'cancelled' : hits.length === 3 || (hits.includes('Lagna') && hits.length >= 2) ? 'prabal' : hits.includes('Lagna') ? 'madhyam' : 'alp';
  }
  /** The sign each dosha is counted from, so a partner's chart can be read from the same point. */
  const refs: Record<string, number> = {Lagna: L, Chandra: P.Mo.rashi, Shukra: P.Ve.rashi};
  return {planets, src, hits, refs, MH, par, caution, level, manglik: !['none', 'cancelled'].includes(level)};
}

// ===== The match =====
// i18n-ok: bilingual pairs (every t(en, hi) carries both languages; `language` picks one)
/** Bride first, groom second — the koota tables are not symmetric. */
export function matchKundli(
  bride: BirthPerson,
  groom: BirthPerson,
  language: string = 'en',
  /** Both charts from the backend Jyotish engine (birthChartOf). */
  charts: {bride: BirthChart; groom: BirthChart},
): KundliMatchReport {
  const lang: Lang = language === 'hi' ? 'hi' : 'en';
  const t = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  const pick = (p: Pair) => p[lang === 'hi' ? 1 : 0];
  const rn = (r: number) => pick(RASHI[r]), nk = (n: number) => pick(NAK[n]), pn = (p: Planet) => pick(PN[p]);
  const levelN = (l: MangalLevel) => ({none: '', cancelled: t('cancelled', 'परिहृत'), alp: t('minor', 'अल्प'), madhyam: t('medium', 'मध्यम'), prabal: t('strong', 'प्रबल')})[l];
  // What the tag on each dosha card says. "Remedied" alone confused people:
  // the dosha IS present, but another factor in the charts cancels it.
  const sevN = (s: string) =>
    ({
      ok: t('Present – cancelled', 'है, पर परिहार (कट गया)'),
      part: t('Present – partly cancelled', 'है, आंशिक परिहार'),
      bad: t('Present – not cancelled', 'है, परिहार नहीं'),
      tyajya: t('Present – match not advised', 'है, संबंध अनुचित'),
    })[s] || '';
  type Rule = [boolean, string];
  const applied = (ps: Rule[]) => ps.filter(x => x[0]).map(x => x[1]).join('; ');

  const bcK = charts.bride, bcV = charts.groom;
  const K = moonPoint(bcK.pl.Mo.lon), V = moonPoint(bcV.pl.Mo.lon);
  const mK = mangalOf(bcK, lang), mV = mangalOf(bcV, lang);
  const k = koots(K, V);
  const chartScore = k.total;

  const lordsOK = k.kl === k.vl || mutualFriends(k.kl, k.vl);
  const lordEnemy = rel(k.kl, k.vl) === 'E' || rel(k.vl, k.kl) === 'E';
  const nl1 = NAK_LORD[K.nak % 9], nl2 = NAK_LORD[V.nak % 9];
  const isNode = (p: Planet) => p === 'Ra' || p === 'Ke';
  const nakLordsOK = nl1 === nl2 || (!isNode(nl1) && !isNode(nl2) && mutualFriends(nl1, nl2));
  const bhakootShuddh = !['2/12', '6/8'].includes(k.pair);
  const sameNak = K.nak === V.nak, sameRashi = K.rashi === V.rashi;

  const groomL = t('Groom ', 'वर '), brideL = t('bride ', 'कन्या ');
  const positions =
    t('Groom: ', 'वर: ') + nk(V.nak) + t(' pada ', ' चरण ') + V.charan + ' (' + rn(V.rashi) + '), ' +
    t('Bride: ', 'कन्या: ') + nk(K.nak) + t(' pada ', ' चरण ') + K.charan + ' (' + rn(K.rashi) + ')';

  const notes: Record<string, string> = {
    varna: groomL + pick(VARNAN[VARNA[V.rashi]]) + ', ' + brideL + pick(VARNAN[VARNA[K.rashi]]) + '.',
    vashya: groomL + pick(VASHYAN[k.vvs]) + ', ' + brideL + pick(VASHYAN[k.kvs]) + '.',
    tara: k.taraK && k.taraV ? t('Auspicious tara from both sides.', 'दोनों ओर से शुभ तारा।') : k.taraK || k.taraV ? t('Auspicious from one side, so the dosha is minor.', 'एक ओर से शुभ तारा, अतः दोष अल्प।') : t('Vipat/pratyari/vadha tara from both sides.', 'दोनों ओर से विपत्/प्रत्यरि/वधा तारा।'),
    yoni: groomL + pick(YONIN[YONI[V.nak]]) + ', ' + brideL + pick(YONIN[YONI[K.nak]]) + '.',
    grahaMaitri: t('Sign lords ', 'राशीश ') + pn(k.vl) + ', ' + pn(k.kl) + (k.kl === k.vl ? t(' (same).', ' (एक)।') : mutualFriends(k.kl, k.vl) ? t(' (mutual friends).', ' (परस्पर मित्र)।') : lordEnemy ? t(' (enemies).', ' (शत्रु)।') : t(' (neutral).', ' (सम)।')),
    gana: groomL + pick(GANAN[GANA[V.nak]]) + ', ' + brideL + pick(GANAN[GANA[K.nak]]) + '.',
    bhakoot: t('Signs ' + k.d1 + '–' + k.d2 + ' apart (', 'राशियाँ ' + k.d1 + '–' + k.d2 + ' पर (') + rn(V.rashi) + ', ' + rn(K.rashi) + ').',
    nadi: groomL + pick(NADIN[NADI[V.nak]]) + ', ' + brideL + pick(NADIN[NADI[K.nak]]) + t(' nadi.', ' नाड़ी।'),
  };
  const scoreOf: Record<string, number> = {varna: k.varna, vashya: k.vashya, tara: k.tara, yoni: k.yoni, grahaMaitri: k.maitri, gana: k.gana, bhakoot: k.bhakoot, nadi: k.nadi};
  const kootas: KootaScore[] = KOOTAS.map(c => ({key: c.key, name: c.name, max: c.max, score: scoreOf[c.key], note: notes[c.key]}));
  const totalScore = k.total;

  const doshas: Dosha[] = [];
  const sev: Record<string, SeverityKey> = {};
  const push = (name: string, present: boolean, severity: SeverityKey | '', description: string, remedy = '') =>
    doshas.push({name, present, severity: present ? sevN(severity) : '', severityKey: present ? severity : '', description, remedy});

  // Nadi
  if (!k.nadiSame) {
    sev.nadi = 'ok';
    push(t('Nadi dosha', 'नाड़ी दोष'), false, '', notes.nadi + t(' 8/8.', ' 8/8 गुण।'));
  } else {
    const ps: Rule[] = [
      [sameNak && K.charan !== V.charan, t('Same nakshatra, different pada', 'एक ही नक्षत्र, भिन्न चरण')],
      [sameRashi && !sameNak, t('Same rashi, different nakshatra', 'एक ही राशि, भिन्न नक्षत्र')],
      [sameNak && !sameRashi, t('Same nakshatra, different rashi', 'एक ही नक्षत्र, भिन्न राशि')],
      [lordsOK, t('Rashi lords same or mutual friends (', 'राशीश एक या परस्पर मित्र (') + pn(k.vl) + ', ' + pn(k.kl) + ')'],
      [nakLordsOK, t('Nakshatra lords friendly (', 'नक्षत्र-स्वामियों में मैत्री (') + pn(nl2) + ', ' + pn(nl1) + ')'],
      [k.maitri === 5 && bhakootShuddh, t('Full graha maitri (5/5) and clean bhakoot', 'ग्रहमैत्री पूर्ण (5/5) तथा भकूट शुद्ध')],
    ];
    const strong = ps.slice(0, 3).some(x => x[0]), part = ps.slice(3).some(x => x[0]);
    sev.nadi = strong ? 'ok' : part ? 'part' : 'bad';
    push(
      t('Nadi dosha', 'नाड़ी दोष'), true, sev.nadi,
      t('Both have ' + pick(NADIN[NADI[K.nak]]) + ' nadi. Indicates harm to progeny and health.', 'दोनों की ' + pick(NADIN[NADI[K.nak]]) + ' नाड़ी। संतति-हानि व स्वास्थ्य-क्षय का सूचक।'),
      applied(ps) || t('Mahamrityunjaya japa, nakshatra-devata shanti, cow/gold-nadi donation. An unremedied nadi dosha should not be accepted on remedies alone.', 'महामृत्युंजय जप, नक्षत्र-देवता शांति, गोदान/स्वर्ण-नाड़ी दान। अपरिहृत नाड़ी दोष को केवल उपाय के बल पर स्वीकार करना उचित नहीं।'),
    );
  }
  // Bhakoot
  const bn = ({'2/12': t('Dwi-dwadash (2/12)', 'द्विर्द्वादश (२/१२)'), '6/8': t('Shadashtak (6/8)', 'षडाष्टक (६/८)'), '5/9': t('Nav-pancham (5/9)', 'नवपंचम (५/९)')} as Record<string, string>)[k.pair];
  if (!bn) {
    sev.bhakoot = 'ok';
    push(t('Bhakoot dosha', 'भकूट दोष'), false, '', notes.bhakoot);
  } else {
    const kvg = navOf(K.lon) === navOf(V.lon) || (navOf(K.lon) === K.rashi && navOf(V.lon) === V.rashi);
    const ps: Rule[] = [
      [k.kl === k.vl, t('Both signs have the same lord (', 'दोनों राशियों का स्वामी एक (') + pn(k.vl) + ', ' + pn(k.kl) + ')'],
      [mutualFriends(k.kl, k.vl) && k.kl !== k.vl, t('Sign lords are mutual friends', 'राशीश परस्पर मित्र')],
      [k.maitri === 5, t('Full 5 points in graha maitri', 'ग्रहमैत्री में पूर्ण 5 गुण')],
      [kvg, t('Both Moons in the same navamsha or vargottama', 'दोनों के चंद्र एक ही नवांश में या वर्गोत्तम')],
      [!k.nadiSame && chartScore >= 18, t('Nadi clean and enough gunas: bhakoot secondary', 'नाड़ी शुद्ध व गुण पर्याप्त: भकूट गौण')],
    ];
    const strong = ps.slice(0, 3).some(x => x[0]), part = ps.slice(3).some(x => x[0]);
    const tyajya = k.pair === '6/8' && !lordsOK && k.nadiSame;
    sev.bhakoot = tyajya ? 'tyajya' : strong ? 'ok' : part || k.pair === '5/9' ? 'part' : 'bad';
    const lvl = ({'6/8': t('Indicates misfortune, discord, harm to longevity (most inauspicious).', 'अरिष्ट, कलह, आयु-हानि का संकेत (सर्वाधिक अशुभ)।'), '2/12': t('Indicates financial loss and separation.', 'आर्थिक क्षय व वियोग का संकेत।'), '5/9': t('Minor dosha (opinions differ).', 'अल्प दोष (मत-भेद)।')} as Record<string, string>)[k.pair];
    push(
      bn + t(' bhakoot', ' भकूट'), true, sev.bhakoot,
      lvl + ' ' + rn(V.rashi) + ', ' + rn(K.rashi) + '.' + (tyajya ? t(' Shadashtak + no lord friendship + nadi dosha: the shastra calls this to be rejected.', ' षडाष्टक + राशीश-मैत्री नहीं + नाड़ी दोष: शास्त्र इसे त्याज्य कहता है।') : ''),
      applied(ps),
    );
  }
  // Gana
  const gk = GANA[K.nak], gv = GANA[V.nak], dr = (gk === 0 && gv === 2) || (gk === 2 && gv === 0), mr = (gk === 1 && gv === 2) || (gk === 2 && gv === 1);
  if (!dr && !mr) {
    sev.gana = 'ok';
    push(t('Gana dosha', 'गण दोष'), false, '', notes.gana + ' ' + k.gana + '/6.');
  } else {
    const ps: Rule[] = [
      [lordsOK, t('Sign lords same or mutual friends', 'राशीश एक या परस्पर मित्र')],
      [sameRashi, t('Both Moons in the same sign', 'दोनों के चंद्र एक ही राशि में')],
      [nl1 === nl2, t('Same nakshatra lord', 'नक्षत्र-स्वामी एक')],
      [bhakootShuddh && !k.nadiSame, t('Bhakoot and nadi both clean', 'भकूट व नाड़ी दोनों शुद्ध')],
      [gv === 0 && gk === 2, t('Groom Deva, bride Rakshasa: reverse order, dosha is minor', 'वर देव, कन्या राक्षस: विपरीत क्रम, दोष अल्प')],
      [chartScore > 27, t('Gunas above 27: gana dosha negligible', 'गुण 27 से अधिक: गण दोष उपेक्षणीय')],
    ];
    // Groom Deva with bride Rakshasa only softens the dosha (its own wording: "minor"); it is not a parihar.
    const ok = ps.some((x, i) => i !== 4 && x[0]), minor = ps[4][0];
    sev.gana = ok ? 'ok' : minor || !dr ? 'part' : 'bad';
    push(
      t('Gana dosha: ', 'गण दोष: ') + pick(GANAN[gv]) + '–' + pick(GANAN[gk]), true, sev.gana,
      (dr ? t('Deva–Rakshasa: major dosha.', 'देव–राक्षस: प्रधान दोष।') : t('Manushya–Rakshasa: medium dosha.', 'मनुष्य–राक्षस: मध्यम दोष।')) + (gk === 0 && gv === 2 ? t(' Groom Rakshasa with bride Deva is considered more inauspicious.', ' वर राक्षस व कन्या देव अधिक अशुभ माना गया है।') : ''),
      applied(ps),
    );
  }
  // Yoni
  const yk = YONI[K.nak], yv = YONI[V.nak], enemy = YONI_ENEMY.some(([a, b]) => (a === yk && b === yv) || (a === yv && b === yk));
  if (!enemy) {
    sev.yoni = 'ok';
    push(t('Yoni dosha', 'योनि दोष'), false, '', notes.yoni + ' ' + k.yoni + '/4.');
  } else {
    const ps: Rule[] = [
      [k.maitri === 5, t('Full graha maitri (5/5)', 'ग्रहमैत्री पूर्ण (5/5)')],
      [lordsOK, t('Sign lords mutual friends', 'राशीश परस्पर मित्र')],
      [bhakootShuddh && !k.nadiSame, t('Bhakoot and nadi both clean', 'भकूट व नाड़ी दोनों शुद्ध')],
      [k.vashya === 2, t('Full vashya koota', 'वश्य कूट पूर्ण')],
    ];
    const ok = ps.some(x => x[0]);
    sev.yoni = ok ? 'ok' : 'part';
    push(t('Yoni dosha: ', 'योनि दोष: ') + pick(YONIN[yv]) + '–' + pick(YONIN[yk]) + t(' (enemy yonis)', ' (शत्रु योनि)'), true, sev.yoni, t('A dosha of physical compatibility.', 'दैहिक सामंजस्य का दोष।'), applied(ps));
  }
  // Rajju
  const rk = rajjuOf(K.nak), rv = rajjuOf(V.nak);
  const dirN = (d: string) => ({aroha: t('ascending', 'आरोही'), avaroha: t('descending', 'अवरोही'), madhya: t('middle', 'मध्य')} as Record<string, string>)[d];
  if (rk.r !== rv.r) {
    sev.rajju = 'ok';
    push(t('Rajju dosha', 'रज्जु दोष'), false, '', groomL + pick(RAJJUN[rv.r]) + ', ' + brideL + pick(RAJJUN[rk.r]) + t(' rajju.', ' रज्जु।'));
  } else {
    const shiro = rk.r === 4, dirDiff = !shiro && rk.dir !== rv.dir, three = !k.nadiSame && bhakootShuddh && sev.gana === 'ok';
    const ps: Rule[] = shiro
      ? [[false, t('No tradition relaxes Shiro rajju', 'शिरो-रज्जु का परिहार किसी परंपरा में शिथिल नहीं')]]
      : [
          [dirDiff, t('Same rajju but ascending/descending differ (', 'रज्जु एक, किंतु आरोह-अवरोह भिन्न (') + dirN(rv.dir) + ', ' + dirN(rk.dir) + ')'],
          [!sameNak, t('Different nakshatras: dosha minor', 'नक्षत्र भिन्न: दोष अल्प')],
          [three, t('Nadi, bhakoot, gana all clean: rajju secondary', 'नाड़ी, भकूट, गण तीनों शुद्ध: रज्जु गौण')],
        ];
    sev.rajju = shiro ? 'tyajya' : dirDiff ? 'ok' : !sameNak || three ? 'part' : 'bad';
    const phal = [t('wandering, instability', 'भ्रमण, अस्थिरता'), t('poverty', 'दारिद्र्य'), t('trouble with children', 'संतान-कष्ट'), t('fear of widowhood', 'वैधव्य-भय'), t('misfortune akin to death', 'मृत्यु-तुल्य अरिष्ट')][rk.r];
    push(
      pick(RAJJUN[rk.r]) + t(' rajju dosha', ' रज्जु दोष'), true, sev.rajju,
      t('Both have ' + pick(RAJJUN[rk.r]) + ' rajju. Result: ' + phal + '. In the North Indian ashtakoot system this is a supporting koota.', 'दोनों का ' + pick(RAJJUN[rk.r]) + ' रज्जु। फल: ' + phal + '। उत्तर भारत की अष्टकूट पद्धति में यह सहायक कूट है।'),
      shiro ? ps[0][1] : applied(ps),
    );
  }
  // Vedha
  const vedha = VEDHA.some(([a, b]) => (a === K.nak && b === V.nak) || (a === V.nak && b === K.nak));
  if (!vedha) {
    push(t('Vedha dosha', 'वेध दोष'), false, '', t('Not a vedha pair.', 'नक्षत्र वेध-युग्म नहीं हैं।'));
  } else {
    const ps: Rule[] = [
      [k.kl === k.vl, t('Same sign lord', 'एक ही राशि-स्वामी')],
      [nakLordsOK, t('Nakshatra lords mutual friends', 'नक्षत्र-स्वामी परस्पर मित्र')],
      [K.charan !== V.charan, t('Different padas: dosha reduced', 'चरण भिन्न: दोष न्यून')],
      [!k.nadiSame && bhakootShuddh, t('Nadi and bhakoot clean: vedha secondary', 'नाड़ी व भकूट शुद्ध: वेध गौण')],
    ];
    const ok = ps[0][0] || ps[1][0] || ps[3][0];
    push(t('Vedha dosha: ', 'वेध दोष: ') + nk(V.nak) + '–' + nk(K.nak), true, ok ? 'ok' : 'part', t('These nakshatras obstruct each other.', 'ये नक्षत्र परस्पर वेध-युक्त हैं।'), applied(ps));
  }
  // Mangal, both charts together
  const mangalName = t('Mangal dosha', 'मंगल दोष');
  const who = (name: string, m: ReturnType<typeof mangalOf>) => name + ' (' + levelN(m.level) + (m.caution ? '; ' + m.caution : '') + ')';
  if (mK.manglik && mV.manglik) {
    push(mangalName, true, 'ok', who(groom.name, mV) + ', ' + who(bride.name, mK) + '. ' + t('Both are manglik: mutual cancellation (universally accepted).', 'दोनों मांगलिक: परस्पर शमन (सर्वमान्य परिहार)।'));
  } else if (mK.manglik || mV.manglik) {
    const brideIs = mK.manglik, m1 = brideIs ? mK : mV, other = brideIs ? mV : mK;
    // Cancellation by equality (dosha-samya): for every reference point (lagna/Moon/Venus) the dosha is
    // counted from, the other chart needs a malefic in a dosha house counted from its own same point.
    const SAMYA: Planet[] = ['Ma', 'Sa', 'Ra', 'Ke', 'Su'];
    const refN = (r: string) => ({Lagna: t('ascendant', 'लग्न'), Chandra: t('Moon', 'चंद्र'), Shukra: t('Venus', 'शुक्र')})[r] as string;
    const juOK = !other.planets.Ju.tags.includes('neech');
    const balance = m1.hits.map(r => ({
      r,
      ps: SAMYA.filter(p => m1.MH.includes(houseFrom(other.planets[p].rashi, other.refs[r]))),
      ju: m1.src[r] === 7 && juOK && houseFrom(other.planets.Ju.rashi, other.refs[r]) === 7,
    }));
    const sh: string[] = [];
    if (balance.length && balance.every(b => b.ps.length || b.ju)) {
      for (const b of balance) {
        if (b.ps.length) sh.push(t('Other chart has ' + b.ps.map(pn).join('/') + ' in a dosha house (' + houseFrom(other.planets[b.ps[0]].rashi, other.refs[b.r]) + ') from its ' + refN(b.r) + ': cancellation by equality', 'दूसरी कुंडली में ' + refN(b.r) + ' से दोष-भाव (' + houseFrom(other.planets[b.ps[0]].rashi, other.refs[b.r]) + ') में ' + b.ps.map(pn).join('/') + ': समता से शमन'));
        else sh.push(t('Other chart has a strong Jupiter in the 7th from its ' + refN(b.r) + ': cancellation', 'दूसरी कुंडली में ' + refN(b.r) + ' से सप्तम में बली गुरु: शमन'));
      }
    }
    const upay = brideIs
      ? t('Kumbh/Vishnu-vivah (if family tradition), Mangal shanti, Mangala-Gauri vrat (16 Tuesdays)', 'कुंभ/विष्णु-विवाह (पारिवारिक परंपरा हो तो), मंगल-शांति, मंगल-गौरी व्रत (१६ मंगलवार)')
      : t('Hanuman worship, Mangal shanti, Rin-mochan Mangal stotra, donate masoor/red sandalwood on Tuesday', 'हनुमान-उपासना, मंगल-शांति, ऋणमोचन मंगल स्तोत्र, मसूर/रक्तचंदन दान (मंगलवार)');
    push(
      mangalName, true, sh.length ? 'ok' : m1.level === 'alp' || m1.par.length ? 'part' : 'bad',
      t(who(brideIs ? bride.name : groom.name, m1) + ' is manglik, ' + (brideIs ? groom.name : bride.name) + ' is not.', who(brideIs ? bride.name : groom.name, m1) + ' मांगलिक है, ' + (brideIs ? groom.name : bride.name) + ' नहीं।') + (m1.par.length ? ' ' + m1.par.map(x => x[1]).join('; ') + '.' : ''),
      sh.length ? sh.join('; ') : upay,
    );
  } else {
    push(mangalName, false, '', t('No effective Mangal dosha in either chart.', 'किसी में प्रभावी मंगल दोष नहीं।') + (mK.par.length || mV.par.length ? ' ' + [mV, mK].flatMap(m => m.par.map(x => x[1])).join('; ') + '.' : ''));
  }

  // Nishedh-dwar: any one proven means 'no' regardless of gunas.
  const blocked: string[] = [];
  if (k.nadiSame && sev.nadi === 'bad' && lordEnemy) blocked.push(t('Nadi', 'नाड़ी'));
  if (rk.r === 4 && rv.r === 4) blocked.push(t('Rajju', 'रज्जु'));
  if (k.pair === '6/8' && lordEnemy && k.nadiSame) blocked.push(t('Bhakoot', 'भकूट'));

  // Navamsha (D9), as the detailed page scores it: karaka is Venus for the groom, Jupiter for the bride.
  const d9 = (bc: BirthChart, karaka: Planet) => {
    const nav = (p: Planet) => navOf(bc.pl[p].lon), navL = navOf(bc.asc), vg = (p: Planet) => nav(p) === bc.pl[p].rashi;
    const nl = SIGN_LORD[navL], n7 = SIGN_LORD[(navL + 6) % 12], l7 = SIGN_LORD[(bc.lagna + 6) % 12], h7 = houseFrom(nav(n7), navL);
    const at = (p: Planet) => pn(p) + ' · ' + rn(nav(p)), l7k = [...new Set([l7, karaka])], vgs = l7k.filter(vg);
    return {
      navL,
      moon: nav('Mo'),
      checks: [
        {ok: ['swa', 'uchch', 'mitra'].includes(dignity(nl, nav(nl))), cell: at(nl)},
        {ok: [1, 4, 5, 7, 9, 10].includes(h7), cell: at(n7) + ', ' + t('house ', 'भाव ') + h7},
        {ok: vgs.length > 0, cell: (vgs.length ? vgs : l7k).map(pn).join(', ')},
      ],
    };
  };
  const gD = d9(bcV, 'Ve'), bD = d9(bcK, 'Ju');
  const apart = (a: number, b: number) => [houseFrom(a, b), houseFrom(b, a)].sort((x, y) => x - y).join('/');
  const lagnaRel = apart(gD.navL, bD.navL), moonRel = apart(gD.moon, bD.moon);
  // An auspicious lagna relation adds 4. A 6/8 or 2/12 one is noted as "to be avoided" but takes nothing from the checks'
  // points: as a −4 it cancelled them, and a 0/20 read as broken (user's call, 2026-09-29).
  const lagnaBad = ['6/8', '2/12'].includes(lagnaRel);
  const rel4 = ['7/7', '5/9', '4/10'].includes(lagnaRel) ? 4 : 0;
  const moonGood = ['1/1', '7/7', '5/9', '4/10'].includes(moonRel), moonBad = ['6/8', '2/12'].includes(moonRel);
  const r1 = (x: number) => Math.round(x * 10) / 10;
  const D9_CHECKS: [string, number][] = [
    [t('Navamsha ascendant lord strong in its navamsha', 'नवांश-लग्नेश अपने नवांश में बली'), 5],
    [t('Navamsha 7th lord in kendra/trikona', 'नवांश-सप्तमेश केंद्र/त्रिकोण में'), 6],
    [t('7th lord or karaka vargottama', 'सप्तमेश या कारक वर्गोत्तम'), 5],
  ];
  const mark = (c: {ok: boolean; cell: string}, max: number) => c.cell + (c.ok ? ` ✓ ${max}` : ' ✗ 0');
  const d9Rows: D9Row[] = [
    {label: t('Navamsha ascendant', 'नवांश लग्न'), groom: rn(gD.navL), bride: rn(bD.navL), points: lagnaRel + ' · ' + (rel4 ? '+4' : '0')},
    {label: t('Navamsha Moon', 'नवांश चंद्र'), groom: rn(gD.moon), bride: rn(bD.moon), points: moonRel},
    ...D9_CHECKS.map(([label, max], i) => ({label, groom: mark(gD.checks[i], max), bride: mark(bD.checks[i], max), points: r1(((+gD.checks[i].ok + +bD.checks[i].ok) * max) / 2) + '/' + max})),
  ];
  const d9Sum = D9_CHECKS.reduce((s, [, max], i) => s + ((+gD.checks[i].ok + +bD.checks[i].ok) * max) / 2, 0);
  const d9Score = Math.min(20, r1(d9Sum + rel4));
  const navamsha: NavamshaMatch = {
    score: d9Score,
    max: 20,
    rows: d9Rows,
    notes: [
      t('Navamsha ascendants are ' + lagnaRel + ' from each other: ', 'नवांश लग्न परस्पर ' + lagnaRel + ': ') +
        (rel4 > 0 ? t('auspicious, the deeper natures support each other.', 'शुभ, अंतःप्रकृति एक-दूसरे की पूरक।') : lagnaBad ? t('to be avoided, friction in the deeper bond.', 'त्याज्य, गहरे संबंध में घर्षण।') : t('neutral.', 'सम।')),
      t('Navamsha Moons are ' + moonRel + ' from each other: ', 'नवांश चंद्र परस्पर ' + moonRel + ': ') +
        (moonGood ? t('supports emotional harmony.', 'भावनात्मक सामंजस्य में सहायक।') : moonBad ? t('some emotional friction; not a dosha on its own.', 'कुछ भावनात्मक घर्षण; स्वयं में दोष नहीं।') : t('neutral.', 'सम।')),
      d9Score >= 14 ? t('Strong navamsha support for the marriage.', 'विवाह को नवांश का प्रबल समर्थन।') : d9Score >= 8 ? t('Moderate navamsha support.', 'नवांश का मध्यम समर्थन।') : t('Weak navamsha support: have an astrologer read both D9 charts.', 'नवांश का समर्थन दुर्बल: दोनों D9 कुंडली ज्योतिषी से दिखाएँ।'),
    ],
  };

  return {
    kootas,
    totalScore,
    maxScore: KUNDLI_MAX_SCORE,
    compatibilityPercent: Math.round((totalScore / KUNDLI_MAX_SCORE) * 100),
    chartScore,
    verdictKey: blocked.length ? 'poor' : verdictFor(totalScore),
    positions,
    summary: blocked.length ? t('Dosha proven: ' + blocked.join(', ') + '. The shastra advises against this match; consult an astrologer before deciding.', 'दोष सिद्ध: ' + blocked.join(', ') + '। शास्त्र इस संयोग को अनुचित कहता है; निर्णय से पहले ज्योतिषी से परामर्श करें।') : '',
    doshas,
    navamsha,
  };
}
