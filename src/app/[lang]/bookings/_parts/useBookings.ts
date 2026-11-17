"use client";

import { useCallback, useEffect, useState } from "react";
import { listAstrologers } from "@/lib/services/astrologers";
import { listMyBookings, type Booking } from "@/lib/services/bookings";

export type BookingsState = {
  bookings: Booking[] | null;
  photos: Map<string, string | null>;
  failed: boolean;
  reload: () => void;
};

/** The signed-in user's bookings and the astrologers' photos (from the public directory, best effort). */
export function useBookings(enabled: boolean): BookingsState {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [photos, setPhotos] = useState<Map<string, string | null>>(new Map());
  const [failed, setFailed] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    listMyBookings(controller.signal).then(
      (rows) => {
        setBookings(rows);
        setFailed(false);
      },
      () => {
        if (!controller.signal.aborted) setFailed(true);
      },
    );
    listAstrologers(controller.signal).then(
      (list) => setPhotos(new Map(list.map((a) => [a.id, a.photo]))),
      () => undefined,
    );
    return () => controller.abort();
  }, [enabled, key]);

  const reload = useCallback(() => {
    setFailed(false);
    setKey((k) => k + 1);
  }, []);

  return { bookings, photos, failed, reload };
}
