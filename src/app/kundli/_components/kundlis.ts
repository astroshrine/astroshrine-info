"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { BackendUser } from "@/lib/endpoints";
import { epochToWall, isValidTimeZone, profileReady, type BirthProfile } from "@/lib/jyotish";

// Saved kundlis: the account's own (users.profile in the shared DB, also used by the app) plus any number of
// others (family members), kept in this browser and scoped to the signed in account.
//
// Why the browser and not the backend: the only per-user kundli route, /v1/user/:id/kundli, writes to a legacy
// DynamoDB table (not the shared Supabase DB), drops the name, has no delete route and its update never answers;
// the Supabase table kundli_profiles has no route at all. See the report that came with this change.

export const ACCOUNT_ID = "account";

export type SavedKundli = { id: string; profile: BirthProfile; updatedAt: number };
type StoreData = { v: 1; items: SavedKundli[]; activeId: string | null; active: BirthProfile | null };
const EMPTY: StoreData = { v: 1, items: [], activeId: null, active: null };

const CHANGE = "jyotish:kundlis-change";
const LEGACY_KEY = "jyotish:profile"; // the single profile this page kept before
const GUEST = "guest";
const keyFor = (scope: string) => `jyotish:kundlis:${scope}`;

function readRaw(scope: string | null): string | null {
  if (!scope) return null;
  try {
    return localStorage.getItem(keyFor(scope));
  } catch {
    return null;
  }
}

function parse(raw: string | null): StoreData {
  if (!raw) return EMPTY;
  try {
    const d = JSON.parse(raw) as Partial<StoreData>;
    const items = Array.isArray(d.items) ? d.items.filter((k) => k && typeof k.id === "string" && profileReady(k.profile)) : [];
    return {
      v: 1,
      items,
      activeId: typeof d.activeId === "string" ? d.activeId : null,
      active: profileReady(d.active) ? d.active : null,
    };
  } catch {
    return EMPTY;
  }
}

function write(scope: string, data: StoreData) {
  try {
    localStorage.setItem(keyFor(scope), JSON.stringify(data));
  } catch {
    /* storage full or blocked: nothing is saved, the page keeps working from the URL */
  }
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

const sameBirth = (a: BirthProfile, b: BirthProfile) =>
  a.name.trim() === b.name.trim() &&
  a.dob === b.dob &&
  a.tob === b.tob &&
  a.timeUnknown === b.timeUnknown &&
  a.place.lat === b.place.lat &&
  a.place.lon === b.place.lon;

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `k${Date.now().toString(36)}`);

/** The account's own birth details (users.profile, shared with the app), read the way the backend reads them. */
export function accountBirth(user: BackendUser | null): BirthProfile | null {
  const p = user?.profile;
  const place = p?.placeOfBirth;
  const dob = Number(p?.dateTimeOfBirth);
  const lat = Number(place?.geoLocation ? place.geoLocation.lat : place?.geolocation?.lat);
  const lon = Number(place?.geoLocation ? place.geoLocation.long : place?.geolocation?.lng);
  if (!(dob > 0) || !place?.displayValue || !(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180)) return null;
  const zone = place.timezone || place.geoLocation?.timezone || place.geolocation?.timezone || "Asia/Kolkata";
  const tz = isValidTimeZone(zone) ? zone : "Asia/Kolkata";
  const wall = epochToWall(dob, tz);
  return {
    name: user?.name?.trim() || "मेरी कुंडली",
    dob: wall.date,
    tob: wall.time,
    timeUnknown: false,
    place: { name: place.displayValue, lat, lon, tz },
  };
}

export type KundliEntry = { id: string; profile: BirthProfile; isAccount: boolean };

/**
 * The saved kundlis and the active one (what kundli, gochar and the other tools open), with the actions that
 * change them. `ready` is false until the account (or guest) scope is known. Use inside a browser-only boundary.
 */
