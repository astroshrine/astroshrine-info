"use client";

import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  PiArrowLeft,
  PiCheck,
  PiCheckCircle,
  PiCopy,
  PiHourglassMedium,
  PiInfo,
  PiWarningCircle,
  PiXCircle,
} from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";
import { fadeUp, stagger } from "@/lib/motion";
import {
  formatCoins,
  formatDateTime,
  formatRupees,
  getRechargeOrder,
  sendPaymentEmail,
  type RechargeMeta,
  type RechargeOrderState,
} from "@/lib/services/wallet";
import { currentLocation, setQueryParam } from "../../url";

// The app checks the order every 2 s, 31 times (about a minute), then says the payment is on its way.
const POLL_INTERVAL_MS = 2000;
const POLL_CHECKS = 31;

type Phase =
  | { kind: "loading" }
  | { kind: "ready"; order: RechargeOrderState; watching: boolean }
  | { kind: "notFound" }
  | { kind: "error" };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * When the wallet page could not confirm the payment itself (?notify=1), the outcome email the app
 * sends is sent here, once, as soon as the order settles. The flag then leaves the URL so a refresh
 * does not send it again.
 */
function sendOutcomeEmailOnce(orderId: string, status: string, amount: number) {
  if (new URLSearchParams(window.location.search).get("notify") !== "1") return;
  if (status === "PAID") sendPaymentEmail("payment_success", { orderId, amount });
  else if (status === "FAILED" || status === "CANCELLED") sendPaymentEmail("payment_failed", { orderId, amount });
  setQueryParam("notify", null, "replace");
}

/**
 * /wallet/orders/<razorpay order id>: the result of a recharge, with its own URL. Opened right after
 * checkout (?payment=<id>), it follows the order until the backend or its Razorpay webhook marks it,
 * so a refresh or a slow confirmation never loses the result. Also reachable from a recharge in the
 * transaction list.
 */
export default function OrderStatus({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "signedOut") router.replace(`/login?next=${encodeURIComponent(currentLocation())}`);
  }, [status, router]);

  if (status !== "signedIn") return <OrderSkeleton />;
  return <SignedInOrder orderId={orderId} />;
}

function SignedInOrder({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  // Razorpay's payment id, present when the user paid on this site a moment ago.
  const paymentParam = searchParams.get("payment");
  const { refresh } = useAuth();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function follow() {
      for (let check = 0; check < POLL_CHECKS; check++) {
        let order: RechargeOrderState;
        try {
          order = await getRechargeOrder(orderId, controller.signal);
        } catch (error) {
          if (controller.signal.aborted) return;
          // The backend answers 403 for an order that is not this account's, or does not exist.
          if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
            setPhase({ kind: "notFound" });
            return;
          }
          if (check === 0) {
            setPhase({ kind: "error" });
            return;
          }
          await sleep(POLL_INTERVAL_MS);
          continue;
        }
        if (controller.signal.aborted) return;

        const status = String(order.status || "").toUpperCase();
        const waiting = status === "CREATED" && !!paymentParam;
        setPhase({ kind: "ready", order, watching: waiting });

        if (status !== "CREATED") {
          if (status === "PAID") void refresh();
          sendOutcomeEmailOnce(orderId, status, Number(order.amount) || 0);
          return;
        }
        if (!waiting) return;
        await sleep(POLL_INTERVAL_MS);
      }
      // Still not marked after a minute: Razorpay has the money, the webhook will credit it.
      if (!controller.signal.aborted) {
        setPhase((p) => (p.kind === "ready" ? { ...p, watching: false } : p));
      }
    }

    void follow();
    return () => controller.abort();
  }, [orderId, paymentParam, attempt, refresh]);

  const checkAgain = () => {
    setPhase({ kind: "loading" });
    setAttempt((n) => n + 1);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 md:px-8 md:pt-10">
      <Link
        href="/wallet"
        className="button-sm inline-flex items-center gap-2 rounded-full px-3 py-2 text-ink-soft transition hover:bg-surface-sunken hover:text-ink active:scale-98"
      >
        <PiArrowLeft className="h-4 w-4" aria-hidden />
        वॉलेट पर वापस जाएँ
      </Link>

      <h1 className="heading-4 mt-4 text-ink md:heading-3">रिचार्ज रसीद</h1>

      {phase.kind === "loading" && <OrderSkeletonBody />}

      {phase.kind === "error" && (
        <Notice tone="danger" icon={PiWarningCircle} title="स्थिति लोड नहीं हो सकी" body="इंटरनेट जाँचें और फिर से कोशिश करें।">
          <button type="button" onClick={checkAgain} className={SECONDARY_BUTTON}>
            फिर से कोशिश करें
          </button>
        </Notice>
      )}

      {phase.kind === "notFound" && (
        <Notice
          tone="neutral"
          icon={PiInfo}
          title="यह ऑर्डर नहीं मिला"
          body="हो सकता है लिंक गलत हो, या यह ऑर्डर किसी दूसरे account का हो।"
        >
          <Link href="/wallet" className={PRIMARY_BUTTON}>
            वॉलेट पर जाएँ
          </Link>
        </Notice>
      )}

      {phase.kind === "ready" && (
        <Receipt order={phase.order} orderId={orderId} watching={phase.watching} paymentParam={paymentParam} onCheckAgain={checkAgain} />
      )}
    </div>
  );
}

