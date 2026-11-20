"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAstrologer } from "../_console/useAstrologer";
import { ApiError } from "@/lib/api";
import { findSession } from "@/lib/services/chat";
import { globalChannel } from "@/lib/services/realtime";
import { useRealtimeChannel } from "@/lib/services/useRealtime";
import {
  activeChats,
  getBookings,
  getCallWaitlist,
  getChatQueue,
  getRating,
  getRemovalsToday,
  getStatus,
  getToday,
  getWorkday,
  REMOVAL_LIMIT_CODE,
  removeFromCallWaitlist,
  removeQueuedChat,
  sendPresence,
  setDnd,
  type AstrologerPresence,
  type Booking,
  type RemovalsToday,
  type Today,
  type Waiting,
  type Workday,
} from "@/lib/services/astrologerHome";

const BEAT_MS = 30_000;

/** One section's data: `loaded` flips once the first answer (or failure) is in. */
type Part<T> = { data: T; loaded: boolean; failed: boolean };
const empty = <T,>(data: T): Part<T> => ({ data, loaded: false, failed: false });

function usePart<T>(initial: T) {
  const [part, setPart] = useState<Part<T>>(() => empty(initial));
  const run = useCallback((load: () => Promise<T>) => {
    // A failed refresh keeps what was shown before, so a bad moment does not blank the page.
    return load().then(
      (data) => setPart({ data, loaded: true, failed: false }),
      () => setPart((p) => ({ ...p, loaded: true, failed: true })),
    );
  }, []);
  return [part, run] as const;
}

export type ActiveChat = { booking: Booking; chatId: string | null };

