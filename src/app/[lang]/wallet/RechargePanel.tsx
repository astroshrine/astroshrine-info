"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import { PiCheckCircle, PiInfo, PiLightning, PiLock, PiTag, PiWallet, PiWarningCircle } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { fadeUp } from "@/lib/motion";
import { RAZORPAY_CHECKOUT_SRC, brandColor, isCheckoutLoaded, openCheckout } from "@/lib/services/razorpay";
import { receiptFromOrder, saveRechargeReceipt } from "@/lib/services/rechargeReceipt";
import {
  cancelRechargeOrder,
  confirmRecharge,
  formatCoins,
  formatRupees,
  formatRupeesShort,
  gstPercent,
  initiateRecharge,
  pointsFor,
  priceBreakdown,
  rechargeTiers,
  sendPaymentEmail,
  validatePromo,
  type PromoValidation,
  type RechargeTier,
} from "@/lib/services/wallet";
import type { ConfigState } from "./WalletView";

/**
 * Where a payment stands while it is on this page. Once Razorpay reports a payment, or a failed attempt, the
 * order's own page (/wallet/orders/<id>) takes over and shows the result.
 */
type Flow =
  | { step: "idle" }
  | { step: "starting" }
  | { step: "paying" }
  | { step: "confirming" }
  /** Checkout closed without a successful or failed attempt: the user cancelled. */
  | { step: "closed" }
  | { step: "error"; message: string };

const BUSY_STEPS = new Set<Flow["step"]>(["starting", "paying", "confirming"]);

/**
 * How long the confirm call may take before the order page takes over (it usually answers in about a second).
 * The money is already with Razorpay by then, so a slow answer only delays the receipt: the order page polls
 * the backend, and Razorpay's webhook credits the points even when confirm never answers.
 */
const CONFIRM_TIMEOUT_MS = 20_000;

