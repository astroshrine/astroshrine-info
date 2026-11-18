"use client";

import { useEffect, useState } from "react";
import Link from "@/i18n/Link";
import { INTL_LOCALE } from "@/i18n/config";
import { defineMessages } from "@/i18n/messages";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { REMOVAL_MIN_DESCRIPTION, nextBooking, removalReasonText, type RemovalReason, type Waiting } from "@/lib/services/astrologerHome";
import { canJoinNow } from "@/lib/services/astrologerJoin";
import JoinBooking from "../_console/JoinBooking";
import { useAstrologer } from "../_console/useAstrologer";
import { Ornament, PageTitle } from "../_console/ui";
import Icon, { type IconName } from "./icons";
import "./home.css";
import { useHome } from "./useHome";

const text = defineMessages({
  hi: {
    eyebrow: "नमस्ते",
    fallbackName: "ज्योतिषी जी",
    waitingSub: (n: number) => `${n} लोग आपसे बात करने की प्रतीक्षा कर रहे हैं।`,
    subOne: "1 व्यक्ति आपसे बात करने की प्रतीक्षा कर रहा है।",
    subNone: "अभी कोई प्रतीक्षा में नहीं है।",
    subBusy: "व्यस्त मोड चालू है। नए अनुरोध रुके हुए हैं।",
    subOff: "आप ऑफ़लाइन हैं। अनुरोध पाने के लिए ऑनलाइन आएँ।",
    subLoading: "आपकी स्थिति देखी जा रही है…",
    statusLabel: "आपकी स्थिति",
    stOnline: "आप ऑनलाइन हैं",
    stBusy: "आप व्यस्त हैं",
    stOff: "आप ऑफ़लाइन हैं",
    stLoading: "स्थिति देखी जा रही है",
    stUnknown: "स्थिति नहीं मिल सकी",
    descOnline: "ग्राहक आपको देख सकते हैं और अनुरोध भेज सकते हैं।",
    descBusy: "नए अनुरोध रुके हैं। चल रहे सत्र जारी रहेंगे।",
    descOff: "ग्राहक देख सकते हैं कि आप कब लौटेंगे।",
    descUnknown: "इंटरनेट जाँचकर फिर कोशिश करें।",
    restNote: "विश्राम के घंटे चल रहे हैं, इसलिए आप व्यस्त दिख रहे हैं।",
    stayHint: "ऑनलाइन रहने के लिए यह पेज खुला रखें।",
    tapHint: "स्थिति बदलने के लिए गोल बटन दबाएँ",
    switchFailed: "स्थिति बदली नहीं जा सकी। फिर कोशिश करें।",
    autoOffline: "सिस्टम ने आपको ऑफ़लाइन कर दिया है। ऑनलाइन आने के लिए बटन दबाएँ।",
    retry: "फिर कोशिश करें",
    bOnline: "ऑनलाइन",
    bBusy: "व्यस्त",
    bOffline: "ऑफ़लाइन",
    chat: "चैट",
    call: "कॉल",
    audio: "ऑडियो",
    video: "वीडियो",
    customer: "ग्राहक",
    newRequest: (name: string, kind: string) => `${name} का नया ${kind} अनुरोध`,
    newBadge: "नया अनुरोध",
    vsMore: (n: string) => `कल से ₹${n} अधिक`,
    vsLess: (n: string) => `कल से ₹${n} कम`,
    dismiss: "बंद करें",
    waitingTitle: "प्रतीक्षा में ग्राहक",
    nWaiting: (n: number) => `${n} प्रतीक्षा में`,
    position: (n: number) => `क्रम ${n}`,
    justNow: "अभी-अभी",
    waitedMin: (n: number) => `${n} मिनट से`,
    waitedSec: (n: number) => `${n} सेकंड से`,
    waitedHr: (h: number, m: number) => `${h} घंटे ${m} मिनट से`,
    decline: "हटाएँ",
    removeTitle: (n: string) => `${n} को हटाएँ?`,
    removeCallBody: "इन्हें आपकी प्रतीक्षा सूची से हटा दिया जाएगा और सूचित किया जाएगा। कोई शुल्क नहीं।",
    removeChatBody: "इनकी चैट अभी शुरू नहीं हुई है। यह रद्द होगी, पूरा पैसा लौटाया जाएगा और इन्हें बताया जाएगा कि हटा दिया गया है।",
    reasonAsk: "आप इन्हें क्यों हटा रहे हैं?",
    reasonBehaviour: "अनुचित व्यवहार",
    reasonOther: "अन्य कारण",
    describeBehaviour: "बताइए क्या हुआ",
    describeOther: "कारण लिखें",
    reasonShown: "ग्राहक को यह कारण दिखेगा।",
    reasonShort: "कम से कम 5 अक्षर लिखें।",
    removalsLeft: (n: number, l: number) => `आज आप ${n} और को हटा सकते हैं (रोज़ की सीमा ${l})।`,
    limitReached: "आज की सीमा पूरी हो गई। आधी रात के बाद फिर से हटा सकेंगे।",
    keep: "रहने दें",
    removeNow: "हटाएँ",
    removing: "हटा रहे हैं…",
    removedOk: (n: string) => `${n} को प्रतीक्षा सूची से हटा दिया गया।`,
    close: "बंद करें",
    callInApp: "कॉल का उत्तर AstroShrine ऐप में दें।",
    chatAuto: "चैट अपने आप शुरू होती है, जब आप खाली होते हैं।",
    declineFailed: "हटाया नहीं जा सका। फिर कोशिश करें।",
    activeTitle: "चल रही चैट",
    openChat: "चैट खोलें",
    goChats: "चैट पर जाएं",
    chatInProgress: "चैट चल रही है",
    emptyNone: "अभी कोई प्रतीक्षा में नहीं है",
    emptyNoneBody: "नया अनुरोध आते ही यहाँ दिखेगा।",
    emptyBusy: "व्यस्त मोड चालू है",
    emptyBusyBody: "नए अनुरोध रुके हैं। ग्राहक आपके कार्ड पर \"व्यस्त\" देखते हैं।",
    emptyOff: "आप ऑफ़लाइन हैं",
    emptyOffBody: "ऑनलाइन आते ही आपको अनुरोध मिलने लगेंगे।",
    goOnline: "ऑनलाइन आएँ",
    loadingList: "प्रतीक्षा सूची खुल रही है…",
    listFailed: "प्रतीक्षा सूची नहीं खुल सकी",
    todayTitle: "आज",
    earned: "आज की कमाई",
    consult: "परामर्श",
    minutes: "बात के मिनट",
    online: "ऑनलाइन समय",
    onlineOf: (m: number, t: number) => `${m} / ${t} मिनट`,
    rating: "रेटिंग",
    noRating: "अभी नहीं",
    viewEarn: "कमाई देखें",
    todayFailed: "आज के आँकड़े नहीं खुल सके",
    nextTitle: "अगली बुकिंग",
    nextNone: "आगे कोई बुकिंग नहीं है",
    nextFailed: "बुकिंग नहीं खुल सकी",
    nextWhat: (kind: string, min: number | null) => (min ? `${kind} · ${min} मिनट` : kind),
  },
  en: {
    eyebrow: "Namaste",
    fallbackName: "Astrologer",
    waitingSub: (n) => `${n} people are waiting to talk to you.`,
    subOne: "1 person is waiting to talk to you.",
    subNone: "No one is waiting right now.",
    subBusy: "Busy mode is on. New requests are paused.",
    subOff: "You are offline. Go online to receive requests.",
    subLoading: "Checking your status…",
    statusLabel: "Your status",
    stOnline: "You are online",
    stBusy: "You are busy",
    stOff: "You are offline",
    stLoading: "Checking your status",
    stUnknown: "Could not read your status",
    descOnline: "Customers can see you and send requests.",
    descBusy: "New requests are paused. Ongoing sessions continue.",
    descOff: "Customers can see when you will be back.",
    descUnknown: "Check your connection and try again.",
    restNote: "Your rest hours are on, so you show as busy.",
    stayHint: "Keep this page open to stay online.",
    tapHint: "Press the round button to change your status",
    switchFailed: "Could not change your status. Please try again.",
    autoOffline: "The system switched you offline. Press the button to go online.",
    retry: "Try again",
    bOnline: "Online",
    bBusy: "Busy",
    bOffline: "Offline",
    chat: "Chat",
    call: "Call",
    audio: "Audio",
    video: "Video",
    customer: "Customer",
    newRequest: (name, kind) => `New ${kind} request from ${name}`,
    newBadge: "New request",
    vsMore: (n) => `₹${n} more than yesterday`,
    vsLess: (n) => `₹${n} less than yesterday`,
    dismiss: "Dismiss",
    waitingTitle: "Waiting customers",
    nWaiting: (n) => `${n} waiting`,
    position: (n) => `No. ${n}`,
    justNow: "Just now",
    waitedMin: (n) => `${n} min`,
    waitedSec: (n) => `${n} sec`,
    waitedHr: (h, m) => `${h} hr ${m} min`,
    decline: "Remove",
    removeTitle: (n) => `Remove ${n}?`,
    removeCallBody: "They will be taken off your waitlist and told. Nothing is charged.",
    removeChatBody: "Their chat has not started yet. It will be cancelled and fully refunded, and they will be told they were removed.",
    reasonAsk: "Why are you removing them?",
    reasonBehaviour: "Inappropriate behaviour",
    reasonOther: "Other reason",
    describeBehaviour: "Describe what happened",
    describeOther: "Write the reason",
    reasonShown: "The customer will see this reason.",
    reasonShort: "Write at least 5 characters.",
    removalsLeft: (n, l) => `You can remove ${n} more today (limit ${l} a day).`,
    limitReached: "You have reached today's limit. You can remove again after midnight.",
    keep: "Keep",
    removeNow: "Remove",
    removing: "Removing…",
    removedOk: (n) => `${n} was removed from your waitlist.`,
    close: "Close",
    callInApp: "Answer calls in the AstroShrine app.",
    chatAuto: "Chats start by themselves when you are free.",
    declineFailed: "Could not remove. Please try again.",
    activeTitle: "Chats in progress",
    openChat: "Open chat",
    goChats: "Go to chats",
    chatInProgress: "Chat in progress",
    emptyNone: "No one is waiting",
    emptyNoneBody: "A new request will show up here as soon as it comes.",
    emptyBusy: "Busy mode is on",
    emptyBusyBody: "New requests are paused. Customers see \"Busy\" on your card.",
    emptyOff: "You are offline",
    emptyOffBody: "You will start receiving requests as soon as you go online.",
    goOnline: "Go online",
    loadingList: "Opening your waiting list…",
    listFailed: "Could not open your waiting list",
    todayTitle: "Today",
    earned: "Earned today",
    consult: "Consultations",
    minutes: "Minutes talked",
    online: "Time online",
    onlineOf: (m, t) => `${m} / ${t} min`,
    rating: "Rating",
    noRating: "None yet",
    viewEarn: "View earnings",
    todayFailed: "Could not open today's figures",
    nextTitle: "Next booking",
    nextNone: "No booking coming up",
    nextFailed: "Could not open your bookings",
    nextWhat: (kind, min) => (min ? `${kind} · ${min} min` : kind),
  },
});

