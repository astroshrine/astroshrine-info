"use client";

import { useEffect, useRef, useState } from "react";
import { getStatuses } from "@/lib/services/astrologers";
import type { StatusInfo } from "@/lib/services/astrologerModel";
import { globalChannel } from "@/lib/services/realtime";
import { useRealtimeChannel } from "@/lib/services/useRealtime";

/** How often a list or profile on screen re-reads availability (the app's PRESENCE_RECONCILE_MS). */
const RECONCILE_MS = 60_000;

/**
 * Reads availability right away (the page may have been rendered minutes ago), then once a minute while the
 * tab is visible, and again when it becomes visible. `onRead` gets each successful read.
 */
function useStatusPolling(ids: string[], onRead: (fresh: Map<string, StatusInfo>) => void) {
  const key = [...new Set(ids.filter(Boolean))].join(",");
  const latest = useRef(onRead);
  useEffect(() => {
    latest.current = onRead;
  });

  useEffect(() => {
    if (!key) return;
    const list = key.split(",");
    let controller: AbortController | null = null;
    const read = () => {
      if (document.visibilityState !== "visible") return;
      controller?.abort();
      const current = new AbortController();
      controller = current;
      getStatuses(list, current.signal).then(
        (fresh) => latest.current(fresh),
        () => undefined, // decorative: a failed read keeps the last known state
      );
    };
    read();
    const timer = setInterval(read, RECONCILE_MS);
    document.addEventListener("visibilitychange", read);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", read);
      controller?.abort();
    };
  }, [key]);
}

/** Fresh availability for a list of astrologers. */
export function useStatuses(ids: string[]): Map<string, StatusInfo> {
  const [statuses, setStatuses] = useState<Map<string, StatusInfo>>(() => new Map());
  useStatusPolling(ids, (fresh) => setStatuses((prev) => new Map([...prev, ...fresh])));
  return statuses;
}

/**
 * One astrologer's availability: the polled read, plus the realtime AstrologerStatusChanged event for
 * signed-in visitors (the socket needs a login), so a switch flip or the end of a session shows at once.
 * Whichever arrived last wins.
 */
export function useAstrologerStatus(id: string, realtime: boolean): StatusInfo | undefined {
  const [latest, setLatest] = useState<StatusInfo | undefined>(undefined);
  useStatusPolling([id], (fresh) => {
    const info = fresh.get(id);
    if (info) setLatest(info);
  });
  useRealtimeChannel(realtime && id ? globalChannel(id) : null, (event, data) => {
    if (event !== "AstrologerStatusChanged" || !data || typeof data !== "object") return;
    const info = data as StatusInfo;
    if (info.id && info.id !== id) return;
    setLatest({ ...info, id });
  });
  return latest;
}
