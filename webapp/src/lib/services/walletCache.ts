import { getTransactions, getWalletConfig, type TransactionsPage, type WalletConfig } from "./wallet";

// Wallet data remembered in this browser tab (memory only, never stored), so the wallet page opens with what was
// last seen and refreshes it quietly, and so it can start loading before the page opens (link hover, focus or
// touch). Transactions are kept per signed-in user, so another account on the same browser never sees them.

/** Data younger than this is not fetched again when a link to the wallet is hovered. */
const FRESH_MS = 30_000;

let config: { data: WalletConfig; at: number } | null = null;
let configPending: Promise<WalletConfig> | null = null;

let firstPage: { userId: string; data: TransactionsPage; at: number } | null = null;
let firstPagePending: { userId: string; promise: Promise<TransactionsPage> } | null = null;

export function cachedWalletConfig(): WalletConfig | null {
  return config?.data ?? null;
}

/** The recharge settings from the backend; concurrent callers share one request. */
export function loadWalletConfig(): Promise<WalletConfig> {
  if (!configPending) {
    configPending = getWalletConfig()
      .then((data) => {
        config = { data, at: Date.now() };
        return data;
      })
      .finally(() => {
        configPending = null;
      });
  }
  return configPending;
}

export function cachedTransactions(userId: string): TransactionsPage | null {
  return firstPage && firstPage.userId === userId ? firstPage.data : null;
}

/** The newest page of transactions for this user; concurrent callers share one request. */
export function loadFirstTransactions(userId: string): Promise<TransactionsPage> {
  if (firstPagePending?.userId === userId) return firstPagePending.promise;
  const promise = getTransactions(0)
    .then((data) => {
      firstPage = { userId, data, at: Date.now() };
      return data;
    })
    .finally(() => {
      if (firstPagePending?.promise === promise) firstPagePending = null;
    });
  firstPagePending = { userId, promise };
  return promise;
}

/** Starts loading the wallet page's data ahead of a likely visit. Cheap to call often: fresh data is skipped. */
export function prefetchWallet(userId: string) {
  const now = Date.now();
  if (!config || now - config.at > FRESH_MS) void loadWalletConfig().catch(() => undefined);
  const page = firstPage?.userId === userId ? firstPage : null;
  if (!page || now - page.at > FRESH_MS) void loadFirstTransactions(userId).catch(() => undefined);
}
