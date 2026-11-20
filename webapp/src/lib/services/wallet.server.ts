import { cacheLife } from "next/cache";
import type { WalletConfig } from "./wallet";

// The fields of wallet_config the website uses (see WalletConfig).
const COLUMNS =
  "points_per_rupee,points_per_question,min_recharge_inr,recharge_step_inr,max_recharge_inr,recharge_tiers,bonus_percentage,gst_percentage,is_active";

/**
 * The wallet's recharge settings (packs, GST, limits): one row shared by every user, the same row the backend's
 * GET /v1/wallet/config returns (WalletService.getConfig: `select * from wallet_config limit 1`). That route needs a
 * login, but the table is publicly readable, so it is read here with the public key, cached on the server and
 * rendered into the page: the recharge packs show at once. The browser still re-reads it from the backend in the
 * background, so an admin change shows up within minutes at worst and payments are always priced by the backend.
 * null when unavailable: the browser then loads it exactly as before.
 */
export async function getPublicWalletConfig(): Promise<WalletConfig | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 86_400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/wallet_config?select=${COLUMNS}&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as WalletConfig[];
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}
