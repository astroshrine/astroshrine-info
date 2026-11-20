/**
 * Sankalpa (brief §8, plan §6): the kaal/desh fields for the chosen muhurat, filled into the
 * KB's template (a reviewed asset, needs_review until an acharya marks it verified). The user edits the result.
 */
import type {Bi, Content} from './kb';
import type {Candidate, Venue} from './search';
import {MAAS_EN, NAK_EN, VAAR_EN, tithiEn} from './names';

export type MonthSystem = 'amanta' | 'purnimanta';
export type SamvatsaraSystem = 'north' | 'south';

// prettier-ignore
const SAMVATSARA: [string, string][] = [
  ['प्रभव','Prabhava'],['विभव','Vibhava'],['शुक्ल','Shukla'],['प्रमोद','Pramoda'],['प्रजापति','Prajapati'],['अङ्गिरा','Angirasa'],['श्रीमुख','Shrimukha'],['भाव','Bhava'],['युवा','Yuva'],['धाता','Dhata'],
  ['ईश्वर','Ishvara'],['बहुधान्य','Bahudhanya'],['प्रमाथी','Pramathi'],['विक्रम','Vikrama'],['वृष','Vrisha'],['चित्रभानु','Chitrabhanu'],['सुभानु','Subhanu'],['तारण','Tarana'],['पार्थिव','Parthiva'],['व्यय','Vyaya'],
  ['सर्वजित्','Sarvajit'],['सर्वधारी','Sarvadhari'],['विरोधी','Virodhi'],['विकृति','Vikriti'],['खर','Khara'],['नन्दन','Nandana'],['विजय','Vijaya'],['जय','Jaya'],['मन्मथ','Manmatha'],['दुर्मुख','Durmukha'],
  ['हेमलम्ब','Hemalamba'],['विलम्ब','Vilamba'],['विकारी','Vikari'],['शार्वरी','Sharvari'],['प्लव','Plava'],['शुभकृत्','Shubhakrit'],['शोभकृत्','Shobhakrit'],['क्रोधी','Krodhi'],['विश्वावसु','Vishvavasu'],['पराभव','Parabhava'],
  ['प्लवङ्ग','Plavanga'],['कीलक','Kilaka'],['सौम्य','Saumya'],['साधारण','Sadharana'],['विरोधकृत्','Virodhakrit'],['परिधावी','Paridhavi'],['प्रमादी','Pramadi'],['आनन्द','Ananda'],['राक्षस','Rakshasa'],['नल','Nala'],
  ['पिङ्गल','Pingala'],['कालयुक्त','Kalayukta'],['सिद्धार्थी','Siddharthi'],['रौद्र','Raudra'],['दुर्मति','Durmati'],['दुन्दुभि','Dundubhi'],['रुधिरोद्गारी','Rudhirodgari'],['रक्ताक्ष','Raktaksha'],['क्रोधन','Krodhana'],['अक्षय','Akshaya'],
];
const MAAS_HI = ['चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ़', 'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन'];
// ritu by lunar month (amanta index), two months each from Chaitra
const RITU: [string, string][] = [
  ['वसन्त', 'Vasanta'],
  ['ग्रीष्म', 'Grishma'],
  ['वर्षा', 'Varsha'],
  ['शरद्', 'Sharad'],
  ['हेमन्त', 'Hemanta'],
  ['शिशिर', 'Shishira'],
];
const VAASARA = ['रवि', 'सोम', 'भौम', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

// Purnimanta in the north; everything else defaults to Amanta (the user can switch it).
const PURNIMANTA_STATES =
  /uttar pradesh|bihar|madhya pradesh|rajasthan|delhi|haryana|punjab|himachal|uttarakhand|jharkhand|chhattisgarh|jammu|chandigarh|उत्तर प्रदेश|बिहार|मध्य प्रदेश|राजस्थान|दिल्ली|हरियाणा|पंजाब|हिमाचल|उत्तराखण्ड|उत्तराखंड|झारखण्ड|झारखंड|छत्तीसगढ़|जम्मू/i;
export const defaultMonthSystem = (state: string): MonthSystem => (PURNIMANTA_STATES.test(state) ? 'purnimanta' : 'amanta');

export interface SankalpaFields {
  vikram: number;
  shaka: number;
  samvatsara: Bi;
  samvatsaraSystem: SamvatsaraSystem;
  ayana: Bi;
  ritu: Bi;
  masa: Bi;
  monthSystem: MonthSystem;
  paksha: Bi;
  tithi: Bi;
  vaar: Bi;
  nakshatra: Bi;
  yoga: Bi;
  karana: Bi;
}

/**
 * Vikram samvat turns at Chaitra shukla pratipada (the amanta Chaitra's start); Shaka = VS − 135.
 * Samvatsara, north: the Barhaspatya name at the year's start, (VS + 10) mod 60 — VS 2081 कालयुक्त,
 * 2082 सिद्धार्थी, 2083 रौद्र as printed by North Indian panchangs.
 * ponytail: the Barhaspatya cycle skips a name about every 85 years; the fixed offset holds for this era
 * only. Switch to mean-Jupiter sign entries if dates decades away are ever needed.
 * Samvatsara, south: the luni-solar year from Chaitra (Ugadi/Gudi Padwa), (Shaka + 11) mod 60 — 1948 पराभव.
 */
export function yearOf(date: string, amantaMonth: number) {
  const y = +date.slice(0, 4),
    gm = +date.slice(5, 7);
  const started = gm >= 5 || amantaMonth < 9; // Jan–Apr in Pausha/Magha/Phalguna: the new year hasn't begun
  const vikram = y + (started ? 57 : 56);
  return {vikram, shaka: vikram - 135};
}
export const samvatsaraOf = (vikram: number, system: SamvatsaraSystem): Bi => {
  const [hi, en] = SAMVATSARA[system === 'north' ? (vikram + 10) % 60 : (vikram - 135 + 11) % 60];
  return {hi, en};
};

export function sankalpaFields(c: Candidate, monthSystem: MonthSystem, samvatsaraSystem: SamvatsaraSystem): SankalpaFields {
  const {vikram, shaka} = yearOf(c.date, c.maas.amanta);
  const m = monthSystem === 'amanta' ? c.maas.amanta : c.maas.purnimanta;
  const adhik = c.maas.adhik ? {hi: 'अधिक ', en: 'Adhika '} : {hi: '', en: ''};
  const uttara = [9, 10, 11, 0, 1, 2].includes(c.sunSign);
  const ritu = RITU[Math.floor(c.maas.amanta / 2)];
  const [tithiHi] = c.tithi.hi.split(' ').slice(-1);
  return {
    vikram,
    shaka,
    samvatsara: samvatsaraOf(vikram, samvatsaraSystem),
    samvatsaraSystem,
    ayana: uttara ? {hi: 'उत्तरायणे', en: 'Uttarayana'} : {hi: 'दक्षिणायने', en: 'Dakshinayana'},
    ritu: {hi: ritu[0], en: ritu[1]},
    // an adhika month is named by the amanta month it precedes in both reckonings
    masa: {hi: adhik.hi + MAAS_HI[c.maas.adhik ? c.maas.amanta : m], en: adhik.en + MAAS_EN[c.maas.adhik ? c.maas.amanta : m]},
    monthSystem,
    paksha: c.paksha === 'shukla' ? {hi: 'शुक्ल', en: 'Shukla'} : {hi: 'कृष्ण', en: 'Krishna'},
    tithi: {hi: tithiHi, en: tithiEn(c.paksha, c.tn).split(' ').slice(1).join(' ')},
    vaar: {hi: VAASARA[c.vaarIdx], en: VAAR_EN[c.vaarIdx]},
    nakshatra: {hi: c.nakshatra.hi, en: NAK_EN[c.nakIdx]},
    yoga: {hi: c.yoga.hi.split(' → ')[0], en: c.yoga.en.split(' → ')[0]},
    karana: {hi: c.karana.hi.split(' → ')[0], en: c.karana.en.split(' → ')[0]},
  };
}

export interface SankalpaFill {
  gotra: string;
  father: string;
  child: string;
  sanskarName: string; // अन्नप्राशन / चूडाकरण
  venue: Pick<Venue, 'city' | 'state' | 'country'>;
  withGeo: boolean; // the traditional "जम्बूद्वीपे भरतखण्डे …" section
}

const BLANK = '__________';
/** The template with every placeholder filled; anything the user didn't give stays a blank line to write in. */
export function fillSankalpa(template: Content | undefined, f: SankalpaFields, x: SankalpaFill): string {
  const body = template?.body || {};
  const vals: Record<string, string> = {
    geo: x.withGeo ? body.geo || '' : '',
    state: x.venue.state,
    city: x.venue.city,
    samvatsara: f.samvatsara.hi,
    vikram: String(f.vikram),
    shaka: String(f.shaka),
    ayana: f.ayana.hi,
    ritu: f.ritu.hi,
    masa: f.masa.hi,
    paksha: f.paksha.hi,
    tithi: f.tithi.hi,
    vaar: f.vaar.hi,
    nakshatra: f.nakshatra.hi,
    yoga: f.yoga.hi,
    karana: f.karana.hi,
    gotra: x.gotra.trim(),
    father: x.father.trim(),
    child: x.child.trim(),
    sanskar: x.sanskarName,
  };
  return String(body.text || '')
    .replace(/\{(\w+)\}/g, (_, k) => (k in vals ? vals[k] || BLANK : BLANK))
    .replace(/\s{2,}/g, ' ')
    .trim();
}
