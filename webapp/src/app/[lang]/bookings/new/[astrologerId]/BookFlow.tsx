"use client";

import { useEffect, useMemo, useState } from "react";
import { PiArrowLeft, PiCalendarCheck, PiChatCircleDots, PiCheckCircle, PiPhone, PiWallet } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import AstrologerAvatar from "@/components/consult/AstrologerAvatar";
import AvailabilityBadge from "@/components/consult/AvailabilityBadge";
import { primaryButton, secondaryButton } from "@/components/consult/Dialog";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { getAstrologerProfile } from "@/lib/services/astrologers";
import { contentLang, rupees, type AstrologerProfile } from "@/lib/services/astrologerModel";
import {
  bookSlot,
  bookableDays,
  clockLabel,
  durationOptions,
  errorCodeOf,
  getBookingRates,
  getSlots,
  statusCodeOf,
  type BookResult,
  type BookingChannel,
  type BookingRates,
  type Slot,
} from "@/lib/services/bookings";
import { getConsultConfig, lowBalanceInfo, rechargeHref } from "@/lib/services/chat";
import { ListSkeleton, LoadError, PageFrame, dayMonthOf, longDate, useRequireSignIn, weekdayOf } from "../../_parts/shared";

const text = defineMessages({
  hi: {
    back: "वापस",
    title: "समय बुक करें",
    intro: "ज्योतिषी के अपने खाली समय में से चुनें। पॉइंट्स अभी wallet से कटते हैं, और समय से पहले रद्द करने पर रिफ़ंड मिलता है।",
    loadFailed: "यह ज्योतिषी या उनका समय लोड नहीं हो सका।",
    howTitle: "कैसे बात करनी है",
    call: "वॉइस कॉल",
    chat: "चैट",
    dayTitle: "दिन चुनें",
    days: "अगले 8 दिन",
    free: (n: number) => (n === 0 ? "कोई स्लॉट नहीं" : `${n} स्लॉट`),
    slotsTitle: "समय चुनें",
    noSlotsDay: "इस दिन इस तरह के लिए कोई खाली समय नहीं है। दूसरा दिन या दूसरा तरीका चुनें।",
    noSlotsAny: "इस ज्योतिषी ने अगले 8 दिनों के लिए अभी कोई समय नहीं रखा है।",
    taken: "बुक",
    slotLabel: (from: string, to: string) => `${from} से ${to}`,
    lengthTitle: "कितनी देर",
    min: (n: number) => `${n} मिनट`,
    callCap: (n: number) => `बुक की गई कॉल ज़्यादा से ज़्यादा ${n} मिनट की होती है।`,
    summary: "सारांश",
    when: "समय",
    price: "अनुमानित कीमत",
    estimateNote: "कीमत अनुमान है। असली रकम बुक करते समय सर्वर तय करता है और यहां दिखाता है।",
    free0: "मुफ़्त",
    wallet: "आपका wallet",
    pts: (n: number) => `${n} पॉइंट्स`,
    confirm: "बुकिंग पक्की करें",
    booking: "बुक हो रही है…",
    offlineNote: "बुकिंग तभी होती है जब ज्योतिषी अभी ऑनलाइन हों। वे अभी ऑनलाइन नहीं हैं, इसलिए बुक करने पर शायद मना हो जाए। कुछ नहीं कटेगा।",
    errOffline: "ये ज्योतिषी अभी ऑनलाइन नहीं हैं, इसलिए बुकिंग नहीं हो सकी। कुछ नहीं कटा। जब वे ऑनलाइन हों तब फिर कोशिश करें।",
    errLive: "ये ज्योतिषी अभी लाइव हैं और बुकिंग नहीं ले रहे। कुछ नहीं कटा।",
    errTaken: "यह समय अभी किसी और ने ले लिया। दूसरा समय चुनें।",
    errLow: (need: number | undefined, balance: number | undefined) =>
      need != null && balance != null ? `इस बुकिंग के लिए ${need} पॉइंट्स चाहिए, आपके पास ${balance} हैं।` : "wallet में पॉइंट्स कम हैं।",
    recharge: "Wallet रिचार्ज करें",
    errOther: "बुकिंग नहीं हो सकी। कुछ नहीं कटा। कृपया फिर से कोशिश करें।",
    doneTitle: "बुकिंग पक्की हो गई",
    doneBody: (name: string, when: string) => `${name} के साथ ${when}।`,
    donePaid: (pts: number) => `${pts} पॉइंट्स कटे`,
    doneQuestions: (n: number) => `इस चैट में ${n} सवाल पूछ सकते हैं।`,
    openBooking: "बुकिंग देखें",
    myAppointments: "मेरी अपॉइंटमेंट",
    astrologer: "ज्योतिषी",
  },
  en: {
    back: "Back",
    title: "Book a slot",
    intro: "Pick from the astrologer's own free times. Points are taken from your wallet now, and you get a refund if you cancel in time.",
    loadFailed: "This astrologer or their times could not be loaded.",
    howTitle: "How do you want to talk",
    call: "Voice call",
    chat: "Chat",
    dayTitle: "Pick a day",
    days: "The next 8 days",
    free: (n) => (n === 0 ? "No slots" : n === 1 ? "1 slot" : `${n} slots`),
    slotsTitle: "Pick a time",
    noSlotsDay: "No free times of this kind on this day. Try another day or another way to talk.",
    noSlotsAny: "This astrologer has not set any times for the next 8 days yet.",
    taken: "Booked",
    slotLabel: (from, to) => `${from} to ${to}`,
    lengthTitle: "How long",
    min: (n) => `${n} min`,
    callCap: (n) => `A booked call lasts at most ${n} minutes.`,
    summary: "Summary",
    when: "When",
    price: "Estimated price",
    estimateNote: "The price is an estimate. The server sets the real amount when you book and shows it here.",
    free0: "Free",
    wallet: "Your wallet",
    pts: (n) => `${n} points`,
    confirm: "Confirm booking",
    booking: "Booking…",
    offlineNote: "A slot can be booked only while the astrologer is online. They are not online right now, so booking may be refused. Nothing is charged then.",
    errOffline: "This astrologer is not online right now, so the booking was not made. Nothing was charged. Try again when they are online.",
    errLive: "This astrologer is live right now and is not taking bookings. Nothing was charged.",
    errTaken: "Someone else just took this time. Please pick another.",
    errLow: (need, balance) => (need != null && balance != null ? `This booking needs ${need} points and you have ${balance}.` : "Your wallet does not have enough points."),
    recharge: "Recharge wallet",
    errOther: "The booking could not be made. Nothing was charged. Please try again.",
    doneTitle: "Booking confirmed",
    doneBody: (name, when) => `${when} with ${name}.`,
    donePaid: (pts) => `${pts} points charged`,
    doneQuestions: (n) => `You can ask ${n} questions in this chat.`,
    openBooking: "View booking",
    myAppointments: "My appointments",
    astrologer: "Astrologer",
  },
});

