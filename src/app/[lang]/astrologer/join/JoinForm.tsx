"use client";

import { PiArrowRight, PiArrowSquareOut, PiCheck, PiClock, PiFileText, PiIdentificationCard, PiLock, PiShieldCheck, PiStar, PiTranslate, PiUsersThree } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import Rails from "../_console/Rails";
import { Accent, Button, Card, IconBadge, Ornament, Page, PageTitle, Pill } from "../_console/ui";

/** Applications are taken on the AstroShrine site; there is no self sign-up on this console. */
const ONBOARDING_URL = "https://astroshrine.in/astrologer-onboarding";

const text = defineMessages({
  hi: {
    eyebrow: "AstroShrine से जुड़ें",
    tA: "",
    tB: "AstroShrine ज्योतिषी",
    tC: " बनें",
    sub: "जुड़ना चार चरणों में होता है। आप आवेदन भरते हैं, हमारी टीम जाँच करके आपका खाता बनाती है, और फिर आप साइन इन करते हैं।",
    step: "चरण",
    j1: "आवेदन फ़ॉर्म भरें",
    j1t: "आपका पूरा नाम, मोबाइल नंबर, ईमेल, शहर, अनुभव, विशेषज्ञता और भाषाएँ। वही मोबाइल नंबर दें जिससे आप साइन इन करेंगे।",
    j1b: "आवेदन करें (astroshrine.in)",
    newTab: "नए टैब में खुलता है",
    j2: "दस्तावेज़ तैयार रखें",
    j2t: "आधार, पैन, प्रोफ़ाइल फ़ोटो और ज्योतिष प्रमाणपत्र (वैकल्पिक) आवेदन के साथ देने होंगे।",
    j3: "हम जाँच करके आपका खाता बनाते हैं",
    j3t: "हमारी टीम आपके विवरण और दस्तावेज़ों की जाँच करती है और स्वीकृति देती है।",
    j4: "साइन इन करें",
    j4t: "स्वीकृत होने पर इसी मोबाइल नंबर से साइन इन करें। पहली बार आप अपनी प्रोफ़ाइल एक बार जाँचेंगे, फिर शुरू कर सकते हैं।",
    j4b: "साइन इन पर जाएँ",
    readyTitle: "ये तैयार रखें",
    ready: ["पूरा नाम, मोबाइल नंबर, ईमेल, शहर और अनुभव", "आपकी शाखाएँ, भाषाएँ और आपके बारे में कुछ पंक्तियाँ", "आधार, पैन और प्रोफ़ाइल फ़ोटो", "ज्योतिष प्रमाणपत्र (वैकल्पिक)"],
    whyTitle: "AstroShrine से क्यों जुड़ें",
    w1: "जिज्ञासु स्वयं आप तक आते हैं",
    w2: "कमाई का पूरा हिसाब",
    w3: "हिंदी या अंग्रेज़ी में कंसोल",
    already: "पहले से AstroShrine ज्योतिषी हैं?",
    signIn: "साइन इन",
  },
  en: {
    eyebrow: "Join AstroShrine",
    tA: "Become an ",
    tB: "AstroShrine astrologer",
    tC: "",
    sub: "Joining takes four steps. You fill the application, our team checks it and creates your account, and then you sign in.",
    step: "Step",
    j1: "Fill the application",
    j1t: "Your full name, mobile number, email, city, experience, expertise and languages. Give the mobile number you will sign in with.",
    j1b: "Apply on astroshrine.in",
    newTab: "Opens in a new tab",
    j2: "Keep your documents ready",
    j2t: "Aadhaar, PAN, a profile photo and an astrology certificate (optional) go with your application.",
    j3: "We check it and create your account",
    j3t: "Our team checks your details and documents and approves you.",
    j4: "Sign in",
    j4t: "Once approved, sign in with the same mobile number. The first time, you check your profile once, and then you can start.",
    j4b: "Go to sign in",
    readyTitle: "Keep these ready",
    ready: ["Full name, mobile number, email, city and experience", "Your specialities, languages and a few lines about you", "Aadhaar, PAN and a profile photo", "An astrology certificate (optional)"],
    whyTitle: "Why join AstroShrine",
    w1: "Seekers come to you",
    w2: "Earnings, clearly shown",
    w3: "The console in Hindi or English",
    already: "Already an AstroShrine astrologer?",
    signIn: "Sign in",
  },
});

