"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PiArrowLeft, PiCheckCircle, PiCircle, PiTruck } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { contentLang } from "@/lib/services/astrologerModel";
import { formatDate, getProductOrder, rupee, type ProductOrder } from "@/lib/services/store";
import StatusBadge from "../../StatusBadge";
import { orderStatus } from "../../status";
import { BTN_SECONDARY, CARD, LoadError, Notice, PAGE, Skeleton, StoreImage, useLoad, useSignedIn } from "../../ui";

const POLL_MS = 4000;
const POLL_MAX = 8;

const text = defineMessages({
  hi: {
    back: "मेरे ऑर्डर",
    title: (id: string) => `ऑर्डर ${id}`,
    placed: (d: string) => `${d} को किया गया`,
    notFound: "यह ऑर्डर नहीं मिला",
    notFoundBody: "हो सकता है लिंक गलत हो, या यह ऑर्डर किसी दूसरे account का हो।",
    paidTitle: "भुगतान सफल, ऑर्डर मिल गया",
    paidBody: "हम आपके ऑर्डर पर काम शुरू कर रहे हैं। भेजे जाने पर ट्रैकिंग यहाँ दिखेगी।",
    pendingTitle: "भुगतान की पुष्टि हो रही है",
    pendingBody: "आपका भुगतान मिल गया है, पुष्टि में थोड़ा समय लग रहा है। यह पेज अपने-आप जाँचता रहेगा। दोबारा भुगतान न करें।",
    stillPending: "अब भी पुष्टि नहीं आई। कुछ देर बाद फिर देखें, या सपोर्ट से संपर्क करें।",
    checkAgain: "स्थिति फिर देखें",
    unpaidTitle: "इस ऑर्डर का भुगतान पूरा नहीं हुआ",
    unpaidBody: "कोई पैसा नहीं कटा। चाहें तो स्टोर से फिर ऑर्डर करें।",
    progress: "ऑर्डर की स्थिति",
    steps: { confirmed: "कन्फर्म", shipped: "भेजा गया", delivered: "डिलीवर हुआ" },
    cancelled: (d: string) => `ऑर्डर रद्द ${d}`,
    delivery: "डिलीवरी",
    courier: "कूरियर",
    tracking: "ट्रैकिंग नंबर",
    track: "ऑर्डर ट्रैक करें",
    eta: "अनुमानित डिलीवरी",
    items: "आइटम",
    qty: (n: number) => `मात्रा ${n}`,
    address: "डिलीवरी का पता",
    payment: "भुगतान",
    total: "कुल भुगतान",
    paymentId: "पेमेंट आईडी",
    returns: "वापसी / बदलाव",
    returnsBody: "वापसी या बदलाव का अनुरोध अभी ऐप से किया जा सकता है।",
    loading: "ऑर्डर लोड हो रहा है",
  },
  en: {
    back: "My orders",
    title: (id) => `Order ${id}`,
    placed: (d) => `Placed ${d}`,
    notFound: "This order was not found",
    notFoundBody: "The link may be wrong, or the order may belong to another account.",
    paidTitle: "Payment received, order placed",
    paidBody: "We are getting your order ready. Tracking appears here once it ships.",
    pendingTitle: "Confirming your payment",
    pendingBody: "Your payment went through and the confirmation is taking a little while. This page keeps checking. Please do not pay again.",
    stillPending: "Still not confirmed. Check again in a little while, or contact support.",
    checkAgain: "Check again",
    unpaidTitle: "Payment for this order was not completed",
    unpaidBody: "No money was taken. You can order again from the store.",
    progress: "Order progress",
    steps: { confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered" },
    cancelled: (d) => `Order cancelled ${d}`,
    delivery: "Delivery",
    courier: "Courier",
    tracking: "Tracking number",
    track: "Track the order",
    eta: "Estimated delivery",
    items: "Items",
    qty: (n) => `Qty ${n}`,
    address: "Delivery address",
    payment: "Payment",
    total: "Total paid",
    paymentId: "Payment ID",
    returns: "Returns and exchanges",
    returnsBody: "Return or exchange requests can be made from the app for now.",
    loading: "Loading the order",
  },
});

export default function OrderDetail({ orderId }: { orderId: string }) {
  const t = useT(text);
  const ready = useSignedIn();
  const justPaid = useSearchParams().get("paid");
  const { state, retry, update } = useLoad((signal) => getProductOrder(orderId, signal), ready, [orderId]);
  const [polls, setPolls] = useState(0);

  const order = state.status === "ready" ? state.data : null;
  const unconfirmed = justPaid === "pending" && order && (order.payment_status || "").toLowerCase() !== "paid";

  // A payment Razorpay took but the backend has not settled yet: look again for about half a minute.
  useEffect(() => {
    if (!unconfirmed || polls >= POLL_MAX) return;
    const timer = window.setTimeout(async () => {
      setPolls((n) => n + 1);
      try {
        update(await getProductOrder(orderId));
      } catch {
        /* keep what is shown */
      }
    }, POLL_MS);
    return () => window.clearTimeout(timer);
  }, [unconfirmed, order, orderId, update, polls]);

  return (
    <div className={`${PAGE} max-w-4xl`}>
      <Link href="/store/orders" className="button-sm inline-flex items-center gap-2 text-ink-soft hover:text-ink">
        <PiArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </Link>
      <div className="mt-4">
        {(!ready || state.status === "loading") && (
          <div role="status" aria-label={t.loading}>
            <Skeleton className="h-96 w-full" />
          </div>
        )}
        {ready && state.status === "error" &&
          (state.error instanceof ApiError && (state.error.status === 404 || state.error.status === 403) ? <Notice title={t.notFound} body={t.notFoundBody} /> : <LoadError error={state.error} onRetry={retry} />)}
        {order && (
          <Body
            order={order}
            banner={
              justPaid === "1" ? (
                <Notice tone="success" title={t.paidTitle} body={t.paidBody} />
              ) : unconfirmed ? (
                <Notice tone="warning" title={t.pendingTitle} body={polls >= POLL_MAX ? t.stillPending : t.pendingBody}>
                  <button type="button" onClick={retry} className={`${BTN_SECONDARY} !px-3 !py-2`}>
                    {t.checkAgain}
                  </button>
                </Notice>
              ) : null
            }
          />
        )}
      </div>
    </div>
  );
}

function Body({ order: o, banner }: { order: ProductOrder; banner: React.ReactNode }) {
  const t = useT(text);
  const status = orderStatus(o);
  const paid = (o.payment_status || "").toLowerCase() === "paid";
  const cancelled = (o.order_status || "").toLowerCase() === "cancelled";
  const items = o.product_order_items ?? [];
  const a = o.shipping_address;
  const reached = o.delivered_at ? 3 : o.shipped_at || (o.order_status || "").toLowerCase() === "shipped" ? 2 : paid ? 1 : 0;
  const steps = [t.steps.confirmed, t.steps.shipped, t.steps.delivered];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="heading-5 text-ink md:heading-4">{t.title(o.id.slice(0, 8).toUpperCase())}</h1>
          <p className="caption-2 text-ink-muted">{t.placed(formatDate(o.created_at))}</p>
        </div>
        <StatusBadge status={status} />
      </header>

      {banner}
      {!paid && !banner && !cancelled && <Notice tone="warning" title={t.unpaidTitle} body={t.unpaidBody} />}

      {paid && !cancelled && (
        <section aria-labelledby="progress" className={`${CARD} p-4 md:p-6`}>
          <h2 id="progress" className="heading-6 text-ink">
            {t.progress}
          </h2>
          <ol className="mt-4 grid grid-cols-3 gap-2">
            {steps.map((label, i) => {
              const done = reached > i;
              return (
                <li key={label} aria-current={reached === i + 1 ? "step" : undefined} className="flex flex-col items-center gap-1 text-center">
                  {done ? <PiCheckCircle className="h-6 w-6 text-success" aria-hidden /> : <PiCircle className="h-6 w-6 text-ink-muted" aria-hidden />}
                  <span className={`caption-3 ${done ? "text-ink" : "text-ink-muted"}`}>{label}</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
      {cancelled && <Notice title={t.cancelled(formatDate(o.cancelled_at))} />}

      {(o.courier_name || o.tracking_number || o.estimated_delivery_date) && (
        <section aria-labelledby="delivery" className={`${CARD} p-4 md:p-6`}>
          <h2 id="delivery" className="heading-6 flex items-center gap-2 text-ink">
            <PiTruck className="h-5 w-5" aria-hidden />
            {t.delivery}
          </h2>
          <dl className="mt-3 max-w-md space-y-2">
            {o.courier_name && <Row label={t.courier} value={o.courier_name} />}
            {o.tracking_number && <Row label={t.tracking} value={o.tracking_number} />}
            {o.estimated_delivery_date && <Row label={t.eta} value={formatDate(o.estimated_delivery_date)} />}
          </dl>
          {o.tracking_url && /^https?:\/\//i.test(o.tracking_url) && (
            <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className={`${BTN_SECONDARY} mt-3 !px-4 !py-2`}>
              {t.track}
            </a>
          )}
        </section>
      )}

      <section aria-labelledby="items" className={`${CARD} p-4 md:p-6`}>
        <h2 id="items" className="heading-6 text-ink">
          {t.items}
        </h2>
        <ul className="mt-3 flex flex-col gap-3">
          {items.map((i) => (
            <li key={i.id ?? i.product_id} className="flex items-center gap-3">
              <StoreImage src={i.products?.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl" sizes="64px" />
              <div className="min-w-0 flex-1">
                <Link href={`/store/products/${encodeURIComponent(i.product_id)}`} lang={contentLang(i.products?.name)} className="title-5 line-clamp-2 text-ink hover:underline">
                  {i.products?.name ?? i.product_id}
                </Link>
                <p className="caption-4 text-ink-muted">{t.qty(Number(i.quantity) || 1)}</p>
              </div>
              <p className="title-5 text-ink">{rupee(Number(i.price) * (Number(i.quantity) || 1))}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {a && (
          <section aria-labelledby="addr" className={`${CARD} p-4 md:p-6`}>
            <h2 id="addr" className="heading-6 text-ink">
              {t.address}
            </h2>
            <address className="body-6 mt-2 not-italic text-ink-soft">
              <strong className="text-ink">{a.name}</strong>
              <br />
              {a.address}
              <br />
              {[a.city, a.state, a.pincode].filter(Boolean).join(", ")}
              <br />
              {a.phone}
            </address>
          </section>
        )}
        <section aria-labelledby="pay" className={`${CARD} p-4 md:p-6`}>
          <h2 id="pay" className="heading-6 text-ink">
            {t.payment}
          </h2>
          <dl className="mt-3 space-y-2">
            <Row label={t.total} value={rupee(Number(o.total_amount))} strong />
            {o.razorpay_payment_id && <Row label={t.paymentId} value={o.razorpay_payment_id} />}
          </dl>
        </section>
      </div>
      <p className="caption-3 text-ink-muted">
        {t.returns}: {t.returnsBody}
      </p>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="caption-2 text-ink-muted">{label}</dt>
      <dd className={`${strong ? "title-4" : "title-5"} break-all text-right text-ink`}>{value}</dd>
    </div>
  );
}