const STATUS_COLOR = { online: "#1F8A4C", busy: "#FFAE00", offline: "#8E93A6" } as const;
type Mode = keyof typeof STATUS_COLOR;

const DEVANAGARI = /[ऀ-ॿ]/;

/** A customer's own name: Devanagari on the English page needs the Hindi font. */
function Person({ name, locale }: { name: string; locale: string }) {
  return <span lang={locale === "en" && DEVANAGARI.test(name) ? "hi" : undefined}>{name}</span>;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0]?.toUpperCase())
    .join("") || "•";

function IconBadge({ name, size = 42, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex flex-none items-center justify-center rounded-full bg-surface-inverse shadow-[0_0_0_4px_var(--color-surface-sunken)] ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon name={name} size={Math.round(size * 0.48)} color="#FFAE00" />
    </span>
  );
}

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex h-[30px] items-center gap-1.5 rounded-full px-3 text-[13px] font-bold whitespace-nowrap ${className}`}>{children}</span>;
}

function TodayRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-3">
      <span className="flex items-center gap-2.5 text-[15px] text-ink-soft">
        <span className="flex size-[34px] flex-none items-center justify-center rounded-[10px] bg-surface-sunken">
          <Icon name={icon} size={17} color="var(--color-brand-strong)" stroke={2.2} />
        </span>
        {label}
      </span>
      <b className="font-display text-[21px] tabular-nums">{value}</b>
    </div>
  );
}

function Notice({ children, action, tone = "error" }: { children: React.ReactNode; action?: React.ReactNode; tone?: "error" | "info" }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-[15px] ${tone === "error" ? "border-danger bg-danger-soft text-danger" : "border-line-strong bg-surface-sunken text-ink"}`}
    >
      <span>{children}</span>
      {action}
    </div>
  );
}

