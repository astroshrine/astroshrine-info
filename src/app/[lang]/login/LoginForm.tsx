"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PiCheckCircle } from "react-icons/pi";
import { getSupabase } from "@/lib/supabase";
import { initUser } from "@/lib/endpoints";
import { useAuth } from "@/components/AuthProvider";
import BrandMark from "@/components/BrandMark";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { stripLocale } from "@/i18n/paths";
import { fadeUp } from "@/lib/motion";
import { APP_HOME_PATH } from "@/lib/site";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

/**
 * Where to go after sign-in: ?next=/path on this site only (never another origin); the app home otherwise.
 * The language is taken off (a `next` built from the current URL carries the one it was made in), so the
 * router adds the language of this page: a language picked on the login page stays after signing in.
 */
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? stripLocale(next) : APP_HOME_PATH;
}

const text = defineMessages({
  hi: {
    perks: [
      "मुफ़्त कुंडली, और जन्म जानकारी सेव करने का विकल्प",
      "ऐप वाला ही wallet balance",
      "Astrologers से chat, वही account",
    ],
    oneAccount: "एक account, ऐप और वेबसाइट दोनों पर",
    otpOnly: "लॉगिन OTP से होता है। कोई password नहीं।",
    loginTitle: "लॉगिन करें",
    otpTitle: "OTP डालें",
    loginIntro: "AstroShrine ऐप वाले मोबाइल नंबर से। नया नंबर हो तो account अपने आप बन जाएगा।",
    otpIntro: (phone: string, digits: number) => `${phone} पर भेजा गया ${digits} अंकों का OTP डालें।`,
    phoneLabel: "मोबाइल नंबर",
    changeNumber: "नंबर बदलें",
    resendIn: (seconds: number) => `OTP फिर से भेजें (${seconds}s)`,
    resend: "OTP फिर से भेजें",
    wait: "कृपया रुकें…",
    sendOtp: "OTP भेजें",
    login: "लॉगिन करें",
    errors: {
      phone: "10 अंकों का मोबाइल नंबर डालें।",
      otp: (digits: number) => `${digits} अंकों का OTP डालें।`,
      verify: "OTP सत्यापित नहीं हुआ। OTP जांचकर फिर कोशिश करें।",
    },
  },
  en: {
    perks: [
      "A free Kundli, with the option to save your birth details",
      "The same wallet balance as the app",
      "Chat with astrologers on the same account",
    ],
    oneAccount: "One account for the app and the website",
    otpOnly: "You log in with an OTP. No password needed.",
    loginTitle: "Log in",
    otpTitle: "Enter the OTP",
    loginIntro: "With the mobile number you use in the AstroShrine app. A new number gets an account automatically.",
    otpIntro: (phone, digits) => `Enter the ${digits} digit OTP sent to ${phone}.`,
    phoneLabel: "Mobile number",
    changeNumber: "Change number",
    resendIn: (seconds) => `Resend OTP (${seconds}s)`,
    resend: "Resend OTP",
    wait: "Please wait…",
    sendOtp: "Send OTP",
    login: "Log in",
    errors: {
      phone: "Enter a 10 digit mobile number.",
      otp: (digits) => `Enter the ${digits} digit OTP.`,
      verify: "The OTP could not be verified. Check the OTP and try again.",
    },
  },
});

