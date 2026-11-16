"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { IconType } from "react-icons";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  PiArrowLeft,
  PiCheck,
  PiCheckCircle,
  PiCopy,
  PiHourglassMedium,
  PiInfo,
  PiWarningCircle,
  PiWifiSlash,
  PiXCircle,
} from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { fadeUp, stagger } from "@/lib/motion";
import {
  readRechargeReceipt,
  receiptFromTransaction,
  saveRechargeReceipt,
  type RechargeReceipt,
} from "@/lib/services/rechargeReceipt";
import {
  formatCoins,
  formatDateTime,
  formatRupees,
  getRechargeStatus,
  sendPaymentEmail,
  type RechargeStatus,
  type TransactionsPage,
} from "@/lib/services/wallet";
import { cachedTransactions, loadFirstTransactions } from "@/lib/services/walletCache";
import { currentLocation, setQueryParam } from "../../url";

// Like the app: check every 2 s for about a minute, then say the payment is on its way.
const POLL_INTERVAL_MS = 2000;
const POLL_CHECKS = 31;

const text = defineMessages({
  hi: {
    back: "वॉलेट पर वापस जाएँ",
    receiptTitle: "रिचार्ज रसीद",
    statusTitle: "रिचार्ज की स्थिति",
    loadFailedTitle: "स्थिति लोड नहीं हो सकी",
    loadFailedBody: "सर्वर से जवाब नहीं मिला। थोड़ी देर बाद फिर से कोशिश करें।",
    tryAgain: "फिर से कोशिश करें",
    offlineTitle: "आप ऑफ़लाइन हैं",
    offlineBody: "इंटरनेट जुड़ते ही इस रिचार्ज की स्थिति अपने-आप दिखेगी।",
    notFoundTitle: "यह ऑर्डर नहीं मिला",
    notFoundBody: "हो सकता है लिंक गलत हो, या यह ऑर्डर किसी दूसरे account का हो।",
    goToWallet: "वॉलेट पर जाएँ",
    offlineNote: "आप ऑफ़लाइन हैं। इंटरनेट जुड़ते ही स्थिति अपने-आप जाँची जाएगी।",
    viewWallet: "वॉलेट देखें",
    anotherRecharge: "एक और रिचार्ज करें",
    checkAgain: "स्थिति फिर देखें",
    rechargeAgain: "फिर से रिचार्ज करें",
    details: "विवरण",
    rechargeAmount: "रिचार्ज राशि",
    promo: (code: string) => `प्रोमो: ${code}`,
    promoDiscount: "प्रोमो छूट",
    promoCode: "प्रोमो कोड",
    gst: "जीएसटी",
    gstWithRate: (percent: string) => `जीएसटी (${percent}%)`,
    totalPaid: "कुल भुगतान",
    payable: "देय राशि",
    coinsAdded: "जोड़े गए कॉइन्स",
    coinsToAdd: "जुड़ने वाले कॉइन्स",
    coins: (count: string) => `${count} कॉइन्स`,
    withBonus: (bonus: string) => ` (${bonus} बोनस सहित)`,
    paymentInfo: "भुगतान की जानकारी",
    orderId: "ऑर्डर आईडी",
    paymentId: "पेमेंट आईडी",
    hero: {
      paid: {
        title: "भुगतान सफल",
        coinsAdded: (count: string) => `${count} कॉइन्स आपके वॉलेट में जुड़ गए।`,
        rechargeAdded: "रिचार्ज आपके वॉलेट में जुड़ गया।",
      },
      verifying: {
        title: "भुगतान की पुष्टि हो रही है",
        body: "Razorpay से भुगतान मिल गया है। कॉइन्स जोड़े जा रहे हैं, इसमें कुछ पल लग सकते हैं।",
      },
      received: {
        title: "भुगतान प्राप्त हुआ",
        body: "आपका भुगतान हो गया है। कॉइन्स कुछ ही मिनटों में आपके वॉलेट में दिख जाएँगे। दोबारा भुगतान न करें।",
      },
      failed: {
        title: "भुगतान असफल",
        body: "यह भुगतान पूरा नहीं हो सका, कोई कॉइन्स नहीं जुड़े। अगर आपके खाते से राशि कटी है, तो वह आपके मूल खाते में वापस आ जाएगी।",
        reason: (reason: string) => `कारण: ${reason}`,
      },
      unpaid: {
        title: "भुगतान पूरा नहीं हुआ",
        body: "इस ऑर्डर का भुगतान नहीं हुआ है। रिचार्ज के लिए नया भुगतान शुरू करें।",
      },
    },
    copy: (label: string) => `${label} कॉपी करें`,
    copied: (label: string) => `${label} कॉपी हो गया`,
    loading: "रसीद लोड हो रही है",
  },
  en: {
    back: "Back to wallet",
    receiptTitle: "Recharge receipt",
    statusTitle: "Recharge status",
    loadFailedTitle: "Could not load the status",
    loadFailedBody: "The server did not respond. Try again in a little while.",
    tryAgain: "Try again",
    offlineTitle: "You are offline",
    offlineBody: "The status of this recharge will show as soon as you are back online.",
    notFoundTitle: "Order not found",
    notFoundBody: "The link may be wrong, or this order may belong to another account.",
    goToWallet: "Go to wallet",
    offlineNote: "You are offline. The status will be checked again as soon as you are back online.",
    viewWallet: "View wallet",
    anotherRecharge: "Make another recharge",
    checkAgain: "Check status again",
    rechargeAgain: "Recharge again",
    details: "Details",
    rechargeAmount: "Recharge amount",
    promo: (code) => `Promo: ${code}`,
    promoDiscount: "Promo discount",
    promoCode: "Promo code",
    gst: "GST",
    gstWithRate: (percent) => `GST (${percent}%)`,
    totalPaid: "Total paid",
    payable: "Payable amount",
    coinsAdded: "Points added",
    coinsToAdd: "Points to be added",
    coins: (count) => `${count} points`,
    withBonus: (bonus) => ` (including ${bonus} bonus)`,
    paymentInfo: "Payment information",
    orderId: "Order ID",
    paymentId: "Payment ID",
    hero: {
      paid: {
        title: "Payment successful",
        coinsAdded: (count) => `${count} points were added to your wallet.`,
        rechargeAdded: "The recharge was added to your wallet.",
      },
      verifying: {
        title: "Confirming your payment",
        body: "Razorpay has received your payment. Your points are being added, which can take a few moments.",
      },
      received: {
        title: "Payment received",
        body: "Your payment went through. The points will appear in your wallet within a few minutes. There is no need to pay again.",
      },
      failed: {
        title: "Payment failed",
        body: "This payment could not be completed and no points were added. If money was deducted from your account, it will be returned to the original account.",
        reason: (reason) => `Reason: ${reason}`,
      },
      unpaid: {
        title: "Payment not completed",
        body: "This order has not been paid. Start a new payment to recharge.",
      },
    },
    copy: (label) => `Copy ${label}`,
    copied: (label) => `${label} copied`,
    loading: "Loading the receipt",
  },
});