export function useKundlis() {
  const { status, session, user } = useAuth();
  const scope = status === "loading" ? null : status === "signedIn" && session ? session.user.id : GUEST;
  const raw = useSyncExternalStore(subscribe, () => readRaw(scope), () => null);
  const store = useMemo(() => parse(raw), [raw]);
  const accountProfile = accountBirth(user);
  const accountKey = accountProfile ? JSON.stringify(accountProfile) : null;

  // One time moves: the single profile this page kept before, and kundlis saved before logging in.
  useEffect(() => {
    if (!scope) return;
    let data = parse(readRaw(scope));
    let changed = false;
    try {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const p = JSON.parse(legacy) as BirthProfile;
        if (profileReady(p) && !data.items.some((k) => sameBirth(k.profile, p))) {
          const id = newId();
          data = { ...data, items: [...data.items, { id, profile: p, updatedAt: Date.now() }], activeId: data.activeId ?? id, active: data.active ?? p };
        }
        localStorage.removeItem(LEGACY_KEY);
        changed = true;
      }
      if (scope !== GUEST) {
        const guest = parse(readRaw(GUEST));
        if (guest.items.length) {
          const fresh = guest.items.filter((g) => !data.items.some((k) => sameBirth(k.profile, g.profile)));
          data = { ...data, items: [...data.items, ...fresh] };
          localStorage.removeItem(keyFor(GUEST));
          changed = true;
        }
      }
    } catch {
      /* storage blocked */
    }
    if (changed) write(scope, data);
  }, [scope]);

  // Keep the account kundli's snapshot current when it is the active one (it can change in the app).
  useEffect(() => {
    if (!scope || store.activeId !== ACCOUNT_ID || !accountKey) return;
    if (store.active && JSON.stringify(store.active) === accountKey) return;
    write(scope, { ...parse(readRaw(scope)), active: JSON.parse(accountKey) as BirthProfile });
  }, [scope, store.activeId, store.active, accountKey]);

  const entries: KundliEntry[] = [
    ...(accountProfile ? [{ id: ACCOUNT_ID, profile: accountProfile, isAccount: true }] : []),
    ...store.items.map((k) => ({ id: k.id, profile: k.profile, isAccount: false })),
  ];

  // The active kundli; with none chosen yet, the account's own, else the first saved one.
  const fallback = entries[0] ?? null;
  const activeEntry =
    (store.activeId && entries.find((e) => e.id === store.activeId)) ||
    (store.activeId === ACCOUNT_ID && store.active ? { id: ACCOUNT_ID, profile: store.active, isAccount: true } : null) ||
    fallback;

  const update = (fn: (d: StoreData) => StoreData) => {
    if (!scope) return;
    write(scope, fn(parse(readRaw(scope))));
  };

  return {
    ready: scope !== null,
    signedIn: status === "signedIn",
    entries,
    active: activeEntry,
    find: (id: string | null) => (id ? entries.find((e) => e.id === id) ?? null : null),
    /** Adds a kundli and makes it the active one; returns its id. */
    add(profile: BirthProfile): string {
      const id = newId();
      update((d) => ({ ...d, items: [...d.items, { id, profile, updatedAt: Date.now() }], activeId: id, active: profile }));
      return id;
    },
    /** Saves changed details; with `activate` it also becomes the active kundli. */
    edit(id: string, profile: BirthProfile, activate = false) {
      update((d) => ({
        ...d,
        items: d.items.map((k) => (k.id === id ? { ...k, profile, updatedAt: Date.now() } : k)),
        activeId: activate ? id : d.activeId,
        active: activate || d.activeId === id ? profile : d.active,
      }));
    },
    remove(id: string) {
      update((d) => {
        const items = d.items.filter((k) => k.id !== id);
        if (d.activeId !== id) return { ...d, items };
        const next = accountProfile ? { id: ACCOUNT_ID, profile: accountProfile } : items[0] ?? null;
        return { ...d, items, activeId: next?.id ?? null, active: next?.profile ?? null };
      });
    },
    activate(id: string) {
      const e = entries.find((x) => x.id === id);
      if (e) update((d) => ({ ...d, activeId: id, active: e.profile }));
    },
    /** After the account's own details were saved: the account kundli becomes the active one. */
    activateAccount(profile: BirthProfile) {
      update((d) => ({ ...d, activeId: ACCOUNT_ID, active: profile }));
    },
  };
}
