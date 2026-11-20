"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import type { BackendUser } from "@/lib/endpoints";

export const ASTROLOGER_ROLE = "ASTROLOGER";

export type AstrologerState = {
  /** The signed-in user's id; the same as the astrologer id. Empty until a session exists. */
  id: string;
  /** Display name from the users row ("" until loaded). */
  name: string;
  /** Profile picture URL, or null. */
  photo: string | null;
  /** The full users row from the backend, once loaded. */
  user: BackendUser | null;
  /** "ready" only for a signed-in user whose role is ASTROLOGER. Pages under the console shell only render when ready. */
  status: "loading" | "ready";
};

/** The signed-in astrologer. Inside the console shell (except login, join, help) it is always "ready". */
export function useAstrologer(): AstrologerState {
  const { status, session, user } = useAuth();
  const ready = status === "signedIn" && user?.role === ASTROLOGER_ROLE;
  return {
    id: session?.user.id ?? "",
    name: user?.name?.trim() ?? "",
    photo: user?.profile?.profilePic || null,
    user,
    status: ready ? "ready" : "loading",
  };
}

type Presence = { isOnline?: boolean; status?: string | null };

/** GET /v1/users/:id/status, refreshed every 30 s. null until the first answer (or when it failed). */
export function useOnlineStatus(id: string): boolean | null {
  const [state, setState] = useState<{ id: string; online: boolean } | null>(null);
  useEffect(() => {
    if (!id) return;
    let live = true;
    const controller = new AbortController();
    const load = () =>
      api<Presence>(`/v1/users/${encodeURIComponent(id)}/status`, { signal: controller.signal }).then(
        (p) => live && setState({ id, online: p.isOnline === true || p.status === "online" }),
        () => {},
      );
    void load();
    const timer = setInterval(load, 30_000);
    return () => {
      live = false;
      controller.abort();
      clearInterval(timer);
    };
  }, [id]);
  return state && state.id === id ? state.online : null;
}