/** Join: the four steps to become an astrologer; the application itself is on astroshrine.in. */
export default function JoinForm() {
  const t = useT(text);
  const steps = [
    { icon: PiFileText, title: t.j1, body: t.j1t, action: { href: ONBOARDING_URL, label: t.j1b, external: true } },
    { icon: PiIdentificationCard, title: t.j2, body: t.j2t },
    { icon: PiShieldCheck, title: t.j3, body: t.j3t },
    { icon: PiLock, title: t.j4, body: t.j4t, action: { href: "/astrologer/login", label: t.j4b, external: false } },
  ];
  const why = [
    { icon: PiUsersThree, label: t.w1 },
    { icon: PiClock, label: t.w2 },
    { icon: PiTranslate, label: t.w3 },
  ];

  return (
    <div className="relative flex flex-1 flex-col">
      <Rails />
      <Page className="relative z-[1]">
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
        <Ornament />
        <div className="flex flex-wrap items-start gap-8">
          <ol className="m-0 flex min-w-0 flex-[1.6_1_520px] list-none flex-col gap-0 p-0">
            {steps.map(({ icon, title, body, action }, i) => (
              <li key={title} className="flex gap-4 sm:gap-5">
                <div className="flex flex-col items-center">
                  <IconBadge icon={icon} size={60} />
                  {i < steps.length - 1 && <span aria-hidden className="my-1 w-0 flex-1 border-l-2 border-dashed border-brand/70" />}
                </div>
                <Card as="article" className="mb-5 min-w-0 flex-1 px-5 py-5 sm:px-7">
                  <Pill>
                    {t.step} {i + 1}
                  </Pill>
                  <h2 className="mt-2 font-display text-2xl font-bold leading-tight">{title}</h2>
                  <p className="mt-1.5 text-[16px] text-ink-soft">{body}</p>
                  {action && (
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      {action.external ? (
                        <Button href={action.href} target="_blank" rel="noopener" variant="gold">
                          {action.label}
                          <PiArrowSquareOut className="h-[18px] w-[18px]" aria-hidden />
                        </Button>
                      ) : (
                        <Button href={action.href} variant="navy">
                          {action.label}
                          <PiArrowRight className="h-[18px] w-[18px] text-brand" aria-hidden />
                        </Button>
                      )}
                      {action.external && <span className="text-sm text-ink-soft">{t.newTab}</span>}
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ol>

          <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
            <Card aria-labelledby="rd" className="px-[26px] py-6">
              <div className="flex items-center gap-3.5">
                <IconBadge icon={PiFileText} size={44} />
                <h2 id="rd" className="font-display text-[22px] font-bold">
                  {t.readyTitle}
                </h2>
              </div>
              <ul className="mt-3 flex list-none flex-col p-0">
                {t.ready.map((r) => (
                  <li key={r} className="flex items-center gap-3 border-t border-line py-2.5 first:border-t-0 text-[15px]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-brand-strong">
                      <PiCheck className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
            <Card aria-labelledby="wy" className="px-[26px] py-6">
              <div className="flex items-center gap-3.5">
                <IconBadge icon={PiStar} size={44} />
                <h2 id="wy" className="font-display text-[22px] font-bold">
                  {t.whyTitle}
                </h2>
              </div>
              <ul className="mt-3 flex list-none flex-col gap-2.5 p-0">
                {why.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 font-semibold">
                    <Icon className="h-[18px] w-[18px] text-brand-strong" aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>
            </Card>
            <div className="text-center text-[15px] text-ink-soft">
              {t.already}{" "}
              <Link href="/astrologer/login" className="font-bold text-brand-strong underline underline-offset-[3px]">
                {t.signIn}
              </Link>
            </div>
          </aside>
        </div>
      </Page>
    </div>
  );
}
