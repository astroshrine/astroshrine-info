"use client";

import { PiArrowRight, PiBroadcast, PiDiamond, PiPhone, PiTranslate, PiWallet } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import Rails from "../_console/Rails";
import { Accent, Button, Card, IconBadge, Ornament, Page, PageTitle, Pill, WithHindiLabel } from "../_console/ui";
/** How long a chat request waits for the astrologer to accept it. */
const ACCEPT_SECONDS = 30;

const text = defineMessages({
  hi: {
    eyebrow: "सहायता",
    tA: "कंसोल का ",
    tB: "उपयोग कैसे करें",
    sub: "बस चार आसान चरण। शुरू करने के लिए इतना ही काफ़ी है।",
    step: "चरण",
    s1: "ऑनलाइन आएँ",
    s1t: "होम पर बड़ा गोल स्थिति बटन दबाएँ। उसका घेरा हरा होकर घूमने लगे तो आप ऑनलाइन हैं और ग्राहक आपसे जुड़ सकते हैं।",
    s1l: "होम खोलें",
    s2: "अनुरोध स्वीकारें",
    s2t: (n: number) => `प्रश्न और कुंडली पढ़ें, फिर स्वीकारें दबाएँ। हर अनुरोध ${n} सेकंड तक रुकता है।`,
    s2l: "कॉल देखें",
    s3: "कुंडली और नोट्स देखें",
    s3t: "चैट के दौरान ग्राहक की कुंडली और आपके निजी नोट्स बातचीत के ठीक बगल में दिखते हैं।",
    s3l: "चैट खोलें",
    s4: "भुगतान पाएँ",
    s4t: "आपकी कमाई लाइव दिखती है। कमाई पन्ने पर हर सत्र का विवरण देखें।",
    s4l: "कमाई देखें",
    langNote: "ऊपर दिए EN / हिं बटन से कभी भी अंग्रेज़ी और हिंदी के बीच बदलें।",
  },
  en: {
    eyebrow: "Help",
    tA: "How to use the ",
    tB: "console",
    sub: "Four simple steps. That is all you need to start.",
    step: "Step",
    s1: "Go online",
    s1t: "On Home, press the big round status button. When its ring turns green and spins, you are online and customers can reach you.",
    s1l: "Open Home",
    s2: "Accept a request",
    s2t: (n) => `Read the question and the kundli, then press Accept. Each request waits for ${n} seconds.`,
    s2l: "See a call",
    s3: "Use the kundli and notes",
    s3t: "During a chat, the customer’s kundli and your private notes stay right beside the conversation.",
    s3l: "Open chats",
    s4: "Get paid",
    s4t: "Your earnings update live. See every session on the earnings page.",
    s4l: "See earnings",
    langNote: "Switch between English and Hindi at any time with the EN / हिं button at the top.",
  },
});

export default function HelpGuide() {
  const t = useT(text);
  const steps = [
    { icon: PiBroadcast, title: t.s1, body: t.s1t, link: t.s1l, href: "/astrologer" },
    { icon: PiPhone, title: t.s2, body: t.s2t(ACCEPT_SECONDS), link: t.s2l, href: "/astrologer" },
    { icon: PiDiamond, title: t.s3, body: t.s3t, link: t.s3l, href: "/astrologer/session" },
    { icon: PiWallet, title: t.s4, body: t.s4t, link: t.s4l, href: "/astrologer/earnings" },
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
          </>
        }
        sub={t.sub}
      />
      <Ornament />
      <div className="flex flex-wrap items-stretch gap-6">
        {steps.map(({ icon, title, body, link, href }, i) => (
          <Card
            key={title}
            as="article"
            className="flex min-w-0 flex-[1_1_240px] flex-col items-center gap-3 rounded-b-[22px] rounded-t-[160px] px-[22px] pb-6 pt-10 text-center transition motion-safe:hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-16px_rgba(20,33,61,0.45)]"
          >
            <div className="relative flex h-[120px] w-[120px] items-center justify-center">
              <span aria-hidden className="absolute inset-3.5 rounded-full bg-brand/35 motion-safe:animate-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
              <IconBadge icon={icon} size={92} className="relative shadow-[0_0_0_6px_var(--color-surface-sunken)]" />
            </div>
            <Pill>
              {t.step} {i + 1}
            </Pill>
            <h2 className="font-display text-[23px] font-bold leading-tight">{title}</h2>
            <p className="flex-1 text-base leading-[1.6] text-ink-soft">{body}</p>
            <Button href={href} variant="line" size="sm" className="h-[46px] w-full text-[14.5px]">
              {link}
              <PiArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Card>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 py-1 text-[15.5px] text-ink-soft">
        <PiTranslate className="h-[22px] w-[22px] shrink-0 text-brand-strong" aria-hidden />
        <span>
          <WithHindiLabel text={t.langNote} />
        </span>
      </div>
    </Page>
    </div>
  );
}
