"use client";

import { useEffect, useState } from "react";
import { listChatAstrologers, type Astrologer } from "@/lib/endpoints";

// The public astrologer list, fetched once per page load and shared by every component that needs it
// (the landing page shows it in the hero and in the proof section).

let pending: Promise<Astrologer[]> | null = null;
let pendingAt = 0;
/** Availability changes all the time: reuse a fetch for a minute, not for the whole visit. */
const FRESH_MS = 60_000;

function load(): Promise<Astrologer[]> {
  if (!pending || Date.now() - pendingAt > FRESH_MS) {
    pendingAt = Date.now();
    pending = listChatAstrologers().catch((error) => {
      pending = null; // the next attempt fetches again
      throw error;
    });
  }
  return pending;
}

export type DirectoryStats = {
  total: number;
  online: number;
  /** The average over all reviews (each astrologer's rating weighted by their review count), one decimal. */
  averageRating: number | null;
  reviews: number;
};

export function statsOf(list: Astrologer[]): DirectoryStats {
  const rated = list.filter((a) => a.rating !== null && a.reviews > 0);
  const reviews = rated.reduce((sum, a) => sum + a.reviews, 0);
  const mean = reviews > 0 ? rated.reduce((sum, a) => sum + (a.rating ?? 0) * a.reviews, 0) / reviews : null;
  return {
    total: list.length,
    online: list.filter((a) => a.availability === "online").length,
    averageRating: mean === null ? null : Math.round(mean * 10) / 10,
    reviews,
  };
}

/** `list` is null while loading; online astrologers come first (the backend's order). */
export function useAstrologerDirectory() {
  const [state, setState] = useState<{ list: Astrologer[] | null; failed: boolean }>({ list: null, failed: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    load().then(
      (list) => live && setState({ list, failed: false }),
      (error) => {
        if (!live) return;
        console.error("[astrologers]", error);
        setState({ list: null, failed: true });
      },
    );
    return () => {
      live = false;
    };
  }, [attempt]);

  const retry = () => {
    setState({ list: null, failed: false });
    setAttempt((n) => n + 1);
  };

  return { ...state, retry };
}
