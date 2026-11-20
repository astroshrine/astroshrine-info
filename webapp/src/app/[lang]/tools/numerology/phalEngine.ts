/* eslint-disable */
// @ts-nocheck
// Ported from the AstroShrine app (components/astro/tools/html/phalShared.ts): the shared phaladesh engine (pure).
// Types are loose on purpose: the tables are the app's own data, shared by the numerology and tarot engines.

/* ---------- Phaladesh (shared): verdict, strength, time window, reasons with their source ---------- */
export const PHAL = {
  siddhi: ['There is a yoga: the matter will succeed.', 'योग है; कार्य सिद्ध होगा।'],
  siddhi_vilamb: ['There is a yoga, but with delay or effort.', 'योग है, किंतु विलंब से।'],
  aanshik: ['A yoga for partial success.', 'आंशिक सफलता का योग।'],
  asiddhi: ['No yoga for it in this period.', 'इस अवधि में योग नहीं बनता।'],
  anirnit: ['Cannot be decided', 'निर्णय संभव नहीं']
};
/* Health readings are a tendency only (Kosh 1.5, part 4): the same verdicts in tendency words. */
export const PRAVRITTI = {
  siddhi: ['Tendency: favourable.', 'प्रवृत्ति: अनुकूल।'],
  siddhi_vilamb: ['Tendency: favourable, but slowly.', 'प्रवृत्ति: अनुकूल, किंतु धीरे-धीरे।'],
  aanshik: ['Tendency: partly favourable.', 'प्रवृत्ति: आंशिक रूप से अनुकूल।'],
  asiddhi: ['Tendency: needs extra care.', 'प्रवृत्ति: अतिरिक्त देखभाल आवश्यक।'],
  anirnit: PHAL.anirnit
};
export const PHAL_CLS = {siddhi: 'ok', siddhi_vilamb: 'mid', aanshik: 'mid', asiddhi: 'bad', anirnit: 'mid'};
export const BAL = {prabal: ['Strong', 'प्रबल'], madhyam: ['Moderate', 'मध्यम'], durbal: ['Weak', 'दुर्बल']};
export const BAL_ORDER = ['durbal', 'madhyam', 'prabal'];
/** Strength moved d steps (±), kept within durbal..prabal. */
export function balShift(bal: any, d: any) { var i = BAL_ORDER.indexOf(bal) + d; return BAL_ORDER[Math.max(0, Math.min(2, i))]; }
export const PRAMAAN = {
  mool_granth: ['classical text', 'मूल ग्रंथ'],
  teeka_parampara: ['commentary tradition', 'टीका-परंपरा'],
  adhunik_parampara: ['modern tradition', 'आधुनिक परंपरा'],
  koi_shastra_nahin: ['no classical source', 'कोई शास्त्र नहीं']
};
/** A rule's source. sandarbh: '2.35' or [en, hi]; null = chapter/verse not yet verified ("verification pending"). */
export function shastra(granthEn: any, granthHi: any, sandarbh: any, star: any) { return {granth: [granthEn, granthHi], sandarbh: sandarbh || null, pramaan_star: star}; }
/** One reason: effect +1 supports, -1 opposes, 0 informs. */
export function reason(id: any, en: any, hi: any, effect: any, src: any) { return {rule_id: id, text: [en, hi], effect: effect, shastra: src}; }
/* Topics whose phal is not given for a minor (Kosh 1.5: marriage, money, misfortune). */
export const MINOR_BLOCK = ['Not shown: the client is under 18, and readings on marriage, money or misfortune are not given for minors.',
  'नहीं दिखाया गया: जातक 18 वर्ष से कम आयु का है; नाबालिग के लिए विवाह, धन या दुर्भाग्य के फल नहीं दिए जाते।'];
export const HEALTH_NOTE = ['Health: only a tendency is shown, with no time window. A check-up with a qualified doctor is essential.',
  'स्वास्थ्य: केवल प्रवृत्ति दिखाई गई है, कोई कालखंड नहीं। योग्य चिकित्सक से जाँच अनिवार्य है।'];
export const HEALTH_KAAL_NULL = ['No time window is given for health.', 'स्वास्थ्य के लिए कोई कालखंड नहीं दिया जाता।'];
/** 'YYYY-MM' for a year and month 1-12. */
export function ym(y: any, m: any) { return y + '-' + (m < 10 ? '0' : '') + m; }
/** Full years of age on a date; both 'YYYY-MM-DD'. */
export function ageOn(dob: any, on: any) {
  var a = dob.split('-').map(Number), b = on.split('-').map(Number);
  return b[0] - a[0] - (b[1] < a[1] || (b[1] === a[1] && b[2] < a[2]) ? 1 : 0);
}
