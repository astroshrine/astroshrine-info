"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PiArrowLeft, PiCheckCircle } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { contentLang } from "@/lib/services/astrologerModel";
import { brandColor, isCheckoutLoaded, openCheckout } from "@/lib/services/razorpay";
import {
  createPujaOrder,
  getPujaBySlug,
  markPujaPaymentFailed,
  paiseToRupees,
  rupee,
  verifyPujaPayment,
  type AppliedCoupon,
  type PujaBookingDetails,
} from "@/lib/services/store";
import CouponBox from "../../../CouponBox";
import PaymentScript, { type ScriptState } from "../../../PaymentScript";
import { BTN_PRIMARY, BTN_SECONDARY, CARD, FIELD, LoadError, Notice, PAGE, Skeleton, StoreImage, useLoad, useSignedIn } from "../../../ui";

const text = defineMessages({
  hi: {
    back: "पूजा पर वापस",
    title: "पूजा बुकिंग",
    devotee: "यजमान का विवरण",
    name: "नाम",
    fatherName: "पिता का नाम",
    gotra: "गोत्र",
    gender: "लिंग",
    maritalStatus: "वैवाहिक स्थिति",
    mobile: "मोबाइल नंबर",
    whatsapp: "WhatsApp नंबर (वैकल्पिक)",
    address: "पता",
    choose: "चुनें",
    genders: { Male: "पुरुष", Female: "महिला", Other: "अन्य" },
    statuses: { Married: "विवाहित", Unmarried: "अविवाहित", Divorced: "तलाकशुदा", Widowed: "विधवा/विधुर" },
    pujaSection: "पूजा की तारीख",
    pujaDate: "पूजा की तारीख",
    pujaTime: "पूजा का समय",
    requirement: "कोई विशेष निवेदन (वैकल्पिक)",
    birth: "जन्म विवरण",
    birthCountry: "जन्म का देश",
    birthState: "जन्म का राज्य",
    birthPlace: "जन्म का स्थान",
    birthDate: "जन्म तिथि",
    birthTime: "जन्म का समय",
    summary: "बुकिंग का सार",
    price: "पूजा",
    discount: "कूपन छूट",
    total: "देय राशि",
    pay: (amount: string) => `${amount} चुकाएं`,
    starting: "भुगतान शुरू हो रहा है",
    paying: "Razorpay विंडो में भुगतान पूरा करें",
    confirming: "भुगतान की पुष्टि हो रही है। पेज खुला रखें।",
    loadingCheckout: "भुगतान विंडो लोड हो रही है",
    trust: "Razorpay से सुरक्षित भुगतान",
    errors: {
      required: "यह जानकारी ज़रूरी है",
      phone: "10 अंकों का मोबाइल नंबर डालें",
      whatsapp: "WhatsApp नंबर 10 अंकों का होना चाहिए",
      fix: "ऊपर लाल रंग की जानकारी ठीक करें।",
      scriptFailed: "भुगतान विंडो लोड नहीं हो सकी। इंटरनेट जाँचें और पेज रीफ़्रेश करें।",
      notStarted: "बुकिंग शुरू नहीं हो सकी। फिर से कोशिश करें।",
      noKey: "भुगतान अभी शुरू नहीं हो सकता। कृपया बाद में कोशिश करें।",
      notOpened: "भुगतान विंडो खुल नहीं सकी। पेज रीफ़्रेश करके फिर कोशिश करें।",
    },
    closedTitle: "भुगतान पूरा नहीं हुआ",
    closedBody: "आपने भुगतान विंडो बंद कर दी। कोई पैसा नहीं कटा। तैयार हों तो फिर से बटन दबाएँ।",
    failedTitle: "भुगतान सफल नहीं हुआ",
    failedBody: "आपका पैसा सुरक्षित है; अगर कट गया हो तो कुछ दिनों में वापस आ जाएगा। फिर से कोशिश करें।",
    doneTitle: "पूजा बुक हो गई",
    doneBody: (ref: string) => `बुकिंग नंबर ${ref}। पूजा की तारीख और समय से पहले हम आपसे संपर्क करेंगे।`,
    unconfirmedTitle: "भुगतान मिला, पुष्टि आ रही है",
    unconfirmedBody: "आपका भुगतान हो गया है, पर बुकिंग की पुष्टि में देर हो रही है। कुछ देर बाद 'मेरे ऑर्डर' में देखें। दोबारा भुगतान न करें।",
    viewBookings: "मेरी बुकिंग देखें",
    moreStore: "स्टोर देखें",
    notFound: "यह पूजा नहीं मिली",
    loading: "बुकिंग फ़ॉर्म लोड हो रहा है",
    checkoutDescription: (title: string) => `पूजा: ${title}`,
  },
  en: {
    back: "Back to the puja",
    title: "Book a puja",
    devotee: "Devotee details",
    name: "Name",
    fatherName: "Father's name",
    gotra: "Gotra",
    gender: "Gender",
    maritalStatus: "Marital status",
    mobile: "Mobile number",
    whatsapp: "WhatsApp number (optional)",
    address: "Address",
    choose: "Choose",
    genders: { Male: "Male", Female: "Female", Other: "Other" },
    statuses: { Married: "Married", Unmarried: "Unmarried", Divorced: "Divorced", Widowed: "Widowed" },
    pujaSection: "Puja date",
    pujaDate: "Puja date",
    pujaTime: "Puja time",
    requirement: "Any special request (optional)",
    birth: "Birth details",
    birthCountry: "Country of birth",
    birthState: "State of birth",
    birthPlace: "Place of birth",
    birthDate: "Date of birth",
    birthTime: "Time of birth",
    summary: "Booking summary",
    price: "Puja",
    discount: "Coupon discount",
    total: "Amount payable",
    pay: (amount) => `Pay ${amount}`,
    starting: "Starting the payment",
    paying: "Complete the payment in the Razorpay window",
    confirming: "Confirming your payment. Keep this page open.",
    loadingCheckout: "Loading the payment window",
    trust: "Secure payment by Razorpay",
    errors: {
      required: "This is required",
      phone: "Enter a 10 digit mobile number",
      whatsapp: "The WhatsApp number must be 10 digits",
      fix: "Please fix the fields marked above.",
      scriptFailed: "The payment window could not load. Check your internet connection and refresh the page.",
      notStarted: "The booking could not start. Try again.",
      noKey: "The payment cannot start right now. Please try again later.",
      notOpened: "The payment window could not open. Refresh the page and try again.",
    },
    closedTitle: "Payment not completed",
    closedBody: "You closed the payment window. No money was taken. Press the button again when you are ready.",
    failedTitle: "The payment did not go through",
    failedBody: "Your money is safe; if it was deducted it returns within a few days. Please try again.",
    doneTitle: "Your puja is booked",
    doneBody: (ref) => `Booking number ${ref}. We will contact you before the puja date and time.`,
    unconfirmedTitle: "Payment received, confirmation pending",
    unconfirmedBody: "Your payment went through, but the booking confirmation is taking a while. Check My orders in a little while. Please do not pay again.",
    viewBookings: "View my bookings",
    moreStore: "Back to the store",
    notFound: "This puja was not found",
    loading: "Loading the booking form",
    checkoutDescription: (title) => `Puja: ${title}`,
  },
});

