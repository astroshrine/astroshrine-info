"use client";

import { useEffect, useState } from "react";
import { PiTag, PiX } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import {
  applyCoupon,
  getAvailableCoupons,
  paiseToRupees,
  removeCoupon,
  rupee,
  type AppliedCoupon,
  type CouponChannel,
  type CouponLine,
  type NearMiss,
} from "@/lib/services/store";
import { BTN_SECONDARY, FIELD } from "./ui";

const text = defineMessages({
  hi: {
    title: "कूपन या रेफरल कोड",
    placeholder: "कोड डालें",
    apply: "लागू करें",
    checking: "जाँच रहे हैं",
    remove: "हटाएं",
    removeLabel: (code: string) => `कूपन ${code} हटाएं`,
    saved: (code: string) => `रेफरल कोड ${code} सेव हो गया। इससे इस ऑर्डर पर छूट नहीं मिलती।`,
    applied: (code: string, amount: string) => `${code} लागू: ${amount} की बचत`,
    failed: "कोड लागू नहीं हो सका। फिर कोशिश करें।",
    available: "आपके लिए उपलब्ध कोड",
    nearMiss: "थोड़ा और खरीदें तो ये भी मिलेंगे",
    signIn: "कोड लगाने के लिए साइन इन करें।",
    off: (amount: string) => `${amount} छूट`,
  },
  en: {
    title: "Coupon or referral code",
    placeholder: "Enter a code",
    apply: "Apply",
    checking: "Checking",
    remove: "Remove",
    removeLabel: (code) => `Remove coupon ${code}`,
    saved: (code) => `Referral code ${code} saved. It gives no discount on this order.`,
    applied: (code, amount) => `${code} applied: you save ${amount}`,
    failed: "The code could not be applied. Try again.",
    available: "Codes available for you",
    nearMiss: "Spend a little more to unlock",
    signIn: "Sign in to use a code.",
    off: (amount) => `${amount} off`,
  },
});

/**
 * A coupon box for the gemstone cart or a puja. The server holds the reservation (the app's too), so the applied
 * coupon is shown from there. `lines` is sent with an apply when the lines are not the server's own cart
 * (a puja, or a "buy now" gemstone).
 */
export default function CouponBox({
  channel,
  lines,
  pujaItems,
  applied,
  onChange,
  suggest = true,
}: {
  channel: CouponChannel;
  lines?: CouponLine[];
  pujaItems?: { pujaId: string; quantity: number }[];
  applied: AppliedCoupon | null;
  onChange: (coupon: AppliedCoupon | null) => void;
  suggest?: boolean;
}) {
  const t = useT(text);
  const { status } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [offers, setOffers] = useState<{ qualifying: AppliedCoupon[]; nearMiss: NearMiss[] }>({ qualifying: [], nearMiss: [] });
  const pujaKey = pujaItems?.map((i) => `${i.pujaId}:${i.quantity}`).join(",");

  useEffect(() => {
    if (!suggest || status !== "signedIn") return;
    const controller = new AbortController();
    getAvailableCoupons(channel, pujaItems, controller.signal).then(setOffers, () => undefined);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, pujaKey, status, suggest, applied?.code]);

  async function apply(value: string) {
    const clean = value.trim();
    if (!clean || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await applyCoupon(clean, channel, lines);
      if (result.kind === "coupon") {
        onChange(result);
        setCode("");
      } else {
        setMessage({ tone: "ok", text: t.saved(result.code) });
        setCode("");
      }
    } catch (e) {
      setMessage({ tone: "bad", text: e instanceof ApiError && e.message ? e.message : t.failed });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!applied) return;
    setBusy(true);
    try {
      await removeCoupon(channel);
      onChange(null);
      setMessage(null);
    } catch (e) {
      setMessage({ tone: "bad", text: e instanceof ApiError && e.message ? e.message : t.failed });
    } finally {
      setBusy(false);
    }
  }

  const others = offers.qualifying.filter((o) => o.code !== applied?.code);

  return (
    <section aria-label={t.title} className="rounded-2xl border border-line bg-surface-card p-4">
      <h3 className="title-4 flex items-center gap-2 text-ink">
        <PiTag className="h-5 w-5 text-brand-strong" aria-hidden />
        {t.title}
      </h3>

      {applied ? (
        <p className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-success-soft px-3 py-2 text-success">
          <span className="caption-2">{t.applied(applied.code, rupee(paiseToRupees(applied.discount)))}</span>
          <button type="button" onClick={remove} disabled={busy} aria-label={t.removeLabel(applied.code)} className="button-xsm inline-flex items-center gap-1 underline">
            <PiX className="h-4 w-4" aria-hidden />
            {t.remove}
          </button>
        </p>
      ) : status !== "signedIn" ? (
        <p className="caption-2 mt-2 text-ink-soft">{t.signIn}</p>
      ) : (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void apply(code);
          }}
        >
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t.placeholder} aria-label={t.title} autoCapitalize="characters" autoComplete="off" className={FIELD} />
          <button type="submit" disabled={busy || !code.trim()} className={`${BTN_SECONDARY} shrink-0 !px-4`}>
            {busy ? t.checking : t.apply}
          </button>
        </form>
      )}

      {message && (
        <p role={message.tone === "bad" ? "alert" : "status"} className={`caption-2 mt-2 ${message.tone === "bad" ? "text-danger" : "text-ink-soft"}`}>
          {message.text}
        </p>
      )}

      {!applied && others.length > 0 && (
        <div className="mt-3">
          <p className="caption-3 text-ink-muted">{t.available}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {others.map((o) => (
              <li key={o.code}>
                <button type="button" onClick={() => apply(o.code)} disabled={busy} className="caption-3 rounded-full border border-dashed border-brand-strong bg-surface-sunken px-3 py-1 text-ink hover:bg-brand-soft">
                  <strong>{o.code}</strong> · {t.off(rupee(paiseToRupees(o.discount)))}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!applied && offers.nearMiss.length > 0 && (
        <div className="mt-3">
          <p className="caption-3 text-ink-muted">{t.nearMiss}</p>
          <ul className="mt-1 space-y-1">
            {offers.nearMiss.slice(0, 2).map((n) => (
              <li key={n.code} className="caption-4 text-ink-soft">
                <strong>{n.code}</strong>: {n.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
