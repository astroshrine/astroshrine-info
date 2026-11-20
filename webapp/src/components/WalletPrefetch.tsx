"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LOCALES } from "@/i18n/config";
import { prefetchWallet } from "@/lib/services/walletCache";

/** Links to the wallet and its pages, in every language ("/hi/wallet", "/en/wallet/orders/…") or without one. */
const WALLET_LINKS = ["/wallet", ...LOCALES.map((locale) => `/${locale}/wallet`)].map((path) => `a[href^="${path}"]`).join(", ");

/**
 * Starts loading the wallet page's data the moment a signed-in visitor shows intent to open it: pointing at,
 * focusing or touching any link to /wallet (header, home, profile, a short balance in chat...). A click follows
 * a hover by a few hundred milliseconds, which is most of the wait. One listener for every wallet link.
 */
export default function WalletPrefetch() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) return;
    const onIntent = (event: Event) => {
      const target = event.target as Element | null;
      if (target?.closest?.(WALLET_LINKS)) prefetchWallet(userId);
    };
    document.addEventListener("pointerover", onIntent, { passive: true });
    document.addEventListener("focusin", onIntent);
    document.addEventListener("touchstart", onIntent, { passive: true });
    return () => {
      document.removeEventListener("pointerover", onIntent);
      document.removeEventListener("focusin", onIntent);
      document.removeEventListener("touchstart", onIntent);
    };
  }, [userId]);

  return null;
}
