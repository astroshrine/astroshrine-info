"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { api } from "@/lib/api";

// Today's rashifal, the same readings the app shows: the backend writes one set per language per IST day
// (GET /v1/horoscope/daily, public). The website has no other horoscope source, so only "today" exists.

/** One rashi's reading for the day. */
export type DailyHoroscopeEntry = {
  rashiKey: string;
  /** "Aries", "Taurus", ...: how the readings are matched to the wheel's signs. */
  englishName: string;
  prediction: string;
  love: string;
  career: string;
  health: string;
  luckyColor: string;
  luckyNumber: number;
  luckyTime: string;
  mood: string;
};

export type DailyHoroscope = { date: string; language: Locale; horoscopes: DailyHoroscopeEntry[] };

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** The reading changes at IST midnight (the backend's day), not the visitor's. */
export function istDate(now = Date.now()) {
  return new Date(now + IST_OFFSET_MS).toISOString().slice(0, 10);
}

// One request per language per IST day, shared by every component; a failed one is forgotten so the next try fetches.
const cache = new Map<string, Promise<DailyHoroscope>>();

export function loadDailyHoroscope(lang: Locale): Promise<DailyHoroscope> {
  const key = `${lang}:${istDate()}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = api<DailyHoroscope>(`/v1/horoscope/daily?lang=${lang}`, { auth: false }).then((data) => {
      if (!data || !Array.isArray(data.horoscopes)) throw new Error("No horoscope in the answer");
      return data;
    });
    hit.catch(() => cache.delete(key));
    cache.set(key, hit);
  }
  return hit;
}

/** The reading for one sign, by its English name ("Aries"). */
export function entryFor(data: DailyHoroscope | null, englishName: string) {
  return data?.horoscopes.find((h) => h.englishName.trim().toLowerCase() === englishName.toLowerCase());
}

/** Today's readings in `lang`: `data` is null while loading, and `failed` is true when they could not be fetched. */
export function useDailyHoroscope(lang: Locale) {
  const [state, setState] = useState<{ lang: Locale; data: DailyHoroscope | null; failed: boolean }>({ lang, data: null, failed: false });

  useEffect(() => {
    let live = true;
    loadDailyHoroscope(lang).then(
      (data) => live && setState({ lang, data, failed: false }),
      (error) => {
        if (!live) return;
        console.error("[horoscope]", error);
        setState({ lang, data: null, failed: true });
      },
    );
    return () => {
      live = false;
    };
  }, [lang]);

  // A language switch shows the loading state until the other language's readings arrive.
  return state.lang === lang ? { data: state.data, failed: state.failed } : { data: null, failed: false };
}
