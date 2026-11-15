"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isValidTimeZone, profileReady, type BirthProfile } from "@/lib/jyotish";
import { useKundlis } from "./kundlis";

// The kundli a tool page shows. Tool pages carry it in the URL hash, so every kundli view has a link that
// can be bookmarked or shared; the hash never reaches the server, so birth details stay out of request logs.

/** The active kundli (chosen on /kundli); follows changes made on another page or tab. Browser only. */
export function useSavedProfile(): BirthProfile | null {
  return useKundlis().active?.profile ?? null;
}

// ─── Profile in the URL hash ──────────────────────────────────────────────────────

export function profileToHash(p: BirthProfile): string {
  const q = new URLSearchParams({
    n: p.name,
    d: p.dob,
    ...(p.timeUnknown ? { u: "1" } : { t: p.tob }),
    p: p.place.name,
    lat: String(p.place.lat),
    lon: String(p.place.lon),
    tz: p.place.tz,
  });
  return `#${q.toString()}`;
}

export function profileFromHash(hash: string): BirthProfile | null {
  if (!hash || hash.length < 2) return null;
  const q = new URLSearchParams(hash.slice(1));
  const lat = Number(q.get("lat")), lon = Number(q.get("lon"));
  const tz = q.get("tz") ?? "";
  const p: BirthProfile = {
    name: (q.get("n") ?? "").slice(0, 100),
    dob: q.get("d") ?? "",
    tob: q.get("t") ?? "",
    timeUnknown: q.get("u") === "1",
    place: { name: (q.get("p") ?? "").slice(0, 200), lat, lon, tz },
  };
  const ok =
    profileReady(p) &&
    /^\d{4}-\d{2}-\d{2}$/.test(p.dob) &&
    (p.timeUnknown || /^\d{2}:\d{2}$/.test(p.tob)) &&
    !!q.get("lat") &&
    !!q.get("lon") &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180 &&
    isValidTimeZone(tz);
  return ok ? p : null;
}

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

/**
 * The kundli a tool page shows: the one in its URL (a shared or bookmarked link), else the active one, whose
 * details are then written into the URL so the page can be shared. `fromLink` = it came from the URL and is not
 * one of the saved kundlis. `ready` = the saved kundlis have been read. Browser only.
 */
export function usePageProfile(): { profile: BirthProfile | null; fromLink: boolean; ready: boolean } {
  const hash = useSyncExternalStore(subscribeHash, () => location.hash, () => "");
  const kundlis = useKundlis();
  const active = kundlis.active?.profile ?? null;
  const linked = profileFromHash(hash);
  const profile = linked ?? active;
  const activeHash = active ? profileToHash(active) : null;
  const hasLink = !!linked;

  useEffect(() => {
    if (!hasLink && activeHash) history.replaceState(history.state, "", activeHash);
  }, [hasLink, activeHash]);

  const linkedHash = linked ? profileToHash(linked) : null;
  const fromLink = !!linkedHash && !kundlis.entries.some((e) => profileToHash(e.profile) === linkedHash);
  return { profile, fromLink, ready: kundlis.ready };
}
