"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  PiCaretRight,
  PiChatCircleDots,
  PiCheck,
  PiCopy,
  PiGift,
  PiReceipt,
  PiWallet,
  PiWarningCircle,
  PiX,
} from "react-icons/pi";
import { base, fadeUp } from "@/lib/motion";
import {
  TRANSACTIONS_PAGE_SIZE,
  TX_FILTERS,
  formatDateTime,
  formatTxAmount,
  getTransactions,
  isBonusTx,
  isCreditTx,
  matchesFilter,
  type TransactionsPage,
  type TxFilter,
  type WalletTransaction,
} from "@/lib/services/wallet";
import { rememberRechargeCredit } from "@/lib/services/rechargeReceipt";
import { cachedTransactions, loadFirstTransactions } from "@/lib/services/walletCache";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { setQueryParam } from "./url";

const text = defineMessages({
  hi: {
    title: "लेनदेन",
    filtersLabel: "लेनदेन फ़िल्टर",
    filters: {
      all: "सभी लेनदेन",
      earned: "अर्जित / कैशबैक",
      spent: "चैट/पूजा पर खर्च",
      bonus: "बोनस",
    } satisfies Record<TxFilter, string>,
    /** Readable names for the wallet_transactions.reference_type values the backend writes. */
    types: {
      RECHARGE: "रिचार्ज",
      BOOKING: "परामर्श बुकिंग",
      BOOKING_REFUND: "बुकिंग रिफ़ंड",
      AI_QUESTION: "AI प्रश्न",
      AI_QUESTION_REFUND: "AI प्रश्न रिफ़ंड",
      AI_PACK: "AI पैक",
      SUBSCRIPTION: "सब्सक्रिप्शन",
      ADMIN_OFFER: "बोनस ऑफ़र",
      GIFT: "गिफ़्ट",
      REFUND: "रिफ़ंड",
      SYSTEM: "सिस्टम समायोजन",
      PUJA: "पूजा",
      PRODUCT: "स्टोर ऑर्डर",
      CHAT: "चैट",
      CALL: "कॉल",
    },
    status: { bonus: "बोनस", credit: "जमा", debit: "खर्च" },
    coins: (amount: string) => `${amount} कॉइन्स`,
    loadFailed: "लेनदेन लोड नहीं हो सके",
    checkInternet: "इंटरनेट जाँचें और फिर से कोशिश करें।",
    tryAgain: "फिर से कोशिश करें",
    emptyTitle: "अभी कोई लेनदेन नहीं",
    emptyBody: "पहला रिचार्ज करें। उसके बाद हर रिचार्ज, चैट, पूजा और बोनस का हिसाब यहाँ दिखेगा।",
    addMoney: "पैसे जोड़ें",
    pickOne: "विवरण देखने के लिए किसी लेनदेन को चुनें",
    noneInFilter: "इस फ़िल्टर में अभी कोई लेनदेन नहीं।",
    loadOlder: " पुराने लेनदेन देखने के लिए और लोड करें।",
    loading: "लोड हो रहा है",
    retryMore: "दोबारा कोशिश करें",
    showMore: "और लेनदेन दिखाएँ",
    moreFailed: "और लेनदेन लोड नहीं हो सके। इंटरनेट जाँचें और दोबारा कोशिश करें।",
    detailsTitle: "लेनदेन विवरण",
    close: "बंद करें",
    rows: {
      date: "तारीख़ और समय",
      notAvailable: "उपलब्ध नहीं",
      status: "स्थिति",
      balanceAfter: "शेष बैलेंस",
      type: "प्रकार",
      reference: "संदर्भ",
      id: "लेनदेन आईडी",
    },
    copy: (label: string) => `${label} कॉपी करें`,
    copied: (label: string) => `${label} कॉपी हो गया`,
    viewReceipt: "रसीद देखें",
    notFoundTitle: "यह लेनदेन नहीं मिला",
    notFoundBody: "यह सूची के पुराने हिस्से में हो सकता है। सूची में और लेनदेन लोड करके देखें।",
    loadingList: "लेनदेन लोड हो रहे हैं",
  },
  en: {
    title: "Transactions",
    filtersLabel: "Transaction filters",
    filters: {
      all: "All transactions",
      earned: "Earned / cashback",
      spent: "Spent on chat/puja",
      bonus: "Bonus",
    },
    types: {
      RECHARGE: "Recharge",
      BOOKING: "Consultation booking",
      BOOKING_REFUND: "Booking refund",
      AI_QUESTION: "AI question",
      AI_QUESTION_REFUND: "AI question refund",
      AI_PACK: "AI pack",
      SUBSCRIPTION: "Subscription",
      ADMIN_OFFER: "Bonus offer",
      GIFT: "Gift",
      REFUND: "Refund",
      SYSTEM: "System adjustment",
      PUJA: "Puja",
      PRODUCT: "Store order",
      CHAT: "Chat",
      CALL: "Call",
    },
    status: { bonus: "Bonus", credit: "Credited", debit: "Spent" },
    // `amount` is formatted without its sign ("1", "1.5", "1,234"); one AI question costs exactly 1 point.
    coins: (amount) => (amount === "1" ? "1 point" : `${amount} points`),
    loadFailed: "Could not load your transactions",
    checkInternet: "Check your internet connection and try again.",
    tryAgain: "Try again",
    emptyTitle: "No transactions yet",
    emptyBody: "Make your first recharge. After that, every recharge, chat, puja and bonus shows up here.",
    addMoney: "Add money",
    pickOne: "Select a transaction to see its details",
    noneInFilter: "No transactions in this filter yet.",
    loadOlder: " Load more to see older transactions.",
    loading: "Loading",
    retryMore: "Try again",
    showMore: "Show more transactions",
    moreFailed: "Could not load more transactions. Check your internet connection and try again.",
    detailsTitle: "Transaction details",
    close: "Close",
    rows: {
      date: "Date and time",
      notAvailable: "Not available",
      status: "Status",
      balanceAfter: "Balance after",
      type: "Type",
      reference: "Reference",
      id: "Transaction ID",
    },
    copy: (label) => `Copy ${label}`,
    copied: (label) => `${label} copied`,
    viewReceipt: "View receipt",
    notFoundTitle: "Transaction not found",
    notFoundBody: "It may be further down the list. Load more transactions in the list and look again.",
    loadingList: "Loading transactions",
  },
});

