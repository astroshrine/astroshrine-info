"use client";

import Image from "next/image";
import { PiArrowRight, PiCaretDown, PiChatCircleText, PiDiamond, PiSealCheck, PiStar, PiTranslate, PiWallet } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { Button, Card, IconBadge, NavyBand, Ornament, Page, Pill, WithHindiLabel } from "../_console/ui";

const text = defineMessages({
  hi: {
    eyebrow: "AstroShrine ज्योतिषियों के लिए",
    tA: "आपके सभी परामर्श, ",
    tB: "एक ही कंसोल में",
    sub: "चैट और कॉल अनुरोध स्वीकारें, बातचीत के साथ कुंडली खोलें और अपनी कमाई देखें। हिंदी या अंग्रेज़ी में।",
    signIn: "कंसोल में साइन इन करें",
    join: "ज्योतिषी के रूप में जुड़ें",
    trust1: "केवल सत्यापित ज्योतिषी",
    trust2: "चैट और कॉल",
    trust3: "हिंदी और अंग्रेज़ी",
    insideEyebrow: "कंसोल के अंदर",
    insideTitle: "परामर्श के लिए ज़रूरी सब कुछ",
    f1: "अनुरोध आपके पास",
    f1t: "चैट और कॉल अनुरोध प्रश्न के साथ आपके कंसोल पर आते हैं। एक टैप में स्वीकारें।",
    f2: "हर चैट में कुंडली और नोट्स",
    f2t: "बातचीत के दौरान ग्राहक की कुंडली और आपके निजी नोट्स ठीक बगल में खुले रहते हैं।",
    f3: "कमाई का पूरा हिसाब",
    f3t: "कमाई पन्ने पर हर सत्र का विवरण देखें।",
    f4: "हिंदी या अंग्रेज़ी",
    f4t: "पूरे कंसोल को एक टैप में बदलें: मेनू, कुंडली और सब कुछ।",
    f5: "केवल सत्यापित ज्योतिषी",
    f5t: "आपकी जानकारी की जाँच के बाद ही AstroShrine आपका खाता बनाता है।",
    howEyebrow: "चार चरण",
    howTitle: "जुड़ना कैसे होता है",
    h1: "आवेदन भरें",
    h1t: "आपका नाम, संपर्क, विशेषज्ञता और दस्तावेज़।",
    h2: "हमारी टीम जाँच करती है",
    h2t: "आपके विवरण और दस्तावेज़ों की जाँच होती है।",
    h3: "आपका खाता बनता है",
    h3t: "स्वीकृति के बाद आप AstroShrine पर ज्योतिषी बन जाते हैं।",
    h4: "साइन इन करें",
    h4t: "अपने पंजीकृत मोबाइल नंबर से साइन इन करें। पहली बार प्रोफ़ाइल एक बार जाँचनी होगी।",
    howBtn: "जुड़ने का तरीका देखें",
    faqEyebrow: "सहायता",
    faqTitle: "ज्योतिषी अक्सर पूछते हैं",
    faqSide: "जवाब नहीं मिला? सहायता पन्ना कंसोल की हर स्क्रीन समझाता है।",
    faqBtn: "सहायता खोलें",
    q1: "यहाँ कौन साइन इन कर सकता है?",
    a1: "केवल वे ज्योतिषी जिनका खाता AstroShrine ने उनके आवेदन की जाँच के बाद बनाया है।",
    q2: "मैं कैसे जुड़ूँ?",
    a2: "AstroShrine की वेबसाइट पर आवेदन भरें। हमारी टीम जाँच करके आपको स्वीकृति देती है। उसके बाद आप अपने मोबाइल नंबर से साइन इन करते हैं।",
    q3: "क्या मैं कंसोल हिंदी में चला सकता हूँ?",
    a3: "हाँ। ऊपर दिए EN / हिं बटन से कभी भी अंग्रेज़ी और हिंदी के बीच बदलें।",
    readyTitle: "शुरू करने के लिए तैयार?",
    readySub: "AstroShrine पर पंजीकृत मोबाइल नंबर से साइन इन करें।",
  },
  en: {
    eyebrow: "For AstroShrine astrologers",
    tA: "All your consultations, ",
    tB: "in one console",
    sub: "Accept chat and call requests, open the kundli beside the conversation and see your earnings. In Hindi or English.",
    signIn: "Sign in to your console",
    join: "Join as an astrologer",
    trust1: "Verified astrologers only",
    trust2: "Chat and call",
    trust3: "Hindi and English",
    insideEyebrow: "Inside the console",
    insideTitle: "Everything you need for a consultation",
    f1: "Requests come to you",
    f1t: "Chat and call requests reach your console with the question. Accept with one tap.",
    f2: "Kundli and notes in every chat",
    f2t: "During a chat, the customer’s kundli and your private notes stay right beside the conversation.",
    f3: "Earnings, clearly shown",
    f3t: "See every session on the earnings page.",
    f4: "Hindi or English",
    f4t: "Switch the whole console with one tap: menus, kundli and everything else.",
    f5: "Verified astrologers only",
    f5t: "AstroShrine creates your account only after your details are checked.",
    howEyebrow: "Four steps",
    howTitle: "How joining works",
    h1: "Fill the application",
    h1t: "Your name, contact details, expertise and documents.",
    h2: "Our team checks it",
    h2t: "Your details and documents are reviewed.",
    h3: "Your account is created",
    h3t: "Once approved, you become an astrologer on AstroShrine.",
    h4: "Sign in",
    h4t: "Sign in with your registered mobile number. The first time, you check your profile once.",
    howBtn: "See how to join",
    faqEyebrow: "Help",
    faqTitle: "Questions astrologers ask",
    faqSide: "Cannot find your answer? The Help page explains every screen of the console.",
    faqBtn: "Open Help",
    q1: "Who can sign in here?",
    a1: "Only astrologers whose account AstroShrine has created after checking their application.",
    q2: "How do I join?",
    a2: "Fill the application on the AstroShrine website. Our team reviews it and approves you. Then you sign in with your mobile number.",
    q3: "Can I use the console in Hindi?",
    a3: "Yes. Switch between English and Hindi at any time with the EN / हिं button at the top.",
    readyTitle: "Ready to start?",
    readySub: "Sign in with the mobile number registered with AstroShrine.",
  },
});