/** Everything the astrologer home shows and does, on the real backend. */
export function useHome() {
  const { id, status: auth } = useAstrologer();
  const ready = auth === "ready" && !!id;

  const [status, runStatus] = usePart<AstrologerPresence>("offline");
  const [workday, runWorkday] = usePart<Workday | null>(null);
  const [chatQueue, runChatQueue] = usePart<Waiting[]>([]);
  const [callList, runCallList] = usePart<Waiting[]>([]);
  const [today, runToday] = usePart<Today | null>(null);
  const [rating, runRating] = usePart<number | null>(null);
  const [bookings, runBookings] = usePart<Booking[]>([]);

  const [pending, setPending] = useState(false);
  const [switchError, setSwitchError] = useState(false);
  const [autoOffline, setAutoOffline] = useState(false);
  const [arrivals, setArrivals] = useState<Waiting[]>([]);
  const [sessions, setSessions] = useState<Record<string, string | null>>({});

  // The Offline switch is only repeated while the astrologer chose it on this page.
  const chosenOffline = useRef(false);
  const seen = useRef<Set<string> | null>(null);

  const reloadStatus = useCallback(() => (id ? runStatus(async () => (await getStatus(id)).presence) : Promise.resolve()), [id, runStatus]);
  const reloadWorkday = useCallback(() => (id ? runWorkday(() => getWorkday(id)) : Promise.resolve()), [id, runWorkday]);
  const reloadWaiting = useCallback(() => {
    if (!id) return Promise.resolve([]);
    return Promise.all([runChatQueue(() => getChatQueue()), runCallList(() => getCallWaitlist(id))]);
  }, [id, runChatQueue, runCallList]);
  const reloadToday = useCallback(() => (id ? runToday(() => getToday(id)) : Promise.resolve()), [id, runToday]);
  const reloadBookings = useCallback(() => runBookings(() => getBookings()), [runBookings]);

  // First load, then a refresh with every heartbeat so the page never shows a stale picture.
  useEffect(() => {
    if (!ready) return;
    const all = () => {
      void reloadStatus();
      void reloadWorkday();
      void reloadWaiting();
      void reloadToday();
      void reloadBookings();
    };
    all();
    void runRating(() => getRating(id));
    const timer = setInterval(all, BEAT_MS);
    return () => clearInterval(timer);
  }, [ready, id, reloadStatus, reloadWorkday, reloadWaiting, reloadToday, reloadBookings, runRating]);

  // Presence heartbeat while the page is open: online and busy keep beating, an Offline choice is repeated.
  const live = status.data === "online" || status.data === "busy";
  useEffect(() => {
    if (!ready || !status.loaded) return;
    const beat = () => {
      if (live) {
        sendPresence(true, "beat").then((p) => {
          if (p?.autoOffline) {
            setAutoOffline(true);
            void reloadStatus();
          }
        }, () => {});
      } else if (chosenOffline.current) sendPresence(false, "switch").catch(() => {});
    };
    const timer = setInterval(beat, BEAT_MS);
    return () => clearInterval(timer);
  }, [ready, status.loaded, live, reloadStatus]);

  const setMode = useCallback(
    async (next: AstrologerPresence) => {
      if (!id || pending) return;
      setPending(true);
      setSwitchError(false);
      setAutoOffline(false);
      try {
        if (next === "offline") {
          chosenOffline.current = true;
          await sendPresence(false, "switch");
        } else {
          chosenOffline.current = false;
          await sendPresence(true, "switch");
          const dnd = workday.data?.dnd === true;
          if (next === "busy" && !dnd) await setDnd(id, true);
          if (next === "online" && dnd) await setDnd(id, false);
        }
      } catch {
        setSwitchError(true);
      } finally {
        await Promise.all([reloadStatus(), reloadWorkday()]);
        setPending(false);
      }
    },
    [id, pending, workday.data, reloadStatus, reloadWorkday],
  );

  // Realtime: a change to my line or a chat that ended refreshes the lists at once.
  useRealtimeChannel(ready ? globalChannel(id) : null, (event) => {
    if (event === "ConsultQueueChanged" || event === "CHAT_QUEUE_CHANGED" || event === "ConsultSessionChanged") {
      void reloadWaiting();
      void reloadBookings();
    } else if (event === "ChatSessionEnded") {
      void reloadToday();
      void reloadBookings();
    }
  });
  useRealtimeChannel(ready ? `astroshrine-public${id}` : null, (event) => {
    if (event === "CALL_WAITLIST_ADD" || event === "CHAT_WAITLIST_ADD") void reloadWaiting();
  });

  const waiting = useMemo(() => [...callList.data, ...chatQueue.data], [callList.data, chatQueue.data]);

  // A customer who was not there before: tell the astrologer once. The first read only sets the baseline.
  useEffect(() => {
    if (!chatQueue.loaded || !callList.loaded) return;
    const keys = new Set(waiting.map((w) => w.key));
    if (seen.current) {
      const fresh = waiting.filter((w) => !seen.current!.has(w.key));
      if (fresh.length) setArrivals((a) => [...fresh, ...a].slice(0, 3));
    }
    seen.current = keys;
    setArrivals((a) => a.filter((w) => keys.has(w.key)));
  }, [waiting, chatQueue.loaded, callList.loaded]);

  const active = useMemo(() => activeChats(bookings.data), [bookings.data]);
  // The chat room of each running chat, for "Open chat".
  useEffect(() => {
    if (!id) return;
    for (const b of active) {
      if (!b.userId || b.userId in sessions) continue;
      findSession(id, b.userId).then(
        (s) => setSessions((m) => ({ ...m, [b.userId]: s?.id ?? null })),
        () => setSessions((m) => ({ ...m, [b.userId]: null })),
      );
    }
  }, [id, active, sessions]);
  const activeList: ActiveChat[] = active.map((b) => ({ booking: b, chatId: sessions[b.userId] ?? null }));

  // Removing a customer: ask for a reason first (`removing` is the open dialog), then send it.
  const [removing, setRemoving] = useState<Waiting | null>(null);
  const [removals, setRemovals] = useState<RemovalsToday | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState<"failed" | "limit" | null>(null);
  const [removedName, setRemovedName] = useState<string | null>(null);

  const askRemove = useCallback(
    (w: Waiting) => {
      if (!id) return;
      setRemoving(w);
      setRemoveError(null);
      setRemovals(null);
      void getRemovalsToday(id).then(setRemovals);
    },
    [id],
  );
  const cancelRemove = useCallback(() => {
    if (!removeBusy) setRemoving(null);
  }, [removeBusy]);
  const confirmRemove = useCallback(
    async (reason: string) => {
      if (!id || !removing || removeBusy) return;
      setRemoveBusy(true);
      setRemoveError(null);
      try {
        if (removing.kind === "call") await removeFromCallWaitlist(id, removing.userId, reason);
        else if (removing.bookingId) await removeQueuedChat(removing.bookingId, reason);
        setRemovedName(removing.name);
        setRemoving(null);
        await reloadWaiting();
      } catch (e) {
        if (e instanceof ApiError && e.code === REMOVAL_LIMIT_CODE) {
          setRemoveError("limit");
          void getRemovalsToday(id).then(setRemovals);
        } else setRemoveError("failed");
      } finally {
        setRemoveBusy(false);
      }
    },
    [id, removing, removeBusy, reloadWaiting],
  );

  return {
    ready,
    status,
    workday,
    waiting,
    waitingLoaded: chatQueue.loaded && callList.loaded,
    waitingFailed: chatQueue.failed || callList.failed,
    today,
    rating,
    bookings,
    active: activeList,
    arrivals,
    dismissArrival: (key: string) => setArrivals((a) => a.filter((w) => w.key !== key)),
    pending,
    switchError,
    autoOffline,
    setMode,
    removing,
    removals,
    removeBusy,
    removeError,
    removedName,
    dismissRemoved: () => setRemovedName(null),
    askRemove,
    cancelRemove,
    confirmRemove,
    retry: () => {
      void reloadStatus();
      void reloadWorkday();
      void reloadWaiting();
      void reloadToday();
      void reloadBookings();
    },
  };
}
