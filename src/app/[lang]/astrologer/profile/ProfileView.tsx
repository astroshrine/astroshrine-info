"use client";

import { useEffect, useState } from "react";
import { PiRocket, PiChatCircleText, PiClock, PiEye, PiPencilSimple, PiPhone, PiQuestion, PiSeal, PiStar, PiUser, PiPower, PiCaretRight } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { DEFAULT_CHAT_RATE, priceOf } from "@/lib/endpoints";
import type { Review } from "@/lib/services/astrologerModel";
import {
  RATE_MAX,
  RATE_MIN,
  TARGET_MAX,
  TARGET_MIN,
  getOwnAstrologer,
  getReviews,
  getWorkday,
  replyToReview,
  nextPricingChange,
  saveProfile,
  savePricing,
  saveWorkdaySettings,
  type OwnAstrologer,
  type Workday,
} from "@/lib/services/astrologerProfile";
import { Accent, Button, Card, IconBadge, Page, PageTitle, Pill, fieldClass, labelClass } from "../_console/ui";
import { useAstrologer } from "../_console/useAstrologer";
import {
  Avatar,
  DetailsInputs,
  EXPERTISE_CHOICES,
  LANGUAGE_CHOICES,
  Note,
  PhotoField,
  Text,
  canonical,
  checkDetails,
  fieldText,
  labelOf,
  messageOf,
  whole,
  type DetailsDraft,
} from "./DetailsFields";

