import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The same Supabase project the mobile app and the backend use, so a user signs in here with the
// same account (phone OTP) and the backend accepts the same access token.
let client: SupabaseClient | null = null;

/** Browser-only: call it from effects and event handlers, never while rendering on the server. */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set (see .env.example)");
  }

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Phone OTP only: there is no OAuth redirect to read a session from.
      detectSessionInUrl: false,
    },
  });
  return client;
}