/** The front page of the astrologer console: shown before sign in and after sign out. */
export default function WelcomeView() {
  const t = useT(text);
  const features = [
    { icon: PiChatCircleText, title: t.f1, body: t.f1t },
    { icon: PiDiamond, title: t.f2, body: t.f2t },
    { icon: PiWallet, title: t.f3, body: t.f3t },
    { icon: PiTranslate, title: t.f4, body: t.f4t },
    { icon: PiSealCheck, title: t.f5, body: t.f5t },
  ];
  const steps = [
    { title: t.h1, body: t.h1t },
    { title: t.h2, body: t.h2t },
    { title: t.h3, body: t.h3t },
    { title: t.h4, body: t.h4t },
  ];
  const faq = [
    { q: t.q1, a: t.a1 },
    { q: t.q2, a: t.a2 },
    { q: t.q3, a: t.a3 },
  ];

  return (
    <Page className="gap-12 sm:gap-16">
      <NavyBand className="px-6 py-12 sm:px-14 sm:py-16">
        <div className="flex flex-wrap items-center gap-10">
          <div className="min-w-0 flex-[1_1_440px]">
            <p className="flex items-center gap-3.5 font-display text-base font-medium tracking-[0.02em] text-[#ffe29a] before:h-px before:w-9 before:bg-brand">
              {t.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-[38px] font-bold leading-[1.08] tracking-[-0.01em] text-balance sm:text-[56px]">
              {t.tA}
              <em className="not-italic text-brand">{t.tB}</em>
            </h1>
            <p className="mt-4 max-w-[560px] text-[18px] text-ink-inverse-soft">{t.sub}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/astrologer/login" variant="gold" size="lg">
                {t.signIn}
                <PiArrowRight className="h-5 w-5" aria-hidden />
              </Button>
              <Button href="/astrologer/join" variant="line" size="lg" className="border-ink-inverse text-ink-inverse hover:bg-surface-inverse-raised">
                <PiStar className="h-[18px] w-[18px] text-brand" aria-hidden />
                {t.join}
              </Button>
            </div>
            <ul className="mt-7 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-[15px] font-semibold">
              {[t.trust1, t.trust2, t.trust3].map((label) => (
                <li key={label} className="flex items-center gap-2">
                  <PiSealCheck className="h-[18px] w-[18px] text-brand" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <div aria-hidden className="relative mx-auto flex h-[260px] w-[260px] shrink-0 items-center justify-center sm:h-[340px] sm:w-[340px]">
            <span className="absolute inset-0 rounded-full border border-dashed border-brand/60 motion-safe:animate-[spin_60s_linear_infinite]" />
            <span className="absolute inset-[12%] rounded-full border border-brand/30" />
            <span className="absolute inset-[24%] rounded-full bg-brand/15 motion-safe:animate-pulse" />
            <Image src="/logo.png" alt="" width={140} height={140} priority className="relative h-[42%] w-[42%]" />
          </div>
        </div>
      </NavyBand>

      <section aria-labelledby="inside" className="flex flex-col gap-6">
        <div className="text-center">
          <p className="flex items-center justify-center gap-3.5 font-display text-base font-medium text-brand-strong before:h-px before:w-9 before:bg-brand after:h-px after:w-9 after:bg-brand">
            {t.insideEyebrow}
          </p>
          <h2 id="inside" className="mt-2 font-display text-[30px] font-bold leading-tight text-balance sm:text-[38px]">
            {t.insideTitle}
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon, title, body }) => (
            <Card key={title} as="article" className="flex flex-col gap-3 p-6 transition motion-safe:hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-16px_rgba(20,33,61,0.45)]">
              <IconBadge icon={icon} size={52} />
              <h3 className="font-display text-xl font-bold">{title}</h3>
              <p className="text-[15.5px] leading-relaxed text-ink-soft">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <Ornament />

      <section aria-labelledby="how" className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-base font-medium text-brand-strong">{t.howEyebrow}</p>
            <h2 id="how" className="mt-1 font-display text-[30px] font-bold leading-tight sm:text-[38px]">
              {t.howTitle}
            </h2>
          </div>
          <Button href="/astrologer/join" variant="line" size="sm">
            {t.howBtn}
            <PiArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <ol className="relative grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
          <span aria-hidden className="absolute left-[10%] right-[10%] top-6 hidden border-t-2 border-dashed border-brand/60 lg:block" />
          {steps.map(({ title, body }, i) => (
            <li key={title} className="relative flex flex-col items-center gap-2 text-center">
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-surface-inverse font-display text-lg font-bold text-brand shadow-[0_0_0_5px_var(--color-surface-page),0_0_0_7px_var(--color-brand)]">
                {i + 1}
              </span>
              <h3 className="mt-2 font-display text-lg font-bold">{title}</h3>
              <p className="max-w-[260px] text-[15px] text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq" className="flex flex-wrap items-start gap-10">
        <div className="flex min-w-0 flex-[1_1_280px] flex-col items-start gap-3">
          <Pill>{t.faqEyebrow}</Pill>
          <h2 id="faq" className="font-display text-[30px] font-bold leading-tight sm:text-[38px]">
            {t.faqTitle}
          </h2>
          <p className="text-ink-soft">{t.faqSide}</p>
          <Button href="/astrologer/help" variant="navy" size="sm">
            {t.faqBtn}
          </Button>
        </div>
        <div className="flex min-w-0 flex-[1.6_1_420px] flex-col gap-3">
          {faq.map(({ q, a }) => (
            <details key={q} className="group rounded-[18px] border border-line bg-surface-card px-5 py-4 open:border-brand">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold [&::-webkit-details-marker]:hidden">
                {q}
                <PiCaretDown className="h-5 w-5 shrink-0 transition group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-2 text-[15.5px] text-ink-soft">
                <WithHindiLabel text={a} />
              </p>
            </details>
          ))}
        </div>
      </section>

      <NavyBand className="px-6 py-10 sm:px-12">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <h2 className="font-display text-[30px] font-bold leading-tight sm:text-[36px]">{t.readyTitle}</h2>
            <p className="mt-1.5 text-[17px] text-ink-inverse-soft">{t.readySub}</p>
          </div>
          <Button href="/astrologer/login" variant="gold" size="lg">
            {t.signIn}
            <PiArrowRight className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </NavyBand>
    </Page>
  );
}
