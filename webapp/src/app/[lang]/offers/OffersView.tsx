"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PiArrowClockwise, PiArrowRight, PiCopy, PiSignIn, PiTag } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { INTL_LOCALE } from "@/i18n/config";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { fadeUp, stagger } from "@/lib/motion";
import { listActivePromos, promoUse, type ActivePromo } from "@/lib/offers";

// The app's Offers screen: the promo codes running right now (admin-created, GET /v1/wallet/promo/active), each with
// a button that opens the wallet with the code filled in.

const text = defineMessages({
  hi: {
    title: "ऑफ़र",
    lead: "Recharge पर अभी चल रहे promo code। कोड चुनें, wallet में वह अपने आप भर जाएगा।",
    off: (n: number) => `${n}% छूट`,
    upTo: (amount: string) => `ज़्यादा से ज़्यादा ${amount}`,
    min: (amount: string) => `कम से कम ${amount} का recharge`,
    until: (date: string) => `${date} तक`,
    on: (where: string) => `इस पर: ${where}`,
    use: "Wallet में इस्तेमाल करें",
    copy: "कोड कॉपी करें",
    copied: "कॉपी हो गया",
    empty: "अभी कोई ऑफ़र नहीं चल रहा। बाद में फिर देखें।",
    failed: "ऑफ़र लोड नहीं हुए।",
    retry: "फिर कोशिश करें",
    signedOut: "ऑफ़र देखने के लिए लॉगिन करें।",
    login: "लॉगिन करें",
  },
  en: {
    title: "Offers",
    lead: "Promo codes running on recharges right now. Pick one and it is filled in on the wallet for you.",
    off: (n) => `${n}% off`,
    upTo: (amount) => `up to ${amount}`,
    min: (amount) => `on recharges of ${amount} or more`,
    until: (date) => `until ${date}`,
    on: (where) => `For: ${where}`,
    use: "Use in wallet",
    copy: "Copy code",
    copied: "Copied",
    empty: "No offers are running right now. Please check again later.",
    failed: "Offers couldn't load.",
    retry: "Try again",
    signedOut: "Log in to see the offers.",
    login: "Log in",
  },
});

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function OffersView() {
  const { status } = useAuth();
  const t = useT(text);
  const [state, setState] = useState<{ promos: ActivePromo[] | null; failed: boolean }>({ promos: null, failed: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (status !== "signedIn") return;
    const ctrl = new AbortController();
    listActivePromos(ctrl.signal).then(
      (promos) => setState({ promos, failed: false }),
      (e) => {
        if (ctrl.signal.aborted) return;
        console.error("[offers]", e);
        setState({ promos: null, failed: true });
      },
    );
    return () => ctrl.abort();
  }, [status, attempt]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8 lg:py-14">
      <h1 className="heading-4 flex items-center gap-2 text-ink">
        <PiTag className="h-7 w-7 text-brand-strong" aria-hidden />
        {t.title}
      </h1>
      <p className="body-3 mt-3 max-w-[640px] text-ink-soft">{t.lead}</p>

      <div className="mt-8">
        {status === "signedOut" ? (
          <div className="flex flex-col items-start gap-4 rounded-3xl border border-line bg-surface-card p-6">
            <p className="body-3 text-ink">{t.signedOut}</p>
            <Link
              href="/login?next=/offers"
              className="button-md inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-brand-ink transition hover:bg-brand-hover"
            >
              <PiSignIn className="h-5 w-5" aria-hidden />
              {t.login}
            </Link>
          </div>
        ) : state.failed ? (
          <div className="flex flex-col items-start gap-3 rounded-3xl border border-line bg-surface-card p-6">
            <p role="alert" className="body-3 text-ink">
              {t.failed}
            </p>
            <button
              type="button"
              onClick={() => {
                setState({ promos: null, failed: false });
                setAttempt((n) => n + 1);
              }}
              className="button-sm inline-flex items-center gap-2 rounded-xl border border-line-strong px-3 py-2 text-ink transition hover:bg-surface-sunken"
            >
              <PiArrowClockwise className="h-4 w-4" aria-hidden />
              {t.retry}
            </button>
          </div>
        ) : !state.promos ? (
          <div aria-busy="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-3xl bg-surface-sunken" />
            ))}
          </div>
        ) : state.promos.length === 0 ? (
          <p className="body-3 rounded-3xl border border-line bg-surface-card p-6 text-ink-soft">{t.empty}</p>
        ) : (
          <motion.ul variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {state.promos.map((p) => (
              <motion.li key={p.code} variants={fadeUp}>
                <PromoCard promo={p} />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}

function PromoCard({ promo: p }: { promo: ActivePromo }) {
  const t = useT(text);
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const recharge = p.applicableTo.length === 0 || p.applicableTo.includes("RECHARGE");
  const until = p.expiresAt
    ? new Date(p.expiresAt).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })
    : null;
  const terms = [
    p.maxDiscountInr != null ? t.upTo(rupees(p.maxDiscountInr)) : null,
    p.minRechargeInr > 0 ? t.min(rupees(p.minRechargeInr)) : null,
    until ? t.until(until) : null,
  ].filter(Boolean);
  const params = new URLSearchParams({ promo: p.code, ...(p.minRechargeInr > 0 ? { amount: String(p.minRechargeInr) } : {}) });

  return (
    <article className="flex h-full flex-col gap-3 rounded-3xl border border-line bg-surface-card p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="heading-5 text-brand-strong">{t.off(p.discountPercentage)}</p>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(p.code).then(
              () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              },
              () => {},
            );
          }}
          aria-label={`${t.copy}: ${p.code}`}
          className="title-4 inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-brand px-3 py-1.5 font-mono tracking-wider text-ink transition hover:bg-surface-sunken"
        >
          {p.code}
          <PiCopy className="h-4 w-4 text-ink-muted" aria-hidden />
        </button>
      </div>
      <span aria-live="polite" className="caption-5 -mt-2 h-4 text-success">
        {copied ? t.copied : ""}
      </span>
      {p.description && <p className="body-6 text-ink">{p.description}</p>}
      {terms.length > 0 && <p className="caption-2 text-ink-soft">{terms.join(" · ")}</p>}
      {!recharge && <p className="caption-2 text-ink-soft">{t.on(promoUse(p, locale))}</p>}
      {recharge && (
        <Link
          href={`/wallet?${params.toString()}#recharge`}
          className="button-sm mt-auto inline-flex w-fit items-center gap-2 rounded-xl bg-surface-inverse px-3 py-2 text-ink-inverse transition hover:bg-surface-inverse-raised motion-safe:active:scale-98"
        >
          {t.use}
          <PiArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </article>
  );
}