/** The call length the server allows for a booked call (CALL_SESSION_MINUTES, 10 unless the server changes it). */
const CALL_CAP = 10;

type DaySlots = Slot[] | "error";

const fits = (s: Slot, c: BookingChannel) => s.channel === "both" || s.channel === c;

export default function BookFlow({ astrologerId }: { astrologerId: string }) {
  const signedIn = useRequireSignIn();
  if (!signedIn) return <PageFrame narrow><ListSkeleton rows={2} /></PageFrame>;
  return <Flow astrologerId={astrologerId} />;
}

function Flow({ astrologerId }: { astrologerId: string }) {
  const t = useT(text);
  const locale = useLocale();
  const { balance, refresh } = useAuth();
  const days = useMemo(() => bookableDays(), []);

  const [astrologer, setAstrologer] = useState<AstrologerProfile | null>(null);
  const [rates, setRates] = useState<BookingRates | null>(null);
  const [free, setFree] = useState(false);
  const [byDay, setByDay] = useState<Map<string, DaySlots>>(new Map());
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const [channel, setChannel] = useState<BookingChannel>("call");
  const [date, setDate] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(0);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<{ kind: "offline" | "live" | "taken" | "low" | "other"; need?: number; balance?: number } | null>(null);
  const [done, setDone] = useState<{ result: BookResult; date: string; start: string; channel: BookingChannel } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      getAstrologerProfile(astrologerId, { signal }),
      getBookingRates(astrologerId, signal).catch(() => null),
      getConsultConfig(signal),
      Promise.all(days.map((d) => getSlots(astrologerId, d, signal).then<DaySlots, DaySlots>((s) => s, () => "error"))),
    ]).then(
      ([profile, r, config, slots]) => {
        setAstrologer(profile);
        setRates(r);
        setFree(config.free);
        setByDay(new Map(days.map((d, i) => [d, slots[i]])));
        // Every day failing is a load failure; some failing just shows "No slots" for those days.
        if (slots.every((s) => s === "error")) setFailed(true);
      },
      () => {
        if (!signal.aborted) setFailed(true);
      },
    );
    return () => controller.abort();
  }, [astrologerId, days, attempt]);

  const slotsOf = (d: string) => {
    const v = byDay.get(d);
    return Array.isArray(v) ? v.filter((s) => fits(s, channel)) : [];
  };
  const freeCount = (d: string) => slotsOf(d).filter((s) => s.available).length;

  // First day with a free slot, for the chosen way of talking.
  const firstDay = useMemo(() => days.find((d) => freeCount(d) > 0) ?? null, [days, byDay, channel]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeDate = date && byDay.has(date) ? date : firstDay;
  const slots = activeDate ? slotsOf(activeDate) : [];
  const slot = slots.find((s) => s.start === start && s.available) ?? null;
  const options = slot ? durationOptions(channel === "call" ? Math.min(slot.durationMinutes, CALL_CAP) : slot.durationMinutes) : [];
  const chosen = options.includes(minutes) ? minutes : (options[options.length - 1] ?? 0);

  const name = astrologer?.name || t.astrologer;
  const rate = rates ? (channel === "call" ? rates.call.price : rates.chat.price) : null;
  const estimate = free ? 0 : rate != null ? Math.ceil(rate * chosen) : null;
  const points = balance?.points_balance ?? null;

  const book = async () => {
    if (!slot || !activeDate || busy) return;
    setBusy(true);
    setProblem(null);
    try {
      const result = await bookSlot({ astrologerId, date: activeDate, startTime: slot.start, channel, durationMinutes: chosen });
      setDone({ result, date: activeDate, start: slot.start, channel });
      void refresh();
    } catch (e) {
      const code = errorCodeOf(e);
      const low = lowBalanceInfo(e);
      if (low) setProblem({ kind: "low", ...low });
      else if (code === "ASTROLOGER_OFFLINE") setProblem({ kind: "offline" });
      else if (code === "ASTROLOGER_LIVE") setProblem({ kind: "live" });
      else if (statusCodeOf(e) === 409) {
        setProblem({ kind: "taken" });
        setStart(null);
        setAttempt((a) => a + 1);
      } else setProblem({ kind: "other" });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const when = `${longDate(done.date, locale)}, ${clockLabel(done.start)}`;
    return (
      <PageFrame narrow>
        <section aria-live="polite" className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-surface-card p-6">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success">
            <PiCheckCircle className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="heading-4 text-ink">{t.doneTitle}</h1>
          <p className="body-5 text-ink">
            <span lang={contentLang(name) ?? undefined}>{t.doneBody(name, when)}</span>
          </p>
          <p className="body-6 text-ink-soft">{free || done.result.pointsCharged === 0 ? t.free0 : t.donePaid(done.result.pointsCharged)}</p>
          {done.channel === "chat" && done.result.questionsAllowed > 0 && <p className="body-6 text-ink-soft">{t.doneQuestions(done.result.questionsAllowed)}</p>}
          <div className="flex flex-wrap gap-2">
            <Link href={`/bookings/${encodeURIComponent(done.result.bookingId)}`} className={primaryButton}>
              {t.openBooking}
            </Link>
            <Link href="/bookings" className={secondaryButton}>
              {t.myAppointments}
            </Link>
          </div>
        </section>
      </PageFrame>
    );
  }

  const anySlots = days.some((d) => (byDay.get(d) as Slot[] | undefined)?.length);

  return (
    <PageFrame narrow>
      <Link href={`/astrologers/${encodeURIComponent(astrologerId)}`} className="button-sm inline-flex w-fit items-center gap-1 text-brand-strong hover:underline">
        <PiArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="heading-3 text-ink">{t.title}</h1>
        <p className="body-6 max-w-xl text-ink-soft">{t.intro}</p>
      </header>

      {failed ? (
        <LoadError message={t.loadFailed} onRetry={() => {
            setFailed(false);
            setAttempt((a) => a + 1);
          }} />
      ) : !astrologer ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          <section className="flex items-center gap-4 rounded-2xl border border-line bg-surface-card p-4">
            <AstrologerAvatar name={name} photo={astrologer.photo} size={56} availability={astrologer.availability} />
            <div className="flex min-w-0 flex-col gap-1">
              <p lang={contentLang(name)} className="title-3 truncate text-ink">
                {name}
              </p>
              <AvailabilityBadge availability={astrologer.availability} />
            </div>
          </section>

          {astrologer.availability === "offline" && (
            <p role="note" className="body-6 rounded-2xl bg-warning-soft px-4 py-3 text-warning">
              {t.offlineNote}
            </p>
          )}

          {!anySlots ? (
            <p className="body-5 rounded-2xl border border-line bg-surface-card p-6 text-ink-soft">{t.noSlotsAny}</p>
          ) : (
            <>
              <fieldset className="flex flex-col gap-3">
                <legend className="title-4 mb-3 text-ink">{t.howTitle}</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["call", "chat"] as const).map((c) => {
                    const Icon = c === "call" ? PiPhone : PiChatCircleDots;
                    const on = channel === c;
                    return (
                      <label
                        key={c}
                        className={`button-md flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${on ? "border-brand bg-surface-sunken text-ink" : "border-line bg-surface-card text-ink-soft hover:bg-surface-sunken"}`}
                      >
                        <input type="radio" name="channel" value={c} checked={on} onChange={() => { setChannel(c); setStart(null); }} className="sr-only" />
                        <Icon className="h-5 w-5" aria-hidden />
                        {t[c]}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-3">
                <legend className="title-4 mb-3 text-ink">{t.dayTitle}</legend>
                <div role="radiogroup" aria-label={t.days} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
                  {days.map((d) => {
                    const n = freeCount(d);
                    const on = d === activeDate;
                    return (
                      <label
                        key={d}
                        className={`flex min-w-[5.5rem] shrink-0 cursor-pointer flex-col items-center gap-0.5 rounded-xl border px-3 py-2 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${on ? "border-brand bg-surface-sunken" : "border-line bg-surface-card hover:bg-surface-sunken"} ${n === 0 ? "opacity-60" : ""}`}
                      >
                        <input type="radio" name="day" value={d} checked={on} onChange={() => { setDate(d); setStart(null); }} className="sr-only" />
                        <span className="caption-2 text-ink-soft">{weekdayOf(d, locale)}</span>
                        <span className="button-sm text-ink">{dayMonthOf(d, locale)}</span>
                        <span className={`caption-4 ${n ? "text-success" : "text-ink-muted"}`}>{t.free(n)}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-3">
                <legend className="title-4 mb-3 text-ink">{t.slotsTitle}</legend>
                {slots.length === 0 ? (
                  <p className="body-6 text-ink-soft">{t.noSlotsDay}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {slots.map((s) => {
                      const on = slot?.start === s.start;
                      return (
                        <label
                          key={s.start}
                          title={t.slotLabel(clockLabel(s.start), clockLabel(s.end))}
                          className={`button-sm flex flex-col items-center rounded-xl border px-2 py-2 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                            !s.available ? "cursor-not-allowed border-line bg-neutral-soft text-ink-muted" : on ? "cursor-pointer border-brand bg-brand text-brand-ink" : "cursor-pointer border-line bg-surface-card text-ink hover:bg-surface-sunken"
                          }`}
                        >
                          <input type="radio" name="slot" value={s.start} disabled={!s.available} checked={on} onChange={() => setStart(s.start)} className="sr-only" />
                          {clockLabel(s.start)}
                          {!s.available && <span className="caption-4">{t.taken}</span>}
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>

              {slot && (
                <>
                  {options.length > 1 && (
                    <fieldset className="flex flex-col gap-3">
                      <legend className="title-4 mb-3 text-ink">{t.lengthTitle}</legend>
                      <div className="flex flex-wrap gap-2">
                        {options.map((m) => (
                          <label
                            key={m}
                            className={`button-sm cursor-pointer rounded-full border px-3 py-2 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${m === chosen ? "border-brand bg-surface-sunken text-ink" : "border-line bg-surface-card text-ink-soft hover:bg-surface-sunken"}`}
                          >
                            <input type="radio" name="length" value={m} checked={m === chosen} onChange={() => setMinutes(m)} className="sr-only" />
                            {t.min(m)}
                          </label>
                        ))}
                      </div>
                      {channel === "call" && <p className="caption-2 text-ink-soft">{t.callCap(CALL_CAP)}</p>}
                    </fieldset>
                  )}

                  <section aria-labelledby="summary" className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-card p-5">
                    <h2 id="summary" className="title-4 text-ink">
                      {t.summary}
                    </h2>
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <dt className="caption-2 text-ink-soft">{t.when}</dt>
                        <dd className="body-6 text-ink">
                          {activeDate && longDate(activeDate, locale)}, {clockLabel(slot.start)} – {clockLabel(addMinutes(slot.start, chosen))}
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1">
                        <dt className="caption-2 text-ink-soft">{t.price}</dt>
                        <dd className="body-6 text-ink">{estimate === null ? "–" : free || estimate === 0 ? t.free0 : `${t.pts(estimate)} (${rupees(estimate)})`}</dd>
                      </div>
                      <div className="flex flex-col gap-1">
                        <dt className="caption-2 text-ink-soft">{t.wallet}</dt>
                        <dd className="body-6 inline-flex items-center gap-1 text-ink">
                          <PiWallet className="h-4 w-4 text-brand-strong" aria-hidden />
                          {points === null ? "–" : t.pts(points)}
                        </dd>
                      </div>
                    </dl>
                    {!free && <p className="caption-2 text-ink-soft">{t.estimateNote}</p>}

                    {problem && (
                      <div role="alert" className="flex flex-col items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-danger">
                        <p className="body-6">
                          {problem.kind === "offline" ? t.errOffline : problem.kind === "live" ? t.errLive : problem.kind === "taken" ? t.errTaken : problem.kind === "low" ? t.errLow(problem.need, problem.balance) : t.errOther}
                        </p>
                        {problem.kind === "low" && (
                          <Link href={rechargeHref(problem.need != null && problem.balance != null ? problem.need - problem.balance : undefined)} className={secondaryButton}>
                            <PiWallet className="h-4 w-4" aria-hidden />
                            {t.recharge}
                          </Link>
                        )}
                      </div>
                    )}

                    <button type="button" onClick={book} disabled={busy} className={`${primaryButton} w-full sm:w-fit`}>
                      <PiCalendarCheck className="h-5 w-5" aria-hidden />
                      {busy ? t.booking : t.confirm}
                    </button>
                  </section>
                </>
              )}
            </>
          )}
        </>
      )}
    </PageFrame>
  );
}

function addMinutes(time: string, add: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + add;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