type TxText = (typeof text)["hi"];

type ListState = {
  items: WalletTransaction[];
  /** How many rows the backend has sent so far (the next page starts here). */
  offset: number;
  end: boolean;
  status: "loading" | "ready" | "error";
  loadingMore: boolean;
  moreFailed: boolean;
};

const EMPTY: ListState = { items: [], offset: 0, end: false, status: "loading", loadingMore: false, moreFailed: false };

/** A reference type's readable name; unknown types as the backend wrote them. */
const typeLabel = (t: TxText, type: string) =>
  (t.types as Record<string, string | undefined>)[type] ?? type.replace(/_/g, " ");

/** Recharges get their own name; other rows show the backend's description as it came. */
const txTitle = (t: TxText, tx: WalletTransaction) =>
  tx.reference_type === "RECHARGE"
    ? t.types.RECHARGE
    : tx.description || (tx.reference_type ? typeLabel(t, tx.reference_type) : tx.type);

const txStatus = (t: TxText, tx: WalletTransaction) =>
  isBonusTx(tx) ? t.status.bonus : isCreditTx(tx) ? t.status.credit : t.status.debit;

/** Merges a page into the list: no duplicates, newest first as the backend sends them. */
function merge(list: WalletTransaction[], page: WalletTransaction[]) {
  const byId = new Map(list.map((tx) => [tx.id, tx]));
  for (const tx of page) byId.set(tx.id, tx);
  return [...byId.values()];
}

/** The list as the newest page describes it. */
function fromFirstPage(page: TransactionsPage): ListState {
  const rows = Array.isArray(page?.transactions) ? page.transactions : [];
  return {
    items: merge([], rows),
    offset: rows.length,
    end: rows.length < TRANSACTIONS_PAGE_SIZE || rows.length >= (Number(page?.total) || 0),
    status: "ready",
    loadingMore: false,
    moreFailed: false,
  };
}

