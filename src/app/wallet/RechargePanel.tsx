"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PiCheckCircle, PiInfo, PiLightning, PiLock, PiTag, PiWallet, PiWarningCircle } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";
import { fadeUp } from "@/lib/motion";
import { RAZORPAY_CHECKOUT_SRC, brandColor, isCheckoutLoaded, openCheckout } from "@/lib/services/razorpay";
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

/** Where a payment stands while it is on this page. Once Razorpay reports a payment, the order page takes over. */
type Flow =
  | { step: "idle" }
  | { step: "starting" }
  | { step: "paying" }
  | { step: "confirming" }
  /** Checkout closed without a payment. `failure`: the reason of a failed attempt, if there was one. */
  | { step: "closed"; failure: string | null }
  | { step: "error"; message: string };

const BUSY_STEPS = new Set<Flow["step"]>(["starting", "paying", "confirming"]);

const BUSY_TEXT: Record<string, string> = {
  starting: "भुगतान शुरू हो रहा है",
  paying: "Razorpay विंडो में भुगतान पूरा करें",
  confirming: "भुगतान की पुष्टि हो रही है। यह पेज बंद न करें।",
};

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
    tiers.findIndex((t) => t.inr === amount),
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
      setPromo({ valid: false, message: error instanceof ApiError ? error.message : "अमान्य प्रोमो कोड" });
    } finally {
      setPromoBusy(false);
    }
  }

  async function pay() {
    if (!tier || busy || !walletOpen || inFlight.current) return;
    // Check Checkout before creating an order that could never be paid.
    if (!isCheckoutLoaded()) {
      setFlow({ step: "error", message: "भुगतान विंडो लोड नहीं हो सकी। इंटरनेट जाँचें और पेज रीफ़्रेश करें।" });
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
      set({ step: "error", message: error instanceof ApiError ? error.message : "रिचार्ज शुरू नहीं हो सका। फिर से कोशिश करें।" });
      return;
    }
    if (!order?.orderId || typeof order.razorpayKey !== "string" || !order.razorpayKey) {
      set({ step: "error", message: "भुगतान शुरू नहीं हो सका। कृपया बाद में कोशिश करें।" });
      return;
    }
    sendPaymentEmail("order_created", { orderId: order.orderId, amount: order.amount });
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
        description: `वॉलेट रिचार्ज: ${formatCoins(order.pointsToCredit)} पॉइंट्स`,
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
      set({ step: "error", message: "भुगतान विंडो खुल नहीं सकी। पेज रीफ़्रेश करके फिर कोशिश करें।" });
      return;
    }

    if (outcome.kind === "closed") {
      // As the app does on a declined or cancelled checkout: cancel the order and send the failure email.
      void cancelRechargeOrder(order.orderId);
      sendPaymentEmail("payment_failed", { orderId: order.orderId, amount: order.amount });
      set({ step: "closed", failure: outcome.failure });
      return;
    }

    // Razorpay took the payment. The backend checks its signature and credits the points.
    set({ step: "confirming" });
    const { payment } = outcome;
    let confirmed = false;
    try {
      const result = await confirmRecharge({
        razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
      });
      confirmed = !!result?.success;
    } catch {
      // Not final: the order page follows the order until the backend (or its webhook) marks it.
    }
    if (confirmed) sendPaymentEmail("payment_success", { orderId: order.orderId, amount: order.amount });

    const query = new URLSearchParams({ payment: payment.razorpay_payment_id });
    if (!confirmed) query.set("notify", "1");
    // The receipt has its own URL: refresh-safe, bookmarkable, and the back button returns here.
    router.push(`/wallet/orders/${encodeURIComponent(order.orderId)}?${query}`);
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
          वॉलेट रिचार्ज करें
        </h2>
        {bonusPct > 0 && (
          <span className="caption-3 rounded-full bg-brand-soft px-2 py-1 text-ink">{bonusPct.toLocaleString("en-IN")}% बोनस</span>
        )}
      </div>

      {config.status === "loading" && <TierSkeleton />}

      {config.status === "error" && (
        <div role="alert" className="mt-4 rounded-2xl bg-danger-soft p-4">
          <p className="title-4 flex items-center gap-2 text-danger">
            <PiWarningCircle className="h-5 w-5 shrink-0" aria-hidden />
            रिचार्ज के विकल्प लोड नहीं हो सके
          </p>
          <p className="caption-2 mt-1 text-ink-soft">इंटरनेट जाँचें और फिर से कोशिश करें।</p>
          <button
            type="button"
            onClick={onRetryConfig}
            className="button-sm mt-3 rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken active:scale-98"
          >
            फिर से कोशिश करें
          </button>
        </div>
      )}

      {walletConfig && (
        <>
          {!walletOpen && (
            <p role="status" className="caption-2 mt-4 flex items-start gap-2 rounded-2xl bg-warning-soft p-3 text-warning">
              <PiInfo className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              वॉलेट रिचार्ज अभी बंद है। थोड़ी देर बाद फिर कोशिश करें।
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p id="pack-label" className="title-4 text-ink">
              पैक राशि चुनें
            </p>
            <p className="caption-5 inline-flex items-center gap-1 text-ink-muted">
              <PiLightning className="h-4 w-4 text-brand-strong" aria-hidden />
              भुगतान के तुरंत बाद कॉइन्स जुड़ते हैं
            </p>
          </div>

          <div role="radiogroup" aria-labelledby="pack-label" className="mt-3 grid grid-cols-3 gap-2">
            {tiers.map((t, i) => {
              const active = i === selectedIndex;
              const p = pointsFor(walletConfig, t.inr);
              return (
                <button
                  key={t.inr}
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
                  {t.label && (
                    <span className="caption-3 absolute -top-2 max-w-full truncate rounded-full bg-surface-inverse px-2 text-brand-on-inverse">
                      {t.label}
                    </span>
                  )}
                  <span className="title-3 text-ink">{formatRupeesShort(t.inr)}</span>
                  <span className="caption-5 text-ink-muted">
                    {p.bonus > 0 ? `${formatCoins(p.base)} + ${formatCoins(p.bonus)} बोनस` : `${formatCoins(p.total)} पॉइंट्स`}
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
              प्रोमो कोड है?
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
                  placeholder="प्रोमो कोड दर्ज करें"
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
                {promoBusy ? "जाँच रहे हैं" : "लागू करें"}
              </button>
            </div>
            {promo && (
              <p
                id="promo-message"
                role="status"
                className={`caption-5 mt-2 ${promo.valid ? "text-success" : "text-danger"}`}
              >
                {promo.message || (promo.valid ? "प्रोमो कोड लागू हो गया" : "अमान्य प्रोमो कोड")}
                {promo.valid && Number(promo.discountAmount) > 0 && ` (${formatRupeesShort(Number(promo.discountAmount))} बचाएँ)`}
              </p>
            )}
          </form>

          {tier && price && points && (
            <>
              <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-surface-sunken p-4">
                <dl className="flex flex-col gap-2">
                  <SummaryRow label="राशि" value={formatRupees(price.amount)} />
                  {price.discount > 0 && (
                    <SummaryRow label={`प्रोमो: ${promoCode.trim()}`} value={`−${formatRupees(price.discount)}`} tone="success" />
                  )}
                  <SummaryRow label={`जीएसटी (${price.gstPct.toLocaleString("en-IN")}%)`} value={formatRupees(price.gst)} />
                </dl>
                <hr className="border-line-strong" />
                <dl className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="title-4 text-ink">देय राशि</dt>
                    <dd className="title-2 text-ink">{formatRupees(price.payable)}</dd>
                  </div>
                  <SummaryRow label="वॉलेट में जुड़ेंगे" value={`${formatCoins(points.total)} कॉइन्स`} />
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
                    ? "प्रोसेस हो रहा है"
                    : checkout === "loading"
                      ? "भुगतान विंडो लोड हो रही है"
                      : `वॉलेट में ${formatRupeesShort(tier.inr)} जोड़ें`}
                </span>
                {!busy && (
                  <span className="caption-3 rounded-full bg-surface-inverse px-2 py-1 text-brand-on-inverse">
                    {formatCoins(points.total)} पॉइंट्स
                  </span>
                )}
              </button>

              <FlowMessage flow={flow} checkoutFailed={checkout === "error"} />

              <p className="caption-5 mt-3 flex items-center justify-center gap-1 text-center text-ink-muted">
                <PiLock className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
                Razorpay से सुरक्षित भुगतान · परामर्श और पूजा के लिए मान्य
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
  if (BUSY_STEPS.has(flow.step)) {
    return (
      <p role="status" className="caption-2 mt-3 flex items-center gap-2 text-ink-soft">
        <span aria-hidden className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-brand" />
        {BUSY_TEXT[flow.step]}
      </p>
    );
  }

  if (flow.step === "closed") {
    return flow.failure ? (
      <div role="alert" className="mt-3 rounded-2xl bg-danger-soft p-4">
        <p className="title-4 text-danger">भुगतान असफल रहा</p>
        <p className="caption-2 mt-1 text-ink">{flow.failure}</p>
        <p className="caption-2 mt-1 text-ink-soft">
          अगर आपके खाते से राशि कटी है, तो वह आपके मूल खाते में वापस आ जाएगी। ऊपर का बटन दबाकर फिर कोशिश करें।
        </p>
      </div>
    ) : (
      <div role="status" className="mt-3 rounded-2xl bg-neutral-soft p-4">
        <p className="title-4 text-ink">भुगतान पूरा नहीं हुआ</p>
        <p className="caption-2 mt-1 text-ink-soft">आपने भुगतान विंडो बंद कर दी। तैयार हों तो ऊपर का बटन फिर दबाएँ।</p>
      </div>
    );
  }

  if (flow.step === "error") {
    return (
      <div role="alert" className="mt-3 rounded-2xl bg-danger-soft p-4">
        <p className="title-4 text-danger">रिचार्ज शुरू नहीं हो सका</p>
        <p className="caption-2 mt-1 text-ink-soft">{flow.message}</p>
      </div>
    );
  }

  if (checkoutFailed) {
    return (
      <p role="alert" className="caption-2 mt-3 text-danger">
        Razorpay भुगतान विंडो लोड नहीं हो सकी। इंटरनेट जाँचें और पेज रीफ़्रेश करें।
      </p>
    );
  }

  return null;
}

function TierSkeleton() {
  return (
    <div aria-busy="true" aria-label="रिचार्ज के विकल्प लोड हो रहे हैं" className="mt-4">
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
