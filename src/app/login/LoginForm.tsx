"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PiCheckCircle } from "react-icons/pi";
import { getSupabase } from "@/lib/supabase";
import { initUser } from "@/lib/endpoints";
import { useAuth } from "@/components/AuthProvider";
import BrandMark from "@/components/BrandMark";
import { fadeUp } from "@/lib/motion";
import { APP_HOME_PATH } from "@/lib/site";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

/** Where to go after sign-in: ?next=/path on this site only (never another origin); the app home otherwise. */
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : APP_HOME_PATH;
}

const PERKS = [
  "मुफ़्त कुंडली, और जन्म जानकारी सेव करने का विकल्प",
  "ऐप वाला ही wallet balance",
  "Astrologers से chat, वही account",
];

export default function LoginForm() {
  const router = useRouter();
  const { status, refresh, blockedMessage } = useAuth();
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
      setError("10 अंकों का मोबाइल नंबर डालें।");
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
      setError(`${OTP_LENGTH} अंकों का OTP डालें।`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data, error } = await getSupabase().auth.verifyOtp({ phone: fullPhone, token: otp, type: "sms" });
      if (error || !data.user) {
        setError(error?.message || "OTP सत्यापित नहीं हुआ। OTP जांचकर फिर कोशिश करें।");
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
          <h2 className="heading-4 max-w-[680px]">एक account, ऐप और वेबसाइट दोनों पर</h2>
          <ul className="mt-8 flex flex-col gap-4">
            {PERKS.map((perk) => (
              <li key={perk} className="body-3 flex items-start gap-3 text-ink-inverse-soft">
                <PiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-on-inverse" aria-hidden />
                {perk}
              </li>
            ))}
          </ul>
        </div>
        <p className="caption-5 text-ink-inverse-soft">लॉगिन OTP से होता है। कोई password नहीं।</p>
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
          {step === "phone" ? "लॉगिन करें" : "OTP डालें"}
        </h1>
        <p className="body-6 mt-2 text-ink-soft">
          {step === "phone"
            ? "AstroShrine ऐप वाले मोबाइल नंबर से। नया नंबर हो तो account अपने आप बन जाएगा।"
            : `${fullPhone} पर भेजा गया ${OTP_LENGTH} अंकों का OTP डालें।`}
        </p>

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
                मोबाइल नंबर
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
                  नंबर बदलें
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
                {resendIn > 0 ? `OTP फिर से भेजें (${resendIn}s)` : "OTP फिर से भेजें"}
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
            {busy ? "कृपया रुकें…" : step === "phone" ? "OTP भेजें" : "लॉगिन करें"}
          </button>
        </form>
      </motion.section>
    </div>
  );
}
