"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase";
import { getUser, initUser, profileComplete, type BackendUser } from "@/lib/endpoints";
import { ASTROLOGER_ROLE } from "../astrologer/_console/useAstrologer";
import { A, css } from "../astrologer/_console/dz";
import Rails from "../astrologer/_console/Rails";
import { useAuth } from "@/components/AuthProvider";
import { FRONT_GUEST, setFrontCookie } from "@/lib/frontDoor";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { localizeHref, stripLocale } from "@/i18n/paths";
import { APP_HOME_PATH, LANDING_PATH, PRIVACY_URL, TERMS_URL } from "@/lib/site";

/** Where an astrologer's account lands after signing in. */
const ASTROLOGER_HOME = "/astrologer";
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

/**
 * Where an account goes after sign-in, as in the app: an astrologer to the console; a customer without a name and
 * birth details to the details form first (then on to `next`); everyone else to `next`.
 */
function destinationFor(user: BackendUser | null | undefined) {
  if (user?.role === ASTROLOGER_ROLE) return ASTROLOGER_HOME;
  if (user && !profileComplete(user)) return `/profile/edit?welcome=1&next=${encodeURIComponent(nextPath())}`;
  return nextPath();
}

const text = defineMessages({
  hi: {
    eyebrow: "उपयोगकर्ता लॉगिन",
    tA: "अपने ",
    tB: "AstroShrine",
    tC: " खाते में लॉगिन करें",
    sub: "AstroShrine ऐप वाले मोबाइल नंबर से। हम आपको एक बार का OTP भेजेंगे। नया नंबर हो तो खाता अपने आप बन जाएगा।",
    notice: "क्या आप ज्योतिषी हैं?",
    noticeSub: "ज्योतिषी अपने अलग साइन इन पेज से कंसोल में जाते हैं।",
    noticeLink: "यहाँ साइन इन करें",
    b1: "भरोसेमंद ज्योतिषियों से चैट और कॉल",
    b2: "मुफ़्त कुंडली, और जन्म जानकारी सेव करने का विकल्प",
    b3: "ऐप और वेबसाइट पर एक ही खाता और wallet",
    cardTitle: "लॉगिन करें",
    otpTitle: "OTP डालें",
    who: "आप कौन हैं?",
    asUser: "उपयोगकर्ता",
    asAstrologer: "ज्योतिषी",
    mobile: "मोबाइल नंबर",
    mobileHelp: "हम SMS से 6 अंकों का OTP भेजेंगे। कोई password नहीं।",
    phonePh: "98765 43210",
    sendOtp: "OTP भेजें",
    codeLabel: "6 अंकों का OTP दर्ज करें",
    codeSent: (to: string) => `${to} पर भेजा गया`,
    change: "नंबर बदलें",
    resendIn: (s: string) => `0:${s} में OTP दोबारा भेजें`,
    resend: "OTP दोबारा भेजें",
    login: "लॉगिन करें",
    codeNeeded: "लॉगिन के लिए सभी 6 अंक दर्ज करें।",
    or: "या",
    guest: "बिना लॉगिन के आगे बढ़ें",
    termsA: "OTP से लॉगिन करके आप हमारी ",
    termsLink: "सेवा की शर्तें",
    termsAnd: " और ",
    privacyLink: "गोपनीयता नीति",
    termsB: " स्वीकार करते हैं।",
    wait: "कृपया रुकें…",
    errPhone: "अपना 10 अंकों का मोबाइल नंबर दर्ज करें।",
    errOtp: "6 अंकों का OTP दर्ज करें।",
    errVerify: "OTP सत्यापित नहीं हुआ। OTP जाँचकर फिर कोशिश करें।",
  },
  en: {
    eyebrow: "User login",
    tA: "Log in to your ",
    tB: "AstroShrine",
    tC: " account",
    sub: "With the mobile number you use in the AstroShrine app. We will send you a one-time code. A new number gets an account automatically.",
    notice: "Are you an astrologer?",
    noticeSub: "Astrologers sign in to their console on their own page.",
    noticeLink: "Astrologer sign in",
    b1: "Chat and call with verified astrologers",
    b2: "A free Kundli, with the option to save your birth details",
    b3: "One account and wallet on the app and the website",
    cardTitle: "Log in",
    otpTitle: "Enter the OTP",
    who: "Who are you?",
    asUser: "User",
    asAstrologer: "Astrologer",
    mobile: "Mobile number",
    mobileHelp: "We will send a 6-digit OTP by SMS. No password needed.",
    phonePh: "98765 43210",
    sendOtp: "Send OTP",
    codeLabel: "Enter the 6-digit OTP",
    codeSent: (to: string) => `Sent to ${to}`,
    change: "Change number",
    resendIn: (s: string) => `Resend OTP in 0:${s}`,
    resend: "Resend OTP",
    login: "Log in",
    codeNeeded: "Enter all 6 digits to log in.",
    or: "or",
    guest: "Continue without login",
    termsA: "By logging in with the OTP, you accept our ",
    termsLink: "Terms of Service",
    termsAnd: " and ",
    privacyLink: "Privacy Policy",
    termsB: ".",
    wait: "Please wait…",
    errPhone: "Enter your 10-digit mobile number.",
    errOtp: "Enter the 6-digit OTP.",
    errVerify: "The OTP could not be verified. Check it and try again.",
  },
});