type Home = ReturnType<typeof useHome>;
type Strings = (typeof text)["en"];

/** Asks why a waiting customer is being removed; the reason is kept for the admin panel and shown to the customer. */
function RemoveDialog({ t, home, name }: { t: Strings; home: Home; name: string }) {
  const w = home.removing!;
  const [picked, setPicked] = useState<RemovalReason | null>(null);
  const [text, setText] = useState("");
  const left = home.removals?.left ?? null;
  const limitHit = left === 0 || home.removeError === "limit";
  const long = text.replace(/\s+/g, " ").trim().length >= REMOVAL_MIN_DESCRIPTION;
  const ready = !limitHit && !home.removeBusy && picked !== null && long;
  const { cancelRemove } = home;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cancelRemove();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelRemove]);
  const opts: [RemovalReason, string][] = [
    ["behaviour", t.reasonBehaviour],
    ["other", t.reasonOther],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={home.cancelRemove}>
      <div role="dialog" aria-modal="true" aria-labelledby="rm-title" onClick={(e) => e.stopPropagation()} className="max-h-full w-full max-w-[480px] overflow-y-auto rounded-[22px] border border-line bg-surface-card p-6 shadow-xl">
        <h2 id="rm-title" className="font-display text-2xl font-bold">
          {t.removeTitle(name)}
        </h2>
        <p className="mt-2 text-[15px] text-ink-soft">{w.kind === "call" ? t.removeCallBody : t.removeChatBody}</p>
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">{t.reasonAsk}</legend>
          <div className="mt-2 flex flex-col gap-2">
            {opts.map(([key, label]) => (
              <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-[14px] border px-4 py-3 text-[15px] font-semibold ${picked === key ? "border-brand bg-surface-sunken" : "border-line-strong"}`}>
                <input type="radio" name="reason" checked={picked === key} onChange={() => setPicked(key)} className="accent-[var(--color-brand-strong)]" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {picked && (
          <div className="mt-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={300}
              aria-label={picked === "behaviour" ? t.describeBehaviour : t.describeOther}
              placeholder={picked === "behaviour" ? t.describeBehaviour : t.describeOther}
              className="w-full rounded-[14px] border border-line-strong bg-surface-page px-3.5 py-3 text-base"
            />
            <p className="mt-1 text-[13px] text-ink-soft">{text.trim() && !long ? t.reasonShort : t.reasonShown}</p>
          </div>
        )}
        {limitHit ? (
          <div className="mt-4">
            <Notice>{t.limitReached}</Notice>
          </div>
        ) : (
          home.removals && left !== null && <p className="mt-3 text-[13px] text-ink-soft">{t.removalsLeft(left, home.removals.limit)}</p>
        )}
        {home.removeError === "failed" && (
          <div className="mt-4">
            <Notice>{t.declineFailed}</Notice>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={home.cancelRemove} disabled={home.removeBusy} className="ah-tap h-12 rounded-[14px] border-[1.5px] border-ink px-5 text-[15px] font-bold disabled:opacity-60">
            {t.keep}
          </button>
          <button type="button" disabled={!ready} onClick={() => picked && home.confirmRemove(removalReasonText(picked, text))} className="ah-tap h-12 rounded-[14px] bg-danger px-5 text-[15px] font-bold text-white disabled:opacity-50">
            {home.removeBusy ? t.removing : t.removeNow}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Wall clock that moves on, for "waiting for 2 min". */
function useNow(everyMs = 15_000) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);
  return now;
}

export default function HomeView() {
  const t = useT(text);
  const locale = useLocale();
  const { id: selfId, name } = useAstrologer();
  const home = useHome();
  const now = useNow();

  const mode: Mode = home.status.data;
  const known = home.status.loaded && !home.status.failed;
  const online = known && mode === "online";
  const busy = known && mode === "busy";
  const offline = known && mode === "offline";
  const n = home.waiting.length;

  let sub = n === 1 ? t.subOne : n > 1 ? t.waitingSub(n) : t.subNone;
  if (!known) sub = home.status.loaded ? t.descUnknown : t.subLoading;
  else if (busy) sub = t.subBusy;
  else if (offline) sub = t.subOff;

  const statusTitle = !home.status.loaded ? t.stLoading : !known ? t.stUnknown : online ? t.stOnline : busy ? t.stBusy : t.stOff;
  const ringColor = known ? STATUS_COLOR[mode] : STATUS_COLOR.offline;
  const seg = (a: boolean) =>
    `ah-tap flex h-[52px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold disabled:opacity-60 ${a ? "bg-surface-inverse text-ink-inverse" : "bg-transparent text-ink"}`;
  const cycle = () => home.setMode(online ? "busy" : busy ? "offline" : "online");

  const kindLabel = (k: Waiting["kind"]) => (k === "call" ? t.call : t.chat);
  const display = (w: Waiting) => w.name || t.customer;
  const waited = (since: number | null) => {
    if (since === null || !now) return null;
    const s = Math.max(0, Math.floor((now - since) / 1000));
    if (s < 15) return t.justNow;
    if (s < 60) return t.waitedSec(s);
    const m = Math.floor(s / 60);
    return m < 60 ? t.waitedMin(m) : t.waitedHr(Math.floor(m / 60), m % 60);
  };

  const showWaiting = home.waitingLoaded && n > 0;
  let empty = { title: t.emptyNone, body: t.emptyNoneBody, cta: "" };
  if (busy) empty = { title: t.emptyBusy, body: t.emptyBusyBody, cta: t.goOnline };
  if (offline) empty = { title: t.emptyOff, body: t.emptyOffBody, cta: t.goOnline };

  const wd = home.workday.data;
  const today = home.today.data;
  const dateFmt = new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
  // A confirmed booking that can be joined now (it may have started a few minutes ago) comes before the next one.
  const joinable =
    home.bookings.data
      .filter((b) => b.status === "CONFIRMED" && canJoinNow(b.status, b.startsAt, b.startsAt === null ? null : b.startsAt + (b.durationMinutes ?? 0) * 60_000, now))
      .sort((a, b) => (a.startsAt ?? 0) - (b.startsAt ?? 0))[0] ?? null;
  const next = joinable ?? nextBooking(home.bookings.data, now);

  return (
    <>
      <PageTitle eyebrow={t.eyebrow} title={name || t.fallbackName} sub={sub} />
      <Ornament />

      {home.arrivals.map((w) => {
        const wait = waited(w.since);
        return (
          <section key={w.key} role="status" aria-label={t.newRequest(display(w), kindLabel(w.kind))} className="ah-rise ah-card flex flex-wrap items-center gap-x-[18px] gap-y-3.5 rounded-[22px] border-[1.5px] border-brand bg-surface-sunken p-5 sm:px-[26px]">
            <div className="relative flex size-[54px] flex-none items-center justify-center rounded-full bg-surface-inverse text-[17px] font-bold text-brand">
              <span aria-hidden="true" className="ah-pulse absolute inset-0 rounded-full bg-[rgba(255,174,0,.35)]" />
              <span className="relative"><Person name={initialsOf(w.name)} locale={locale} /></span>
            </div>
            <div className="min-w-0 flex-[1_1_260px]">
              <div className="text-[13px] font-bold tracking-wide text-brand-strong uppercase">{t.newBadge}</div>
              <div className="font-display text-xl font-bold">
                <Person name={display(w)} locale={locale} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill className={w.kind === "call" ? "bg-success-soft text-success" : "bg-[#E9EDF7] text-ink"}>
                  <Icon name={w.kind === "call" ? "phone" : "chat"} size={14} />
                  {kindLabel(w.kind)}
                </Pill>
                {(w.subType === "video" || w.subType === "audio") && <Pill className="bg-surface-card text-brand-strong">{w.subType === "video" ? t.video : t.audio}</Pill>}
                {wait && (
                  <Pill className="bg-surface-card text-ink-soft">
                    <Icon name="clock" size={14} />
                    {wait}
                  </Pill>
                )}
              </div>
            </div>
            <div className="flex flex-none flex-wrap gap-2.5">
              <button type="button" onClick={() => home.dismissArrival(w.key)} className="ah-tap h-12 rounded-[14px] border-[1.5px] border-ink px-[18px] text-[15px] font-bold">
                {t.dismiss}
              </button>
              {w.kind === "chat" && (
                <Link href="/astrologer/session" className="ah-tap inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-surface-inverse px-5 text-[15px] font-bold text-ink-inverse">
                  <Icon name="chat" size={17} color="#FFAE00" />
                  {t.goChats}
                </Link>
              )}
            </div>
          </section>
        );
      })}

      {/* Status */}
      <section aria-label={t.statusLabel} className="ah-rise ah-card flex flex-wrap items-center gap-x-10 gap-y-6 rounded-[22px] border border-line bg-surface-card px-5 py-7 sm:px-8">
        <button
          type="button"
          disabled={!known || home.pending}
          onClick={cycle}
          aria-label={`${statusTitle}. ${t.tapHint}`}
          className="ah-tap relative block size-40 flex-none rounded-full disabled:cursor-default"
        >
          {online && (
            <>
              <span aria-hidden="true" className="ah-pulse absolute inset-3.5 rounded-full bg-[rgba(31,138,76,.28)]" />
              <span aria-hidden="true" className="ah-pulse absolute inset-3.5 rounded-full bg-[rgba(255,174,0,.3)]" style={{ animationDelay: "1.2s" }} />
            </>
          )}
          <span aria-hidden="true" className={`absolute inset-0 block ${online ? "ah-spinM" : busy ? "ah-spin" : ""}`}>
            <svg viewBox="0 0 160 160" className="size-full">
              <circle cx="80" cy="80" r="76" fill="none" stroke={ringColor} strokeWidth="3" strokeDasharray="3 9" strokeLinecap="round" />
              <circle cx="80" cy="80" r="67" fill="none" stroke={ringColor} strokeWidth="4" strokeDasharray="70 36" strokeLinecap="round" opacity=".55" />
            </svg>
          </span>
          <span
            className={`absolute inset-[26px] flex items-center justify-center rounded-full transition-[background,box-shadow] duration-500 ${online ? "ah-breathe bg-surface-inverse shadow-[0_0_0_6px_var(--color-surface-sunken),0_16px_30px_-12px_rgba(20,33,61,.7)]" : busy ? "bg-brand shadow-[0_0_0_6px_var(--color-surface-sunken)]" : "bg-[#E9E4D8] shadow-[0_0_0_6px_#F4EFE4]"}`}
          >
            <Icon name="power" size={44} color={online ? "#FFAE00" : busy ? "#14213D" : "#8E93A6"} stroke={2.4} />
          </span>
        </button>
        <div className="min-w-0 flex-1 basis-[260px]">
          <div className="text-[13px] font-semibold text-ink-soft">{t.statusLabel}</div>
          <h2 className="mt-1 font-display text-[34px] leading-[1.1] font-bold">{statusTitle}</h2>
          <p className="mt-1.5 text-base text-ink-soft">{!known ? t.descUnknown : online ? t.descOnline : busy ? t.descBusy : t.descOff}</p>
          {busy && wd?.restActive && !wd.dnd && <p className="mt-1.5 text-sm font-semibold text-ink-soft">{t.restNote}</p>}
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-strong">
            <Icon name="info" size={16} color="var(--color-brand-strong)" stroke={2.2} />
            {online || busy ? t.stayHint : t.tapHint}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 basis-[380px] flex-col gap-3">
          <div role="group" aria-label={t.statusLabel} className="grid grid-cols-3 gap-1 rounded-2xl bg-[#F4ECDB] p-1">
            {(["online", "busy", "offline"] as const).map((k) => (
              <button key={k} type="button" disabled={!known || home.pending} aria-pressed={known && mode === k} onClick={() => home.setMode(k)} className={seg(known && mode === k)}>
                <span className="size-[9px] rounded-full" style={{ background: STATUS_COLOR[k] }} />
                {k === "online" ? t.bOnline : k === "busy" ? t.bBusy : t.bOffline}
              </button>
            ))}
          </div>
          {home.switchError && <Notice>{t.switchFailed}</Notice>}
          {home.autoOffline && <Notice tone="info">{t.autoOffline}</Notice>}
          {home.status.failed && (
            <Notice action={<button type="button" onClick={home.retry} className="ah-tap h-9 rounded-xl border border-danger px-3.5 text-sm font-bold">{t.retry}</button>}>
              {t.stUnknown}
            </Notice>
          )}
        </div>
      </section>

      {home.active.length > 0 && (
        <section aria-labelledby="ac" className="ah-rise ah-card rounded-[22px] border border-line bg-surface-card p-5 sm:p-[26px]">
          <div className="flex items-center gap-3">
            <IconBadge name="chat" />
            <h2 id="ac" className="font-display text-2xl leading-tight font-bold">
              {t.activeTitle}
            </h2>
          </div>
          <div className="mt-[18px] flex flex-col gap-3">
            {home.active.map(({ booking, chatId }) => (
              <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-line bg-surface-page p-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex size-[46px] flex-none items-center justify-center rounded-full bg-surface-sunken font-bold text-brand-strong"><Person name={initialsOf(booking.name)} locale={locale} /></div>
                  <div className="min-w-0">
                    <div className="text-[17px] font-bold">
                      <Person name={booking.name || t.customer} locale={locale} />
                    </div>
                    <div className="text-sm text-ink-soft">{t.chatInProgress}</div>
                  </div>
                </div>
                {chatId && (
                  <Link href={`/astrologer/session?chat=${encodeURIComponent(chatId)}`} className="ah-tap inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-surface-inverse px-6 text-[15px] font-bold text-ink-inverse">
                    <Icon name="chat" size={18} />
                    {t.openChat}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-start gap-7">
        {/* Waiting customers */}
        <section aria-labelledby="rq" className="ah-rise ah-card min-w-0 flex-[2_1_600px] rounded-[22px] border border-line bg-surface-card p-5 sm:p-[26px]" style={{ animationDelay: ".12s" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconBadge name="people" />
              <h2 id="rq" className="font-display text-2xl leading-tight font-bold">
                {t.waitingTitle}
              </h2>
            </div>
            {home.waitingLoaded && <Pill className={showWaiting ? "bg-surface-inverse text-brand" : "bg-neutral-soft text-ink-soft"}>{t.nWaiting(n)}</Pill>}
          </div>
          {home.removedName !== null && (
            <div className="mt-4">
              <Notice tone="info" action={<button type="button" onClick={home.dismissRemoved} className="ah-tap h-9 rounded-xl border border-line-strong px-3.5 text-sm font-bold">{t.close}</button>}>
                {t.removedOk(home.removedName || t.customer)}
              </Notice>
            </div>
          )}
          {home.waitingFailed && (
            <div className="mt-4">
              <Notice action={<button type="button" onClick={home.retry} className="ah-tap h-9 rounded-xl border border-danger px-3.5 text-sm font-bold">{t.retry}</button>}>
                {t.listFailed}
              </Notice>
            </div>
          )}
          {!home.waitingLoaded ? (
            <p role="status" className="mt-[18px] rounded-[18px] border border-dashed border-line-strong bg-surface-page px-5 py-9 text-center text-[15px] text-ink-soft">
              {t.loadingList}
            </p>
          ) : showWaiting ? (
            <div className="mt-[18px] flex flex-col gap-3.5">
              {home.waiting.map((w, i) => {
                const wait = waited(w.since);
                return (
                  <article key={w.key} className="ah-rise ah-rowh flex flex-wrap items-center gap-x-[18px] gap-y-3.5 rounded-[18px] border border-line bg-surface-page p-[18px]" style={{ animationDelay: `${Math.min(i, 5) * 0.08}s` }}>
                    <div className="flex size-[54px] flex-none items-center justify-center rounded-full bg-surface-sunken text-[17px] font-bold text-brand-strong"><Person name={initialsOf(w.name)} locale={locale} /></div>
                    <div className="min-w-0 flex-[1_1_280px]">
                      <div className="text-[17px] font-bold">
                        <Person name={display(w)} locale={locale} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Pill className={w.kind === "call" ? "bg-success-soft text-success" : "bg-[#E9EDF7] text-ink"}>
                          <Icon name={w.kind === "call" ? "phone" : "chat"} size={14} />
                          {kindLabel(w.kind)}
                        </Pill>
                        {w.subType && (w.subType === "video" || w.subType === "audio") && <Pill className="bg-surface-sunken text-brand-strong">{w.subType === "video" ? t.video : t.audio}</Pill>}
                        {w.position !== null && <Pill className="bg-surface-sunken text-brand-strong">{t.position(w.position)}</Pill>}
                        {wait && (
                          <Pill className="bg-[#F1ECE1] text-ink-soft">
                            <Icon name="clock" size={14} />
                            {wait}
                          </Pill>
                        )}
                      </div>
                      <p className="mt-2.5 text-sm text-ink-soft">{w.kind === "call" ? t.callInApp : t.chatAuto}</p>
                    </div>
                    {(w.kind === "call" || w.bookingId) && (
                      <button type="button" onClick={() => home.askRemove(w)} className="ah-tap inline-flex h-12 flex-none items-center justify-center rounded-[14px] border-[1.5px] border-ink px-[18px] text-[15px] font-bold">
                        {t.decline}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-[18px] flex flex-col items-center gap-2 rounded-[18px] border border-dashed border-line-strong bg-surface-page px-5 py-9 text-center">
              <span className="ah-bob inline-flex size-[76px] items-center justify-center rounded-full bg-surface-inverse shadow-[0_0_0_4px_var(--color-surface-sunken)]">
                <Icon name="power" size={36} color="#FFAE00" />
              </span>
              <div className="font-display text-xl font-bold">{empty.title}</div>
              <p className="m-0 max-w-[440px] text-[15px] text-ink-soft">{empty.body}</p>
              {empty.cta && (
                <button type="button" disabled={home.pending} onClick={() => home.setMode("online")} className="ah-tap mt-2 inline-flex h-[50px] items-center justify-center rounded-[14px] bg-brand px-6 text-[15px] font-bold text-brand-ink disabled:opacity-60">
                  {empty.cta}
                </button>
              )}
              <Link href="/astrologer/session" className="ah-tap mt-2 inline-flex h-[50px] items-center justify-center gap-2 rounded-[14px] bg-surface-inverse px-6 text-[15px] font-bold text-ink-inverse">
                <Icon name="chat" size={18} />
                {t.goChats}
              </Link>
            </div>
          )}
        </section>
        {home.removing && <RemoveDialog t={t} home={home} name={display(home.removing)} />}

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-7">
          <section aria-labelledby="td" className="ah-rise ah-card rounded-[22px] border border-line bg-surface-card p-5 sm:p-[26px]" style={{ animationDelay: ".18s" }}>
            <div className="flex items-center gap-3">
              <IconBadge name="sun" />
              <h2 id="td" className="font-display text-2xl leading-tight font-bold">
                {t.todayTitle}
              </h2>
            </div>
            {home.today.failed && !today ? (
              <div className="mt-4">
                <Notice action={<button type="button" onClick={home.retry} className="ah-tap h-9 rounded-xl border border-danger px-3.5 text-sm font-bold">{t.retry}</button>}>{t.todayFailed}</Notice>
              </div>
            ) : !today ? (
              <p role="status" className="mt-4 text-[15px] text-ink-soft">…</p>
            ) : (
              <div className="mt-4">
                {today.earned !== null && (
                  <>
                    <div className="text-[13px] font-semibold text-ink-soft">{t.earned}</div>
                    <div className="font-display text-5xl leading-[1.05] font-bold tracking-[-.01em] tabular-nums">₹{today.earned.toLocaleString("en-IN")}</div>
                    {today.vsYesterday ? (
                      <div className={`mt-1 mb-3.5 flex items-center gap-1.5 text-sm font-semibold ${today.vsYesterday > 0 ? "text-success" : "text-ink-soft"}`}>
                        <Icon name="trend" size={15} color="currentColor" stroke={2.4} />
                        {today.vsYesterday > 0 ? t.vsMore(today.vsYesterday.toLocaleString("en-IN")) : t.vsLess(Math.abs(today.vsYesterday).toLocaleString("en-IN"))}
                      </div>
                    ) : (
                      <div className="mb-2" />
                    )}
                  </>
                )}
                <TodayRow icon="people" label={t.consult} value={String(today.sessions)} />
                <TodayRow icon="clock" label={t.minutes} value={String(today.minutes)} />
                {wd && wd.targetMinutes > 0 && <TodayRow icon="power" label={t.online} value={t.onlineOf(wd.onlineMinutes, wd.targetMinutes)} />}
                <TodayRow icon="star" label={t.rating} value={home.rating.data !== null ? `${home.rating.data.toFixed(1)} ★` : t.noRating} />
              </div>
            )}
            <Link href="/astrologer/earnings" className="ah-tap mt-3 inline-flex h-[50px] w-full items-center justify-center rounded-[14px] border-[1.5px] border-ink text-[15px] font-bold">
              {t.viewEarn}
            </Link>
          </section>

          <section aria-labelledby="nb" className="ah-rise ah-card rounded-[160px_160px_22px_22px] border border-line bg-surface-card px-6 pt-10 pb-[26px] text-center" style={{ animationDelay: ".24s" }}>
            <span className="ah-wig inline-flex size-[66px] items-center justify-center rounded-full bg-surface-inverse shadow-[0_0_0_6px_var(--color-surface-sunken)]">
              <Icon name="calendar" size={30} color="#FFAE00" />
            </span>
            <div id="nb" className="mt-3.5 text-[13px] font-semibold text-ink-soft">{t.nextTitle}</div>
            {next ? (
              <>
                <div className="mt-0.5 font-display text-xl font-bold">
                  <Person name={next.name || t.customer} locale={locale} />
                </div>
                <div className="text-[15px] text-ink-soft">{t.nextWhat(kindLabel(next.kind), next.durationMinutes)}</div>
                <Pill className="mt-3 bg-surface-sunken text-brand-strong">{dateFmt.format(next.startsAt ?? 0)}</Pill>
                {joinable && (
                  <div className="mt-3.5 flex justify-center">
                    <JoinBooking
                      bookingId={joinable.id}
                      userId={joinable.userId}
                      selfId={selfId}
                      kind={joinable.kind}
                      status={joinable.status}
                      startsAt={joinable.startsAt}
                      endsAt={joinable.startsAt === null ? null : joinable.startsAt + (joinable.durationMinutes ?? 0) * 60_000}
                      size="md"
                    />
                  </div>
                )}
              </>
            ) : home.bookings.failed && !home.bookings.data.length ? (
              <div className="mt-0.5 text-[15px] text-danger">{t.nextFailed}</div>
            ) : home.bookings.loaded ? (
              <div className="mt-0.5 text-[15px] text-ink-soft">{t.nextNone}</div>
            ) : (
              <div className="mt-0.5 text-[15px] text-ink-soft">…</div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
