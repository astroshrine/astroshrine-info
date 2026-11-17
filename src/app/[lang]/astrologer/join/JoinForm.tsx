"use client";

import Image from "next/image";
import { PiArrowSquareOut, PiBank, PiCertificate, PiIdentificationCard, PiTranslate, PiUserCircle, PiUsersThree } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import Rails from "../_console/Rails";
import { Accent, Button, Card, IconBadge, Ornament, Page, PageTitle } from "../_console/ui";

/** Applications are taken on the AstroShrine site; there is no self sign-up on this console. */
const ONBOARDING_URL = "https://astroshrine.in/astrologer-onboarding";

const text = defineMessages({
  hi: {
    eyebrow: "AstroShrine से जुड़ें",
    tA: "",
    tB: "AstroShrine ज्योतिषी",
    tC: " बनें",
    sub: "जिज्ञासुओं का मार्गदर्शन करें। आवेदन AstroShrine की वेबसाइट पर होता है, और हमारी टीम हर आवेदन की जाँच करके स्वीकृति देती है।",
    applyTitle: "आवेदन कैसे करें",
    applyBody: "आवेदन फ़ॉर्म astroshrine.in पर खुलेगा। शुरू करने से पहले ये चीज़ें तैयार रखें।",
    prepare: [
      { title: "आपका विवरण", body: "पूरा नाम, मोबाइल नंबर, ईमेल, शहर और अनुभव।" },
      { title: "आपकी विशेषज्ञता", body: "आपकी शाखाएँ, भाषाएँ और आपके बारे में कुछ पंक्तियाँ।" },
      { title: "दस्तावेज़", body: "आधार, पैन, प्रोफ़ाइल फ़ोटो और ज्योतिष प्रमाणपत्र (वैकल्पिक)।" },
    ],
    apply: "आवेदन करें (astroshrine.in)",
    newTab: "नए टैब में खुलता है",
    approval: "आवेदन की जाँच हमारी टीम करती है और स्वीकृति देती है। स्वीकृत होने पर इसी मोबाइल नंबर से यहाँ साइन इन करें।",
    whyTitle: "AstroShrine से क्यों जुड़ें",
    w1: "जिज्ञासु स्वयं आप तक आते हैं",
    w1t: "चैट अनुरोध सीधे आपके कंसोल पर आते हैं।",
    w2: "कमाई का पूरा हिसाब",
    w2t: "कमाई पन्ने पर हर सत्र का विवरण देखें।",
    w3: "हिंदी या अंग्रेज़ी",
    w3t: "कंसोल अपनी पसंद की भाषा में चलाएँ।",
    nextTitle: "आगे क्या होगा",
    n1: "आप astroshrine.in पर आवेदन करते हैं।",
    n2: "हमारी टीम आपके विवरण की जाँच करती है।",
    n3: "स्वीकृति के बाद आप साइन इन करके ऑनलाइन आ सकते हैं।",
    already: "पहले से AstroShrine ज्योतिषी हैं?",
    signIn: "साइन इन",
  },
  en: {
    eyebrow: "Join AstroShrine",
    tA: "Become an ",
    tB: "AstroShrine astrologer",
    tC: "",
    sub: "Guide seekers across India. You apply on the AstroShrine website, and our team reviews and approves every application.",
    applyTitle: "How to apply",
    applyBody: "The application form opens on astroshrine.in. Keep these ready before you start.",
    prepare: [
      { title: "Your details", body: "Full name, mobile number, email, city and experience." },
      { title: "Your expertise", body: "Your specialities, languages and a few lines about you." },
      { title: "Documents", body: "Aadhaar, PAN, a profile photo and an astrology certificate (optional)." },
    ],
    apply: "Apply on astroshrine.in",
    newTab: "Opens in a new tab",
    approval: "Our team reviews and approves each application. Once you are approved, sign in here with the same mobile number.",
    whyTitle: "Why join AstroShrine",
    w1: "Seekers come to you",
    w1t: "Chat requests arrive on your console.",
    w2: "Earnings, clearly shown",
    w2t: "See every session on the earnings page.",
    w3: "Hindi or English",
    w3t: "Use the console in the language you prefer.",
    nextTitle: "What happens next",
    n1: "You apply on astroshrine.in.",
    n2: "Our team reviews your details.",
    n3: "Once approved, you sign in and go online.",
    already: "Already an AstroShrine astrologer?",
    signIn: "Sign in",
  },
});

const PREPARE_ICONS = [PiUserCircle, PiCertificate, PiIdentificationCard];

/** Join: explains how to become an astrologer and sends the visitor to the real application on astroshrine.in. */
export default function JoinForm() {
  const t = useT(text);
  const why = [
    { icon: PiUsersThree, title: t.w1, body: t.w1t },
    { icon: PiBank, title: t.w2, body: t.w2t },
    { icon: PiTranslate, title: t.w3, body: t.w3t },
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
          <Card aria-labelledby="ap" className="min-w-0 flex-[1.6_1_560px] px-5 py-7 sm:px-8 sm:py-[30px]">
            <h2 id="ap" className="font-display text-2xl font-bold">
              {t.applyTitle}
            </h2>
            <p className="mt-1.5 text-[16px] text-ink-soft">{t.applyBody}</p>
            <ol className="mt-5 flex list-none flex-col gap-3 p-0">
              {t.prepare.map(({ title, body }, i) => {
                const Icon = PREPARE_ICONS[i];
                return (
                  <li key={title} className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface-page px-4 py-3.5">
                    <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-brand-strong">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <b className="block text-[15.5px]">
                        {i + 1}. {title}
                      </b>
                      <span className="text-[14.5px] text-ink-soft">{body}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-5">
              <Button href={ONBOARDING_URL} target="_blank" rel="noopener" variant="gold" size="lg">
                <PiArrowSquareOut className="h-[18px] w-[18px]" aria-hidden />
                {t.apply}
              </Button>
              <span className="text-sm text-ink-soft">{t.newTab}</span>
            </div>
            <p className="mt-4 text-[15px] text-ink-soft">{t.approval}</p>
          </Card>

          <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
            <Card aria-labelledby="wy" className="rounded-b-[22px] rounded-t-[180px] px-[26px] pb-[26px] pt-10">
              <div className="mb-3.5 flex justify-center">
                <Image src="/logo.png" alt="" width={68} height={68} className="h-[68px] w-[68px]" />
              </div>
              <h2 id="wy" className="text-center font-display text-[22px] font-bold">
                {t.whyTitle}
              </h2>
              <div className="mt-[18px] flex flex-col gap-[18px]">
                {why.map(({ icon, title, body }) => (
                  <div key={title} className="flex items-start gap-3.5 rounded-[14px] p-1 transition hover:bg-surface-sunken/60">
                    <IconBadge icon={icon} size={48} />
                    <div>
                      <b className="block text-base">{title}</b>
                      <span className="text-[14.5px] text-ink-soft">{body}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card aria-labelledby="nx" className="px-[26px] py-6">
              <h2 id="nx" className="font-display text-xl font-bold">
                {t.nextTitle}
              </h2>
              <ol className="mt-3.5 flex list-none flex-col gap-3 p-0">
                {[t.n1, t.n2, t.n3].map((n, i) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-surface-sunken font-display font-bold text-brand-strong">
                      {i + 1}
                    </span>
                    <span className="pt-[3px] text-[15.5px]">{n}</span>
                  </li>
                ))}
              </ol>
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