type Form = {
  name: string;
  fatherName: string;
  gotra: string;
  gender: string;
  maritalStatus: string;
  mobile: string;
  whatsapp: string;
  address: string;
  poojaDateDb: string;
  poojaTime: string;
  specificRequirement: string;
  birthCountry: string;
  birthState: string;
  birthPlace: string;
  birthDateDb: string;
  birthTime: string;
};

const EMPTY: Form = {
  name: "",
  fatherName: "",
  gotra: "",
  gender: "",
  maritalStatus: "",
  mobile: "",
  whatsapp: "",
  address: "",
  poojaDateDb: "",
  poojaTime: "",
  specificRequirement: "",
  birthCountry: "India",
  birthState: "",
  birthPlace: "",
  birthDateDb: "",
  birthTime: "",
};

const REQUIRED: (keyof Form)[] = ["name", "address", "poojaDateDb", "poojaTime", "birthCountry", "birthState", "birthPlace", "birthDateDb", "birthTime"];

/** "2026-11-20" as "20 November 2026", the way the app writes poojaDate. */
function longDate(db: string) {
  const [y, m, d] = db.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
/** "14:05" as "02:05 PM", the way the app writes poojaTime. */
function clock12(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Flow =
  | { step: "idle" }
  | { step: "starting" | "paying" | "confirming" }
  | { step: "closed" | "failed" }
  | { step: "error"; message: string }
  | { step: "done"; ref: string; confirmed: boolean };

export default function PujaBooking({ slug }: { slug: string }) {
  const t = useT(text);
  const ready = useSignedIn();
  const { state, retry } = useLoad((signal) => getPujaBySlug(slug, signal), true, [slug]);

  return (
    <div className={`${PAGE} max-w-5xl`}>
      <Link href={`/store/pujas/${encodeURIComponent(slug)}`} className="button-sm inline-flex items-center gap-2 text-ink-soft hover:text-ink">
        <PiArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </Link>
      <h1 className="heading-4 mt-3 text-ink md:heading-3">{t.title}</h1>
      <div className="mt-6">
        {(state.status === "loading" || !ready) && <Skeleton className="h-96 w-full" />}
        {state.status === "error" && (state.error instanceof ApiError && state.error.status === 404 ? <Notice title={t.notFound} /> : <LoadError error={state.error} onRetry={retry} />)}
        {state.status === "ready" && ready && state.data && <BookingForm puja={state.data} />}
      </div>
    </div>
  );
}

function BookingForm({ puja }: { puja: NonNullable<Awaited<ReturnType<typeof getPujaBySlug>>> }) {
  const t = useT(text);
  const { user, session } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [script, setScript] = useState<ScriptState>("loading");
  const [flow, setFlow] = useState<Flow>({ step: "idle" });
  const inFlight = useRef(false);
  // One booking reference per form, kept across retries, as the app does.
  const bookingId = useRef<string | null>(null);

  // Prefill from the account once, without overwriting what the visitor typed.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !user) return;
    prefilled.current = true;
    const digits = (user.profile?.phoneNumber ?? "").replace(/\D/g, "").slice(-10);
    setForm((f) => ({ ...f, name: f.name || user.name || "", mobile: f.mobile || digits }));
  }, [user]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const errors = useMemo(() => {
    const e: Partial<Record<keyof Form, string>> = {};
    for (const k of REQUIRED) if (!form[k].trim()) e[k] = t.errors.required;
    if (!/^\d{10}$/.test(form.mobile.trim())) e.mobile = t.errors.phone;
    if (form.whatsapp.trim() && !/^\d{10}$/.test(form.whatsapp.trim())) e.whatsapp = t.errors.whatsapp;
    return e;
  }, [form, t]);

  const price = Number(puja.price) || 0;
  const discount = coupon ? paiseToRupees(coupon.discount) : 0;
  const payable = Math.max(0, price - discount);
  const busy = flow.step === "starting" || flow.step === "paying" || flow.step === "confirming";

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
    bookingId.current ??= `PUJA${Date.now().toString().slice(-8)}`;
    const ref = bookingId.current;
    const details: PujaBookingDetails = {
      name: form.name.trim(),
      fatherName: form.fatherName.trim(),
      gotra: form.gotra.trim(),
      mobile: form.mobile.trim(),
      whatsapp: form.whatsapp.trim(),
      gender: form.gender,
      maritalStatus: form.maritalStatus,
      poojaDate: longDate(form.poojaDateDb),
      poojaDateDb: form.poojaDateDb,
      poojaTime: clock12(form.poojaTime),
      address: form.address.trim(),
      birthCountry: form.birthCountry.trim(),
      birthState: form.birthState.trim(),
      birthPlace: form.birthPlace.trim(),
      birthDate: longDate(form.birthDateDb),
      birthTime: clock12(form.birthTime),
      specificRequirement: form.specificRequirement.trim(),
    };
    let order;
    try {
      order = await createPujaOrder({
        amount: payable,
        bookingId: ref,
        poojaName: puja.title,
        items: [{ pujaId: puja.id, pujaTitle: puja.title, quantity: 1, price }],
        details,
        couponCode: coupon?.code,
      });
    } catch (e) {
      setFlow({ step: "error", message: e instanceof ApiError && e.message ? e.message : t.errors.notStarted });
      return;
    }
    if (!order?.orderId || !order.keyId) {
      setFlow({ step: "error", message: t.errors.noKey });
      return;
    }
    setFlow({ step: "paying" });
    let outcome;
    try {
      outcome = await openCheckout({
        key: order.keyId,
        order_id: order.orderId,
        amount: Number(order.amount),
        currency: order.currency || "INR",
        name: "AstroShrine",
        description: t.checkoutDescription(puja.title),
        image: window.location.protocol === "https:" ? `${window.location.origin}/logo.png` : undefined,
        prefill: { name: form.name.trim(), email: user?.profile?.email || session?.user.email || undefined, contact: form.mobile.trim() },
        theme: { color: brandColor() },
      });
    } catch {
      void markPujaPaymentFailed({ razorpay_order_id: order.orderId, bookingId: ref, amount: payable, poojaName: puja.title, reason: "Payment window could not open" });
      setFlow({ step: "error", message: t.errors.notOpened });
      return;
    }
    if (outcome.kind === "closed") {
      // Releases the PENDING booking, as the app does for a cancelled or failed payment.
      void markPujaPaymentFailed({ razorpay_order_id: order.orderId, bookingId: ref, amount: payable, poojaName: puja.title, reason: outcome.failed ? (outcome.reason ?? "Payment failed") : "Payment cancelled" });
      setFlow({ step: outcome.failed ? "failed" : "closed" });
      return;
    }
    setFlow({ step: "confirming" });
    let confirmed = false;
    try {
      await verifyPujaPayment(outcome.payment);
      confirmed = true;
    } catch {
      // Razorpay's webhook settles the booking too; My orders shows where it stands.
    }
    setFlow({ step: "done", ref, confirmed });
  }

  if (flow.step === "done") {
    return (
      <div className="mx-auto max-w-xl">
        <Notice tone={flow.confirmed ? "success" : "warning"} title={flow.confirmed ? t.doneTitle : t.unconfirmedTitle} body={flow.confirmed ? t.doneBody(flow.ref) : t.unconfirmedBody}>
          <div className="flex flex-wrap gap-2">
            <Link href="/store/orders?tab=pujas" className={`${BTN_PRIMARY} !px-4 !py-2`}>
              <PiCheckCircle className="h-5 w-5" aria-hidden />
              {t.viewBookings}
            </Link>
            <Link href="/store" className={`${BTN_SECONDARY} !px-4 !py-2`}>
              {t.moreStore}
            </Link>
          </div>
        </Notice>
      </div>
    );
  }

  const field = (key: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, optional = false) => {
    const err = touched ? errors[key] : undefined;
    return (
      <label className="block">
        <span className="caption-2 text-ink-soft">{label}</span>
        <input
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
          aria-invalid={err ? true : undefined}
          aria-required={optional ? undefined : true}
          disabled={busy}
          className={`${FIELD} mt-1 ${err ? "!border-danger" : ""}`}
          {...props}
        />
        {err && <span className="caption-4 mt-1 block text-danger">{err}</span>}
      </label>
    );
  };
  const choice = (key: "gender" | "maritalStatus", label: string, values: Record<string, string>) => (
    <label className="block">
      <span className="caption-2 text-ink-soft">{label}</span>
      <select value={form[key]} onChange={(e) => set(key, e.target.value)} disabled={busy} className={`${FIELD} mt-1`}>
        <option value="">{t.choose}</option>
        {Object.entries(values).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <PaymentScript onState={setScript} />
      <div className="flex flex-col gap-6 lg:col-span-7">
        <fieldset className={`${CARD} grid gap-4 p-4 sm:grid-cols-2 md:p-6`}>
          <legend className="sr-only">{t.devotee}</legend>
          <h2 className="heading-6 text-ink sm:col-span-2">{t.devotee}</h2>
          {field("name", t.name, { autoComplete: "name" })}
          {field("fatherName", t.fatherName, {}, true)}
          {field("gotra", t.gotra, {}, true)}
          {choice("gender", t.gender, t.genders)}
          {choice("maritalStatus", t.maritalStatus, t.statuses)}
          {field("mobile", t.mobile, { inputMode: "numeric", maxLength: 10, autoComplete: "tel-national" })}
          {field("whatsapp", t.whatsapp, { inputMode: "numeric", maxLength: 10 }, true)}
          <div className="sm:col-span-2">{field("address", t.address, { autoComplete: "street-address" })}</div>
        </fieldset>

        <fieldset className={`${CARD} grid gap-4 p-4 sm:grid-cols-2 md:p-6`}>
          <legend className="sr-only">{t.pujaSection}</legend>
          <h2 className="heading-6 text-ink sm:col-span-2">{t.pujaSection}</h2>
          {field("poojaDateDb", t.pujaDate, { type: "date", min: today() })}
          {field("poojaTime", t.pujaTime, { type: "time" })}
          <label className="block sm:col-span-2">
            <span className="caption-2 text-ink-soft">{t.requirement}</span>
            <textarea value={form.specificRequirement} onChange={(e) => set("specificRequirement", e.target.value)} rows={3} disabled={busy} className={`${FIELD} mt-1`} />
          </label>
        </fieldset>

        <fieldset className={`${CARD} grid gap-4 p-4 sm:grid-cols-2 md:p-6`}>
          <legend className="sr-only">{t.birth}</legend>
          <h2 className="heading-6 text-ink sm:col-span-2">{t.birth}</h2>
          {field("birthCountry", t.birthCountry)}
          {field("birthState", t.birthState)}
          <div className="sm:col-span-2">{field("birthPlace", t.birthPlace)}</div>
          {field("birthDateDb", t.birthDate, { type: "date", max: today() })}
          {field("birthTime", t.birthTime, { type: "time" })}
        </fieldset>
      </div>

      <aside className="lg:col-span-5">
        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section aria-labelledby="sum-title" className={`${CARD} p-4 md:p-6`}>
            <h2 id="sum-title" className="heading-6 text-ink">
              {t.summary}
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <StoreImage src={puja.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl" sizes="64px" />
              <p lang={contentLang(puja.title)} className="title-4 text-ink">
                {puja.title}
              </p>
            </div>
            <dl className="mt-4 space-y-2">
              <div className="flex justify-between">
                <dt className="body-6 text-ink-soft">{t.price}</dt>
                <dd className="title-5 text-ink">{rupee(price)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <dt className="body-6">{t.discount}</dt>
                  <dd className="title-5">-{rupee(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="title-4 text-ink">{t.total}</dt>
                <dd className="title-3 text-ink">{rupee(payable)}</dd>
              </div>
            </dl>
          </section>

          <CouponBox channel="puja" lines={[{ pujaId: puja.id, quantity: 1 }]} pujaItems={[{ pujaId: puja.id, quantity: 1 }]} applied={coupon} onChange={setCoupon} />

          <div aria-live="polite" className="flex flex-col gap-2">
            {flow.step === "error" && <Notice tone="danger" title={flow.message} />}
            {flow.step === "closed" && <Notice tone="warning" title={t.closedTitle} body={t.closedBody} />}
            {flow.step === "failed" && <Notice tone="danger" title={t.failedTitle} body={t.failedBody} />}
            {busy && <p className="caption-2 text-ink-soft">{{ starting: t.starting, paying: t.paying, confirming: t.confirming }[flow.step as "starting"]}</p>}
          </div>

          <button type="button" onClick={pay} disabled={busy || script === "error"} className={`${BTN_PRIMARY} w-full`}>
            {script === "loading" ? t.loadingCheckout : t.pay(rupee(payable))}
          </button>
          {script === "error" && <p role="alert" className="caption-2 text-danger">{t.errors.scriptFailed}</p>}
          <p className="caption-4 text-center text-ink-muted">{t.trust}</p>
        </div>
      </aside>
    </div>
  );
}
