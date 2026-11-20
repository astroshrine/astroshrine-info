/**
 * The Sanskar Muhurat draft: everything the user typed, saved on every change (AsyncStorage), so
 * back navigation and reopening never lose data. Results are recomputed on the device.
 */
import {tzHours} from './engine';
import {BASE_TRADITION, type Sanskar} from './kb';
import {MAX_DAYS, type Family, type SearchInput, type TimeBand} from './search';
import {defaultMonthSystem, type MonthSystem, type SamvatsaraSystem} from './sankalpa';

export interface Place {
  name: string;
  lat: number;
  lng: number;
  tz: string; // IANA zone from the geocoder
}
export interface Draft {
  v: 1;
  step: number;
  child: {name: string; gender: 'M' | 'F'; date: string; time: string; place: Place | null; isEldest: boolean};
  sanskars: Sanskar[];
  from: string;
  to: string;
  weekdays: number[] | null;
  timeBand: TimeBand;
  venue: {name: string; city: string; state: string; country: string; place: Place | null; confirmed: boolean};
  gotra: string;
  father: string;
  mother: string;
  tradition: string;
  family: Family;
  monthSystem: MonthSystem | null; // null = by the venue's state
  samvatsaraSystem: SamvatsaraSystem | null; // null = follows the month system
  motherExpecting: boolean; // mundan only, a neutral optional question
  selected: Partial<Record<Sanskar, string>>; // candidate id per sanskar
  sankalpa: Record<string, string>; // the user's edited text per candidate id
  checklist: Record<string, boolean>;
  chargeKey: string;
  charged: boolean;
}

const KEY = 'sanskarMuhurat.draft.v1';
const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayNo = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 864e5;
export const daysBetween = (a: string, b: string) => dayNo(b) - dayNo(a);

export function newDraft(now = new Date()): Draft {
  const to = new Date(now);
  to.setMonth(to.getMonth() + 3);
  return {
    v: 1,
    step: 1,
    child: {name: '', gender: 'M', date: '', time: '', place: null, isEldest: false},
    sanskars: ['annaprashan'],
    from: ymd(now),
    to: ymd(to),
    weekdays: null,
    timeBand: 'any',
    venue: {name: '', city: '', state: '', country: 'India', place: null, confirmed: false},
    gotra: '',
    father: '',
    mother: '',
    tradition: BASE_TRADITION,
    family: {mode: 'default', ages: [], note: ''},
    monthSystem: null,
    samvatsaraSystem: null,
    motherExpecting: false,
    selected: {},
    sankalpa: {},
    checklist: {},
    chargeKey: `sm_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    charged: false,
  };
}

const keyOf = (scope?: string) => (scope ? `${KEY}:${scope}` : KEY);

/** The draft lives in this browser, scoped to the signed in account (the app keeps it on the device). */
export function loadDraft(scope?: string): Draft | null {
  try {
    const s = localStorage.getItem(keyOf(scope));
    const d = s ? JSON.parse(s) : null;
    return d?.v === 1 ? d : null;
  } catch {
    return null;
  }
}
export function saveDraft(d: Draft, scope?: string) {
  try {
    localStorage.setItem(keyOf(scope), JSON.stringify(d));
  } catch {
    // private window or full storage: the draft is simply not kept
  }
}
export function clearDraft(scope?: string) {
  try {
    localStorage.removeItem(keyOf(scope));
  } catch {
    // nothing to clear
  }
}

export const monthSystemOf = (d: Draft): MonthSystem => d.monthSystem ?? defaultMonthSystem(d.venue.state);
export const samvatsaraSystemOf = (d: Draft): SamvatsaraSystem => d.samvatsaraSystem ?? (monthSystemOf(d) === 'purnimanta' ? 'north' : 'south');

/** The first problem on a step, as an i18n key under sanskar.invalid, or null. */
export function stepError(step: number, d: Draft, today = ymd(new Date())): string | null {
  if (step === 1) {
    if (!d.child.name.trim()) {
      return 'childName';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.child.date) || d.child.date > today) {
      return 'childDate';
    }
    if (!/^\d{2}:\d{2}$/.test(d.child.time)) {
      return 'childTime';
    }
    if (!d.child.place) {
      return 'childPlace';
    }
    if (!Number.isFinite(tzHours(d.child.place.tz, d.child.date, d.child.time))) {
      return 'tz';
    }
  }
  if (step === 2) {
    if (!d.sanskars.length) {
      return 'sanskar';
    }
    if (d.from && d.from < today) {
      return 'rangePast'; // a muhurat search runs from today into the future
    }
    if (!d.from || !d.to || d.to < d.from) {
      return 'range';
    }
    if (daysBetween(d.from, d.to) >= MAX_DAYS) {
      return 'rangeLong';
    }
    if (d.from < d.child.date) {
      return 'range';
    }
    if (d.weekdays && !d.weekdays.length) {
      return 'weekdays';
    }
    if (typeof d.timeBand === 'object' && !(d.timeBand.from < d.timeBand.to)) {
      return 'timeBand';
    }
  }
  if (step === 3) {
    if (!d.venue.place) {
      return 'venue';
    }
    if (!Number.isFinite(tzHours(d.venue.place.tz, d.from, '12:00'))) {
      return 'tz';
    }
    if (!d.venue.confirmed) {
      return 'venueConfirm';
    }
  }
  if (step === 4 && d.family.mode === 'custom' && !d.family.ages.length) {
    return 'familyAges';
  }
  return null;
}

/** The search input for one sanskar; NaN offsets (unknown zone) are caught by stepError/validity checks upstream. */
export function toSearchInput(d: Draft, sanskar: Sanskar, relaxed = false, lang: 'hi' | 'en' = 'hi'): SearchInput {
  const c = d.child,
    cp = c.place!,
    vp = d.venue.place!;
  return {
    sanskar,
    child: {
      name: c.name.trim(),
      gender: c.gender,
      isEldest: c.isEldest,
      birth: {
        date: c.date,
        time: c.time,
        tz: tzHours(cp.tz, c.date, c.time),
        lat: cp.lat,
        lon: cp.lng,
        place: cp.name,
      },
    },
    motherExpecting: sanskar === 'mundan' && d.motherExpecting,
    venue: {
      name: d.venue.name,
      city: d.venue.city || vp.name,
      state: d.venue.state,
      country: d.venue.country,
      lat: vp.lat,
      lon: vp.lng,
      tz: tzHours(vp.tz, d.from, '12:00'),
    },
    from: d.from,
    to: d.to,
    weekdays: d.weekdays,
    timeBand: d.timeBand,
    tradition: d.tradition,
    family: d.family,
    relaxed,
    lang,
  };
}