const PRIMARY_BUTTON =
  "button-sm inline-flex items-center justify-center rounded-full bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover active:scale-98";
const SECONDARY_BUTTON =
  "button-sm inline-flex items-center justify-center rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken active:scale-98";

function Receipt({
  order,
  orderId,
  watching,
  paymentParam,
  onCheckAgain,
}: {
  order: RechargeOrderState;
  orderId: string;
  watching: boolean;
  paymentParam: string | null;
  onCheckAgain: () => void;
}) {
  const status = String(order.status || "").toUpperCase();
  const details = Array.isArray(order.paymentDetails) ? order.paymentDetails : [];
  const meta: RechargeMeta = details.find((d) => d?.type === "WALLET_RECHARGE") ?? details[0] ?? {};
  const paymentId = details.find((d) => d?.paymentId)?.paymentId ?? paymentParam;
  const paidAt = details.find((d) => d?.paymentId && d.timestamp)?.timestamp ?? order.createTs;
  const total = Number(meta.totalPayable ?? order.amount) || 0;
  const coins = Number(meta.pointsToCredit) || 0;
  const bonus = Number(meta.bonusPoints) || 0;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start md:gap-8">
      <motion.section variants={fadeUp} aria-live="polite" className="rounded-3xl border border-line bg-surface-card p-6 md:p-8">
        <StatusHero status={status} watching={watching} paid={!!paymentParam} total={total} coins={coins} />
        {paidAt ? <p className="caption-5 mt-2 text-center text-ink-muted">{formatDateTime(paidAt)}</p> : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {status === "PAID" && (
            <>
              <Link href="/wallet" className={PRIMARY_BUTTON}>
                वॉलेट देखें
              </Link>
              <Link href="/wallet#recharge" className={SECONDARY_BUTTON}>
                एक और रिचार्ज करें
              </Link>
            </>
          )}
          {status === "CREATED" && paymentParam && !watching && (
            <button type="button" onClick={onCheckAgain} className={PRIMARY_BUTTON}>
              स्थिति फिर देखें
            </button>
          )}
          {(status === "FAILED" || status === "CANCELLED" || (status === "CREATED" && !paymentParam)) && (
            <Link href="/wallet#recharge" className={PRIMARY_BUTTON}>
              फिर से रिचार्ज करें
            </Link>
          )}
        </div>
      </motion.section>

      <motion.section variants={fadeUp} aria-labelledby="breakdown-title" className="rounded-3xl border border-line bg-surface-card p-6 md:p-8">
        <h2 id="breakdown-title" className="heading-6 text-ink">
          विवरण
        </h2>
        <dl className="mt-4 flex flex-col gap-2">
          {meta.originalAmount != null && <Row label="रिचार्ज राशि" value={formatRupees(Number(meta.originalAmount))} />}
          {Number(meta.discountAmount) > 0 && (
            <Row
              label={meta.promoCode ? `प्रोमो: ${meta.promoCode}` : "प्रोमो छूट"}
              value={`−${formatRupees(Number(meta.discountAmount))}`}
              tone="success"
            />
          )}
          {meta.gstAmount != null && (
            <Row
              label={meta.gstPct != null ? `जीएसटी (${Number(meta.gstPct).toLocaleString("en-IN")}%)` : "जीएसटी"}
              value={formatRupees(Number(meta.gstAmount))}
            />
          )}
        </dl>
        <hr className="my-4 border-line" />
        <dl className="flex flex-col gap-2">
          <Row label="कुल भुगतान" value={formatRupees(total)} strong />
          {coins > 0 && (
            <Row
              label={status === "PAID" ? "जोड़े गए कॉइन्स" : "जुड़ने वाले कॉइन्स"}
              value={`${formatCoins(coins)} कॉइन्स${bonus > 0 ? ` (${formatCoins(bonus)} बोनस सहित)` : ""}`}
            />
          )}
        </dl>

        <h3 className="title-4 mt-6 text-ink">भुगतान की जानकारी</h3>
        <dl className="mt-2 flex flex-col">
          <CopyRow label="ऑर्डर आईडी" value={orderId} />
          {paymentId && <CopyRow label="पेमेंट आईडी" value={paymentId} />}
        </dl>
      </motion.section>
    </motion.div>
  );
}

