"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { isRealtimeOpen, resetRealtime, subscribe, subscribeStatus, type RealtimeHandler } from "./realtime";

/** Listen to a realtime channel while the component is mounted (null = nothing). The latest handler always runs. */
export function useRealtimeChannel(channel: string | null, onEvent: RealtimeHandler) {
  const latest = useRef(onEvent);
  useEffect(() => {
    latest.current = onEvent;
  });
  useEffect(() => {
    if (!channel) return;
    return subscribe(channel, (event, data) => latest.current(event, data));
  }, [channel]);
}

/** Whether the realtime socket is connected right now. */
export function useRealtimeOpen(): boolean {
  return useSyncExternalStore(subscribeStatus, isRealtimeOpen, () => false);
}

/** The signed-in account changed (sign-out, another login): reconnect as the new one. */
export function useRealtimeAccount(userId: string | null) {
  const previous = useRef(userId);
  useEffect(() => {
    if (previous.current === userId) return;
    previous.current = userId;
    resetRealtime();
  }, [userId]);
}