/** The segmented control's two halves (User | Astrologer), as on the astrologer sign-in. */
const seg = (on: boolean) =>
  `height:44px;border-radius:11px;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;${on ? "background:#14213D;color:#FBF6EC" : "background:transparent;color:#14213D"}`;

const inputStyle = {
  height: "54px",
  borderRadius: "14px",
  border: "1px solid #E3D2A6",
  background: "#FBF6EC",
  padding: "0 16px",
  fontSize: "17px",
  color: "#14213D",
  width: "100%",
} as const;

const Arrow = ({ color = "#FFAE00" }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

/**
 * The customer login (the site's front door), in the astrologer sign-in's look: an OTP by SMS through Supabase, then
 * the account goes where the app sends it (destinationFor). "Continue without login" remembers the choice (AS_FRONT).
 */
export default function LoginForm() {
  const router = useRouter();
  const { status, user, refresh, blockedMessage } = useAuth();
  const t = useT(text);
  const locale = useLocale();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(0);

  // Already signed in (or a session restored from this browser): nothing to do here.
  // An astrologer's account goes to the astrologer console, not the customer pages.
  useEffect(() => {
    if (status === "signedIn" && !busy) router.replace(destinationFor(user));
  }, [status, user, busy, router]);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const fullPhone = `+91${phone}`;
  const shown = phone.length >= 10 ? `${phone.slice(0, 5)} ${phone.slice(5, 10)}` : phone;

  async function sendOtp() {
    if (busy) return;
    if (phone.length !== 10) {
      setError(t.errPhone);
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await getSupabase().auth.signInWithOtp({
      phone: fullPhone,
      // Read by the handle_new_user trigger into users.signup_platform; Supabase applies it only when the account is created.
      options: { data: { signup_platform: "web" } },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setStep("otp");
    setOtp("");
    setLeft(RESEND_SECONDS);
  }

  async function verifyOtp() {
    if (busy) return;
    if (otp.length !== OTP_LENGTH) {
      setError(t.errOtp);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data, error: err } = await getSupabase().auth.verifyOtp({ phone: fullPhone, token: otp, type: "sms" });
      if (err || !data.user) {
        setError(err?.message || t.errVerify);
        return;
      }
      // Same as the app after OTP: create / update the users row in the shared database.
      // Non-fatal, like the app: the database trigger usually created it already.
      try {
        await initUser(data.user.id, data.user.phone);
      } catch (e) {
        console.warn("[login] user init failed (non-fatal):", e);
      }
      // Which side of the site this account belongs to: an astrologer signing in here goes to the console.
      let account: BackendUser | undefined;
      try {
        account = await getUser(data.user.id);
      } catch {
        account = undefined; // unknown: the effect above sends them on once the account has loaded
      }
      await refresh();
      router.replace(destinationFor(account));
    } finally {
      setBusy(false);
    }
  }

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    void (step === "phone" ? sendOtp() : verifyOtp());
  };
  const continueAsGuest = () => {
    setFrontCookie(FRONT_GUEST);
    // A full page load, not router.push: the client router remembers the proxy's earlier redirect of the home
    // page to this login (production only) and would bring the visitor straight back here.
    window.location.assign(localizeHref(locale, LANDING_PATH));
  };
  const pad = (n: number) => (n < 10 ? "0" : "") + n;
  const isPhone = step === "phone";
  const codeOk = otp.length === OTP_LENGTH;
  const linkStyle = { fontWeight: 700, color: "#8A5A00", textDecoration: "underline", textUnderlineOffset: "3px" } as const;

  const benefits: Array<[string, React.ReactNode]> = [
    [
      t.b1,
      <>
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
      </>,
    ],
    [
      t.b2,
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 3l18 18M21 3L3 21M12 3v18M3 12h18" />
      </>,
    ],
    [
      t.b3,
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M16 12.5h2M3 10h18" />
      </>,
    ],
  ];

  return (
    <div className="dz flex flex-1 flex-col">
      <div className="stage pg-in">
        <Rails />
        <div className="wrap">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "48px", alignItems: "center", padding: "16px 0" }}>
            <section className="rise d1" style={{ flex: "1 1 480px", minWidth: "0", display: "flex", flexDirection: "column", gap: "22px" }}>
              <div>
                <p className="dv">{t.eyebrow}</p>
                <h1 className="ttl">
                  {t.tA}
                  <em>{t.tB}</em>
                  {t.tC}
                </h1>
                <p className="sub">{t.sub}</p>
              </div>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "18px 20px", borderRadius: "18px", background: "#FFF0CC", border: "1px solid #F2D58A" }}>
                <span className="ico wig" aria-hidden="true" style={{ width: "44px", height: "44px" }}>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
                    <path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z" />
                  </svg>
                </span>
                <div>
                  <b style={{ display: "block", fontSize: "17px" }}>{t.notice}</b>
                  <span style={{ fontSize: "15px", color: "#555D74" }}>{t.noticeSub} </span>
                  <A href="/astrologer/login" style={{ display: "inline-block", marginTop: "6px", ...linkStyle }}>
                    {t.noticeLink} →
                  </A>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "4px" }}>
                {benefits.map(([label, icon], i) => (
                  <div key={label} className="rise" style={{ display: "flex", alignItems: "center", gap: "16px", animationDelay: `${0.2 + i * 0.1}s` }}>
                    <span className="ico bob" style={{ width: "52px", height: "52px", animationDelay: `${i * 0.5}s` }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
                        {icon}
                      </svg>
                    </span>
                    <span style={{ fontSize: "17px", fontWeight: "600" }}>{label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section
              aria-labelledby="login-title"
              className="card rise d2"
              style={{ flex: "1 1 400px", maxWidth: "500px", minWidth: "0", padding: "48px 36px 32px", borderRadius: "220px 220px 22px 22px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", boxShadow: "0 30px 60px -40px rgba(20,33,61,.5)" }}
            >
              <div className="bob">
                <Image src="/logo.png" alt="" width="76" height="76" style={{ width: "76px", height: "76px", display: "block", flex: "none" }} />
              </div>
              <h2 id="login-title" className="h2" style={{ fontSize: "26px" }}>
                {isPhone ? t.cardTitle : t.otpTitle}
              </h2>

              {blockedMessage && (
                <p role="alert" style={{ width: "100%", margin: 0, padding: "10px 14px", borderRadius: "12px", background: "#FEF3F2", border: "1px solid #F4B7B1", color: "#B42318", fontSize: "14.5px", fontWeight: 600, textAlign: "left" }}>
                  {blockedMessage}
                </p>
              )}

              {isPhone && (
                <>
                  {/* The front door, as in the app: customers log in here, astrologers on their own sign-in page. */}
                  <nav aria-label={t.who} style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "4px", background: "#F4ECDB", borderRadius: "14px", padding: "4px" }}>
                    <span aria-current="page" style={css(seg(true))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
                      </svg>
                      {t.asUser}
                    </span>
                    <A href="/astrologer/login" className="tap" style={css(seg(false))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
                        <path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z" />
                      </svg>
                      {t.asAstrologer}
                    </A>
                  </nav>
                  <div style={{ width: "100%", textAlign: "left" }}>
                    <label htmlFor="phone" className="lbl" style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#14213D" }}>
                      {t.mobile}
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span style={{ height: "54px", padding: "0 14px", borderRadius: "14px", border: "1px solid #E3D2A6", background: "#F4ECDB", display: "flex", alignItems: "center", fontWeight: "700", fontSize: "17px" }}>
                        +91
                      </span>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        autoFocus
                        aria-invalid={!!error}
                        aria-describedby={error ? "login-error" : undefined}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                          setError(null);
                        }}
                        onKeyDown={onEnter}
                        placeholder={t.phonePh}
                        style={{ ...inputStyle, flex: "1", minWidth: "0" }}
                      />
                    </div>
                    <div style={{ fontSize: "14px", color: "#555D74", marginTop: "6px" }}>{t.mobileHelp}</div>
                  </div>
                </>
              )}

              {!isPhone && (
                <div style={{ width: "100%", textAlign: "left" }}>
                  <label htmlFor="otp" className="lbl" style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#14213D" }}>
                    {t.codeLabel}
                  </label>
                  <input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_LENGTH}
                    autoFocus
                    aria-invalid={!!error}
                    aria-describedby={error ? "login-error" : undefined}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                    onKeyDown={onEnter}
                    placeholder="• • • • • •"
                    style={{ ...inputStyle, fontSize: "22px", textAlign: "center", letterSpacing: ".5em", fontWeight: "700" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", fontSize: "14px", marginTop: "8px" }}>
                    <span style={{ color: "#555D74" }}>{t.codeSent(`+91 ${shown}`)}</span>
                    <button
                      type="button"
                      className="tap"
                      onClick={() => {
                        setStep("phone");
                        setError(null);
                      }}
                      style={{ fontWeight: "700", color: "#8A5A00" }}
                    >
                      {t.change}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div id="login-error" role="alert" style={{ width: "100%", display: "flex", gap: "8px", alignItems: "flex-start", textAlign: "left", fontSize: "14.5px", fontWeight: "600", color: "#B42318" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B42318" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "2px" }}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5M12 8h.01" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {isPhone ? (
                <button type="button" className="btn b-navy tap lift glowy" onClick={() => void sendOtp()} disabled={busy} style={{ width: "100%", height: "56px", fontSize: "17px" }}>
                  {busy ? t.wait : t.sendOtp}
                  <Arrow />
                </button>
              ) : codeOk ? (
                <button type="button" className="btn b-navy tap lift" onClick={() => void verifyOtp()} disabled={busy} style={{ width: "100%", height: "56px", fontSize: "17px" }}>
                  {busy ? t.wait : t.login}
                  <Arrow />
                </button>
              ) : (
                <>
                  <span role="button" aria-disabled="true" className="btn" style={{ width: "100%", height: "56px", fontSize: "17px", background: "#D9D4C7", color: "#555D74", cursor: "not-allowed" }}>
                    {t.login}
                    <Arrow color="#555D74" />
                  </span>
                  <div style={{ fontSize: "13.5px", color: "#555D74", marginTop: "-6px" }}>{t.codeNeeded}</div>
                </>
              )}

              {!isPhone && (
                <button
                  type="button"
                  className="tap"
                  onClick={() => {
                    if (left === 0) void sendOtp();
                  }}
                  style={css(`font-size:14px;font-weight:700;${left > 0 ? "color:#555D74;cursor:default" : "color:#8A5A00"}`)}
                >
                  {left > 0 ? t.resendIn(pad(left)) : t.resend}
                </button>
              )}

              {isPhone && (
                <>
                  <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", color: "#555D74", fontSize: "14px" }}>
                    <span style={{ flex: "1", height: "1px", background: "#EBDFC6" }} />
                    {t.or}
                    <span style={{ flex: "1", height: "1px", background: "#EBDFC6" }} />
                  </div>
                  <button type="button" className="btn b-line tap lift" onClick={continueAsGuest} style={{ width: "100%", height: "54px", fontSize: "16px" }}>
                    {t.guest}
                    <Arrow color="#14213D" />
                  </button>
                </>
              )}

              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#555D74" }}>
                {t.termsA}
                <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  {t.termsLink}
                </a>
                {t.termsAnd}
                <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  {t.privacyLink}
                </a>
                {t.termsB}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
