"use client";

import { useEffect, useState } from "react";
import { PiMinus, PiPlus, PiShoppingCartSimple, PiTrash } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { contentLang } from "@/lib/services/astrologerModel";
import { getCart, paiseToRupees, productName, removeFromCart, rupee, setCartQuantity, type Cart, type CartLine } from "@/lib/services/store";
import CouponBox from "../CouponBox";
import { BTN_PRIMARY, BTN_SECONDARY, CARD, LoadError, Notice, PAGE, Skeleton, StoreImage, notifyCartChanged, useLoad, useSignedIn } from "../ui";

const text = defineMessages({
  hi: {
    title: "आपका कार्ट",
    empty: "आपका कार्ट खाली है",
    emptyBody: "रत्न, रुद्राक्ष या माला चुनकर यहाँ जोड़ें। यह कार्ट ऐप के कार्ट जैसा ही है।",
    browse: "स्टोर देखें",
    each: "प्रति पीस",
    qty: "मात्रा",
    less: "कम करें",
    more: "बढ़ाएं",
    remove: "हटाएं",
    removeLabel: (name: string) => `${name} को कार्ट से हटाएं`,
    craft: (n: number) => `बनने में ${n} दिन`,
    summary: "ऑर्डर का सार",
    subtotal: (n: number) => `सब-टोटल (${n} आइटम)`,
    couponDiscount: (code: string) => `कूपन ${code}`,
    shipping: "शिपिंग",
    free: "मुफ़्त",
    freeAbove: (amount: string) => `${amount} से ऊपर शिपिंग मुफ़्त`,
    total: "कुल",
    checkout: "चेकआउट पर जाएं",
    couponRemoved: (code: string, why: string) => `कूपन ${code} हटा दिया गया: ${why}`,
    actionFailed: "कार्ट बदला नहीं जा सका। फिर कोशिश करें।",
    loading: "कार्ट लोड हो रहा है",
  },
  en: {
    title: "Your cart",
    empty: "Your cart is empty",
    emptyBody: "Pick a gemstone, rudraksha or mala and it will show up here. This is the same cart as in the app.",
    browse: "Browse the store",
    each: "each",
    qty: "Quantity",
    less: "Decrease",
    more: "Increase",
    remove: "Remove",
    removeLabel: (name) => `Remove ${name} from the cart`,
    craft: (n) => `Takes ${n} days to make`,
    summary: "Order summary",
    subtotal: (n) => (n === 1 ? "Subtotal (1 item)" : `Subtotal (${n} items)`),
    couponDiscount: (code) => `Coupon ${code}`,
    shipping: "Shipping",
    free: "Free",
    freeAbove: (amount) => `Free shipping above ${amount}`,
    total: "Total",
    checkout: "Go to checkout",
    couponRemoved: (code, why) => `Coupon ${code} was removed: ${why}`,
    actionFailed: "The cart could not be changed. Try again.",
    loading: "Loading your cart",
  },
});

export default function CartView() {
  const t = useT(text);
  const ready = useSignedIn();
  const { state, retry, update } = useLoad(getCart, ready);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === "ready") notifyCartChanged();
  }, [state]);

  async function change(productId: string, action: () => Promise<unknown>) {
    setBusyId(productId);
    setError(null);
    try {
      await action();
      update(await getCart());
    } catch (e) {
      setError(e instanceof ApiError && e.message ? e.message : t.actionFailed);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={PAGE}>
      <h1 className="heading-4 text-ink md:heading-3">{t.title}</h1>
      <div className="mt-6">
        {(!ready || state.status === "loading") && <CartSkeleton />}
        {ready && state.status === "error" && <LoadError error={state.error} onRetry={retry} />}
        {ready && state.status === "ready" &&
          (state.data.items.length === 0 ? (
            <div className={`${CARD} flex flex-col items-center gap-3 p-10 text-center`}>
              <PiShoppingCartSimple className="h-10 w-10 text-ink-muted" aria-hidden />
              <p className="title-3 text-ink">{t.empty}</p>
              <p className="body-6 max-w-md text-ink-soft">{t.emptyBody}</p>
              <Link href="/store?tab=gems" className={BTN_PRIMARY}>
                {t.browse}
              </Link>
            </div>
          ) : (
            <Filled cart={state.data} busyId={busyId} error={error} change={change} onCoupon={async () => update(await getCart())} />
          ))}
      </div>
    </div>
  );
}