/** AbortSignal.timeout, with a fallback for browsers without it (Chrome before 103, Safari before 16). */
function timeoutSignal(ms: number) {
  if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

const text = defineMessages({
  hi: {
    title: "वॉलेट रिचार्ज करें",
    bonus: (percent: string) => `${percent}% बोनस`,
    configFailed: "रिचार्ज के विकल्प लोड नहीं हो सके",
    checkInternet: "इंटरनेट जाँचें और फिर से कोशिश करें।",
    tryAgain: "फिर से कोशिश करें",
    rechargePaused: "वॉलेट रिचार्ज अभी बंद है। थोड़ी देर बाद फिर कोशिश करें।",
    choosePack: "पैक राशि चुनें",
    instantCoins: "भुगतान के तुरंत बाद कॉइन्स जुड़ते हैं",
    withBonus: (base: string, bonus: string) => `${base} + ${bonus} बोनस`,
    points: (count: string) => `${count} पॉइंट्स`,
    havePromo: "प्रोमो कोड है?",
    promoPlaceholder: "प्रोमो कोड दर्ज करें",
    checking: "जाँच रहे हैं",
    apply: "लागू करें",
    promoApplied: "प्रोमो कोड लागू हो गया",
    invalidPromo: "अमान्य प्रोमो कोड",
    youSave: (amount: string) => ` (${amount} बचाएँ)`,
    amount: "राशि",
    promo: (code: string) => `प्रोमो: ${code}`,
    gst: (percent: string) => `जीएसटी (${percent}%)`,
    payable: "देय राशि",
    willBeAdded: "वॉलेट में जुड़ेंगे",
    coins: (count: string) => `${count} कॉइन्स`,
    processing: "प्रोसेस हो रहा है",
    loadingCheckout: "भुगतान विंडो लोड हो रही है",
    addToWallet: (amount: string) => `वॉलेट में ${amount} जोड़ें`,
    checkoutDescription: (points: string) => `वॉलेट रिचार्ज: ${points} पॉइंट्स`,
    trust: "Razorpay से सुरक्षित भुगतान · परामर्श और पूजा के लिए मान्य",
    loadingPacks: "रिचार्ज के विकल्प लोड हो रहे हैं",
    busy: {
      starting: "भुगतान शुरू हो रहा है",
      paying: "Razorpay विंडो में भुगतान पूरा करें",
      confirming: "भुगतान की पुष्टि हो रही है। यह पेज बंद न करें।",
    },
    closedTitle: "भुगतान पूरा नहीं हुआ",
    closedBody: "आपने भुगतान विंडो बंद कर दी। तैयार हों तो ऊपर का बटन फिर दबाएँ।",
    errorTitle: "रिचार्ज शुरू नहीं हो सका",
    errors: {
      checkoutNotLoaded: "भुगतान विंडो लोड नहीं हो सकी। इंटरनेट जाँचें और पेज रीफ़्रेश करें।",
      rechargeNotStarted: "रिचार्ज शुरू नहीं हो सका। फिर से कोशिश करें।",
      paymentNotStarted: "भुगतान शुरू नहीं हो सका। कृपया बाद में कोशिश करें।",
      checkoutNotOpened: "भुगतान विंडो खुल नहीं सकी। पेज रीफ़्रेश करके फिर कोशिश करें।",
    },
    checkoutScriptFailed: "Razorpay भुगतान विंडो लोड नहीं हो सकी। इंटरनेट जाँचें और पेज रीफ़्रेश करें।",
  },
  en: {
    title: "Recharge wallet",
    bonus: (percent) => `${percent}% bonus`,
    configFailed: "Could not load the recharge options",
    checkInternet: "Check your internet connection and try again.",
    tryAgain: "Try again",
    rechargePaused: "Wallet recharge is paused right now. Try again in a little while.",
    choosePack: "Select pack amount",
    instantCoins: "Points are added right after payment",
    withBonus: (base, bonus) => `${base} + ${bonus} bonus`,
    points: (count) => `${count} points`,
    havePromo: "Have a promo code?",
    promoPlaceholder: "Enter promo code",
    checking: "Checking",
    apply: "Apply",
    promoApplied: "Promo code applied",
    invalidPromo: "Invalid promo code",
    youSave: (amount) => ` (you save ${amount})`,
    amount: "Amount",
    promo: (code) => `Promo: ${code}`,
    gst: (percent) => `GST (${percent}%)`,
    payable: "Payable amount",
    willBeAdded: "Added to your wallet",
    coins: (count) => `${count} points`,
    processing: "Processing",
    loadingCheckout: "Loading the payment window",
    addToWallet: (amount) => `Add ${amount} to wallet`,
    checkoutDescription: (points) => `Wallet recharge: ${points} points`,
    trust: "Secure payment by Razorpay · Valid for consultations and pujas",
    loadingPacks: "Loading recharge options",
    busy: {
      starting: "Starting the payment",
      paying: "Complete the payment in the Razorpay window",
      confirming: "Confirming your payment. Keep this page open.",
    },
    closedTitle: "Payment not completed",
    closedBody: "You closed the payment window. When you are ready, press the button above again.",
    errorTitle: "Could not start the recharge",
    errors: {
      checkoutNotLoaded: "The payment window could not load. Check your internet connection and refresh the page.",
      rechargeNotStarted: "The recharge could not start. Try again.",
      paymentNotStarted: "The payment could not start. Try again later.",
      checkoutNotOpened: "The payment window could not open. Refresh the page and try again.",
    },
    checkoutScriptFailed: "The Razorpay payment window could not load. Check your internet connection and refresh the page.",
  },
});

type BusyStep = keyof (typeof text)["hi"]["busy"];

export default function RechargePanel({
  className,
  config,
  onRetryConfig,
  amount,
  onAmountChange,
}: {
  className: string;
  config: ConfigState;
  onRetryConfig: () => void;
  /** The pack in the URL (?amount=500); the first pack when absent or not on offer. */
  amount: number | null;
  onAmountChange: (inr: number) => void;
}) {
  const router = useRouter();
  const { session, user } = useAuth();
  const t = useT(text);
  const [checkout, setCheckout] = useState<"loading" | "ready" | "error">(() =>
    isCheckoutLoaded() ? "ready" : "loading",
  );
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<PromoValidation | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [flow, setFlow] = useState<Flow>({ step: "idle" });
  const alive = useRef(true);
  // A second click before React re-renders must not create a second order.
  const inFlight = useRef(false);
  const tierRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Next.js keeps this page alive, hidden, while the order's page shows (React Activity), and shows it again as it
  // was when the user comes back. Once a payment has handed over to the order's page, the panel resets as it hides:
  // not before, so the button stays disabled until the order's page is on screen.
  const handedOver = useRef<{ clearPromo: boolean } | null>(null);
  useLayoutEffect(
    () => () => {
      const reset = handedOver.current;
      if (!reset) return;
      handedOver.current = null;
      setFlow({ step: "idle" });
      // A promo used by a paid recharge is spent; after a failed one it stays for the retry.
      if (reset.clearPromo) {
        setPromo(null);
        setPromoCode("");
      }
    },
    [],
  );

  const busy = BUSY_STEPS.has(flow.step);

  // While a payment is starting or being confirmed, leaving the page asks first (the app does the same).
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  const walletConfig = config.status === "ready" ? config.config : null;
  const tiers = walletConfig ? rechargeTiers(walletConfig) : [];
  const selectedIndex = Math.max(
    tiers.findIndex((pack) => pack.inr === amount),
    0,
  );
  const tier: RechargeTier | undefined = tiers[selectedIndex];
  const bonusPct = Number(walletConfig?.bonus_percentage) || 0;
  const walletOpen = walletConfig?.is_active !== false;
  const points = tier ? pointsFor(walletConfig, tier.inr) : null;
  const price = tier ? priceBreakdown(tier.inr, promo, gstPercent(walletConfig)) : null;
  const promoValid = !!promo?.valid;

  const set = (next: Flow) => {
    if (alive.current) setFlow(next);
  };

  function selectTier(index: number, focus = false) {
    const next = tiers[index];
    if (!next || busy) return;
    // A code checked for one amount must not carry over to another (the app clears it too).
    setPromo(null);
    setPromoCode("");
    if (flow.step !== "idle") setFlow({ step: "idle" });
    onAmountChange(next.inr);
    if (focus) tierRefs.current[index]?.focus();
  }

  // Radio group keys: arrows move the selection, Home / End jump to the first / last pack.
  function onTierKey(e: React.KeyboardEvent, index: number) {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      selectTier(e.key === "Home" ? 0 : tiers.length - 1, true);
    } else if (moves[e.key] !== undefined) {
      e.preventDefault();
      selectTier((index + moves[e.key] + tiers.length) % tiers.length, true);
    }
  }

  async function applyPromo() {
    const code = promoCode.trim();
    if (!code || !tier || promoBusy) return;
    setPromoBusy(true);
    setPromo(null);
    try {
      setPromo(await validatePromo(code, tier.inr));
    } catch (error) {
      setPromo({ valid: false, message: error instanceof ApiError ? error.message : t.invalidPromo });
    } finally {
      setPromoBusy(false);
    }
  }

  async function pay() {
    if (!tier || busy || !walletOpen || inFlight.current) return;
    // Check Checkout before creating an order that could never be paid.
    if (!isCheckoutLoaded()) {
      setFlow({ step: "error", message: t.errors.checkoutNotLoaded });
      return;
    }
    inFlight.current = true;
    try {
      await runPayment(tier);
    } finally {
      inFlight.current = false;
    }
  }

  async function runPayment(tier: RechargeTier) {
    setFlow({ step: "starting" });
    let order;
    try {
      order = await initiateRecharge(tier.inr, promoValid ? promoCode.trim() : undefined);
    } catch (error) {
      set({ step: "error", message: error instanceof ApiError ? error.message : t.errors.rechargeNotStarted });
      return;
    }
    if (!order?.orderId || typeof order.razorpayKey !== "string" || !order.razorpayKey) {
      set({ step: "error", message: t.errors.paymentNotStarted });
      return;
    }
    sendPaymentEmail("order_created", { orderId: order.orderId, amount: order.amount });
    // The receipt page reads the amounts from here: the backend's status route returns the status only.
    const userId = session?.user.id ?? "";
    const receipt = receiptFromOrder(userId, order, promoValid ? promoCode.trim() : null);
    saveRechargeReceipt(receipt);
    const receiptUrl = `/wallet/orders/${encodeURIComponent(order.orderId)}`;
    set({ step: "paying" });

    const contact = user?.profile?.phoneNumber || (session?.user.phone ? `+${session.user.phone}` : undefined);
    let outcome;
    try {
      outcome = await openCheckout({
        key: order.razorpayKey,
        order_id: order.orderId,
        amount: Math.round(order.amount * 100),
        currency: order.currency || "INR",
        name: "AstroShrine",
        description: t.checkoutDescription(formatCoins(order.pointsToCredit)),
        // Razorpay shows the logo from an https address only.
        image: window.location.protocol === "https:" ? `${window.location.origin}/logo.png` : undefined,
        prefill: {
          name: user?.name || undefined,
          email: user?.profile?.email || session?.user.email || undefined,
          contact,
        },
        theme: { color: brandColor() },
      });
    } catch {
      void cancelRechargeOrder(order.orderId);
      set({ step: "error", message: t.errors.checkoutNotOpened });
      return;
    }

    if (outcome.kind === "closed") {
      // As the app does on a declined or cancelled checkout: cancel the order and send the failure email.
      void cancelRechargeOrder(order.orderId);
      sendPaymentEmail("payment_failed", { orderId: order.orderId, amount: order.amount });
      if (outcome.failed) {
        // A failed attempt gets the order's page, in its failed state (the app opens its "payment failed" screen).
        saveRechargeReceipt({ ...receipt, checkout: { kind: "failed", reason: outcome.reason } });
        handedOver.current = { clearPromo: false };
        router.push(receiptUrl);
        return;
      }
      // Closed without a failed attempt: the note stays here, next to the button to try again.
      set({ step: "closed" });
      return;
    }

    // Razorpay took the payment. The backend checks its signature and credits the points.
    set({ step: "confirming" });
    const { payment } = outcome;
    let confirmed = false;
    try {
      const result = await confirmRecharge(
        {
          razorpayOrderId: payment.razorpay_order_id,
          razorpayPaymentId: payment.razorpay_payment_id,
          razorpaySignature: payment.razorpay_signature,
        },
        timeoutSignal(CONFIRM_TIMEOUT_MS),
      );
      confirmed = !!result?.success;
    } catch {
      // Not final: the order page follows the order until the backend (or its webhook) marks it PAID.
    }
    saveRechargeReceipt({
      ...receipt,
      paymentId: payment.razorpay_payment_id,
      paidAt: Date.now(),
      checkout: { kind: "paid", confirmed },
    });
    if (confirmed) sendPaymentEmail("payment_success", { orderId: order.orderId, amount: order.amount });

    const query = new URLSearchParams({ payment: payment.razorpay_payment_id });
    if (!confirmed) query.set("notify", "1");
    // The receipt has its own URL: refresh-safe, bookmarkable, and the back button returns here.
    handedOver.current = { clearPromo: true };
    router.push(`${receiptUrl}?${query}`);
  }

  return (
    <motion.section
      id="recharge"
      tabIndex={-1}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      aria-labelledby="recharge-title"
      className={`scroll-mt-24 rounded-3xl border border-line bg-surface-card p-4 md:p-6 ${className}`}
    >
      <Script src={RAZORPAY_CHECKOUT_SRC} onReady={() => setCheckout("ready")} onError={() => setCheckout("error")} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="recharge-title" className="heading-6 text-ink">
          {t.title}
        </h2>
        {bonusPct > 0 && (
          <span className="caption-3 rounded-full bg-brand-soft px-2 py-1 text-ink">{t.bonus(bonusPct.toLocaleString("en-IN"))}</span>
        )}
      </div>

      {config.status === "loading" && <TierSkeleton />}

      {config.status === "error" && (
        <div role="alert" className="mt-4 rounded-2xl bg-danger-soft p-4">
          <p className="title-4 flex items-center gap-2 text-danger">
            <PiWarningCircle className="h-5 w-5 shrink-0" aria-hidden />
            {t.configFailed}
          </p>
          <p className="caption-2 mt-1 text-ink-soft">{t.checkInternet}</p>
          <button
            type="button"
            onClick={onRetryConfig}
            className="button-sm mt-3 rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken active:scale-98"
          >
            {t.tryAgain}
          </button>
        </div>
      )}

      {walletConfig && (
        <>
          {!walletOpen && (
            <p role="status" className="caption-2 mt-4 flex items-start gap-2 rounded-2xl bg-warning-soft p-3 text-warning">
              <PiInfo className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {t.rechargePaused}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p id="pack-label" className="title-4 text-ink">
              {t.choosePack}
            </p>
            <p className="caption-5 inline-flex items-center gap-1 text-ink-muted">
              <PiLightning className="h-4 w-4 text-brand-strong" aria-hidden />
              {t.instantCoins}
            </p>
          </div>

          <div role="radiogroup" aria-labelledby="pack-label" className="mt-3 grid grid-cols-3 gap-2">
            {tiers.map((pack, i) => {
              const active = i === selectedIndex;
              const p = pointsFor(walletConfig, pack.inr);
              return (
                <button
                  key={pack.inr}
                  ref={(el) => {
                    tierRefs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  disabled={busy}
                  onClick={() => selectTier(i)}
                  onKeyDown={(e) => onTierKey(e, i)}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center transition active:scale-98 disabled:opacity-60 ${
                    active
                      ? "border-brand bg-surface-sunken"
                      : "border-line bg-surface-card hover:border-line-strong hover:bg-surface-sunken"
                  }`}
                >
                  {pack.label && (
                    <span className="caption-3 absolute -top-2 max-w-full truncate rounded-full bg-surface-inverse px-2 text-brand-on-inverse">
                      {pack.label}
                    </span>
                  )}
                  <span className="title-3 text-ink">{formatRupeesShort(pack.inr)}</span>
                  <span className="caption-5 text-ink-muted">
                    {p.bonus > 0 ? t.withBonus(formatCoins(p.base), formatCoins(p.bonus)) : t.points(formatCoins(p.total))}
                  </span>
                </button>
              );
            })}
          </div>

          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              void applyPromo();
            }}
          >
            <label htmlFor="promo" className="title-4 inline-flex items-center gap-2 text-ink">
              <PiTag className="h-4 w-4 text-brand-strong" aria-hidden />
              {t.havePromo}
            </label>
            <div className="mt-2 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  id="promo"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase().replace(/\s+/g, ""));
                    setPromo(null);
                  }}
                  disabled={busy}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={40}
                  placeholder={t.promoPlaceholder}
                  aria-describedby={promo ? "promo-message" : undefined}
                  aria-invalid={promo ? !promo.valid : undefined}
                  className="body-5 w-full rounded-full border border-line-strong bg-surface-card px-4 py-2 pr-10 text-ink transition placeholder:text-ink-muted hover:border-brand disabled:opacity-60"
                />
                {promoValid && (
                  <PiCheckCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-success" aria-hidden />
                )}
              </div>
              <button
                type="submit"
                disabled={!promoCode.trim() || promoBusy || busy}
                className="button-sm shrink-0 rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken active:scale-98 disabled:opacity-60"
              >
                {promoBusy ? t.checking : t.apply}
              </button>
            </div>
            {promo && (
              <p
                id="promo-message"
                role="status"
                className={`caption-5 mt-2 ${promo.valid ? "text-success" : "text-danger"}`}
              >
                {promo.message || (promo.valid ? t.promoApplied : t.invalidPromo)}
                {promo.valid && Number(promo.discountAmount) > 0 && t.youSave(formatRupeesShort(Number(promo.discountAmount)))}
              </p>
            )}
          </form>

          {tier && price && points && (
            <>
              <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-surface-sunken p-4">
                <dl className="flex flex-col gap-2">
                  <SummaryRow label={t.amount} value={formatRupees(price.amount)} />
                  {price.discount > 0 && (
                    <SummaryRow label={t.promo(promoCode.trim())} value={`−${formatRupees(price.discount)}`} tone="success" />
                  )}
                  <SummaryRow label={t.gst(price.gstPct.toLocaleString("en-IN"))} value={formatRupees(price.gst)} />
                </dl>
                <hr className="border-line-strong" />
                <dl className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="title-4 text-ink">{t.payable}</dt>
                    <dd className="title-2 text-ink">{formatRupees(price.payable)}</dd>
                  </div>
                  <SummaryRow label={t.willBeAdded} value={t.coins(formatCoins(points.total))} />
                </dl>
              </div>

              <button
                type="button"
                onClick={() => void pay()}
                disabled={busy || checkout !== "ready" || !walletOpen}
                aria-busy={busy}
                className="button-md mt-6 flex w-full flex-wrap items-center justify-between gap-2 rounded-full bg-brand px-3 py-2 text-left text-brand-ink transition hover:bg-brand-hover active:scale-98 disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2">
                  <PiWallet className="h-5 w-5 shrink-0" aria-hidden />
                  {busy
                    ? t.processing
                    : checkout === "loading"
                      ? t.loadingCheckout
                      : t.addToWallet(formatRupeesShort(tier.inr))}
                </span>
                {!busy && (
                  <span className="caption-3 rounded-full bg-surface-inverse px-2 py-1 text-brand-on-inverse">
                    {t.points(formatCoins(points.total))}
                  </span>
                )}
              </button>

              <FlowMessage flow={flow} checkoutFailed={checkout === "error"} />

              <p className="caption-5 mt-3 flex items-center justify-center gap-1 text-center text-ink-muted">
                <PiLock className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
                {t.trust}
              </p>
            </>
          )}
        </>
      )}
    </motion.section>
  );
}

function SummaryRow({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="caption-2 min-w-0 truncate text-ink-soft">{label}</dt>
      <dd className={`body-5 shrink-0 ${tone === "success" ? "text-success" : "text-ink"}`}>{value}</dd>
    </div>
  );
}

/** Inline, specific status under the pay button (B9: never an alert box). */
function FlowMessage({ flow, checkoutFailed }: { flow: Flow; checkoutFailed: boolean }) {
  const t = useT(text);

  if (BUSY_STEPS.has(flow.step)) {
    return (
      <p role="status" className="caption-2 mt-3 flex items-center gap-2 text-ink-soft">
        <span aria-hidden className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-brand" />
        {t.busy[flow.step as BusyStep]}
      </p>
    );
  }

  if (flow.step === "closed") {
    return (
      <div role="status" className="mt-3 rounded-2xl bg-neutral-soft p-4">
        <p className="title-4 text-ink">{t.closedTitle}</p>
        <p className="caption-2 mt-1 text-ink-soft">{t.closedBody}</p>
      </div>
    );
  }

  if (flow.step === "error") {
    return (
      <div role="alert" className="mt-3 rounded-2xl bg-danger-soft p-4">
        <p className="title-4 text-danger">{t.errorTitle}</p>
        <p className="caption-2 mt-1 text-ink-soft">{flow.message}</p>
      </div>
    );
  }

  if (checkoutFailed) {
    return (
      <p role="alert" className="caption-2 mt-3 text-danger">
        {t.checkoutScriptFailed}
      </p>
    );
  }

  return null;
}

function TierSkeleton() {
  const t = useT(text);
  return (
    <div aria-busy="true" aria-label={t.loadingPacks} className="mt-4">
      <span className="block h-5 w-32 animate-pulse rounded bg-surface-sunken" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="block h-16 animate-pulse rounded-2xl bg-surface-sunken" />
        ))}
      </div>
      <span className="mt-6 block h-10 animate-pulse rounded-full bg-surface-sunken" />
    </div>
  );
}