const text = defineMessages({
  hi: {
    eyebrow: "प्रोफ़ाइल और दरें",
    titleA: "आपकी ",
    titleB: "प्रोफ़ाइल",
    sub: "ग्राहक आपको ऐसे देखते हैं। अपनी फ़ोटो, परिचय, विशेषज्ञता, दरें और विश्राम-समय यहीं बदलें।",
    loading: "प्रोफ़ाइल लोड हो रही है…",
    failed: "प्रोफ़ाइल नहीं खुल सकी।",
    retry: "फिर कोशिश करें",
    rating: "रेटिंग",
    noRating: "अभी नहीं",
    reviewsCount: (n: number) => `${n} समीक्षाएँ`,
    sessions: "परामर्श",
    years: (n: number) => `${n} वर्ष`,
    publicCard: "अपना सार्वजनिक कार्ड देखें",
    aboutTitle: "आपके बारे में और विशेषज्ञता",
    edit: "प्रोफ़ाइल बदलें",
    saveProfile: "प्रोफ़ाइल सहेजें",
    cancel: "रद्द करें",
    editHint: "सहेजने के बाद बदलाव आपके सार्वजनिक कार्ड पर दिखेंगे।",
    expL: "विशेषज्ञता",
    langL: "भाषाएँ",
    cardTitle: "ग्राहक क्या देखते हैं",
    perMin: (n: number) => `₹${n}/मिनट`,
    sessionsCount: (n: number) => `${n} परामर्श`,
    noAbout: "अभी कुछ नहीं लिखा। ग्राहक आपको चुनने से पहले इसे पढ़ते हैं।",
    saving: "सहेज रहे हैं…",
    saved: "सहेजा गया ✓",
    ratesTitle: "आपकी दरें",
    ratesSub: "प्रति मिनट रुपये में। ग्राहक वही चुकाते हैं जो यहाँ दिखता है। दरें और ऑफ़र 24 घंटे में एक बार बदले जा सकते हैं।",
    chat: "चैट",
    call: "कॉल",
    rate: "दर (₹ प्रति मिनट)",
    offer: "ऑफ़र दर (₹ प्रति मिनट, वैकल्पिक)",
    offerHint: "दर से कम होनी चाहिए। ऑफ़र हटाने के लिए खाली छोड़ें।",
    nextChange: (when: string) => `अगला बदलाव ${when} के बाद ही हो सकता है।`,
    saveRates: "दरें सहेजें",
    errRate: (ch: string) => `${ch} की दर ${RATE_MIN} से ${RATE_MAX} के बीच पूरी संख्या होनी चाहिए।`,
    errOffer: (ch: string) => `${ch} की ऑफ़र दर ${RATE_MIN} से ${RATE_MAX} के बीच पूरी संख्या और सामान्य दर से कम होनी चाहिए।`,
    cooldown: (when: string) => `दरें 24 घंटे में एक बार बदली जा सकती हैं। अगला बदलाव ${when} के बाद।`,
    workTitle: "कार्य लक्ष्य और विश्राम",
    workSub: "विश्राम-समय में आप व्यस्त दिखते हैं और नए सत्र नहीं आते। समय भारतीय समय (IST) में है।",
    today: "आज ऑनलाइन",
    min: (n: number) => `${n.toLocaleString("hi-IN")} मिनट`,
    target: "दैनिक लक्ष्य (मिनट)",
    targetHint: `${TARGET_MIN} से ${TARGET_MAX} मिनट के बीच`,
    rest: "रोज़ विश्राम-समय चालू रखें",
    restStart: "विश्राम शुरू",
    restEnd: "विश्राम समाप्त",
    errTarget: `दैनिक लक्ष्य ${TARGET_MIN} से ${TARGET_MAX} मिनट के बीच होना चाहिए।`,
    errRest: "विश्राम की शुरुआत और समाप्ति के अलग-अलग समय चुनें।",
    saveWork: "लक्ष्य सहेजें",
    boostTitle: "ऑटो बूस्ट (मुफ़्त)",
    boostSub: "मुफ़्त। चालू होने पर आप ज्योतिषी सूची में ऊपर दिखेंगे।",
    boostChat: "चैट के लिए",
    boostCall: "कॉल के लिए",
    onBreak: "अभी विश्राम पर",
    reviewsTitle: "हाल की समीक्षाएँ",
    noReviews: "अभी कोई समीक्षा नहीं।",
    reply: "आपका उत्तर",
    replyBtn: "उत्तर दें",
    replyLabel: "सार्वजनिक उत्तर",
    replyHint: "आपका उत्तर प्रोफ़ाइल पर सबको दिखेगा।",
    replySend: "उत्तर भेजें",
    replySending: "भेज रहे हैं…",
    replyCancel: "रद्द करें",
    replyEmpty: "उत्तर लिखें।",
    account: "खाता",
    help: "उपयोग कैसे करें",
    helpSub: "सहायता और अक्सर पूछे जाने वाले प्रश्न",
    payouts: "भुगतान, बैंक और KYC AstroShrine टीम संभालती है। इनमें बदलाव के लिए सहायता से संपर्क करें।",
    logout: "लॉग आउट",
    genericError: "सहेजा नहीं जा सका। कृपया फिर कोशिश करें।",
  },
  en: {
    eyebrow: "Profile and rates",
    titleA: "Your ",
    titleB: "profile",
    sub: "This is how customers see you. Edit your photo, bio and expertise, and set your rates and rest hours.",
    loading: "Loading your profile…",
    failed: "Could not load your profile.",
    retry: "Try again",
    rating: "Rating",
    noRating: "None yet",
    reviewsCount: (n) => `${n} reviews`,
    sessions: "Sessions",
    years: (n) => `${n} years`,
    publicCard: "See your public card",
    aboutTitle: "About you and expertise",
    edit: "Edit profile",
    saveProfile: "Save profile",
    cancel: "Cancel",
    editHint: "Changes show on your public card after you save.",
    expL: "Expertise",
    langL: "Languages",
    cardTitle: "What customers see",
    perMin: (n) => `₹${n}/min`,
    sessionsCount: (n) => `${n} sessions`,
    noAbout: "Nothing written yet. Customers read this before they choose you.",
    saving: "Saving…",
    saved: "Saved ✓",
    ratesTitle: "Your rates",
    ratesSub: "Per minute, in rupees. Customers pay what you see here. You can change rates and offers once every 24 hours.",
    chat: "Chat",
    call: "Call",
    rate: "Rate (₹ per minute)",
    offer: "Offer rate (₹ per minute, optional)",
    offerHint: "Must be lower than the rate. Leave empty to remove the offer.",
    nextChange: (when) => `The next change is possible after ${when}.`,
    saveRates: "Save rates",
    errRate: (ch) => `${ch} rate must be a whole number from ${RATE_MIN} to ${RATE_MAX}.`,
    errOffer: (ch) => `${ch} offer rate must be a whole number from ${RATE_MIN} to ${RATE_MAX} and lower than the rate.`,
    cooldown: (when) => `Rates can be changed once every 24 hours. Next change after ${when}.`,
    workTitle: "Daily target and rest hours",
    workSub: "During rest hours you show as busy and get no new sessions. Times are Indian Standard Time (IST).",
    today: "Online today",
    min: (n) => `${n.toLocaleString("en-IN")} min`,
    target: "Daily target (minutes)",
    targetHint: `Between ${TARGET_MIN} and ${TARGET_MAX} minutes`,
    rest: "Keep daily rest hours on",
    restStart: "Rest starts",
    restEnd: "Rest ends",
    errTarget: `The daily target must be between ${TARGET_MIN} and ${TARGET_MAX} minutes.`,
    errRest: "Pick a different start and end time for rest hours.",
    saveWork: "Save target",
    boostTitle: "Auto Boost (free)",
    boostSub: "Free. When on, you are shown higher in the astrologer list.",
    boostChat: "For chat",
    boostCall: "For call",
    onBreak: "On a break now",
    reviewsTitle: "Recent reviews",
    noReviews: "No reviews yet.",
    reply: "Your reply",
    replyBtn: "Reply",
    replyLabel: "Public reply",
    replyHint: "Your reply is shown to everyone on your profile.",
    replySend: "Send reply",
    replySending: "Sending…",
    replyCancel: "Cancel",
    replyEmpty: "Write a reply.",
    account: "Account",
    help: "How to use",
    helpSub: "Help and common questions",
    payouts: "Payouts, bank details and KYC are handled by the AstroShrine team. Contact support to change them.",
    logout: "Log out",
    genericError: "Could not save. Please try again.",
  },
});

