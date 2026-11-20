"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { stripLocale } from "@/i18n/paths";
import { getUser, initUser } from "@/lib/endpoints";
import { getSupabase } from "@/lib/supabase";
import { A, css } from "../_console/dz";
import Rails from "../_console/Rails";
import { ASTROLOGER_ROLE } from "../_console/useAstrologer";

const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = defineMessages({
  hi: {
    eyebrow: "ज्योतिषी साइन इन",
    tA: "अपने ",
    tB: "ज्योतिषी",
    tC: " खाते में साइन इन करें",
    sub: "ऑनबोर्डिंग फ़ॉर्म में दिया मोबाइल नंबर या ईमेल उपयोग करें। हम आपको एक बार का कोड भेजेंगे।",
    notice: "यह साइन इन केवल ज्योतिषियों के लिए है।",
    noticeSub: "ग्राहक AstroShrine ऐप और वेबसाइट पर ज्योतिषियों से चैट या कॉल कर सकते हैं।",
    noticeLink: "astroshrine.in पर जाएँ",
    customer: "ज्योतिषी नहीं हैं?",
    customerLink: "उपयोगकर्ता लॉगिन",
    b1: "देश भर के जिज्ञासुओं से चैट और कॉल अनुरोध",
    b2: "कमाई का पूरा हिसाब कंसोल में",
    b3: "कंसोल हिंदी या अंग्रेज़ी में चलाएँ",
    cardTitle: "ज्योतिषी साइन इन",
    mobile: "मोबाइल नंबर",
    mobileHelp: "हम SMS से 6 अंकों का कोड भेजेंगे।",
    sendCode: "कोड भेजें",
    codeLabel: "6 अंकों का कोड दर्ज करें",
    codeSent: (to: string) => `${to} पर भेजा गया`,
    change: "नंबर बदलें",
    resendIn: (s: string) => `0:${s} में कोड दोबारा भेजें`,
    resend: "कोड दोबारा भेजें",
    signInBtn: "साइन इन करें",
    or: "या",
    newHere: "AstroShrine पर नए हैं?",
    joinBtn: "ज्योतिषी के रूप में जुड़ें",
    terms: "कोड से साइन इन करके आप ज्योतिषी अनुबंध, सेवा की शर्तें और गोपनीयता नीति स्वीकार करते हैं।",
    phonePh: "98765 43210",
    byMobile: "मोबाइल नंबर",
    byEmail: "ईमेल",
    method: "साइन इन का तरीका",
    email: "ईमेल पता",
    emailPh: "name@example.com",
    emailHelp: "हम इस ईमेल पर 6 अंकों का कोड भेजेंगे।",
    changeEmail: "ईमेल बदलें",
    firstNote: "पहला साइन इन: आप एक बार अपनी प्रोफ़ाइल जाँचेंगे।",
    notRegistered: "अभी पंजीकरण नहीं हुआ? पहले ऑनबोर्डिंग फ़ॉर्म भरें।",
    badEmail: "सही ईमेल पता दर्ज करें, जैसे name@example.com।",
    badPhone: "अपना 10 अंकों का मोबाइल नंबर दर्ज करें।",
    noAccTitle: "कोई ज्योतिषी खाता नहीं मिला",
    noAccEmail: (v: string) => `${v} के लिए AstroShrine पर कोई ज्योतिषी खाता नहीं है। हम ऑनबोर्डिंग और KYC फ़ॉर्म जाँचने के बाद ही खाता बनाते हैं।`,
    noAccPhone: (v: string) => `+91 ${v} के लिए AstroShrine पर कोई ज्योतिषी खाता नहीं है। हम ऑनबोर्डिंग और KYC फ़ॉर्म जाँचने के बाद ही खाता बनाते हैं।`,
    noAccHelp: "दोनों फ़ॉर्म भर चुके हैं? वही ईमेल या नंबर उपयोग करें जो आपने वहाँ दिया था, या हमारे पुष्टि संदेश की प्रतीक्षा करें।",
    noAccJoin: "जुड़ने का तरीका देखें",
    tryOther: "दूसरा आज़माएँ",
    codeNeeded: "साइन इन के लिए सभी 6 अंक दर्ज करें।",
    wait: "कृपया रुकें…",
    errOtp: "6 अंकों का कोड दर्ज करें।",
    errVerify: "कोड सत्यापित नहीं हुआ। कोड जाँचकर फिर कोशिश करें।",
    errSend: "कोड नहीं भेजा जा सका। विवरण जाँचकर फिर कोशिश करें।",
  },
  en: {
    eyebrow: "Astrologer sign in",
    tA: "Sign in to your ",
    tB: "astrologer",
    tC: " account",
    sub: "Use the mobile number or email you gave in your onboarding form. We will send you a one-time code.",
    notice: "This sign-in is only for astrologers.",
    noticeSub: "Customers can chat with or call astrologers on the AstroShrine app and website.",
    noticeLink: "Go to astroshrine.in",
    customer: "Not an astrologer?",
    customerLink: "User login",
    b1: "Chat and call requests from seekers across India",
    b2: "Your earnings, clearly shown in the console",
    b3: "Use the console in Hindi or English",
    cardTitle: "Astrologer sign in",
    mobile: "Mobile number",
    mobileHelp: "We will send a 6-digit code by SMS.",
    sendCode: "Send code",
    codeLabel: "Enter the 6-digit code",
    codeSent: (to: string) => `Sent to ${to}`,
    change: "Change number",
    resendIn: (s: string) => `Resend code in 0:${s}`,
    resend: "Resend code",
    signInBtn: "Sign in",
    or: "or",
    newHere: "New to AstroShrine?",
    joinBtn: "Join as an astrologer",
    terms: "By signing in with the code, you accept the astrologer agreement, the Terms of Service and the Privacy Policy.",
    phonePh: "98765 43210",
    byMobile: "Mobile number",
    byEmail: "Email",
    method: "Sign in with",
    email: "Email address",
    emailPh: "name@example.com",
    emailHelp: "We will send a 6-digit code to this email.",
    changeEmail: "Change email",
    firstNote: "First sign-in: you will check your profile once.",
    notRegistered: "Not registered yet? Fill the onboarding form first.",
    badEmail: "Enter a valid email address, like name@example.com.",
    badPhone: "Enter your 10-digit mobile number.",
    noAccTitle: "No astrologer account found",
    noAccEmail: (v: string) => `There is no AstroShrine astrologer account for ${v}. We create an account only after checking the onboarding and KYC forms.`,
    noAccPhone: (v: string) => `There is no AstroShrine astrologer account for +91 ${v}. We create an account only after checking the onboarding and KYC forms.`,
    noAccHelp: "Already filled both forms? Use the same email or number you gave there, or wait for our confirmation message.",
    noAccJoin: "See how to join",
    tryOther: "Try another",
    codeNeeded: "Enter all 6 digits to sign in.",
    wait: "Please wait…",
    errOtp: "Enter the 6-digit code.",
    errVerify: "The code could not be verified. Check it and try again.",
    errSend: "The code could not be sent. Check the details and try again.",
  },
});