export default function Transactions({
  className,
  filter,
  onFilterChange,
  openTxId,
}: {
  className: string;
  filter: TxFilter;
  onFilterChange: (filter: TxFilter) => void;
  /** ?tx=<id>: the transaction whose details are open. */
  openTxId: string | null;
}) {
  const { session } = useAuth();
  const t = useT(text);
  const userId = session?.user.id ?? null;
  // Opens with the newest page this tab already has (a previous visit, or loaded early when a wallet link was
  // hovered or tapped), then refreshes it quietly below.
  const [list, setList] = useState<ListState>(() => {
    const known = userId ? cachedTransactions(userId) : null;
    return known ? fromFirstPage(known) : EMPTY;
  });
  const [attempt, setAttempt] = useState(0);
  // True when this page opened the details itself (pushState), so closing can step back in history.
  const pushedTx = useRef(false);

  // Details closed from outside (the back button): there is no entry of ours to step back over any more.
  useEffect(() => {
    if (!openTxId) pushedTx.current = false;
  }, [openTxId]);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    // Shared with an early load started by a wallet link, so the page never asks twice.
    loadFirstTransactions(userId).then(
      (page) => {
        if (!live) return;
        const rows = Array.isArray(page?.transactions) ? page.transactions : [];
        // Already paged further down: fold the fresh newest rows in instead of dropping the older pages.
        setList((s) => (s.status === "ready" && s.offset > rows.length ? { ...s, items: merge(s.items, rows) } : fromFirstPage(page)));
      },
      () => {
        // A failed refresh keeps the list already shown; only with nothing to show is it an error.
        if (live) setList((s) => (s.status === "ready" ? s : { ...EMPTY, status: "error" }));
      },
    );
    return () => {
      live = false;
    };
  }, [attempt, userId]);

  function retry() {
    setList(EMPTY);
    setAttempt((n) => n + 1);
  }

  function loadMore() {
    if (list.loadingMore || list.end) return;
    const offset = list.offset;
    setList((s) => ({ ...s, loadingMore: true, moreFailed: false }));
    getTransactions(offset).then(
      (page) => {
        const rows = Array.isArray(page?.transactions) ? page.transactions : [];
        setList((s) => ({
          ...s,
          items: merge(s.items, rows),
          offset: offset + rows.length,
          end: rows.length < TRANSACTIONS_PAGE_SIZE || offset + rows.length >= (Number(page?.total) || 0),
          loadingMore: false,
        }));
      },
      () => setList((s) => ({ ...s, loadingMore: false, moreFailed: true })),
    );
  }

  function openTx(id: string) {
    pushedTx.current = true;
    setQueryParam("tx", id, "push");
  }

  function closeTx() {
    if (pushedTx.current) {
      pushedTx.current = false;
      window.history.back();
    } else {
      setQueryParam("tx", null, "replace");
    }
  }

  const visible = list.items.filter((tx) => matchesFilter(tx, filter));

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="show"
      aria-labelledby="tx-title"
      className={`rounded-3xl border border-line bg-surface-card p-4 md:p-6 ${className}`}
    >
      <h2 id="tx-title" className="heading-6 text-ink">
        {t.title}
      </h2>

      <div role="group" aria-label={t.filtersLabel} className="mt-4 flex flex-wrap gap-2">
        {TX_FILTERS.map((f) => {
          const active = f === filter;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={active}
              onClick={() => onFilterChange(f)}
              className={`button-xsm rounded-full px-3 py-2 transition active:scale-98 ${
                active ? "on-inverse bg-surface-inverse text-ink-inverse" : "bg-surface-sunken text-ink-soft hover:bg-line hover:text-ink"
              }`}
            >
              {t.filters[f]}
            </button>
          );
        })}
      </div>

      {list.status === "loading" && <ListSkeleton />}

      {list.status === "error" && (
        <div role="alert" className="mt-6 rounded-2xl bg-danger-soft p-4">
          <p className="title-4 flex items-center gap-2 text-danger">
            <PiWarningCircle className="h-5 w-5 shrink-0" aria-hidden />
            {t.loadFailed}
          </p>
          <p className="caption-2 mt-1 text-ink-soft">{t.checkInternet}</p>
          <button
            type="button"
            onClick={retry}
            className="button-sm mt-3 rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken active:scale-98"
          >
            {t.tryAgain}
          </button>
        </div>
      )}

      {list.status === "ready" && list.items.length === 0 && list.end && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-surface-sunken px-4 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-card text-brand-strong">
            <PiReceipt className="h-6 w-6" aria-hidden />
          </span>
          <p className="title-3 text-ink">{t.emptyTitle}</p>
          <p className="caption-2 max-w-xs text-ink-soft">{t.emptyBody}</p>
          <a
            href="#recharge"
            className="button-sm rounded-full bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover active:scale-98"
          >
            {t.addMoney}
          </a>
        </div>
      )}

      {list.status === "ready" && list.items.length > 0 && (
        <>
          {visible.length > 0 ? (
            <>
              <p className="caption-5 mt-4 text-ink-muted">{t.pickOne}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {visible.map((tx) => (
                  <li key={tx.id}>
                    <TxRow tx={tx} onOpen={() => openTx(tx.id)} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="caption-2 mt-6 text-center text-ink-soft">
              {t.noneInFilter}
              {!list.end && t.loadOlder}
            </p>
          )}

          {!list.end && (
            <div className="mt-4">
              <button
                type="button"
                onClick={loadMore}
                disabled={list.loadingMore}
                className="button-sm w-full rounded-full border border-line-strong px-3 py-2 text-ink transition hover:bg-surface-sunken active:scale-98 disabled:opacity-60"
              >
                {list.loadingMore ? t.loading : list.moreFailed ? t.retryMore : t.showMore}
              </button>
              {list.moreFailed && (
                <p role="alert" className="caption-5 mt-2 text-center text-danger">
                  {t.moreFailed}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <TxDialog
        openTxId={openTxId}
        tx={openTxId ? (list.items.find((t) => t.id === openTxId) ?? null) : null}
        userId={userId}
        loading={list.status === "loading"}
        onClose={closeTx}
      />
    </motion.section>
  );
}

function TxIcon({ tx, large = false }: { tx: WalletTransaction; large?: boolean }) {
  const credit = isCreditTx(tx);
  const Icon = isBonusTx(tx) ? PiGift : credit ? PiWallet : PiChatCircleDots;
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full ${large ? "h-12 w-12" : "h-10 w-10"} ${
        credit ? "bg-brand-soft text-brand-strong" : "bg-danger-soft text-danger"
      }`}
    >
      <Icon className={large ? "h-6 w-6" : "h-5 w-5"} aria-hidden />
    </span>
  );
}

function TxAmount({ tx, className }: { tx: WalletTransaction; className: string }) {
  const t = useT(text);
  const credit = isCreditTx(tx);
  return (
    <span className={`${className} ${credit ? "text-success" : "text-danger"}`}>
      {credit ? "+" : "−"}
      {t.coins(formatTxAmount(tx.amount))}
    </span>
  );
}

function TxRow({ tx, onOpen }: { tx: WalletTransaction; onOpen: () => void }) {
  const t = useT(text);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition hover:bg-surface-sunken active:scale-98"
    >
      <TxIcon tx={tx} />
      <span className="min-w-0 flex-1">
        <span className="title-4 block truncate text-ink">{txTitle(t, tx)}</span>
        <span className="caption-5 block text-ink-muted">{formatDateTime(tx.created_at)}</span>
      </span>
      <span className="shrink-0 text-right">
        <TxAmount tx={tx} className="body-4 block" />
        <span className="caption-4 block text-ink-muted">{txStatus(t, tx)}</span>
      </span>
      <PiCaretRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
    </button>
  );
}

/** Transaction details in a native modal dialog: focus stays inside, Escape and the backdrop close it. */
function TxDialog({
  openTxId,
  tx,
  userId,
  loading,
  onClose,
}: {
  openTxId: string | null;
  tx: WalletTransaction | null;
  userId: string | null;
  loading: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const t = useT(text);

  // The URL decides: ?tx present → open. Back button / history change → closed.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (openTxId && !el.open) el.showModal();
    else if (!openTxId && el.open) el.close();
  }, [openTxId]);

  function copy(label: string, value: string) {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(label);
        setTimeout(() => setCopied((c) => (c === label ? null : c)), 2000);
      },
      () => undefined,
    );
  }

  const rows: Array<{ label: string; value: string; copy?: boolean }> = tx
    ? [
        { label: t.rows.date, value: formatDateTime(tx.created_at) || t.rows.notAvailable },
        { label: t.rows.status, value: txStatus(t, tx) },
        { label: t.rows.balanceAfter, value: t.coins(formatTxAmount(tx.balance_after)) },
        ...(tx.reference_type ? [{ label: t.rows.type, value: typeLabel(t, tx.reference_type) }] : []),
        ...(tx.reference_id ? [{ label: t.rows.reference, value: tx.reference_id, copy: true }] : []),
        { label: t.rows.id, value: tx.id, copy: true },
      ]
    : [];

  return (
    <dialog
      ref={dialog}
      aria-labelledby="tx-dialog-title"
      // Escape closes the dialog natively; keep the URL in step.
      onClose={() => {
        if (new URLSearchParams(window.location.search).get("tx")) onClose();
      }}
      // A click on the backdrop lands on the <dialog> itself, not on the panel inside it.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-0 mt-auto w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-ink/40 md:m-auto md:max-w-md"
    >
      <motion.div
        key={openTxId ?? "closed"}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={base}
        className="rounded-t-3xl bg-surface-card p-4 md:rounded-3xl md:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="tx-dialog-title" className="heading-6 text-ink">
            {t.detailsTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-surface-sunken active:scale-98"
          >
            <PiX className="h-5 w-5 text-ink-soft" aria-hidden />
          </button>
        </div>

        {tx ? (
          <>
            <div className="mt-4 flex flex-col items-center gap-2 text-center">
              <TxIcon tx={tx} large />
              <p className="title-3 text-ink">{txTitle(t, tx)}</p>
              <TxAmount tx={tx} className="heading-5" />
            </div>

            <dl className="mt-6 flex flex-col">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 odd:bg-surface-sunken">
                  <dt className="caption-2 shrink-0 text-ink-soft">{row.label}</dt>
                  <dd className="flex min-w-0 items-center gap-2">
                    <span className="body-5 truncate text-ink">{row.value}</span>
                    {row.copy && (
                      <button
                        type="button"
                        onClick={() => copy(row.label, row.value)}
                        aria-label={t.copy(row.label)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-muted transition hover:bg-line hover:text-ink active:scale-98"
                      >
                        {copied === row.label ? (
                          <PiCheck className="h-4 w-4 text-success" aria-hidden />
                        ) : (
                          <PiCopy className="h-4 w-4" aria-hidden />
                        )}
                      </button>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <p role="status" className="sr-only">
              {copied ? t.copied(copied) : ""}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {tx.reference_type === "RECHARGE" && tx.reference_id && (
                <Link
                  href={`/wallet/orders/${encodeURIComponent(tx.reference_id)}`}
                  // The backend's status route has no amounts: the receipt takes them from this credit.
                  onClick={() => userId && rememberRechargeCredit(userId, tx)}
                  className="button-sm flex-1 rounded-full bg-brand px-3 py-2 text-center text-brand-ink transition hover:bg-brand-hover active:scale-98"
                >
                  {t.viewReceipt}
                </Link>
              )}
              <button
                type="button"
                onClick={onClose}
                className="button-sm flex-1 rounded-full border border-line-strong px-3 py-2 text-ink transition hover:bg-surface-sunken active:scale-98"
              >
                {t.close}
              </button>
            </div>
          </>
        ) : loading ? (
          <div aria-busy="true" className="mt-6 flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} className="block h-10 animate-pulse rounded-xl bg-surface-sunken" />
            ))}
          </div>
        ) : (
          <div className="mt-6 text-center">
            <p className="title-4 text-ink">{t.notFoundTitle}</p>
            <p className="caption-2 mt-1 text-ink-soft">{t.notFoundBody}</p>
            <button
              type="button"
              onClick={onClose}
              className="button-sm mt-4 rounded-full border border-line-strong px-3 py-2 text-ink transition hover:bg-surface-sunken active:scale-98"
            >
              {t.close}
            </button>
          </div>
        )}
      </motion.div>
    </dialog>
  );
}

function ListSkeleton() {
  const t = useT(text);
  return (
    <ul aria-busy="true" aria-label={t.loadingList} className="mt-6 flex flex-col gap-1">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-2 py-3">
          <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-sunken" />
          <span className="flex flex-1 flex-col gap-2">
            <span className="block h-4 w-1/2 animate-pulse rounded bg-surface-sunken" />
            <span className="block h-3 w-1/3 animate-pulse rounded bg-surface-sunken" />
          </span>
          <span className="h-4 w-16 animate-pulse rounded bg-surface-sunken" />
        </li>
      ))}
    </ul>
  );
}