function Filled({
  cart,
  busyId,
  error,
  change,
  onCoupon,
}: {
  cart: Cart;
  busyId: string | null;
  error: string | null;
  change: (productId: string, action: () => Promise<unknown>) => Promise<void>;
  onCoupon: () => Promise<void>;
}) {
  const t = useT(text);
  const discount = cart.coupon ? paiseToRupees(cart.coupon.discount) : 0;
  const total = Math.max(0, cart.total - discount);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      <div className="flex flex-col gap-4 lg:col-span-7">
        {cart.coupon_removed && <Notice tone="warning" title={t.couponRemoved(cart.coupon_removed.code, cart.coupon_removed.message)} />}
        {error && <Notice tone="danger" title={error} />}
        <ul className="flex flex-col gap-3">
          {cart.items.map((l) => (
            <Line key={l.product_id} line={l} busy={busyId === l.product_id} change={change} />
          ))}
        </ul>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:col-span-5">
        <CouponBox channel="stone" applied={cart.coupon ?? null} onChange={() => void onCoupon()} />
        <section aria-labelledby="cart-sum" className={`${CARD} p-4 md:p-6`}>
          <h2 id="cart-sum" className="heading-6 text-ink">
            {t.summary}
          </h2>
          <dl className="mt-3 space-y-2">
            <div className="flex justify-between">
              <dt className="body-6 text-ink-soft">{t.subtotal(cart.itemCount)}</dt>
              <dd className="title-5 text-ink">{rupee(cart.subtotal)}</dd>
            </div>
            {cart.coupon && discount > 0 && (
              <div className="flex justify-between text-success">
                <dt className="body-6">{t.couponDiscount(cart.coupon.code)}</dt>
                <dd className="title-5">-{rupee(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="body-6 text-ink-soft">{t.shipping}</dt>
              <dd className="title-5 text-ink">{cart.shipping > 0 ? rupee(cart.shipping) : t.free}</dd>
            </div>
            {cart.shipping > 0 && cart.free_shipping_above > 0 && <p className="caption-4 text-ink-muted">{t.freeAbove(rupee(cart.free_shipping_above))}</p>}
            <div className="flex justify-between border-t border-line pt-2">
              <dt className="title-4 text-ink">{t.total}</dt>
              <dd className="title-3 text-ink">{rupee(total)}</dd>
            </div>
          </dl>
          <Link href="/store/checkout" className={`${BTN_PRIMARY} mt-4 w-full`}>
            {t.checkout}
          </Link>
        </section>
      </aside>
    </div>
  );
}

function Line({ line: l, busy, change }: { line: CartLine; busy: boolean; change: (productId: string, action: () => Promise<unknown>) => Promise<void> }) {
  const t = useT(text);
  const locale = useLocale();
  const p = l.product;
  const name = p ? productName(locale, p) : l.product_id;
  const price = Number(l.unit_price ?? p?.price ?? 0);
  const label = l.selection_label && l.selection_label !== "Loose stone" ? l.selection_label : "";
  const qty = Number(l.quantity) || 1;
  return (
    <li className={`${CARD} flex gap-3 p-3 md:gap-4 md:p-4 ${busy ? "opacity-60" : ""}`} aria-busy={busy}>
      <Link href={`/store/products/${encodeURIComponent(l.product_id)}`} className="shrink-0">
        <StoreImage src={p?.image_url || p?.images?.[0]} alt="" className="h-20 w-20 rounded-xl md:h-24 md:w-24" sizes="96px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link href={`/store/products/${encodeURIComponent(l.product_id)}`} lang={contentLang(name)} className="title-4 line-clamp-2 text-ink hover:underline">
          {name}
        </Link>
        {label && <p className="caption-3 text-ink-soft">{label}</p>}
        {Number(l.crafting_days) > 0 && <p className="caption-4 text-ink-muted">{t.craft(Number(l.crafting_days))}</p>}
        <p className="title-5 text-ink">
          {rupee(price)} <span className="caption-4 text-ink-muted">{t.each}</span>
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <div role="group" aria-label={t.qty} className="inline-flex items-center rounded-xl border border-line-strong">
            <button type="button" disabled={busy} aria-label={t.less} onClick={() => change(l.product_id, () => (qty <= 1 ? removeFromCart(l.product_id) : setCartQuantity(l.product_id, qty - 1)))} className="grid h-9 w-9 place-items-center text-ink hover:bg-surface-sunken">
              <PiMinus className="h-4 w-4" aria-hidden />
            </button>
            <span className="title-5 min-w-8 text-center text-ink" aria-live="polite">
              {qty}
            </span>
            <button type="button" disabled={busy} aria-label={t.more} onClick={() => change(l.product_id, () => setCartQuantity(l.product_id, qty + 1))} className="grid h-9 w-9 place-items-center text-ink hover:bg-surface-sunken">
              <PiPlus className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <button type="button" disabled={busy} aria-label={t.removeLabel(name)} onClick={() => change(l.product_id, () => removeFromCart(l.product_id))} className={`${BTN_SECONDARY} !px-3 !py-2`}>
            <PiTrash className="h-4 w-4" aria-hidden />
            {t.remove}
          </button>
          <p className="title-4 ml-auto text-ink">{rupee(Number(l.line_total ?? price * qty))}</p>
        </div>
      </div>
    </li>
  );
}

function CartSkeleton() {
  const t = useT(text);
  return (
    <div role="status" aria-label={t.loading} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-3 lg:col-span-7">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-72 w-full lg:col-span-5" />
    </div>
  );
}