export default function LoginForm() {
  const router = useRouter();
  const { status, refresh, blockedMessage } = useAuth();
  const t = useT(text);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // Already signed in (or a session restored from this browser): nothing to do here.
  useEffect(() => {
    if (status === "signedIn" && !busy) router.replace(nextPath());
  }, [status, busy, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const fullPhone = `+91${phone}`;

  async function sendOtp() {
    if (phone.length !== 10) {
      setError(t.errors.phone);
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().auth.signInWithOtp({ phone: fullPhone });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("otp");
    setOtp("");
    setResendIn(RESEND_SECONDS);
  }

  async function verifyOtp() {
    if (otp.length !== OTP_LENGTH) {
      setError(t.errors.otp(OTP_LENGTH));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data, error } = await getSupabase().auth.verifyOtp({ phone: fullPhone, token: otp, type: "sms" });
      if (error || !data.user) {
        setError(error?.message || t.errors.verify);
        return;
      }
      // Same as the app after OTP: create / update the users row in the shared database.
      // Non-fatal, like the app: the database trigger usually created it already.
      try {
        await initUser(data.user.id, data.user.phone);
      } catch (e) {
        console.warn("[login] user init failed (non-fatal):", e);
      }
      await refresh();
      router.replace(nextPath());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 md:px-8 lg:grid-cols-2 lg:items-stretch lg:py-16">
      {/* Desktop: what the account gives you, beside the form. */}
      <motion.aside
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="on-inverse hidden flex-col justify-between gap-12 rounded-3xl bg-surface-inverse p-12 text-ink-inverse lg:flex"
      >
        <div className="flex items-center gap-3">
          <BrandMark size={48} />
          <span className="title-1">AstroShrine</span>
        </div>
        <div>
          <h2 className="heading-4 max-w-[680px]">{t.oneAccount}</h2>
          <ul className="mt-8 flex flex-col gap-4">
            {t.perks.map((perk) => (
              <li key={perk} className="body-3 flex items-start gap-3 text-ink-inverse-soft">
                <PiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-on-inverse" aria-hidden />
                {perk}
              </li>
            ))}
          </ul>
        </div>
        <p className="caption-5 text-ink-inverse-soft">{t.otpOnly}</p>
      </motion.aside>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="show"
        aria-labelledby="login-title"
        className="flex flex-col justify-center rounded-3xl border border-line bg-surface-card p-6 md:p-12"
      >
        <div className="flex items-center gap-3 lg:hidden">
          <BrandMark size={40} />
          <span className="title-2 text-ink">AstroShrine</span>
        </div>
        <h1 id="login-title" className="heading-5 mt-6 text-ink lg:mt-0">
          {step === "phone" ? t.loginTitle : t.otpTitle}
        </h1>
        <p className="body-6 mt-2 text-ink-soft">{step === "phone" ? t.loginIntro : t.otpIntro(fullPhone, OTP_LENGTH)}</p>

        <form
          noValidate
          className="mt-8 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void (step === "phone" ? sendOtp() : verifyOtp());
          }}
        >
          {blockedMessage && (
            <p role="alert" className="body-6 rounded-xl bg-danger-soft px-3 py-2 text-danger">
              {blockedMessage}
            </p>
          )}

          {step === "phone" ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="title-4 text-ink">
                {t.phoneLabel}
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface-page px-3 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
                <span className="caption-1 shrink-0 whitespace-nowrap text-ink-soft">IN +91</span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  autoFocus
                  required
                  aria-invalid={!!error}
                  aria-describedby={error ? "login-error" : undefined}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210"
                  className="body-3 min-w-0 flex-1 bg-transparent py-3 text-ink placeholder:text-ink-muted focus-visible:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor="otp" className="title-4 text-ink">
                  OTP
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError(null);
                  }}
                  className="caption-3 rounded-sm text-brand-strong transition hover:text-ink"
                >
                  {t.changeNumber}
                </button>
              </div>
              <input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                aria-invalid={!!error}
                aria-describedby={error ? "login-error" : undefined}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                placeholder="• • • • • •"
                className="heading-6 w-full rounded-xl border border-line-strong bg-surface-page px-3 py-3 text-center tracking-widest text-ink placeholder:text-ink-muted"
              />
              <button
                type="button"
                disabled={resendIn > 0 || busy}
                onClick={() => void sendOtp()}
                className="caption-3 w-fit rounded-sm text-brand-strong transition enabled:hover:text-ink disabled:text-ink-muted"
              >
                {resendIn > 0 ? t.resendIn(resendIn) : t.resend}
              </button>
            </div>
          )}

          {error && (
            <p id="login-error" role="alert" className="body-6 text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="button-md w-full rounded-full bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98 disabled:opacity-60"
          >
            {busy ? t.wait : step === "phone" ? t.sendOtp : t.login}
          </button>
        </form>
      </motion.section>
    </div>
  );
}
