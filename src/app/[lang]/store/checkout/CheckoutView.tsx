"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PiArrowLeft } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { contentLang } from "@/lib/services/astrologerModel";
import { brandColor, isCheckoutLoaded, openCheckout } from "@/lib/services/razorpay";
import { sendPaymentEmail } from "@/lib/services/wallet";
import {
  clearCart,
  createProductOrder,
  getCart,
  getProduct,
  lineSelectionOf,
  markProductPaymentFailed,
  paiseToRupees,
  productCheckoutKey,
  productName,
  rupee,
  unitPrice,
  verifyProductPayment,
  type AppliedCoupon,
  type OrderLineInput,
  type Product,
  type Selection,
  type ShippingAddress,
} from "@/lib/services/store";
import CouponBox from "../CouponBox";
import PaymentScript, { type ScriptState } from "../PaymentScript";
import { BTN_PRIMARY, CARD, FIELD, LoadError, Notice, PAGE, Skeleton, StoreImage, notifyCartChanged, useLoad, useSignedIn } from "../ui";

const text = defineMessages({
  hi: {
    back: "वापस",
    title: "चेकआउट",
    delivery: "डिलीवरी का पता",
    name: "पूरा नाम",
    mobile: "मोबाइल नंबर",
    email: "ईमेल",
    address: "पता (मकान, गली, इलाका)",
    city: "शहर",
    state: "राज्य",
    pincode: "पिन कोड",
    summary: "ऑर्डर का सार",
    qty: (n: number) => `मात्रा ${n}`,
    subtotal: "सब-टोटल",
    discount: (code: string) => `कूपन ${code}`,
    shipping: "शिपिंग",
    free: "मुफ़्त",
    shippingNote: "अगर शिपिंग शुल्क है तो वह भुगतान के समय जुड़ेगा।",
    total: "देय राशि",
    pay: (amount: string) => `${amount} चुकाएं`,
    starting: "ऑर्डर बन रहा है",
    paying: "Razorpay विंडो में भुगतान पूरा करें",
    confirming: "भुगतान की पुष्टि हो रही है। पेज खुला रखें।",
    loadingCheckout: "भुगतान विंडो लोड हो रही है",
    trust: "Razorpay से सुरक्षित भुगतान",
    emptyTitle: "चेकआउट के लिए कुछ नहीं है",
    emptyBody: "पहले कार्ट में कुछ जोड़ें।",
    toStore: "स्टोर देखें",
    gone: "यह उत्पाद नहीं मिला",
    errors: {
      required: "यह जानकारी ज़रूरी है",
      phone: "10 अंकों का मोबाइल नंबर डालें",
      email: "सही ईमेल डालें",
      pincode: "6 अंकों का पिन कोड डालें",
      fix: "ऊपर लाल रंग की जानकारी ठीक करें।",
      scriptFailed: "भुगतान विंडो लोड नहीं हो सकी। इंटरनेट जाँचें और पेज रीफ़्रेश करें।",
      notStarted: "ऑर्डर नहीं बन सका। फिर से कोशिश करें।",
      noKey: "ऑनलाइन भुगतान अभी वेबसाइट पर चालू नहीं है। कृपया ऐप से ऑर्डर करें या बाद में कोशिश करें।",
      notOpened: "भुगतान विंडो खुल नहीं सकी। पेज रीफ़्रेश करके फिर कोशिश करें।",
    },
    closedTitle: "भुगतान पूरा नहीं हुआ",
    closedBody: "आपने भुगतान विंडो बंद कर दी। कोई पैसा नहीं कटा। तैयार हों तो फिर से बटन दबाएँ।",
    failedTitle: "भुगतान सफल नहीं हुआ",
    failedBody: "आपका पैसा सुरक्षित है; अगर कट गया हो तो कुछ दिनों में वापस आ जाएगा। फिर से कोशिश करें।",
    checkoutDescription: "AstroShrine उत्पाद खरीद",
    loading: "चेकआउट लोड हो रहा है",
  },
  en: {
    back: "Back",
    title: "Checkout",
    delivery: "Delivery address",
    name: "Full name",
    mobile: "Mobile number",
    email: "Email",
    address: "Address (house, street, area)",
    city: "City",
    state: "State",
    pincode: "Pincode",
    summary: "Order summary",
    qty: (n) => `Qty ${n}`,
    subtotal: "Subtotal",
    discount: (code) => `Coupon ${code}`,
    shipping: "Shipping",
    free: "Free",
    shippingNote: "Any shipping charge is added when you pay.",
    total: "Amount payable",
    pay: (amount) => `Pay ${amount}`,
    starting: "Creating your order",
    paying: "Complete the payment in the Razorpay window",
    confirming: "Confirming your payment. Keep this page open.",
    loadingCheckout: "Loading the payment window",
    trust: "Secure payment by Razorpay",
    emptyTitle: "Nothing to check out",
    emptyBody: "Add something to your cart first.",
    toStore: "Browse the store",
    gone: "This product was not found",
    errors: {
      required: "This is required",
      phone: "Enter a 10 digit mobile number",
      email: "Enter a valid email",
      pincode: "Enter a 6 digit pincode",
      fix: "Please fix the fields marked above.",
      scriptFailed: "The payment window could not load. Check your internet connection and refresh the page.",
      notStarted: "The order could not be created. Try again.",
      noKey: "Online payment is not switched on for the website yet. Please order from the app, or try again later.",
      notOpened: "The payment window could not open. Refresh the page and try again.",
    },
    closedTitle: "Payment not completed",
    closedBody: "You closed the payment window. No money was taken. Press the button again when you are ready.",
    failedTitle: "The payment did not go through",
    failedBody: "Your money is safe; if it was deducted it returns within a few days. Please try again.",
    checkoutDescription: "AstroShrine product purchase",
    loading: "Loading checkout",
  },
});