/**
 * paid: the points are credited. verifying: Razorpay has the money and the credit is being confirmed.
 * received: still not credited after a minute (Razorpay's webhook credits it). failed: the payment failed.
 * unpaid: no payment on this order.
 */
type Outcome = "paid" | "verifying" | "received" | "failed" | "unpaid";

type Phase =
  | { kind: "loading" }
  | { kind: "ready"; outcome: Outcome }
  | { kind: "notFound" }
  /** Nothing is known about the order and the backend could not be asked. */
  | { kind: "error" };

/** What this tab saw at checkout, besides the backend's status. */
type Known = {
  /** Razorpay reported a payment (its success handler ran). */
  paid: boolean;
  /** The backend's confirm answered that the points are credited. */
  confirmed: boolean;
  /** Razorpay reported a failed attempt and the window was closed. */
  failed: boolean;
};

/**
 * The outcome from the backend's status (null when it could not be asked) and what this tab knows. The backend's
 * PAID always wins, even over a failure Checkout reported (a late UPI approval is still captured and credited).
 * Its PENDING is not taken as "not paid" while this tab saw a payment: the credit can take a moment.
 */
function decide(status: RechargeStatus["status"] | null, known: Known): Outcome | null {
  if (status === "PAID" || known.confirmed) return "paid";
  if (status === "FAILED" || known.failed) return "failed";
  if (known.paid) return "verifying";
  if (status === "PENDING") return "unpaid";
  return null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const subscribeOnline = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

/** The browser's own idea of being online: false only when it has no network at all. */
const useOnline = () =>
  useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );

