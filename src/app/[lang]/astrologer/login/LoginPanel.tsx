"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PiArrowRight, PiBank, PiInfo, PiStar, PiTranslate, PiUsersThree } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "@/i18n/navigation";
import { stripLocale } from "@/i18n/paths";
import { getSupabase } from "@/lib/supabase";
import { getUser, initUser } from "@/lib/endpoints";
import Rails from "../_console/Rails";
import { ASTROLOGER_ROLE } from "../_console/useAstrologer";
import { Accent, Button, Card, IconBadge, Page, PageTitle, fieldClass } from "../_console/ui";

const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;

const text = defineMessages({
  hi: {
    eyebrow: "ज्योतिषी साइन इन",
    tA: "अपने ",
    tB: "ज्योतिषी",
    tC: " खाते में साइन इन करें",
    sub: "AstroShrine पर पंजीकृत मोबाइल नंबर का उपयोग करें। हम आपको एक बार का कोड भेजेंगे।",
    notice: "यह साइन इन केवल ज्योतिषियों के लिए है।",
    noticeSub: "ग्राहक AstroShrine ऐप और वेबसाइट पर ज्योतिषियों से चैट या कॉल कर सकते हैं।",
    noticeLink: "astroshrine.in पर जाएँ",
    b1: "देश भर के जिज्ञासुओं से चैट और कॉल अनुरोध",
    b2: "कमाई का पूरा हिसाब कंसोल में",
    b3: "कंसोल हिंदी या अंग्रेज़ी में चलाएँ",
    cardTitle: "ज्योतिषी साइन इन",
    mobile: "मोबाइल नंबर",
    mobileHelp: "हम SMS से 6 अंकों का कोड भेजेंगे।",
    sendCode: "कोड भेजें",
    codeLabel: "6 अंकों का कोड दर्ज करें",
    codeSent: (p: string) => `+91 ${p} पर भेजा गया`,
    change: "नंबर बदलें",
    resendIn: (s: string) => `0:${s} में कोड दोबारा भेजें`,
    resend: "कोड दोबारा भेजें",
    signInBtn: "साइन इन करें",
    or: "या",
    newHere: "AstroShrine पर नए हैं?",
    joinBtn: "ज्योतिषी के रूप में जुड़ें",
    wait: "कृपया रुकें…",
    errPhone: "10 अंकों का मोबाइल नंबर डालें।",
    errOtp: "6 अंकों का कोड दर्ज करें।",
    errVerify: "कोड सत्यापित नहीं हुआ। कोड जाँचकर फिर कोशिश करें।",
    notAstrologer: "यह नंबर ज्योतिषी खाते का नहीं है। ग्राहक AstroShrine ऐप या वेबसाइट पर साइन इन करें। ज्योतिषी बनने के लिए आवेदन करें, हमारी टीम स्वीकृति देगी।",
    firstNote: "पहली बार साइन इन: प्रोफ़ाइल एक बार जाँचनी होगी।",
    notRegistered: "अभी पंजीकृत नहीं हैं? पहले आवेदन फ़ॉर्म भरें।",
    terms: "साइन इन करके आप पवित्रता की शर्तों और गोपनीयता व्यवस्था से सहमत होते हैं।",
  },
  en: {
    eyebrow: "Astrologer sign in",
    tA: "Sign in to your ",
    tB: "astrologer",
    tC: " account",
    sub: "Use the mobile number registered with AstroShrine. We will send you a one-time code.",
    notice: "This sign-in is only for astrologers.",
    noticeSub: "Customers can chat with or call astrologers on the AstroShrine app and website.",
    noticeLink: "Go to astroshrine.in",
    b1: "Chat and call requests from seekers across India",
    b2: "Your earnings, clearly shown in the console",
    b3: "Use the console in Hindi or English",
    cardTitle: "Astrologer sign in",
    mobile: "Mobile number",
    mobileHelp: "We will send a 6-digit code by SMS.",
    sendCode: "Send code",
    codeLabel: "Enter the 6-digit code",
    codeSent: (p) => `Sent to +91 ${p}`,
    change: "Change number",
    resendIn: (s) => `Resend code in 0:${s}`,
    resend: "Resend code",
    signInBtn: "Sign in",
    or: "or",
    newHere: "New to AstroShrine?",
    joinBtn: "Join as an astrologer",
    wait: "Please wait…",
    errPhone: "Enter a 10 digit mobile number.",
    errOtp: "Enter the 6-digit code.",
    errVerify: "The code could not be verified. Check it and try again.",
    notAstrologer: "This number is not an astrologer account. Customers sign in on the AstroShrine app or website. To become an astrologer, apply and our team will approve you.",
    firstNote: "First sign-in: you will check your profile once.",
    notRegistered: "Not registered yet? Fill the application first.",
    terms: "By signing in, you agree to the Terms of Sanctity and the Privacy Architecture.",
  },
});

