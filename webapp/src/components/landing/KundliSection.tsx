"use client";

import { useId, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Reveal, RevealItem } from "@/components/Reveal";
import { useT } from "@/i18n/LocaleProvider";
import Link from "@/i18n/Link";
import { defineMessages } from "@/i18n/messages";
import SectionHead from "./SectionHead";

const text = defineMessages({
  hi: {
    eyebrow: "हमारी सेवाएँ",
    title: "हमारी सेवाएँ",
    kundli: "कुंडली",
    kundliBody: "ग्रह स्थिति, दशा और दोष के साथ आपकी पूरी जन्म कुंडली, लगभग एक मिनट में तैयार।",
    name: "पूरा नाम",
    namePh: "आपका नाम",
    dob: "जन्म तिथि",
    tob: "जन्म समय",
    pob: "जन्म स्थान",
    pobPh: "शहर, राज्य",
    submit: "मेरी कुंडली बनाएँ",
    milan: "कुंडली मिलान",
    milanBody: "विवाह मिलान के लिए 36 में से गुण मिलान का स्कोर।",
    rashifal: "दैनिक राशिफल",
    rashifalBody: "सभी 12 राशियों के लिए छोटे, साफ़ राशिफल।",
    panchang: "आज का पंचांग",
    panchangBody: "तिथि, नक्षत्र, राहुकाल और चौघड़िया।",
    muhurat: "शुभ मुहूर्त",
    muhuratBody: "गृह प्रवेश, विवाह और अन्य कार्यों के लिए शुभ समय।",
  },
  en: {
    eyebrow: "Our services",
    title: "Our services",
    kundli: "Kundli",
    kundliBody: "Your complete birth chart with planet positions, dasha periods and doshas, ready in about a minute.",
    name: "Full name",
    namePh: "Your name",
    dob: "Date of birth",
    tob: "Time of birth",
    pob: "Place of birth",
    pobPh: "City, state",
    submit: "Make my Kundli",
    milan: "Kundli milan",
    milanBody: "Guna milan score out of 36 for marriage matching.",
    rashifal: "Daily rashifal",
    rashifalBody: "Short, clear readings for all 12 rashis.",
    panchang: "Aaj ka panchang",
    panchangBody: "Tithi, nakshatra, Rahu kaal and choghadiya.",
    muhurat: "Shubh muhurat",
    muhuratBody: "Good timings for griha pravesh, vivah and more.",
  },
});

// The kundli page keeps an unsaved form in sessionStorage (see kundli/KundliForm.tsx). Seeding it here
// prefills name, date and time there; the place is searched on that page, because it needs coordinates.
const KUNDLI_DRAFT = "jyotish:draft";

const iconProps = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true } as const;

const tile =
  "group flex flex-col gap-2.5 rounded-3xl border border-line bg-surface-card p-7 transition-colors hover:border-brand";
const iconTile =
  "grid h-[54px] w-[54px] place-items-center rounded-2xl bg-surface-sunken text-ink transition-transform duration-500 group-hover:-rotate-6 group-hover:-translate-y-0.5";
const input =
  "h-[50px] w-full rounded-xl border border-brand/35 bg-white/[0.06] px-3.5 text-ink-inverse [color-scheme:dark] placeholder:text-ink-inverse-soft/60 focus:border-brand focus:outline-none";

/** Our services: the design's bento, with a working Kundli form in the big navy tile. */
export default function KundliSection() {
  const t = useT(text);
  const router = useRouter();
  const uid = useId();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [tob, setTob] = useState("");
  const [pob, setPob] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      sessionStorage.setItem(
        KUNDLI_DRAFT,
        JSON.stringify({ mode: "new", form: { name: name.trim(), dob, tob, timeUnknown: !tob, place: null, toAccount: false } }),
      );
    } catch {
      /* best effort: the kundli page just opens empty */
    }
    router.push("/kundli");
  }

  const small: { href: string; title: string; body: string; icon: React.ReactNode }[] = [
    {
      href: "/kundli/milan",
      title: t.milan,
      body: t.milanBody,
      icon: (
        <svg {...iconProps}>
          <circle cx="9" cy="12" r="6" />
          <circle cx="15" cy="12" r="6" />
        </svg>
      ),
    },
    {
      href: "#rashifal",
      title: t.rashifal,
      body: t.rashifalBody,
      icon: (
        <svg {...iconProps}>
          <path d="M20 14A8 8 0 1110 4a6.5 6.5 0 0010 10z" />
        </svg>
      ),
    },
    {
      href: "/kundli/panchang",
      title: t.panchang,
      body: t.panchangBody,
      icon: (
        <svg {...iconProps}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 10h16M9 3v4M15 3v4" />
        </svg>
      ),
    },
    {
      href: "/kundli/panchang",
      title: t.muhurat,
      body: t.muhuratBody,
      icon: (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      ),
    },
  ];

  return (
    <section id="kundli" aria-labelledby="services-title" className="scroll-mt-24 py-16 md:py-[104px]">
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
        <SectionHead id="services-title" eyebrow={t.eyebrow} title={t.title} />
        <Reveal group className="mt-10 grid grid-cols-1 gap-5 md:mt-12 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          <RevealItem className="flex flex-col gap-2.5 rounded-3xl bg-surface-inverse p-6 text-ink-inverse md:col-span-2 md:p-9 lg:col-span-1 lg:row-span-2">
            <span className="grid h-[54px] w-[54px] place-items-center rounded-2xl bg-brand/15 text-brand">
              <svg {...iconProps}>
                <rect x="3" y="3" width="18" height="18" />
                <path d="M3 3l18 18M21 3L3 21M12 3l9 9-9 9-9-9z" />
              </svg>
            </span>
            <h3 className="font-display text-[30px] font-semibold leading-[1.2] tracking-[-0.01em]">{t.kundli}</h3>
            <p className="text-base text-ink-inverse-soft">{t.kundliBody}</p>
            <form onSubmit={submit} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor={`${uid}-name`} className="text-[13px] font-semibold text-brand">
                  {t.name}
                </label>
                <input id={`${uid}-name`} className={input} required maxLength={100} autoComplete="name" placeholder={t.namePh} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${uid}-dob`} className="text-[13px] font-semibold text-brand">
                  {t.dob}
                </label>
                <input id={`${uid}-dob`} className={input} type="date" required min="1900-01-01" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${uid}-tob`} className="text-[13px] font-semibold text-brand">
                  {t.tob}
                </label>
                <input id={`${uid}-tob`} className={input} type="time" value={tob} onChange={(e) => setTob(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor={`${uid}-pob`} className="text-[13px] font-semibold text-brand">
                  {t.pob}
                </label>
                <input id={`${uid}-pob`} className={input} placeholder={t.pobPh} value={pob} onChange={(e) => setPob(e.target.value)} />
              </div>
              <button
                type="submit"
                className="mt-1.5 inline-flex h-[52px] items-center justify-center rounded-[14px] bg-brand px-[26px] text-[15px] font-semibold text-brand-ink transition-colors hover:bg-brand-hover motion-safe:active:translate-y-px sm:col-span-2"
              >
                {t.submit}
              </button>
            </form>
          </RevealItem>
          {small.map(({ href, title, body, icon }) => (
            <RevealItem key={title} hover>
              <Link href={href} className={`${tile} h-full`}>
                <span className={iconTile}>{icon}</span>
                <h3 className="font-display text-xl font-semibold leading-[1.3] tracking-[-0.01em] text-ink">{title}</h3>
                <p className="text-sm text-ink-soft">{body}</p>
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
