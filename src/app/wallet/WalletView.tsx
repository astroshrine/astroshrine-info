"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PiGift, PiSparkle, PiWallet } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { fadeUp } from "@/lib/motion";
import {
  TX_FILTERS,
  formatCoins,
  formatRupees,
  type TxFilter,
  type WalletConfig,
} from "@/lib/services/wallet";
import { cachedWalletConfig, loadWalletConfig } from "@/lib/services/walletCache";
import RechargePanel from "./RechargePanel";
import Transactions from "./Transactions";
import { currentLocation, setQueryParam } from "./url";

export type ConfigState = { status: "loading" } | { status: "ready"; config: WalletConfig } | { status: "error" };

/**
 * /wallet: balance, recharge and transactions, on the same wallet as the app.
 * The URL carries the view: ?amount=500 preselects a pack, ?filter=spent filters the list,
 * ?tx=<id> opens a transaction (the back button closes it).
 */
export default function WalletView({ initialConfig = null }: { initialConfig?: WalletConfig | null }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "signedOut") router.replace(`/login?next=${encodeURIComponent(currentLocation())}`);
  }, [status, router]);

  if (status !== "signedIn") return <WalletSkeleton />;
  return <SignedInWallet initialConfig={initialConfig} />;
}

function SignedInWallet({ initialConfig }: { initialConfig: WalletConfig | null }) {
  const searchParams = useSearchParams();
  // The recharge packs show at once: the copy this tab already read from the backend, else the server's copy
  // that came with the page. The backend's own copy is then read in the background and replaces it.
  const [config, setConfig] = useState<ConfigState>(() => {
    const known = cachedWalletConfig() ?? initialConfig;
    return known ? { status: "ready", config: known } : { status: "loading" };
  });
  const [configAttempt, setConfigAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    loadWalletConfig().then(
      (value) => {
        if (live) setConfig({ status: "ready", config: value });
      },
      () => {
        // A failed background read keeps the copy already shown; only with nothing to show is it an error.
        if (live) setConfig((prev) => (prev.status === "ready" ? prev : { status: "error" }));
      },
    );
    return () => {
      live = false;
    };
  }, [configAttempt]);

  const retryConfig = () => {
    setConfig({ status: "loading" });
    setConfigAttempt((n) => n + 1);
  };

  const amountParam = Number(searchParams.get("amount")) || null;
  const filterParam = searchParams.get("filter");
  const filter: TxFilter = TX_FILTERS.includes(filterParam as TxFilter) ? (filterParam as TxFilter) : "all";
  const txParam = searchParams.get("tx");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 md:px-8 md:pt-10">
      <motion.header variants={fadeUp} initial="hidden" animate="show">
        <h1 className="heading-4 text-ink md:heading-3">वॉलेट</h1>
        <p className="body-6 mt-2 max-w-2xl text-ink-soft">
          ऐप और वेबसाइट पर एक ही वॉलेट। यहाँ जोड़े गए कॉइन्स ऐप में भी दिखते हैं।
        </p>
      </motion.header>

      {/* Phones: balance, recharge, transactions. Desktop: recharge stays beside the other two. */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:mt-8 lg:grid-cols-12 lg:items-start lg:gap-8">
        <BalanceCard className="lg:col-span-7 lg:col-start-1 lg:row-start-1" config={config} />
        <RechargePanel
          className="lg:sticky lg:top-24 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1"
          config={config}
          onRetryConfig={retryConfig}
          amount={amountParam}
          onAmountChange={(inr) => setQueryParam("amount", String(inr), "replace")}
        />
        <Transactions
          className="lg:col-span-7 lg:col-start-1 lg:row-start-2"
          filter={filter}
          onFilterChange={(next) => setQueryParam("filter", next === "all" ? null : next, "replace")}
          openTxId={txParam}
        />
      </div>
    </div>
  );
}

function BalanceCard({ className, config }: { className: string; config: ConfigState }) {
  const { balance } = useAuth();
  const ready = config.status === "ready" ? config.config : null;
  const pointsPerRupee = Number(ready?.points_per_rupee) || 1;
  const pointsPerQuestion = Number(ready?.points_per_question) || 0;
  const points = balance ? balance.points_balance : null;
  const questions = points !== null && pointsPerQuestion > 0 ? Math.floor(points / pointsPerQuestion) : null;

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="show"
      aria-labelledby="balance-title"
      className={`on-inverse rounded-3xl bg-surface-inverse p-6 text-ink-inverse md:p-8 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="balance-title" className="caption-4 text-ink-inverse-soft">
            उपलब्ध बैलेंस
          </h2>
          {points === null ? (
            <span aria-hidden className="mt-2 block h-10 w-40 animate-pulse rounded-xl bg-surface-inverse-raised" />
          ) : (
            <p className="mt-2 flex items-baseline gap-2" aria-live="polite">
              <span className="heading-3 text-brand-on-inverse">{formatCoins(points)}</span>
              <span className="title-3">कॉइन्स</span>
            </p>
          )}
        </div>
        {ready && (
          <p className="caption-4 inline-flex items-center gap-1 rounded-full bg-surface-inverse-raised px-3 py-1">
            <PiSparkle className="h-4 w-4 text-brand-on-inverse" aria-hidden />1 कॉइन = {formatRupees(1 / pointsPerRupee)}
          </p>
        )}
      </div>

      <hr className="my-6 border-line-inverse" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-inverse-raised text-brand-on-inverse">
            <PiGift className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="title-4">AI प्रश्न</p>
            {questions === null ? (
              <span aria-hidden className="mt-1 block h-4 w-32 animate-pulse rounded bg-surface-inverse-raised" />
            ) : (
              <p className="caption-5 text-ink-inverse-soft">
                {questions === 1 ? "1 AI प्रश्न उपलब्ध" : `${formatCoins(questions)} AI प्रश्न उपलब्ध`}
              </p>
            )}
          </div>
        </div>
        {/* On phones the recharge panel sits below; on desktop it is already beside this card. */}
        <a
          href="#recharge"
          className="button-sm inline-flex items-center gap-2 rounded-full bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover active:scale-98 lg:hidden"
        >
          <PiWallet className="h-4 w-4" aria-hidden />
          पैसे जोड़ें
        </a>
      </div>
    </motion.section>
  );
}

/** Layout-shaped placeholder while the session is read (and for the moment before a redirect to login). */
export function WalletSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 md:px-8 md:pt-10" aria-busy="true" aria-label="वॉलेट लोड हो रहा है">
      <span className="block h-10 w-40 animate-pulse rounded-xl bg-surface-sunken" />
      <span className="mt-2 block h-5 w-72 max-w-full animate-pulse rounded bg-surface-sunken" />
      <div className="mt-6 grid grid-cols-1 gap-6 md:mt-8 lg:grid-cols-12 lg:gap-8">
        <span className="block h-56 animate-pulse rounded-3xl bg-surface-sunken lg:col-span-7" />
        <span className="block h-96 animate-pulse rounded-3xl bg-surface-sunken lg:col-span-5 lg:row-span-2" />
        <span className="block h-80 animate-pulse rounded-3xl bg-surface-sunken lg:col-span-7" />
      </div>
    </div>
  );
}