/** Where to go after sign-in: ?next=/path on this site only; the console home otherwise. */
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? stripLocale(next) : "/astrologer";
}

/** The segmented control's two buttons (Mobile number | Email). */
const seg = (on: boolean) =>
  `height:44px;border-radius:11px;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;${on ? "background:#14213D;color:#FBF6EC" : "background:transparent;color:#14213D"}`;

/**
 * Astrologer sign in: a one-time code by SMS or by email through Supabase, then the account must have the
 * ASTROLOGER role. The astrologer's account is created by the AstroShrine team with both the mobile number and
 * the email on it, so either one signs in to the same account.
 */
export default function LoginPanel() {
  const t = useT(text);
  const router = useRouter();
  const { status, user, refresh, signOut } = useAuth();
  const [via, setVia] = useState<"mobile" | "email">("mobile");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAcc, setNoAcc] = useState(false);

  // Already signed in as an astrologer: straight to the console.
  useEffect(() => {
    if (status === "signedIn" && user?.role === ASTROLOGER_ROLE && !busy) router.replace(nextPath());
  }, [status, user, busy, router]);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const byEmail = via === "email";
  const mail = email.trim();
  const fullPhone = `+91${phone}`;
  const digits = phone.replace(/\D/g, "");
  const shown = digits.length >= 10 ? `${digits.slice(0, 5)} ${digits.slice(5, 10)}` : digits || "98765 43210";

  async function sendCode() {
    if (busy) return;
    if (byEmail ? !EMAIL_PATTERN.test(mail) : phone.length !== 10) {
      setError(byEmail ? t.badEmail : t.badPhone);
      return;
    }
    setBusy(true);
    setError(null);
    setNoAcc(false);
    // An email code never creates an account: the astrologer's own account must already exist.
    const { error: err } = byEmail
      ? await getSupabase().auth.signInWithOtp({ email: mail, options: { shouldCreateUser: false } })
      : await getSupabase().auth.signInWithOtp({ phone: fullPhone });
    setBusy(false);
    if (err) {
      if (byEmail && (err.code === "otp_disabled" || /signups? not allowed/i.test(err.message))) setNoAcc(true);
      else setError(err.message || t.errSend);
      return;
    }
    setStep("otp");
    setCode("");
    setLeft(RESEND_SECONDS);
  }

  async function verify() {
    if (busy) return;
    if (code.length !== OTP_LENGTH) {
      setError(t.errOtp);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data, error: err } = byEmail
        ? await getSupabase().auth.verifyOtp({ email: mail, token: code, type: "email" })
        : await getSupabase().auth.verifyOtp({ phone: fullPhone, token: code, type: "sms" });
      if (err || !data.user) {
        setError(err?.message || t.errVerify);
        return;
      }
      try {
        await initUser(data.user.id, data.user.phone);
      } catch (e) {
        console.warn("[astrologer login] user init failed (non-fatal):", e);
      }
      let role: string | null | undefined;
      try {
        role = (await getUser(data.user.id)).role;
      } catch (e) {
        await signOut();
        setError(e instanceof Error ? e.message : t.errVerify);
        return;
      }
      if (role !== ASTROLOGER_ROLE) {
        await signOut();
        setStep("phone");
        setNoAcc(true);
        return;
      }
      await refresh();
      router.replace(nextPath());
    } finally {
      setBusy(false);
    }
  }

  const pad = (n: number) => (n < 10 ? "0" : "") + n;
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    void (step === "phone" ? sendCode() : verify());
  };
  const fresh = () => {
    setError(null);
    setNoAcc(false);
  };

  // The names below are what the markup reads.
  const byMobile = !byEmail;
  const mStyle = seg(byMobile);
  const eStyle = seg(byEmail);
  const pickMobile = () => {
    setVia("mobile");
    fresh();
  };
  const pickEmail = () => {
    setVia("email");
    fresh();
  };
  const onEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    fresh();
  };
  const onPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
    fresh();
  };
  const onCode = (e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH));
  const isPhone = step === "phone";
  const isOtp = step === "otp";
  const errBad = !!error;
  const errText = error ?? "";
  const errNoAcc = noAcc;
  const noAccText = byEmail ? t.noAccEmail(mail) : t.noAccPhone(shown);
  const showJoin = !(noAcc && step === "phone");
  const clearErr = () => {
    fresh();
    setEmail("");
    setPhone("");
  };
  const codeOk = code.length === OTP_LENGTH;
  const codeShort = !codeOk;
  const codeSent = t.codeSent(byEmail ? mail : `+91 ${shown}`);
  const changeText = byEmail ? t.changeEmail : t.change;
  const changeNo = () => {
    setStep("phone");
    fresh();
  };
  const firstTime = true;
  const resendText = left > 0 ? t.resendIn(pad(left)) : t.resend;
  const resendStyle = `font-size:14px;font-weight:700;${left > 0 ? "color:#555D74;cursor:default" : "color:#8A5A00"}`;
  const resend = () => {
    if (left === 0) void sendCode();
  };

  return (
    <div className="dz flex flex-1 flex-col">
      <div className="stage pg-in">
        <Rails />
        <div className="wrap">
          <div style={{display:"flex",flexWrap:"wrap",gap:"48px",alignItems:"center",padding:"16px 0"}}>
            <section className="rise d1" style={{flex:"1 1 480px",minWidth:"0",display:"flex",flexDirection:"column",gap:"22px"}}>
              <div>
                <p className="dv">
                  {t.eyebrow}
                </p>
                <h1 className="ttl">
                  {t.tA}
                  <em>
                    {t.tB}
                  </em>
                  {t.tC}
                </h1>
                <p className="sub">
                  {t.sub}
                </p>
              </div>
              <div style={{display:"flex",gap:"14px",alignItems:"flex-start",padding:"18px 20px",borderRadius:"18px",background:"#FFF0CC",border:"1px solid #F2D58A"}}>
                <span className="ico wig" aria-hidden="true" style={{width:"44px",height:"44px"}}>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5M12 8h.01" />
                  </svg>
                </span>
                <div>
                  <b style={{display:"block",fontSize:"17px"}}>
                    {t.notice}
                  </b>
                  <span style={{fontSize:"15px",color:"#555D74"}}>
                    {t.noticeSub}
                  </span>
                  <A href="https://www.astroshrine.in" target="_blank" rel="noopener" style={{display:"inline-block",marginTop:"6px",fontWeight:"700",color:"#8A5A00",textDecoration:"underline",textUnderlineOffset:"3px"}}>
                    {t.noticeLink} ↗
                  </A>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"14px",marginTop:"4px"}}>
                <div className="rise" style={{display:"flex",alignItems:"center",gap:"16px",animationDelay:"0.20s"}}>
                  <span className="ico bob" style={{width:"52px",height:"52px",animationDelay:"0.0s"}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <circle cx="9" cy="8" r="3.5" />
                      <path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5" />
                      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.6 3.5 5.2" />
                    </svg>
                  </span>
                  <span style={{fontSize:"17px",fontWeight:"600"}}>
                    {t.b1}
                  </span>
                </div>
                <div className="rise" style={{display:"flex",alignItems:"center",gap:"16px",animationDelay:"0.30s"}}>
                  <span className="ico bob" style={{width:"52px",height:"52px",animationDelay:"0.5s"}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M3 10h18L12 4z" />
                      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" />
                    </svg>
                  </span>
                  <span style={{fontSize:"17px",fontWeight:"600"}}>
                    {t.b2}
                  </span>
                </div>
                <div className="rise" style={{display:"flex",alignItems:"center",gap:"16px",animationDelay:"0.40s"}}>
                  <span className="ico bob" style={{width:"52px",height:"52px",animationDelay:"1.0s"}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8" />
                      <path d="M11 5c0 4-3 7-7 8" />
                      <path d="M13 21l4-9 4 9M14.5 18h5" />
                    </svg>
                  </span>
                  <span style={{fontSize:"17px",fontWeight:"600"}}>
                    {t.b3}
                  </span>
                </div>
              </div>
                  </section>
            <section aria-labelledby="ct" className="card rise d2" style={{flex:"1 1 400px",maxWidth:"500px",minWidth:"0",padding:"48px 36px 32px",borderRadius:"220px 220px 22px 22px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",gap:"16px",boxShadow:"0 30px 60px -40px rgba(20,33,61,.5)"}}>
              <div className="bob">
                <Image src="/logo.png" alt="" width="76" height="76" style={{width:"76px",height:"76px",display:"block",flex:"none"}} />
              </div>
              <h2 id="ct" className="h2" style={{fontSize:"26px"}}>
                {t.cardTitle}
              </h2>
              {(isPhone) && (<>
                <div role="group" aria-label={t.method} style={{width:"100%",display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:"4px",background:"#F4ECDB",borderRadius:"14px",padding:"4px"}}>
                  <button type="button" className="tap" onClick={pickMobile} aria-pressed={byMobile} style={css(mStyle)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                    </svg>
                    {t.byMobile}
                  </button>
                  <button type="button" className="tap" onClick={pickEmail} aria-pressed={byEmail} style={css(eStyle)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                    {t.byEmail}
                  </button>
                </div>
                {(byEmail) && (<>
                  <div style={{width:"100%",textAlign:"left"}}>
                    <label htmlFor="em" className="lbl" style={{display:"block",marginBottom:"6px",fontSize:"14px",color:"#14213D"}}>
                      {t.email}
                    </label>
                    <input id="em" type="email" inputMode="email" autoComplete="email" value={email} onChange={onEmail} onKeyDown={onEnter} autoFocus placeholder={t.emailPh} style={{height:"54px",borderRadius:"14px",border:"1px solid #E3D2A6",background:"#FBF6EC",padding:"0 16px",fontSize:"17px",color:"#14213D",width:"100%"}} />
                    <div style={{fontSize:"14px",color:"#555D74",marginTop:"6px"}}>
                      {t.emailHelp}
                    </div>
                  </div>
                </>)}
                {(byMobile) && (<>
                  <div style={{width:"100%",textAlign:"left"}}>
                    <label htmlFor="ph" className="lbl" style={{display:"block",marginBottom:"6px",fontSize:"14px",color:"#14213D"}}>
                      {t.mobile}
                    </label>
                    <div style={{display:"flex",gap:"8px"}}>
                      <span style={{height:"54px",padding:"0 14px",borderRadius:"14px",border:"1px solid #E3D2A6",background:"#F4ECDB",display:"flex",alignItems:"center",fontWeight:"700",fontSize:"17px"}}>
                        +91
                      </span>
                      <input id="ph" inputMode="numeric" autoComplete="tel" value={phone} onChange={onPhone} onKeyDown={onEnter} autoFocus placeholder={t.phonePh} style={{height:"54px",borderRadius:"14px",border:"1px solid #E3D2A6",background:"#FBF6EC",padding:"0 16px",fontSize:"17px",color:"#14213D",width:"100%",flex:"1",minWidth:"0"}} />
                    </div>
                    <div style={{fontSize:"14px",color:"#555D74",marginTop:"6px"}}>
                      {t.mobileHelp}
                    </div>
                  </div>
                </>)}
                {(errBad) && (<>
                  <div role="alert" style={{width:"100%",display:"flex",gap:"8px",alignItems:"flex-start",textAlign:"left",fontSize:"14.5px",fontWeight:"600",color:"#B42318"}}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B42318" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none",marginTop:"2px"}}>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 11v5M12 8h.01" />
                    </svg>
                    <span>
                      {errText}
                    </span>
                  </div>
                </>)}
                {(errNoAcc) && (<>
                  <div role="alert" className="rise" style={{width:"100%",textAlign:"left",padding:"16px 16px 14px",borderRadius:"16px",background:"#FEF3F2",border:"1.5px solid #F4B7B1",animationDuration:".35s"}}>
                    <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
                      <span style={{width:"34px",height:"34px",borderRadius:"50%",background:"#B42318",display:"flex",alignItems:"center",justifyContent:"center",flex:"none"}}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
                        </svg>
                      </span>
                      <b style={{fontSize:"16px",color:"#7A1A12"}}>
                        {t.noAccTitle}
                      </b>
                    </div>
                    <p style={{margin:"8px 0 0",fontSize:"14.5px",lineHeight:"1.55",color:"#14213D",wordBreak:"break-word"}}>
                      {noAccText}
                    </p>
                    <p style={{margin:"6px 0 0",fontSize:"13.5px",lineHeight:"1.5",color:"#555D74"}}>
                      {t.noAccHelp}
                    </p>
                    <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginTop:"12px"}}>
                      <A href="/astrologer/join" className="btn b-navy tap" style={{height:"42px",padding:"0 16px",fontSize:"14px"}}>
                        {t.noAccJoin}
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                          <path d="M5 12h14" />
                          <path d="M13 6l6 6-6 6" />
                        </svg>
                      </A>
                      <button type="button" className="btn b-line tap" onClick={clearErr} style={{height:"42px",padding:"0 16px",fontSize:"14px"}}>
                        {t.tryOther}
                      </button>
                    </div>
                  </div>
                </>)}
                <button type="button" className="btn b-navy tap lift glowy" onClick={sendCode} disabled={busy} style={{width:"100%",height:"56px",fontSize:"17px"}}>
                  {busy ? t.wait : t.sendCode}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </button>
              </>)}
              {(isOtp) && (<>
                <div style={{width:"100%",textAlign:"left"}}>
                  <label htmlFor="otp" className="lbl" style={{display:"block",marginBottom:"6px",fontSize:"14px",color:"#14213D"}}>
                    {t.codeLabel}
                  </label>
                  <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={onCode} onKeyDown={onEnter} autoFocus placeholder="• • • • • •" style={{height:"54px",borderRadius:"14px",border:"1px solid #E3D2A6",background:"#FBF6EC",padding:"0 16px",fontSize:"22px",color:"#14213D",width:"100%",textAlign:"center",letterSpacing:".5em",fontWeight:"700"}} />
                  <div style={{display:"flex",justifyContent:"space-between",gap:"10px",flexWrap:"wrap",fontSize:"14px",marginTop:"8px"}}>
                    <span style={{color:"#555D74"}}>
                      {codeSent}
                    </span>
                    <button type="button" className="tap" onClick={changeNo} style={{fontWeight:"700",color:"#8A5A00"}}>
                      {changeText}
                    </button>
                  </div>
                </div>
                {(codeOk) && (<>
                  <button type="button" className="btn b-navy tap lift" onClick={verify} disabled={busy} style={{width:"100%",height:"56px",fontSize:"17px"}}>
                    {busy ? t.wait : t.signInBtn}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M5 12h14" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </>)}
                {(codeShort) && (<>
                  <span role="button" aria-disabled="true" className="btn" style={{width:"100%",height:"56px",fontSize:"17px",background:"#D9D4C7",color:"#555D74",cursor:"not-allowed"}}>
                    {t.signInBtn}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555D74" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M5 12h14" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                  </span>
                  <div style={{fontSize:"13.5px",color:"#555D74",marginTop:"-6px"}}>
                    {t.codeNeeded}
                  </div>
                </>)}
                {(firstTime) && (<>
                  <div style={{fontSize:"14px",color:"#8A5A00",fontWeight:"600"}}>
                    {t.firstNote}
                  </div>
                </>)}
                <button type="button" className="tap" onClick={resend} style={css(resendStyle)}>
                  {resendText}
                </button>
              </>)}
              {(showJoin) && (<>
                <div style={{width:"100%",display:"flex",alignItems:"center",gap:"12px",color:"#555D74",fontSize:"14px"}}>
                  <span style={{flex:"1",height:"1px",background:"#EBDFC6"}}>
                  </span>
                  {t.or}
                  <span style={{flex:"1",height:"1px",background:"#EBDFC6"}}>
                  </span>
                </div>
                <div style={{fontSize:"15px",color:"#555D74"}}>
                  {t.newHere} {t.notRegistered}
                </div>
                <A href="/astrologer/join" className="btn b-gold tap lift" style={{width:"100%",height:"54px",fontSize:"16px"}}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                    <path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z" />
                  </svg>
                  {t.joinBtn}
                </A>
              </>)}
              <div style={{fontSize:"15px",color:"#555D74"}}>
                {t.customer}{" "}
                <A href="/login" style={{fontWeight:"700",color:"#8A5A00",textDecoration:"underline",textUnderlineOffset:"3px"}}>
                  {t.customerLink}
                </A>
              </div>
              <p style={{margin:"4px 0 0",fontSize:"13px",color:"#555D74"}}>
                {t.terms}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