function StatusHero({
  status,
  watching,
  paid,
  total,
  coins,
}: {
  status: string;
  watching: boolean;
  paid: boolean;
  total: number;
  coins: number;
}) {
  if (status === "PAID") {
    return (
      <Hero
        icon={PiCheckCircle}
        tone="success"
        title="भुगतान सफल"
        amount={formatRupees(total)}
        body={coins > 0 ? `${formatCoins(coins)} कॉइन्स आपके वॉलेट में जुड़ गए।` : "रिचार्ज आपके वॉलेट में जुड़ गया।"}
      />
    );
  }
  if (status === "CREATED" && paid) {
    return watching ? (
      <Hero
        icon={PiHourglassMedium}
        tone="neutral"
        title="भुगतान की पुष्टि हो रही है"
        amount={formatRupees(total)}
        body="Razorpay से भुगतान मिल गया है। कॉइन्स जोड़े जा रहे हैं, इसमें कुछ पल लग सकते हैं।"
        pulse
      />
    ) : (
      <Hero
        icon={PiHourglassMedium}
        tone="neutral"
        title="भुगतान प्राप्त हुआ"
        amount={formatRupees(total)}
        body="आपका भुगतान हो गया है। कॉइन्स कुछ ही मिनटों में आपके वॉलेट में दिख जाएँगे। दोबारा भुगतान न करें।"
      />
    );
  }
  if (status === "FAILED") {
    return (
      <Hero
        icon={PiXCircle}
        tone="danger"
        title="भुगतान असफल"
        amount={formatRupees(total)}
        body="यह भुगतान पूरा नहीं हो सका। अगर आपके खाते से राशि कटी है, तो वह आपके मूल खाते में वापस आ जाएगी।"
      />
    );
  }
  if (status === "CANCELLED") {
    return (
      <Hero icon={PiInfo} tone="neutral" title="भुगतान रद्द हुआ" amount={formatRupees(total)} body="इस ऑर्डर का भुगतान नहीं हुआ, कोई कॉइन्स नहीं जुड़े।" />
    );
  }
  return (
    <Hero
      icon={PiInfo}
      tone="neutral"
      title="भुगतान पूरा नहीं हुआ"
      amount={formatRupees(total)}
      body="इस ऑर्डर का भुगतान अभी नहीं हुआ है। रिचार्ज के लिए नया भुगतान शुरू करें।"
    />
  );
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
  pulse = false,
}: {
  icon: IconType;
  tone: keyof typeof TONE;
  title: string;
  amount: string;
  body: string;
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
      <p className="heading-3 text-ink">{amount}</p>
      <p className="body-6 max-w-sm text-ink-soft">{body}</p>
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
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 odd:bg-surface-sunken">
      <dt className="caption-2 shrink-0 text-ink-soft">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <span className="body-5 truncate text-ink">{value}</span>
        <button
          type="button"
          aria-label={`${label} कॉपी करें`}
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
          {copied ? `${label} कॉपी हो गया` : ""}
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
  return (
    <div aria-busy="true" aria-label="रसीद लोड हो रही है" className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
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
