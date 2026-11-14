"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { ACCOUNT_BLOCKED_CODES, ApiError } from "@/lib/api";
import { getUser, getWalletBalance, type BackendUser, type WalletBalance } from "@/lib/endpoints";

type AuthState = {
  /** "loading" until the stored session has been read. */
  status: "loading" | "signedOut" | "signedIn";
  session: Session | null;
  /** The users row from the backend (same record the app shows). */
  user: BackendUser | null;
  balance: WalletBalance | null;
  /** Set when the backend refused the account (deactivated / recently deleted) and we signed out. */
  blockedMessage: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

/** Account data loaded for one user id; ignored once the session belongs to someone else (or no one). */
type Account = { id: string; user: BackendUser; balance: WalletBalance };

const AuthContext = createContext<AuthState | null>(null);

const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function fetchAccount(id: string, signal?: AbortSignal): Promise<Account> {
  const [user, balance] = await Promise.all([getUser(id, signal), getWalletBalance(signal)]);
  return { id, user, balance };
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // Without Supabase settings there is no session to wait for: signed out.
  const [loaded, setLoaded] = useState(!SUPABASE_CONFIGURED);
  const [account, setAccount] = useState<Account | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  // Read the stored session once, then follow sign-in / sign-out / token refresh.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      console.error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set (see .env.example)");
      return;
    }
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoaded(true);
    });
    // Only state updates in here: Supabase warns against awaiting its own calls inside this callback.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoaded(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const signOut = useCallback(async () => {
    // "local": this browser only. The app does the same so other devices stay signed in.
    await getSupabase().auth.signOut({ scope: "local" });
  }, []);

  const onLoadError = useCallback(
    async (error: unknown) => {
      if (error instanceof ApiError && error.code && ACCOUNT_BLOCKED_CODES.has(error.code)) {
        setBlockedMessage(error.message);
        await signOut();
        return;
      }
      console.error("[auth] could not load the account:", error);
    },
    [signOut],
  );

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    fetchAccount(userId, controller.signal).then(setAccount, (error) => {
      if (!controller.signal.aborted) void onLoadError(error);
    });
    return () => controller.abort();
  }, [userId, onLoadError]);

  // Reads the session itself rather than `userId`, so it also works right after sign-in, from a
  // handler created before the new session reached this component's state.
  const refresh = useCallback(async () => {
    const { data } = await getSupabase().auth.getSession();
    const id = data.session?.user.id;
    if (!id) return;
    await fetchAccount(id).then(setAccount, onLoadError);
  }, [onLoadError]);

  const current = account && account.id === userId ? account : null;

  const value = useMemo<AuthState>(
    () => ({
      status: !loaded ? "loading" : session ? "signedIn" : "signedOut",
      session,
      user: current?.user ?? null,
      balance: current?.balance ?? null,
      blockedMessage,
      refresh,
      signOut,
    }),
    [loaded, session, current, blockedMessage, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