type Source = {
  lines: OrderLineInput[];
  display: { id: string; name: string; image: string | null; label: string; qty: number; unit: number }[];
  subtotal: number;
  shipping: number;
  freeAbove: number;
  /** The coupon the server already holds for this cart. */
  coupon: AppliedCoupon | null;
};

function selectionLabel(sel: Selection, p: Product): string {
  const parts: string[] = [];
  if (sel.form !== "loose") parts.push(sel.form === "ring" ? "Ring" : "Pendant", ...(sel.metal ? [sel.metal] : []), ...(sel.size ? [`size ${sel.size}`] : []));
  const names = (p.addons ?? []).filter((a) => sel.addons.includes(a.id)).map((a) => a.name);
  if (names.length) parts.push(names.join(" + "));
  return parts.join(" · ");
}

export default function CheckoutView() {
  const t = useT(text);
  const ready = useSignedIn();
  const params = useSearchParams();
  const buy = params.get("buy");
  const sel = useMemo<Selection>(
    () => ({
      form: params.get("form") === "ring" ? "ring" : params.get("form") === "pendant" ? "pendant" : "loose",
      metal: params.get("metal"),
      size: params.get("size"),
      addons: (params.get("addons") ?? "").split(",").filter(Boolean),
    }),
    [params],
  );
  const locale = useLocale();

  const { state, retry, update } = useLoad<Source | null>(
    async (signal) => {
      if (buy) {
        const p = await getProduct(buy, signal);
        if (!p) return null;
        const unit = unitPrice(p, sel);
        if (unit === null) return null;
        return {
          lines: [{ productId: p.id, quantity: 1, form: sel.form, metal: sel.metal, ring_size: sel.size, addons: sel.addons }],
          display: [{ id: p.id, name: productName(locale, p), image: p.image_url || p.images?.[0] || null, label: selectionLabel(sel, p), qty: 1, unit }],
          subtotal: unit,
          shipping: 0,
          freeAbove: 0,
          coupon: null,
        };
      }
      const cart = await getCart(signal);
      return {
        lines: cart.items.map(lineSelectionOf),
        display: cart.items.map((l) => ({
          id: l.product_id,
          name: l.product ? productName(locale, l.product) : l.product_id,
          image: l.product?.image_url || l.product?.images?.[0] || null,
          label: l.selection_label && l.selection_label !== "Loose stone" ? l.selection_label : "",
          qty: Number(l.quantity) || 1,
          unit: Number(l.unit_price ?? l.product?.price ?? 0),
        })),
        subtotal: cart.subtotal,
        shipping: cart.shipping,
        freeAbove: cart.free_shipping_above,
        coupon: cart.coupon ?? null,
      };
    },
    ready,
    [buy, sel, locale],
  );

  return (
    <div className={`${PAGE} max-w-5xl`}>
      <Link href={buy ? `/store/products/${encodeURIComponent(buy)}` : "/store/cart"} className="button-sm inline-flex items-center gap-2 text-ink-soft hover:text-ink">
        <PiArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </Link>
      <h1 className="heading-4 mt-3 text-ink md:heading-3">{t.title}</h1>
      <div className="mt-6">
        {(!ready || state.status === "loading") && (
          <div role="status" aria-label={t.loading}>
            <Skeleton className="h-96 w-full" />
          </div>
        )}
        {ready && state.status === "error" && <LoadError error={state.error} onRetry={retry} />}
        {ready && state.status === "ready" &&
          (!state.data || state.data.lines.length === 0 ? (
            <Notice title={buy ? t.gone : t.emptyTitle} body={buy ? undefined : t.emptyBody}>
              <Link href="/store?tab=gems" className={`${BTN_PRIMARY} !px-4 !py-2`}>
                {t.toStore}
              </Link>
            </Notice>
          ) : (
            <Form
              source={state.data}
              isBuyNow={Boolean(buy)}
              reloadCart={async () => {
                const cart = await getCart();
                update({ ...state.data!, subtotal: cart.subtotal, shipping: cart.shipping, coupon: cart.coupon ?? null });
              }}
            />
          ))}
      </div>
    </div>
  );
}