/** What the backend bills a call when no rate is stored (the app's DEFAULT_CALL_RATE). */
const DEFAULT_CALL_RATE = 10;

const REPLY_MAX = 500;

/** One review with the astrologer's public reply: shown when there is one, otherwise a form to write it. */
function ReviewItem({ review: r, id, t, intl }: { review: Review; id: string; t: T; intl: string }) {
  const [reply, setReply] = useState(r.reply);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = draft.trim();
    if (!message) return setError(t.replyEmpty);
    setBusy(true);
    setError("");
    try {
      await replyToReview(id, r, message);
      setReply(message);
      setOpen(false);
    } catch (err) {
      setError(messageOf(err, t.genericError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold">
          <Text>{r.reviewer}</Text>
        </span>
        <span className="text-brand-strong" role="img" aria-label={`${r.rating} / 5`}>
          {"★".repeat(r.rating)}
          <span className="text-line-strong">{"★".repeat(5 - r.rating)}</span>
        </span>
        <span className="text-sm text-ink-soft">{new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", year: "numeric" }).format(r.ts)}</span>
      </div>
      {r.comment && (
        <p className="mt-1 text-[15px]">
          <Text>{r.comment}</Text>
        </p>
      )}
      {reply ? (
        <p className="mt-2 rounded-xl bg-surface-sunken p-3 text-[15px]">
          <span className="font-semibold">{t.reply}: </span>
          <Text>{reply}</Text>
        </p>
      ) : open ? (
        <form onSubmit={send} noValidate className="mt-3 flex flex-col gap-2">
          <label htmlFor={`rv-${r.key}`} className={labelClass}>
            {t.replyLabel}
          </label>
          <textarea
            id={`rv-${r.key}`}
            className={`${fieldClass} h-24 py-3`}
            value={draft}
            maxLength={REPLY_MAX}
            onChange={(e) => setDraft(e.target.value)}
            aria-describedby={`rv-${r.key}-hint`}
          />
          <p id={`rv-${r.key}-hint`} className="text-sm text-ink-soft">
            {t.replyHint}
          </p>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? t.replySending : t.replySend}
            </Button>
            <Button variant="line" size="sm" disabled={busy} onClick={() => setOpen(false)}>
              {t.replyCancel}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="ghost" size="sm" className="mt-2 -ml-2" onClick={() => setOpen(true)}>
          {t.replyBtn}
        </Button>
      )}
    </li>
  );
}

type Load = { id: string; status: "ready"; me: OwnAstrologer; workday: Workday | null; reviews: Review[] } | { id: string; status: "error" };

export default function ProfileView() {
  const t = useT(text);
  const locale = useLocale();
  const intl = INTL_LOCALE[locale];
  const { id, status } = useAstrologer();
  const { session, signOut, refresh } = useAuth();
  const [load, setLoad] = useState<Load | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(false);
  const hi = locale === "hi";

  useEffect(() => {
    if (status !== "ready" || !id || !session) return;
    const controller = new AbortController();
    Promise.all([
      getOwnAstrologer(id, controller.signal),
      getWorkday(id, controller.signal).catch(() => null),
      getReviews(id, controller.signal).catch(() => [] as Review[]),
    ]).then(
      ([me, workday, reviews]) => setLoad({ id, status: "ready", me, workday, reviews }),
      () => !controller.signal.aborted && setLoad({ id, status: "error" }),
    );
    return () => controller.abort();
  }, [id, status, session, attempt]);

  const current = load && load.id === id ? load : null;
  const reload = () => setAttempt((n) => n + 1);

  const header = (
    <PageTitle
      eyebrow={t.eyebrow}
      title={
        <>
          {t.titleA}
          <Accent>{t.titleB}</Accent>
        </>
      }
      sub={t.sub}
    />
  );

  if (!current)
    return (
      <Page>
        {header}
        <Card className="p-8 text-ink-soft" role="status">
          {t.loading}
        </Card>
      </Page>
    );
  if (current.status === "error")
    return (
      <Page>
        {header}
        <Card className="flex flex-wrap items-center justify-between gap-4 p-8" role="alert">
          <p className="text-danger">{t.failed}</p>
          <Button
            variant="line"
            size="sm"
            onClick={() => {
              setLoad(null);
              reload();
            }}
          >
            {t.retry}
          </Button>
        </Card>
      </Page>
    );

  const { me, workday, reviews } = current;
  const when = (ms: number) => new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(ms);

  return (
    <Page>
      {header}

      <div className="flex flex-wrap items-start gap-7">
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-6 lg:max-w-[360px]">
          <Card className="flex flex-col items-center rounded-t-[160px] px-6 pb-7 pt-10 text-center" aria-label={t.cardTitle}>
            <Avatar photo={me.photo} name={me.name} size={120} />
            <h2 className="mt-5 font-display text-2xl font-bold leading-tight">
              <Text>{me.name || "—"}</Text>
            </h2>
            {me.expertise.length > 0 && (
              <p className="mt-1.5 text-[15px] text-ink-soft">
                <Text>{me.expertise.map((e) => labelOf(EXPERTISE_CHOICES, e, hi)).join(" · ")}</Text>
              </p>
            )}
            {me.languages.length > 0 && (
              <p className="mt-0.5 text-[14px] text-ink-soft">
                {me.languages.map((l, i) => (
                  <span key={l}>
                    {i > 0 && ", "}
                    <Text>{labelOf(LANGUAGE_CHOICES, l, hi)}</Text>
                  </span>
                ))}
              </p>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Pill>
                <PiStar size={14} aria-hidden="true" />
                {me.rating ? me.rating.toFixed(1) : t.noRating} · {t.reviewsCount(me.reviews)}
              </Pill>
              {me.experience > 0 && <Pill tone="neutral">{t.years(me.experience)}</Pill>}
              <Pill tone="neutral">{t.sessionsCount(me.orders)}</Pill>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              <Button size="sm" onClick={() => setEditing(true)}>
                <PiPencilSimple size={17} className="text-brand" aria-hidden="true" />
                {t.edit}
              </Button>
              <Button href={`/astrologers/${me.id}`} variant="line" size="sm">
                <PiEye size={17} aria-hidden="true" />
                {t.publicCard}
              </Button>
            </div>
          </Card>

          <Card className="p-6" aria-labelledby="pf-account">
            <div className="flex items-center gap-3">
              <IconBadge icon={PiUser} size={42} />
              <h2 id="pf-account" className="font-display text-xl font-bold">
                {t.account}
              </h2>
            </div>
            <p className="mt-3 text-[14.5px] text-ink-soft">{t.payouts}</p>
            <ul className="mt-3 divide-y divide-line">
              <li>
                <Link href="/astrologer/help" className="flex items-center gap-3 py-3.5 transition hover:translate-x-1">
                  <IconBadge icon={PiQuestion} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{t.help}</span>
                    <span className="block text-[13.5px] text-ink-soft">{t.helpSub}</span>
                  </span>
                  <PiCaretRight size={16} className="text-ink-soft" aria-hidden="true" />
                </Link>
              </li>
              <li>
                <button type="button" onClick={() => void signOut()} className="flex w-full cursor-pointer items-center gap-3 py-3.5 text-left font-bold text-danger">
                  <span aria-hidden="true" className="inline-flex size-[38px] shrink-0 items-center justify-center rounded-full bg-danger-soft">
                    <PiPower size={18} />
                  </span>
                  {t.logout}
                </button>
              </li>
            </ul>
          </Card>
        </div>

        <div className="flex min-w-0 flex-[3_1_480px] flex-col gap-7">
          <DetailsCard
            key={`d-${me.name}-${me.experience}-${me.aboutMe}-${me.expertise.join()}-${me.languages.join()}`}
            me={me}
            editing={editing}
            setEditing={setEditing}
            hi={hi}
            onPhoto={reload}
            onSaved={() => {
              reload();
              void refresh();
            }}
            t={t}
          />
          <RatesForm key={`r-${JSON.stringify(me.pricing)}`} me={me} onChanged={reload} when={when} t={t} />
          {workday && <BoostCard id={me.id} settings={workday.settings} t={t} />}
          {workday && <WorkdayForm key={`w-${JSON.stringify(workday.settings)}`} id={me.id} workday={workday} onSaved={reload} t={t} />}

          <Card className="p-6 sm:p-7" aria-labelledby="pf-reviews">
            <div className="flex items-center gap-3">
              <IconBadge icon={PiStar} size={42} />
              <h2 id="pf-reviews" className="font-display text-2xl font-bold">
                {t.reviewsTitle}
              </h2>
            </div>
            {reviews.length === 0 ? (
              <p className="mt-4 text-ink-soft">{t.noReviews}</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {reviews.map((r) => (
                  <ReviewItem key={r.key} review={r} id={me.id} t={t} intl={intl} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}

type T = (typeof text)["en"];

function RatesForm({ me, onChanged, when, t }: { me: OwnAstrologer; onChanged: () => void; when: (ms: number) => string; t: T }) {
  const chat = priceOf(me.pricing.chat, DEFAULT_CHAT_RATE);
  const call = priceOf(me.pricing.call, DEFAULT_CALL_RATE);
  const init = (p: typeof chat) => ({ rate: String(p.rate), offer: p.hasOffer ? String(p.price) : "" });
  const [v, setV] = useState({ chat: init(chat), call: init(call) });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const next = nextPricingChange(me.pricing);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const out: Record<"chat" | "call", { rate: number; offerRate: number | null }> = { chat: { rate: 0, offerRate: null }, call: { rate: 0, offerRate: null } };
    for (const ch of ["chat", "call"] as const) {
      const rate = whole(v[ch].rate);
      const label = ch === "chat" ? t.chat : t.call;
      if (!(rate >= RATE_MIN && rate <= RATE_MAX)) return setNote({ kind: "error", text: t.errRate(label) });
      let offerRate: number | null = null;
      if (v[ch].offer.trim() !== "") {
        offerRate = whole(v[ch].offer);
        if (!(offerRate >= RATE_MIN && offerRate <= RATE_MAX && offerRate < rate)) return setNote({ kind: "error", text: t.errOffer(label) });
      }
      out[ch] = { rate, offerRate };
    }
    setBusy(true);
    setNote(null);
    try {
      await savePricing(me.id, out);
      setNote({ kind: "ok", text: t.saved });
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        // Reload so the date of the next allowed change comes from the server.
        setNote({ kind: "error", text: next ? t.cooldown(when(next)) : err.message });
        onChanged();
      } else setNote({ kind: "error", text: messageOf(err, t.genericError) });
    } finally {
      setBusy(false);
    }
  };

  const rows = [
    { ch: "chat" as const, label: t.chat, Icon: PiChatCircleText },
    { ch: "call" as const, label: t.call, Icon: PiPhone },
  ];

  return (
    <Card className="p-6 sm:p-7" aria-labelledby="pf-rates">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <div>
          <div className="flex items-center gap-3">
            <IconBadge icon={PiSeal} size={42} />
            <h2 id="pf-rates" className="font-display text-2xl font-bold">
              {t.ratesTitle}
            </h2>
          </div>
          <p className="mt-2 text-[15px] text-ink-soft">{t.ratesSub}</p>
          {next && <p className="mt-2 rounded-xl bg-warning-soft px-3 py-2 text-[15px] font-semibold text-warning">{t.nextChange(when(next))}</p>}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {rows.map(({ ch, label, Icon }) => (
            <fieldset key={ch} className="flex flex-col gap-3 rounded-2xl bg-surface-sunken p-4">
              <legend className="sr-only">{label}</legend>
              <p className="flex items-center gap-2 font-bold" aria-hidden="true">
                <Icon size={18} className="text-brand-strong" />
                {label}
              </p>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>{t.rate}</span>
                <input className={fieldClass} inputMode="numeric" value={v[ch].rate} onChange={(e) => setV({ ...v, [ch]: { ...v[ch], rate: e.target.value } })} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>{t.offer}</span>
                <input className={fieldClass} inputMode="numeric" value={v[ch].offer} onChange={(e) => setV({ ...v, [ch]: { ...v[ch], offer: e.target.value } })} />
                <span className="text-[13px] text-ink-soft">{t.offerHint}</span>
              </label>
            </fieldset>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={busy}>
            {busy ? t.saving : t.saveRates}
          </Button>
          {note && <Note kind={note.kind}>{note.text}</Note>}
        </div>
      </form>
    </Card>
  );
}

function WorkdayForm({ id, workday, onSaved, t }: { id: string; workday: Workday; onSaved: () => void; t: T }) {
  const s = workday.settings;
  const [target, setTarget] = useState(String(s.dailyTargetMinutes));
  const [restEnabled, setRestEnabled] = useState(s.restEnabled);
  const [restStart, setRestStart] = useState(s.restStart ?? "");
  const [restEnd, setRestEnd] = useState(s.restEnd ?? "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const intl = INTL_LOCALE[useLocale()];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = whole(target);
    if (!(minutes >= TARGET_MIN && minutes <= TARGET_MAX)) return setNote({ kind: "error", text: t.errTarget });
    if (restEnabled && (!restStart || !restEnd || restStart === restEnd)) return setNote({ kind: "error", text: t.errRest });
    setBusy(true);
    setNote(null);
    try {
      await saveWorkdaySettings(id, { dailyTargetMinutes: minutes, restEnabled, restStart: restStart || null, restEnd: restEnd || null });
      setNote({ kind: "ok", text: t.saved });
      onSaved();
    } catch (err) {
      setNote({ kind: "error", text: messageOf(err, t.genericError) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6 sm:p-7" aria-labelledby="pf-work">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <IconBadge icon={PiClock} size={42} />
            <h2 id="pf-work" className="font-display text-2xl font-bold">
              {t.workTitle}
            </h2>
            {workday.onBreak && <Pill tone="amber">{t.onBreak}</Pill>}
          </div>
          <p className="mt-2 text-[15px] text-ink-soft">{t.workSub}</p>
          <p className="mt-2 text-[15px] font-semibold">
            {t.today}: {t.min(workday.today.onlineMinutes)} / {t.min(workday.today.targetMinutes)}
          </p>
          <div className="mt-2 h-2 max-w-md overflow-hidden rounded-full bg-surface-sunken" role="img" aria-label={`${Math.round(workday.today.progress * 100)}%`}>
            <div className="h-full bg-brand" style={{ width: `${Math.round(workday.today.progress * 100)}%` }} />
          </div>
          <ul className="mt-3 flex max-w-md gap-1.5" aria-hidden="true">
            {workday.last7Days.map((d) => (
              <li key={d.day} className="flex-1 text-center text-[12px] text-ink-soft">
                <div className={`mx-auto h-1.5 rounded-full ${d.onlineMinutes >= s.dailyTargetMinutes ? "bg-brand" : "bg-line-strong"}`} />
                {new Intl.DateTimeFormat(intl, { weekday: "narrow", timeZone: "UTC" }).format(new Date(`${d.day}T00:00:00Z`))}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>{t.target}</span>
            <input className={fieldClass} inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} />
            <span className="text-[13px] text-ink-soft">{t.targetHint}</span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>{t.restStart}</span>
            <input className={fieldClass} type="time" value={restStart} onChange={(e) => setRestStart(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>{t.restEnd}</span>
            <input className={fieldClass} type="time" value={restEnd} onChange={(e) => setRestEnd(e.target.value)} />
          </label>
        </div>
        <label className="flex items-center gap-3 font-semibold">
          <input type="checkbox" className="size-5 accent-[var(--color-brand)]" checked={restEnabled} onChange={(e) => setRestEnabled(e.target.checked)} />
          {t.rest}
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={busy}>
            {busy ? t.saving : t.saveWork}
          </Button>
          {note && <Note kind={note.kind}>{note.text}</Note>}
        </div>
      </form>
    </Card>
  );
}

type BoostKey = "boostChat" | "boostCall";

/** Auto Boost switches: each saves at once, shows the new value straight away and goes back if the save fails. */
function BoostCard({ id, settings, t }: { id: string; settings: Workday["settings"]; t: T }) {
  const [on, setOn] = useState<Record<BoostKey, boolean>>({ boostChat: !!settings.boostChat, boostCall: !!settings.boostCall });
  const [saving, setSaving] = useState<BoostKey | null>(null);
  const [error, setError] = useState("");

  const toggle = async (key: BoostKey) => {
    if (saving) return;
    const value = !on[key];
    setOn((o) => ({ ...o, [key]: value }));
    setSaving(key);
    setError("");
    try {
      await saveWorkdaySettings(id, { [key]: value });
    } catch (err) {
      setOn((o) => ({ ...o, [key]: !value }));
      setError(messageOf(err, t.genericError));
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card className="p-6 sm:p-7" aria-labelledby="pf-boost">
      <div className="flex flex-wrap items-center gap-3">
        <IconBadge icon={PiRocket} size={42} />
        <h2 id="pf-boost" className="font-display text-2xl font-bold">
          {t.boostTitle}
        </h2>
      </div>
      <p className="mt-2 text-[15px] text-ink-soft">{t.boostSub}</p>
      <ul className="mt-4 divide-y divide-line">
        {(["boostChat", "boostCall"] as const).map((key) => (
          <li key={key}>
            <label className="flex cursor-pointer items-center justify-between gap-4 py-3 font-semibold">
              {t[key]}
              <input
                type="checkbox"
                role="switch"
                className="size-5 accent-[var(--color-brand)]"
                checked={on[key]}
                disabled={saving === key}
                onChange={() => toggle(key)}
              />
            </label>
          </li>
        ))}
      </ul>
      {error && <Note kind="error">{error}</Note>}
    </Card>
  );
}

function DetailsCard({
  me,
  editing,
  setEditing,
  hi,
  onPhoto,
  onSaved,
  t,
}: {
  me: OwnAstrologer;
  editing: boolean;
  setEditing: (v: boolean) => void;
  hi: boolean;
  onPhoto: () => void;
  onSaved: () => void;
  t: T;
}) {
  const f = useT(fieldText);
  const initial = (): DetailsDraft => ({
    name: me.name,
    experience: String(me.experience),
    about: me.aboutMe,
    expertise: me.expertise.map((v) => canonical(EXPERTISE_CHOICES, v)),
    languages: me.languages.map((v) => canonical(LANGUAGE_CHOICES, v)),
  });
  const [draft, setDraft] = useState<DetailsDraft>(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const checked = checkDetails(draft, f);
    if ("error" in checked) return setNote({ kind: "error", text: checked.error });
    setBusy(true);
    setNote(null);
    try {
      await saveProfile(me.id, checked.input);
      setNote({ kind: "ok", text: t.saved });
      setEditing(false);
      onSaved();
    } catch (err) {
      setNote({ kind: "error", text: messageOf(err, t.genericError) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card as="section" className="p-6 sm:p-7" aria-labelledby="pf-details">
      <div className="flex flex-wrap items-center gap-3">
        <IconBadge icon={PiUser} size={42} />
        <h2 id="pf-details" className="font-display text-2xl font-bold">
          {t.aboutTitle}
        </h2>
        {!editing && (
          <Button variant="line" size="sm" className="ml-auto" onClick={() => setEditing(true)}>
            <PiPencilSimple size={16} aria-hidden="true" />
            {t.edit}
          </Button>
        )}
        {!editing && note?.kind === "ok" && <Pill tone="green">{note.text}</Pill>}
      </div>

      {editing ? (
        <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-6">
          <PhotoField id={me.id} photo={me.photo} name={draft.name} onDone={onPhoto} />
          <DetailsInputs draft={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? t.saving : t.saveProfile}
            </Button>
            <Button
              variant="line"
              disabled={busy}
              onClick={() => {
                setDraft(initial());
                setNote(null);
                setEditing(false);
              }}
            >
              {t.cancel}
            </Button>
            <span className="text-[13.5px] text-ink-soft">{t.editHint}</span>
          </div>
          {note?.kind === "error" && <Note kind="error">{note.text}</Note>}
        </form>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <p className="max-w-3xl text-[15.5px] leading-relaxed">{me.aboutMe ? <Text>{me.aboutMe}</Text> : <span className="text-ink-soft">{t.noAbout}</span>}</p>
          <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-[auto_1fr]">
            <dt className="font-bold text-brand-strong">{t.expL}</dt>
            <dd>
              <Text>{me.expertise.map((e) => labelOf(EXPERTISE_CHOICES, e, hi)).join(" · ") || "—"}</Text>
            </dd>
            <dt className="font-bold text-brand-strong">{t.langL}</dt>
            <dd>
              <Text>{me.languages.map((l) => labelOf(LANGUAGE_CHOICES, l, hi)).join(", ") || "—"}</Text>
            </dd>
          </dl>
        </div>
      )}
    </Card>
  );
}