/**
 * When the wallet page could not confirm the payment itself (?notify=1), the outcome email the app sends is
 * sent here, once, as soon as the order settles. The flag then leaves the URL so a refresh does not send it again.
 */
function sendOutcomeEmailOnce(orderId: string, outcome: Outcome, amount: number) {
  if (new URLSearchParams(window.location.search).get("notify") !== "1") return;
  if (outcome === "paid") sendPaymentEmail("payment_success", { orderId, amount });
  else if (outcome === "failed") sendPaymentEmail("payment_failed", { orderId, amount });
  else return;
  setQueryParam("notify", null, "replace");
}

/**
 * /wallet/orders/<razorpay order id>: the result of a recharge, with its own URL. Opened right after checkout
 * (?payment=<id>), it shows at once what checkout and the backend's confirm said, and follows the order on the
 * backend until it is credited, so a refresh or a slow confirmation never loses the result. Also opened for a
 * failed payment, and from a recharge in the transaction list.
 */
export default function OrderStatus({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { status, session } = useAuth();

  useEffect(() => {
    if (status === "signedOut") router.replace(`/login?next=${encodeURIComponent(currentLocation())}`);
  }, [status, router]);

  const userId = session?.user.id;
  if (status !== "signedIn" || !userId) return <OrderSkeleton />;
  return <SignedInOrder key={`${userId}:${orderId}`} orderId={orderId} userId={userId} />;
}

function SignedInOrder({ orderId, userId }: { orderId: string; userId: string }) {
  const searchParams = useSearchParams();
  // Razorpay's payment id, present when the user paid on this site a moment ago.
  const paymentParam = searchParams.get("payment");
  const { refresh } = useAuth();
  const online = useOnline();
  // Rendered only once signed in, so on the client: this tab's own record of the order, if it made it.
  const [receipt, setReceipt] = useState<RechargeReceipt | null>(() => readRechargeReceipt(orderId, userId));
  // For the outcome email, which only a payment made in this tab can owe (see ?notify).
  const [emailAmount] = useState(() => receipt?.total ?? 0);

  const checkout = receipt?.checkout;
  const knownPaid = !!paymentParam || checkout?.kind === "paid";
  const knownConfirmed = checkout?.kind === "paid" && checkout.confirmed;
  const knownFailed = checkout?.kind === "failed";

  // A payment this tab saw shows at once: success after confirm, "confirming" otherwise, or the failure.
  const [phase, setPhase] = useState<Phase>(() => {
    const outcome = decide(null, { paid: knownPaid, confirmed: knownConfirmed, failed: knownFailed });
    return outcome ? { kind: "ready", outcome } : { kind: "loading" };
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const known: Known = { paid: knownPaid, confirmed: knownConfirmed, failed: knownFailed };

    async function follow() {
      for (let check = 0; check < POLL_CHECKS; check++) {
        let status: RechargeStatus["status"] | null = null;
        try {
          status = (await getRechargeStatus(orderId, signal)).status;
        } catch (error) {
          if (signal.aborted) return;
          // 403: another account's order; 404: no such order. Not believed for an order this tab just paid.
          if (error instanceof ApiError && (error.status === 403 || error.status === 404) && !known.paid && !known.failed) {
            setPhase({ kind: "notFound" });
            return;
          }
        }
        if (signal.aborted) return;

        const outcome = decide(status, known);
        if (!outcome) {
          setPhase({ kind: "error" });
          return;
        }
        setPhase({ kind: "ready", outcome });
        if (outcome !== "verifying") {
          if (outcome === "paid") void refresh();
          sendOutcomeEmailOnce(orderId, outcome, emailAmount);
          return;
        }
        await sleep(POLL_INTERVAL_MS);
        if (signal.aborted) return;
      }
      // Still not credited after a minute: Razorpay has the money and its webhook credits it.
      setPhase({ kind: "ready", outcome: "received" });
    }

    void follow();
    return () => controller.abort();
  }, [orderId, knownPaid, knownConfirmed, knownFailed, attempt, refresh, emailAmount]);

  // A paid order opened without this tab's record (from the transaction list, a bookmark): the amounts come from
  // its credit in the transaction list.
  const needsDetails = phase.kind === "ready" && phase.outcome === "paid" && receipt?.total == null;
  useEffect(() => {
    if (!needsDetails) return;
    let cancelled = false;
    const find = (page: TransactionsPage | null) =>
      page?.transactions.find((tx) => tx.reference_type === "RECHARGE" && tx.reference_id === orderId) ?? null;
    // The list this tab already holds, else the newest page (also when the held one predates this credit).
    const cached = find(cachedTransactions(userId));
    (cached ? Promise.resolve(cached) : loadFirstTransactions(userId).then(find)).then(
      (tx) => {
        const found = tx ? receiptFromTransaction(userId, tx) : null;
        if (cancelled || !found) return;
        saveRechargeReceipt(found);
        setReceipt((previous) => (previous?.total != null ? previous : { ...found, checkout: previous?.checkout }));
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [needsDetails, orderId, userId]);

  // Waiting on the network (the status could not be loaded, or the credit is not seen yet): check again as soon as
  // the browser is back online.
  const waiting = phase.kind === "error" || (phase.kind === "ready" && phase.outcome === "received");
  useEffect(() => {
    if (!waiting) return;
    const onOnline = () => setAttempt((n) => n + 1);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [waiting]);

  const checkAgain = () => {
    const outcome = decide(null, { paid: knownPaid, confirmed: knownConfirmed, failed: knownFailed });
    setPhase(outcome ? { kind: "ready", outcome } : { kind: "loading" });
    setAttempt((n) => n + 1);
  };

  const paid = phase.kind === "ready" && phase.outcome === "paid";
  const t = useT(text);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 md:px-8 md:pt-10">
      <Link
        href="/wallet"
        className="button-sm inline-flex items-center gap-2 rounded-xl px-3 py-2 text-ink-soft transition hover:bg-surface-sunken hover:text-ink active:scale-98"
      >
        <PiArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </Link>

      <h1 className="heading-4 mt-4 text-ink md:heading-3">{paid ? t.receiptTitle : t.statusTitle}</h1>

      {phase.kind === "loading" && <OrderSkeletonBody />}

      {phase.kind === "error" &&
        (online ? (
          <Notice tone="danger" icon={PiWarningCircle} title={t.loadFailedTitle} body={t.loadFailedBody}>
            <button type="button" onClick={checkAgain} className={SECONDARY_BUTTON}>
              {t.tryAgain}
            </button>
          </Notice>
        ) : (
          <Notice tone="neutral" icon={PiWifiSlash} title={t.offlineTitle} body={t.offlineBody}>
            <button type="button" onClick={checkAgain} className={SECONDARY_BUTTON}>
              {t.tryAgain}
            </button>
          </Notice>
        ))}

      {phase.kind === "notFound" && (
        <Notice tone="neutral" icon={PiInfo} title={t.notFoundTitle} body={t.notFoundBody}>
          <Link href="/wallet" className={PRIMARY_BUTTON}>
            {t.goToWallet}
          </Link>
        </Notice>
      )}

      {phase.kind === "ready" && (
        <Receipt
          outcome={phase.outcome}
          receipt={receipt}
          orderId={orderId}
          paymentParam={paymentParam}
          online={online}
          onCheckAgain={checkAgain}
        />
      )}
    </div>
  );
}

const PRIMARY_BUTTON =
  "button-sm inline-flex items-center justify-center rounded-xl bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover active:scale-98";
const SECONDARY_BUTTON =
  "button-sm inline-flex items-center justify-center rounded-xl border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken active:scale-98";

function Receipt({
  outcome,
  receipt,
  orderId,
  paymentParam,
  online,
  onCheckAgain,
}: {
  outcome: Outcome;
  receipt: RechargeReceipt | null;
  orderId: string;
  paymentParam: string | null;
  online: boolean;
  onCheckAgain: () => void;
}) {
  const total = receipt?.total ?? null;
  const coins = receipt?.coins ?? null;
  const bonus = receipt?.bonus ?? 0;
  const paymentId = receipt?.paymentId ?? paymentParam;
  const paidAt = outcome === "failed" || outcome === "unpaid" ? null : (receipt?.paidAt ?? null);
  const moneyTaken = outcome === "paid" || outcome === "verifying" || outcome === "received";
  const failureReason = receipt?.checkout?.kind === "failed" ? receipt.checkout.reason : null;
  // "Try again" opens the wallet on the same pack.
  const retryHref = receipt?.originalAmount ? `/wallet?amount=${receipt.originalAmount}#recharge` : "/wallet#recharge";
  const hasAmounts = receipt != null && (receipt.originalAmount != null || total != null);
  const t = useT(text);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start md:gap-8">
      <motion.section variants={fadeUp} aria-live="polite" className="rounded-3xl border border-line bg-surface-card p-6 md:p-8">
        <StatusHero outcome={outcome} total={total} coins={coins} failureReason={failureReason} />
        {paidAt ? <p className="caption-5 mt-2 text-center text-ink-muted">{formatDateTime(paidAt)}</p> : null}

        {!online && (outcome === "verifying" || outcome === "received") && (
          <p className="caption-2 mt-4 flex items-start justify-center gap-2 text-center text-ink-soft">
            <PiWifiSlash className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t.offlineNote}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {outcome === "paid" && (
            <>
              <Link href="/wallet" className={PRIMARY_BUTTON}>
                {t.viewWallet}
              </Link>
              <Link href="/wallet#recharge" className={SECONDARY_BUTTON}>
                {t.anotherRecharge}
              </Link>
            </>
          )}
          {outcome === "received" && (
            <>
              <button type="button" onClick={onCheckAgain} className={PRIMARY_BUTTON}>
                {t.checkAgain}
              </button>
              <Link href="/wallet" className={SECONDARY_BUTTON}>
                {t.viewWallet}
              </Link>
            </>
          )}
          {outcome === "failed" && (
            <>
              <Link href={retryHref} className={PRIMARY_BUTTON}>
                {t.tryAgain}
              </Link>
              <Link href="/wallet" className={SECONDARY_BUTTON}>
                {t.viewWallet}
              </Link>
            </>
          )}
          {outcome === "unpaid" && (
            <Link href={retryHref} className={PRIMARY_BUTTON}>
              {t.rechargeAgain}
            </Link>
          )}
        </div>
      </motion.section>

      <motion.section variants={fadeUp} aria-labelledby="breakdown-title" className="rounded-3xl border border-line bg-surface-card p-6 md:p-8">
        <h2 id="breakdown-title" className="heading-6 text-ink">
          {t.details}
        </h2>
        {hasAmounts && (
          <>
            <dl className="mt-4 flex flex-col gap-2">
              {receipt.originalAmount != null && <Row label={t.rechargeAmount} value={formatRupees(receipt.originalAmount)} />}
              {receipt.discount != null && receipt.discount > 0 ? (
                <Row
                  label={receipt.promoCode ? t.promo(receipt.promoCode) : t.promoDiscount}
                  value={`−${formatRupees(receipt.discount)}`}
                  tone="success"
                />
              ) : receipt.promoCode && receipt.discount == null ? (
                <Row label={t.promoCode} value={receipt.promoCode} />
              ) : null}
              {receipt.gstAmount != null && (
                <Row
                  label={receipt.gstPct != null ? t.gstWithRate(receipt.gstPct.toLocaleString("en-IN")) : t.gst}
                  value={formatRupees(receipt.gstAmount)}
                />
              )}
            </dl>
            <hr className="my-4 border-line" />
            <dl className="flex flex-col gap-2">
              {total != null && <Row label={moneyTaken ? t.totalPaid : t.payable} value={formatRupees(total)} strong />}
              {moneyTaken && coins != null && coins > 0 && (
                <Row
                  label={outcome === "paid" ? t.coinsAdded : t.coinsToAdd}
                  value={`${t.coins(formatCoins(coins))}${bonus > 0 ? t.withBonus(formatCoins(bonus)) : ""}`}
                />
              )}
            </dl>
          </>
        )}

        <h3 className={`title-4 text-ink ${hasAmounts ? "mt-6" : "mt-4"}`}>{t.paymentInfo}</h3>
        <dl className="mt-2 flex flex-col">
          <CopyRow label={t.orderId} value={orderId} />
          {paymentId && <CopyRow label={t.paymentId} value={paymentId} />}
        </dl>
      </motion.section>
    </motion.div>
  );
}

function StatusHero({
  outcome,
  total,
  coins,
  failureReason,
}: {
  outcome: Outcome;
  total: number | null;
  coins: number | null;
  failureReason: string | null;
}) {
  const { hero } = useT(text);
  const amount = total != null ? formatRupees(total) : null;
  switch (outcome) {
    case "paid":
      return (
        <Hero
          icon={PiCheckCircle}
          tone="success"
          title={hero.paid.title}
          amount={amount}
          body={coins ? hero.paid.coinsAdded(formatCoins(coins)) : hero.paid.rechargeAdded}
        />
      );
    case "verifying":
      return (
        <Hero
          icon={PiHourglassMedium}
          tone="neutral"
          title={hero.verifying.title}
          amount={amount}
          body={hero.verifying.body}
          pulse
        />
      );
    case "received":
      return <Hero icon={PiHourglassMedium} tone="neutral" title={hero.received.title} amount={amount} body={hero.received.body} />;
    case "failed":
      return (
        <Hero
          icon={PiXCircle}
          tone="danger"
          title={hero.failed.title}
          amount={amount}
          body={hero.failed.body}
          note={failureReason ? hero.failed.reason(failureReason) : null}
        />
      );
    case "unpaid":
      return <Hero icon={PiInfo} tone="neutral" title={hero.unpaid.title} amount={amount} body={hero.unpaid.body} />;
  }
}

const TONE = {
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-neutral-soft text-ink-soft",
} as const;

function Hero({
  icon: Icon,
  tone,
  title,
  amount,
  body,
  note = null,
  pulse = false,
}: {
  icon: IconType;
  tone: keyof typeof TONE;
  title: string;
  amount: string | null;
  body: string;
  note?: string | null;
  pulse?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className={`grid h-16 w-16 place-items-center rounded-full ${TONE[tone]} ${pulse ? "animate-pulse" : ""}`}>
        <Icon className="h-8 w-8" aria-hidden />
      </span>
      <h2 className={`heading-5 mt-2 ${tone === "neutral" ? "text-ink" : tone === "success" ? "text-success" : "text-danger"}`}>
        {title}
      </h2>
      {amount && <p className="heading-3 text-ink">{amount}</p>}
      <p className="body-6 max-w-sm text-ink-soft">{body}</p>
      {note && <p className="caption-2 max-w-sm rounded-xl bg-surface-sunken px-3 py-2 text-ink">{note}</p>}
    </div>
  );
}

function Row({ label, value, tone, strong = false }: { label: string; value: string; tone?: "success"; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={`${strong ? "title-4 text-ink" : "caption-2 text-ink-soft"} min-w-0`}>{label}</dt>
      <dd className={`${strong ? "title-2" : "body-5"} shrink-0 text-right ${tone === "success" ? "text-success" : "text-ink"}`}>
        {value}
      </dd>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const t = useT(text);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 odd:bg-surface-sunken">
      <dt className="caption-2 shrink-0 text-ink-soft">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <span className="body-5 truncate text-ink">{value}</span>
        <button
          type="button"
          aria-label={t.copy(label)}
          onClick={() =>
            navigator.clipboard?.writeText(value).then(
              () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              },
              () => undefined,
            )
          }
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-muted transition hover:bg-line hover:text-ink active:scale-98"
        >
          {copied ? <PiCheck className="h-4 w-4 text-success" aria-hidden /> : <PiCopy className="h-4 w-4" aria-hidden />}
        </button>
        <span role="status" className="sr-only">
          {copied ? t.copied(label) : ""}
        </span>
      </dd>
    </div>
  );
}

function Notice({
  tone,
  icon: Icon,
  title,
  body,
  children,
}: {
  tone: "danger" | "neutral";
  icon: IconType;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`mt-6 max-w-xl rounded-3xl p-6 ${tone === "danger" ? "bg-danger-soft" : "bg-surface-sunken"}`}
    >
      <p className={`title-3 flex items-center gap-2 ${tone === "danger" ? "text-danger" : "text-ink"}`}>
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        {title}
      </p>
      <p className="body-6 mt-2 text-ink-soft">{body}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function OrderSkeletonBody() {
  const t = useT(text);
  return (
    <div aria-busy="true" aria-label={t.loading} className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
      <span className="block h-72 animate-pulse rounded-3xl bg-surface-sunken" />
      <span className="block h-72 animate-pulse rounded-3xl bg-surface-sunken" />
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 md:px-8 md:pt-10">
      <span className="block h-10 w-48 animate-pulse rounded-full bg-surface-sunken" />
      <span className="mt-4 block h-10 w-56 animate-pulse rounded-xl bg-surface-sunken" />
      <OrderSkeletonBody />
    </div>
  );
}
