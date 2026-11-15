import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { getPublicWalletConfig } from "@/lib/services/wallet.server";
import WalletView, { WalletSkeleton } from "./WalletView";

const text = defineMessages({
  hi: {
    title: "Wallet · AstroShrine",
    description: "AstroShrine wallet: बैलेंस, रिचार्ज और लेनदेन। ऐप और वेबसाइट पर एक ही wallet।",
  },
  en: {
    title: "Wallet · AstroShrine",
    description: "AstroShrine wallet: balance, recharge and transactions. One wallet on the app and the website.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getT(text);
  return {
    title,
    description,
    // A private, signed-in page: nothing here for search engines.
    robots: { index: false, follow: false },
  };
}

/** The recharge settings come from the server cache with the page, so the packs show without waiting. */
async function WalletWithConfig() {
  const initialConfig = await getPublicWalletConfig();
  return <WalletView initialConfig={initialConfig} />;
}

export default function WalletPage() {
  // WalletView reads the URL (?amount, ?filter, ?tx), so it renders in the browser behind this boundary.
  return (
    <Suspense fallback={<WalletSkeleton />}>
      <WalletWithConfig />
    </Suspense>
  );
}