const SITE_URL = "https://www.astroshrine.in";

/** Where to go after sign-in: ?next=/path on this site only; the console home otherwise. */
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? stripLocale(next) : "/astrologer";
}

/** Astrologer sign in: phone OTP through Supabase, then the account must have the ASTROLOGER role. */
export default function LoginPanel() {
  const t = useT(text);
  const router = useRouter();
  const { status, user, refresh, signOut } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in as an astrologer: straight to the console.
  useEffect(() => {
    if (status === "signedIn" && user?.role === ASTROLOGER_ROLE && !busy) router.replace(nextPath());
  }, [status, user, busy, router]);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const fullPhone = `+91${phone}`;

  async function sendCode() {
    if (phone.length !== 10) {
      setError(t.errPhone);
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await getSupabase().auth.signInWithOtp({ phone: fullPhone });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setStep("otp");
    setCode("");
    setLeft(RESEND_SECONDS);
  }

  async function verify() {
    if (code.length !== OTP_LENGTH) {
      setError(t.errOtp);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data, error: err } = await getSupabase().auth.verifyOtp({ phone: fullPhone, token: code, type: "sms" });
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
        setError(t.notAstrologer);
        return;
      }
      await refresh();
      router.replace(nextPath());
    } finally {
      setBusy(false);
    }
  }

  const digits = phone.replace(/\D/g, "");
  const shown = digits.length >= 10 ? `${digits.slice(0, 5)} ${digits.slice(5, 10)}` : digits;
  const bullets = [
    { icon: PiUsersThree, label: t.b1 },
    { icon: PiBank, label: t.b2 },
    { icon: PiTranslate, label: t.b3 },
  ];

  return (
    <div className="relative flex flex-1 flex-col">
      <Rails />
      <Page className="relative z-[1]">
        <div className="flex flex-wrap items-center gap-12 py-4">
          <section className="flex min-w-0 flex-[1_1_480px] flex-col gap-[22px]">
            <PageTitle
              eyebrow={t.eyebrow}
              title={
                <>
                  {t.tA}
                  <Accent>{t.tB}</Accent>
                  {t.tC}
                </>
              }
              sub={t.sub}
            />
            <div className="flex items-start gap-3.5 rounded-[18px] border border-[#f2d58a] bg-surface-sunken px-5 py-[18px]">
              <IconBadge icon={PiInfo} size={44} />
              <div>
                <b className="block text-[17px]">{t.notice}</b>
                <span className="text-[15px] text-ink-soft">{t.noticeSub}</span>
                <a href={SITE_URL} target="_blank" rel="noopener" className="mt-1.5 block font-bold text-brand-strong underline underline-offset-[3px]">
                  {t.noticeLink} ↗
                </a>
              </div>
            </div>
            <div className="mt-1 flex flex-col gap-3.5">
              {bullets.map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-4">
                  <IconBadge icon={icon} size={52} />
                  <span className="text-[17px] font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </section>

          <Card
            aria-labelledby="ct"
            className="flex min-w-0 max-w-[500px] flex-[1_1_400px] flex-col items-center gap-4 rounded-b-[22px] rounded-t-[220px] px-9 pb-8 pt-12 text-center shadow-[0_30px_60px_-40px_rgba(20,33,61,0.5)]"
          >
            <Image src="/logo.png" alt="" width={76} height={76} className="h-[76px] w-[76px]" />
            <h2 id="ct" className="font-display text-[26px] font-bold leading-tight">
              {t.cardTitle}
            </h2>

            {step === "phone" ? (
              <form
                className="flex w-full flex-col gap-4"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!busy) void sendCode();
                }}
              >
                <div className="text-left">
                  <label htmlFor="ph" className="mb-1.5 block text-sm font-semibold">
                    {t.mobile}
                  </label>
                  <div className="flex gap-2">
                    <span className="flex h-[54px] items-center rounded-[14px] border border-line-strong bg-[#f4ecdb] px-3.5 text-[17px] font-bold">+91</span>
                    <input
                      id="ph"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      aria-invalid={!!error}
                      aria-describedby={error ? "login-error" : undefined}
                      autoFocus
                      className={`${fieldClass} h-[54px] min-w-0 flex-1 px-4 text-[17px]`}
                    />
                  </div>
                  <div className="mt-1.5 text-sm text-ink-soft">{t.mobileHelp}</div>
                </div>
                {error && (
                  <p id="login-error" role="alert" className="text-left text-sm font-semibold text-danger">
                    {error}
                  </p>
                )}
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? t.wait : t.sendCode}
                  <PiArrowRight className="h-[18px] w-[18px] text-brand" aria-hidden />
                </Button>
              </form>
            ) : (
              <form
                noValidate
                className="flex w-full flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!busy) void verify();
                }}
              >
                <div className="text-left">
                  <label htmlFor="otp" className="mb-1.5 block text-sm font-semibold">
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
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="• • • • • •"
                    className={`${fieldClass} h-[54px] text-center text-[22px] font-bold tracking-[0.5em]`}
                  />
                  <div className="mt-2 flex flex-wrap justify-between gap-2.5 text-sm">
                    <span className="text-ink-soft">{t.codeSent(shown)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("phone");
                        setError(null);
                      }} className="cursor-pointer font-bold text-brand-strong"
                    >
                      {t.change}
                    </button>
                  </div>
                </div>
                {error && (
                  <p id="login-error" role="alert" className="text-left text-sm font-semibold text-danger">
                    {error}
                  </p>
                )}
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? t.wait : t.signInBtn}
                  <PiArrowRight className="h-[18px] w-[18px] text-brand" aria-hidden />
                </Button>
                <p className="-mt-1 text-[13px] font-semibold text-brand-strong">{t.firstNote}</p>
                <button
                  type="button"
                  disabled={left > 0 || busy}
                  onClick={() => void sendCode()}
                  className={`text-sm font-bold ${left > 0 || busy ? "cursor-default text-ink-soft" : "cursor-pointer text-brand-strong"}`}
                >
                  {left > 0 ? t.resendIn(String(left).padStart(2, "0")) : t.resend}
                </button>
              </form>
            )}

            <div className="flex w-full items-center gap-3 text-sm text-ink-soft">
              <span className="h-px flex-1 bg-line" />
              {t.or}
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className="text-[15px] text-ink-soft">
              {t.newHere} {t.notRegistered}
            </div>
            <Button href="/astrologer/join" variant="gold" className="h-[54px] w-full text-base">
              <PiStar className="h-[17px] w-[17px]" aria-hidden />
              {t.joinBtn}
            </Button>
            <p className="mt-1 text-[13px] text-ink-soft">{t.terms}</p>
          </Card>
        </div>
      </Page>
    </div>
  );
}