type Fields = Record<keyof ShippingAddress, string>;
type Flow = { step: "idle" } | { step: "starting" | "paying" | "confirming" | "closed" | "failed" } | { step: "error"; message: string };

function Form({ source, isBuyNow, reloadCart }: { source: Source; isBuyNow: boolean; reloadCart: () => Promise<void> }) {
  const t = useT(text);
  const router = useRouter();
  const { user, session } = useAuth();
  const [f, setF] = useState<Fields>({ name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "" });
  const [touched, setTouched] = useState(false);
  const [buyCoupon, setBuyCoupon] = useState<AppliedCoupon | null>(null);
  const [script, setScript] = useState<ScriptState>("loading");
  const [flow, setFlow] = useState<Flow>({ step: "idle" });
  const inFlight = useRef(false);

  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !user) return;
    prefilled.current = true;
    const digits = (user.profile?.phoneNumber ?? "").replace(/\D/g, "").slice(-10);
    setF((x) => ({ ...x, name: x.name || user.name || "", phone: x.phone || digits, email: x.email || user.profile?.email || session?.user.email || "" }));
  }, [user, session]);

  const coupon = isBuyNow ? buyCoupon : source.coupon;
  const discount = coupon ? paiseToRupees(coupon.discount) : 0;
  const payable = Math.max(0, source.subtotal + source.shipping - discount);
  const busy = flow.step === "starting" || flow.step === "paying" || flow.step === "confirming";

  const errors = useMemo(() => {
    const e: Partial<Record<keyof Fields, string>> = {};
    for (const k of ["name", "address", "city", "state"] as const) if (!f[k].trim()) e[k] = t.errors.required;
    if (!/^\d{10}$/.test(f.phone.replace(/\D/g, ""))) e.phone = t.errors.phone;
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = t.errors.email;
    if (!/^\d{6}$/.test(f.pincode.replace(/\D/g, ""))) e.pincode = t.errors.pincode;
    return e;
  }, [f, t]);

  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  async function pay() {
    if (busy || inFlight.current) return;
    setTouched(true);
    if (Object.keys(errors).length) {
      setFlow({ step: "error", message: t.errors.fix });
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    if (!isCheckoutLoaded()) {
      setFlow({ step: "error", message: t.errors.scriptFailed });
      return;
    }
    inFlight.current = true;
    try {
      await run();
    } finally {
      inFlight.current = false;
    }
  }

  async function run() {
    setFlow({ step: "starting" });
    const address: ShippingAddress = {
      name: f.name.trim(),
      phone: f.phone.replace(/\D/g, ""),
      email: f.email.trim(),
      address: f.address.trim(),
      city: f.city.trim(),
      state: f.state.trim(),
      pincode: f.pincode.replace(/\D/g, ""),
    };
    let created;
    try {
      created = await createProductOrder(address, source.lines, coupon?.code);
    } catch (e) {
      setFlow({ step: "error", message: e instanceof ApiError && e.message ? e.message : t.errors.notStarted });
      return;
    }
    const orderId = created?.order?.id;
    const amountPaise = Number(created?.razorpay?.amount);
    if (!orderId || !created.razorpay?.orderId || !(amountPaise > 0)) {
      setFlow({ step: "error", message: t.errors.notStarted });
      return;
    }
    const amount = amountPaise / 100;
    const key = productCheckoutKey(created);
    if (!key) {
      void markProductPaymentFailed(orderId);
      setFlow({ step: "error", message: t.errors.noKey });
      return;
    }
    sendPaymentEmail("order_created", { orderId, amount });
    setFlow({ step: "paying" });
    let outcome;
    try {
      outcome = await openCheckout({
        key,
        order_id: created.razorpay.orderId,
        amount: amountPaise,
        currency: created.razorpay.currency || "INR",
        name: "AstroShrine",
        description: t.checkoutDescription,
        image: window.location.protocol === "https:" ? `${window.location.origin}/logo.png` : undefined,
        prefill: { name: address.name, email: address.email, contact: address.phone },
        theme: { color: brandColor() },
      });
    } catch {
      void markProductPaymentFailed(orderId);
      setFlow({ step: "error", message: t.errors.notOpened });
      return;
    }
    if (outcome.kind === "closed") {
      void markProductPaymentFailed(orderId);
      sendPaymentEmail("payment_failed", { orderId, amount });
      setFlow({ step: outcome.failed ? "failed" : "closed" });
      return;
    }
    setFlow({ step: "confirming" });
    let confirmed = false;
    try {
      const res = await verifyProductPayment(orderId, outcome.payment);
      confirmed = Boolean(res?.success);
    } catch {
      // The Razorpay webhook settles the order too; the order's page shows where it stands.
    }
    if (confirmed) {
      sendPaymentEmail("payment_success", { orderId, amount });
      // Only a real cart is emptied; "buy now" never touched it. A failed clear must not undo a paid order.
      if (!isBuyNow) {
        await clearCart().catch(() => undefined);
        notifyCartChanged();
      }
    }
    router.push(`/store/orders/${encodeURIComponent(orderId)}?paid=${confirmed ? "1" : "pending"}`);
  }

  const field = (key: keyof Fields, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const err = touched ? errors[key] : undefined;
    return (
      <label className="block">
        <span className="caption-2 text-ink-soft">{label}</span>
        <input
          value={f[key]}
          onChange={(e) => setF({ ...f, [key]: e.target.value })}
          aria-invalid={err ? true : undefined}
          aria-required
          disabled={busy}
          className={`${FIELD} mt-1 ${err ? "!border-danger" : ""}`}
          {...props}
        />
        {err && <span className="caption-4 mt-1 block text-danger">{err}</span>}
      </label>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      <PaymentScript onState={setScript} />
      <fieldset className={`${CARD} grid gap-4 p-4 sm:grid-cols-2 md:p-6 lg:col-span-7`}>
        <legend className="sr-only">{t.delivery}</legend>
        <h2 className="heading-6 text-ink sm:col-span-2">{t.delivery}</h2>
        {field("name", t.name, { autoComplete: "name" })}
        {field("phone", t.mobile, { inputMode: "numeric", maxLength: 10, autoComplete: "tel-national" })}
        <div className="sm:col-span-2">{field("email", t.email, { type: "email", autoComplete: "email" })}</div>
        <div className="sm:col-span-2">{field("address", t.address, { autoComplete: "street-address" })}</div>
        {field("city", t.city, { autoComplete: "address-level2" })}
        {field("state", t.state, { autoComplete: "address-level1" })}
        {field("pincode", t.pincode, { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}
      </fieldset>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:col-span-5">
        <section aria-labelledby="co-sum" className={`${CARD} p-4 md:p-6`}>
          <h2 id="co-sum" className="heading-6 text-ink">
            {t.summary}
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {source.display.map((d) => (
              <li key={d.id} className="flex gap-3">
                <StoreImage src={d.image} alt="" className="h-14 w-14 shrink-0 rounded-lg" sizes="56px" />
                <div className="min-w-0 flex-1">
                  <p lang={contentLang(d.name)} className="title-5 line-clamp-2 text-ink">
                    {d.name}
                  </p>
                  <p className="caption-4 text-ink-muted">{[d.label, t.qty(d.qty)].filter(Boolean).join(" · ")}</p>
                </div>
                <p className="title-5 text-ink">{rupee(d.unit * d.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-3">
            <div className="flex justify-between">
              <dt className="body-6 text-ink-soft">{t.subtotal}</dt>
              <dd className="title-5 text-ink">{rupee(source.subtotal)}</dd>
            </div>
            {coupon && discount > 0 && (
              <div className="flex justify-between text-success">
                <dt className="body-6">{t.discount(coupon.code)}</dt>
                <dd className="title-5">-{rupee(discount)}</dd>
              </div>
            )}
            {!isBuyNow && (
              <div className="flex justify-between">
                <dt className="body-6 text-ink-soft">{t.shipping}</dt>
                <dd className="title-5 text-ink">{source.shipping > 0 ? rupee(source.shipping) : t.free}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2">
              <dt className="title-4 text-ink">{t.total}</dt>
              <dd className="title-3 text-ink">{rupee(payable)}</dd>
            </div>
          </dl>
          {isBuyNow && <p className="caption-4 mt-2 text-ink-muted">{t.shippingNote}</p>}
        </section>

        {isBuyNow ? (
          <CouponBox channel="stone" lines={source.lines} applied={buyCoupon} onChange={setBuyCoupon} suggest={false} />
        ) : (
          <CouponBox channel="stone" applied={source.coupon} onChange={() => void reloadCart()} />
        )}

        <div aria-live="polite" className="flex flex-col gap-2">
          {flow.step === "error" && <Notice tone="danger" title={flow.message} />}
          {flow.step === "closed" && <Notice tone="warning" title={t.closedTitle} body={t.closedBody} />}
          {flow.step === "failed" && <Notice tone="danger" title={t.failedTitle} body={t.failedBody} />}
          {busy && <p className="caption-2 text-ink-soft">{{ starting: t.starting, paying: t.paying, confirming: t.confirming }[flow.step as "starting"]}</p>}
        </div>

        <button type="button" onClick={pay} disabled={busy || script === "error"} className={`${BTN_PRIMARY} w-full`}>
          {script === "loading" ? t.loadingCheckout : t.pay(rupee(payable))}
        </button>
        {script === "error" && (
          <p role="alert" className="caption-2 text-danger">
            {t.errors.scriptFailed}
          </p>
        )}
        <p className="caption-4 text-center text-ink-muted">{t.trust}</p>
      </aside>
    </div>
  );
}
