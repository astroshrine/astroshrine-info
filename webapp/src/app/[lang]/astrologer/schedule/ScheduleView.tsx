"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PiCalendarCheck, PiCalendarX, PiChatCircleText, PiPhone, PiPlus, PiTrash } from "react-icons/pi";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import {
  addOverride,
  deleteOverride,
  getAppointments,
  getOverrides,
  getSchedule,
  saveSchedule,
  type Appointment,
  type ScheduleOverride,
  type ScheduleSlot,
} from "@/lib/services/astrologerSchedule";
import { Accent, Button, Card, fieldClass, labelClass, Page, PageTitle, Pill } from "../_console/ui";
import { istMs } from "@/lib/services/astrologerJoin";
import JoinBooking from "../_console/JoinBooking";
import { useAstrologer } from "../_console/useAstrologer";

const text = defineMessages({
  hi: {
    eyebrow: "समय-सारणी",
    titleA: "आपकी ",
    titleB: "उपलब्धता",
    sub: "हफ़्ते के किन समयों पर ग्राहक आपसे चैट या कॉल बुक कर सकते हैं, छुट्टी के दिन और बुक हुए सत्र।",
    loading: "समय-सारणी लोड हो रही है…",
    failed: "समय-सारणी नहीं खुल सकी।",
    retry: "फिर कोशिश करें",
    weekly: "साप्ताहिक समय",
    weeklySub: "हर दिन के एक या अधिक समय-खंड। जिस दिन कोई खंड नहीं, उस दिन बुकिंग नहीं।",
    days: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"],
    off: "छुट्टी",
    from: "से",
    to: "तक",
    slot: "स्लॉट",
    mins: (n: number) => `${n} मिनट`,
    channel: "माध्यम",
    channels: { call: "कॉल", chat: "चैट", both: "चैट और कॉल", live: "लाइव (बुक नहीं होता)" } as Record<string, string>,
    addBlock: "समय-खंड जोड़ें",
    remove: "हटाएँ",
    save: "साप्ताहिक समय सहेजें",
    saving: "सहेजा जा रहा है…",
    saved: "समय-सारणी सहेज ली गई।",
    unsaved: "बदलाव अभी सहेजे नहीं गए।",
    saveFailed: "समय-सारणी सहेज नहीं सके। फिर कोशिश करें।",
    badRange: "समाप्ति का समय शुरुआत के बाद होना चाहिए।",
    tooShort: "खंड कम से कम एक स्लॉट जितना लंबा होना चाहिए।",
    overlap: "एक दिन के खंड आपस में नहीं टकरा सकते।",
    special: "विशेष दिन",
    specialSub: "किसी तारीख पर छुट्टी लें या अतिरिक्त समय खोलें।",
    date: "तारीख",
    kind: "क्या करना है",
    kinds: { off: "पूरे दिन अनुपलब्ध", offHours: "कुछ घंटे अनुपलब्ध", extra: "अतिरिक्त समय उपलब्ध" },
    reason: "कारण (वैकल्पिक)",
    addDay: "विशेष दिन जोड़ें",
    adding: "जोड़ा जा रहा है…",
    addFailed: "विशेष दिन नहीं जोड़ सके।",
    delFailed: "विशेष दिन नहीं हटा सके।",
    noSpecial: "कोई आगामी विशेष दिन नहीं।",
    unavailable: "अनुपलब्ध",
    extraHours: "अतिरिक्त समय",
    wholeDay: "पूरा दिन",
    booked: "बुक हुए सत्र",
    bookedSub: "आज से आगे के आपके बुक हुए चैट और कॉल।",
    noBooked: "अभी कोई बुकिंग नहीं।",
    bookedFailed: "बुक हुए सत्र नहीं खुल सके।",
    customer: "ग्राहक",
    statuses: { WAITING: "प्रतीक्षा में", CONFIRMED: "पक्का", IN_PROGRESS: "चल रहा है", COMPLETED: "पूरा" } as Record<string, string>,
  },
  en: {
    eyebrow: "Schedule",
    titleA: "Your ",
    titleB: "availability",
    sub: "The hours in the week when customers can book a chat or call with you, your days off and your booked sessions.",
    loading: "Loading your schedule…",
    failed: "Could not load your schedule.",
    retry: "Try again",
    weekly: "Weekly hours",
    weeklySub: "One or more blocks for each day. A day with no block takes no bookings.",
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    off: "Day off",
    from: "From",
    to: "To",
    slot: "Slot",
    mins: (n) => `${n} min`,
    channel: "Channel",
    channels: { call: "Call", chat: "Chat", both: "Chat and call", live: "Live (not bookable)" },
    addBlock: "Add a block",
    remove: "Remove",
    save: "Save weekly hours",
    saving: "Saving…",
    saved: "Schedule saved.",
    unsaved: "Changes not saved yet.",
    saveFailed: "Could not save the schedule. Try again.",
    badRange: "The end time must be after the start time.",
    tooShort: "A block must be at least one slot long.",
    overlap: "Blocks on the same day cannot overlap.",
    special: "Special days",
    specialSub: "Take a date off or open extra hours on it.",
    date: "Date",
    kind: "What to do",
    kinds: { off: "Unavailable all day", offHours: "Unavailable for some hours", extra: "Extra hours available" },
    reason: "Reason (optional)",
    addDay: "Add special day",
    adding: "Adding…",
    addFailed: "Could not add the special day.",
    delFailed: "Could not remove the special day.",
    noSpecial: "No upcoming special days.",
    unavailable: "Unavailable",
    extraHours: "Extra hours",
    wholeDay: "All day",
    booked: "Booked sessions",
    bookedSub: "Your booked chats and calls from today onward.",
    noBooked: "No bookings yet.",
    bookedFailed: "Could not load booked sessions.",
    customer: "Customer",
    statuses: { WAITING: "Waiting", CONFIRMED: "Confirmed", IN_PROGRESS: "In progress", COMPLETED: "Completed" },
  },
});

const TZ = "Asia/Kolkata";
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const DURATIONS = [10, 15, 20, 30];
const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
const mins = (hm: string) => {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)/.exec(hm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const todayIst = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
const sortSlots = (a: ScheduleSlot, b: ScheduleSlot) => a.day_of_week - b.day_of_week || (mins(a.start_time) ?? 0) - (mins(b.start_time) ?? 0);
const same = (a: ScheduleSlot[], b: ScheduleSlot[]) => JSON.stringify([...a].sort(sortSlots)) === JSON.stringify([...b].sort(sortSlots));

/** The first problem with a draft week, as a message key, or null. Same rules as the backend. */
function problem(slots: ScheduleSlot[]): "badRange" | "tooShort" | "overlap" | null {
  for (const s of slots) {
    const a = mins(s.start_time);
    const b = mins(s.end_time);
    if (a === null || b === null || a >= b) return "badRange";
    if (b - a < s.slot_duration_minutes) return "tooShort";
  }
  for (const [i, s] of slots.entries()) {
    for (const o of slots.slice(i + 1)) {
      if (o.day_of_week === s.day_of_week && (mins(s.start_time) ?? 0) < (mins(o.end_time) ?? 0) && (mins(o.start_time) ?? 0) < (mins(s.end_time) ?? 0)) return "overlap";
    }
  }
  return null;
}

type Load<T> = { id: string; status: "ready"; data: T } | { id: string; status: "error" };

export default function ScheduleView() {
  const t = useT(text);
  const intl = INTL_LOCALE[useLocale()];
  const { id, status } = useAstrologer();
  const [week, setWeek] = useState<Load<ScheduleSlot[]> | null>(null);
  const [overrides, setOverrides] = useState<Load<ScheduleOverride[]> | null>(null);
  const [bookings, setBookings] = useState<Load<Appointment[]> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [draft, setDraft] = useState<ScheduleSlot[] | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  useEffect(() => {
    if (status !== "ready" || !id) return;
    const c = new AbortController();
    const ok = <T,>(data: T): Load<T> => ({ id, status: "ready", data });
    const bad = { id, status: "error" } as const;
    getSchedule(c.signal).then(
      (d) => {
        setWeek(ok(d));
        setDraft(d);
      },
      () => !c.signal.aborted && setWeek(bad),
    );
    getOverrides(todayIst(), c.signal).then((d) => setOverrides(ok(d)), () => !c.signal.aborted && setOverrides(bad));
    getAppointments(c.signal).then((d) => setBookings(ok(d)), () => !c.signal.aborted && setBookings(bad));
    return () => c.abort();
  }, [id, status, attempt]);

  const weekNow = week && week.id === id ? week : null;
  const saved = weekNow?.status === "ready" ? weekNow.data : null;
  const dirty = !!(saved && draft && !same(saved, draft));
  const issue = draft ? problem(draft) : null;

  const edit = (fn: (d: ScheduleSlot[]) => ScheduleSlot[]) => {
    setDraft((d) => fn(d ?? []));
    setSaveState("idle");
  };
  const patch = (target: ScheduleSlot, change: Partial<ScheduleSlot>) => edit((d) => d.map((s) => (s === target ? { ...s, ...change } : s)));

  const onSave = async () => {
    if (!draft || issue) return;
    setSaveState("saving");
    try {
      await saveSchedule(draft);
      setWeek({ id, status: "ready", data: draft });
      setSaveState("saved");
    } catch {
      setSaveState("failed");
    }
  };

  const fmtDate = (d: string) => new Intl.DateTimeFormat(intl, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
  const fmtTime = (hm: string) => {
    const m = mins(hm);
    return m === null ? hm : new Intl.DateTimeFormat(intl, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2000, 0, 1, Math.floor(m / 60), m % 60)));
  };

  const retry = () => {
    setWeek(null);
    setOverrides(null);
    setBookings(null);
    setAttempt((n) => n + 1);
  };

  const ovNow = overrides && overrides.id === id ? overrides : null;
  const bkNow = bookings && bookings.id === id ? bookings : null;

  return (
    <Page>
      <PageTitle eyebrow={t.eyebrow} title={<>{t.titleA}<Accent>{t.titleB}</Accent></>} sub={t.sub} />

      <Card className="p-5 sm:p-7">
        <h2 className="font-display text-[26px] font-bold">{t.weekly}</h2>
        <p className="mt-1 text-ink-soft">{t.weeklySub}</p>
        {!weekNow ? (
          <p role="status" className="py-10 text-center text-ink-soft">{t.loading}</p>
        ) : weekNow.status === "error" ? (
          <div role="alert" className="py-10 text-center">
            <p className="text-danger">{t.failed}</p>
            <Button variant="line" size="sm" className="mt-3" onClick={retry}>{t.retry}</Button>
          </div>
        ) : (
          <>
            <ul className="mt-5 flex flex-col divide-y divide-line">
              {WEEK.map((day) => {
                const blocks = (draft ?? []).filter((s) => s.day_of_week === day).sort(sortSlots);
                return (
                  <li key={day} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                    <div className="flex items-center gap-3 sm:w-40 sm:shrink-0 sm:pt-3">
                      <b className="text-[16px]">{t.days[day]}</b>
                      {blocks.length === 0 && <Pill tone="neutral">{t.off}</Pill>}
                    </div>
                    <div className="flex flex-1 flex-col gap-3">
                      {blocks.map((s, i) => (
                        <div key={i} className="flex flex-wrap items-end gap-3">
                          <label className="flex flex-col gap-1">
                            <span className={labelClass}>{t.from}</span>
                            <input type="time" value={s.start_time} onChange={(e) => patch(s, { start_time: e.target.value })} className={`${fieldClass} w-[140px]`} />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className={labelClass}>{t.to}</span>
                            <input type="time" value={s.end_time} onChange={(e) => patch(s, { end_time: e.target.value })} className={`${fieldClass} w-[140px]`} />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className={labelClass}>{t.slot}</span>
                            <select value={s.slot_duration_minutes} onChange={(e) => patch(s, { slot_duration_minutes: Number(e.target.value) })} className={`${fieldClass} w-[110px]`}>
                              {[...new Set([...DURATIONS, s.slot_duration_minutes])].sort((a, b) => a - b).map((d) => (
                                <option key={d} value={d}>{t.mins(d)}</option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className={labelClass}>{t.channel}</span>
                            <select value={s.channel_type} onChange={(e) => patch(s, { channel_type: e.target.value })} className={`${fieldClass} w-[190px]`}>
                              {["both", "call", "chat", ...(s.channel_type === "live" ? ["live"] : [])].map((c) => (
                                <option key={c} value={c}>{t.channels[c]}</option>
                              ))}
                            </select>
                          </label>
                          <Button variant="ghost" size="sm" className="h-[52px]" aria-label={`${t.remove}: ${t.days[day]} ${s.start_time}`} onClick={() => edit((d) => d.filter((x) => x !== s))}>
                            <PiTrash className="h-[18px] w-[18px]" aria-hidden />
                            {t.remove}
                          </Button>
                        </div>
                      ))}
                      <div>
                        <Button
                          variant="line"
                          size="sm"
                          onClick={() => {
                            const last = blocks[blocks.length - 1];
                            const lastEnd = last ? mins(last.end_time) : null;
                            const startM = lastEnd !== null && lastEnd <= 21 * 60 ? lastEnd : 10 * 60;
                            const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
                            edit((d) => [
                              ...d,
                              {
                                day_of_week: day,
                                start_time: hm(startM),
                                end_time: hm(Math.min(startM + 120, 23 * 60 + 59)),
                                slot_duration_minutes: last?.slot_duration_minutes ?? d[0]?.slot_duration_minutes ?? 10,
                                channel_type: last?.channel_type ?? "both",
                              },
                            ]);
                          }}
                        >
                          <PiPlus className="h-4 w-4" aria-hidden />
                          {t.addBlock}
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Button variant="gold" onClick={onSave} disabled={!dirty || !!issue || saveState === "saving"}>
                {saveState === "saving" ? t.saving : t.save}
              </Button>
              <p role="status" className={`text-sm font-semibold ${saveState === "failed" || issue ? "text-danger" : "text-ink-soft"}`}>
                {issue ? t[issue] : saveState === "failed" ? t.saveFailed : saveState === "saved" ? t.saved : dirty ? t.unsaved : ""}
              </p>
            </div>
          </>
        )}
      </Card>

      <SpecialDays
        overrides={ovNow}
        onChange={(data) => setOverrides({ id, status: "ready", data })}
        onRetry={retry}
        fmtDate={fmtDate}
        fmtTime={fmtTime}
      />

      <Card className="p-5 sm:p-7">
        <h2 className="font-display text-[26px] font-bold">{t.booked}</h2>
        <p className="mt-1 text-ink-soft">{t.bookedSub}</p>
        {!bkNow ? (
          <p role="status" className="py-8 text-center text-ink-soft">{t.loading}</p>
        ) : bkNow.status === "error" ? (
          <p role="alert" className="py-8 text-center text-danger">{t.bookedFailed}</p>
        ) : bkNow.data.length === 0 ? (
          <p className="py-8 text-center text-ink-soft">{t.noBooked}</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-line">
            {bkNow.data.map((b) => {
              const name = b.user?.name?.trim() || t.customer;
              const Icon = b.channel_type === "call" ? PiPhone : PiChatCircleText;
              return (
                <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
                  <Icon className="h-5 w-5 shrink-0 text-brand-strong" aria-hidden />
                  <div className="min-w-0 flex-1 basis-[220px]">
                    <b lang={hasDevanagari(name) ? "hi" : undefined} className="block truncate">{name}</b>
                    <span className="text-sm text-ink-soft">
                      {fmtDate(b.booking_date)} · {fmtTime(b.start_time)} – {fmtTime(b.end_time)}
                      {b.duration_minutes ? ` (${t.mins(b.duration_minutes)})` : ""}
                    </span>
                  </div>
                  <JoinBooking
                    bookingId={b.id}
                    userId={b.user_id}
                    selfId={id}
                    kind={b.channel_type === "call" ? "call" : "chat"}
                    status={b.status}
                    startsAt={istMs(b.booking_date, b.start_time)}
                    endsAt={istMs(b.booking_date, b.end_time)}
                  />
                  <Pill tone={b.status === "COMPLETED" ? "neutral" : b.status === "CONFIRMED" ? "green" : "amber"}>{t.statuses[b.status] ?? b.status}</Pill>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Page>
  );
}

function SpecialDays({
  overrides,
  onChange,
  onRetry,
  fmtDate,
  fmtTime,
}: {
  overrides: Load<ScheduleOverride[]> | null;
  onChange: (data: ScheduleOverride[]) => void;
  onRetry: () => void;
  fmtDate: (d: string) => string;
  fmtTime: (hm: string) => string;
}) {
  const t = useT(text);
  const today = useMemo(() => todayIst(), []);
  const [date, setDate] = useState(today);
  const [kind, setKind] = useState<"off" | "offHours" | "extra">("off");
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("14:00");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<"addFailed" | "delFailed" | "badRange" | null>(null);

  const data = overrides?.status === "ready" ? overrides.data : null;
  const reload = useCallback(async () => (await getOverrides(todayIst())), []);

  const add = async () => {
    const timed = kind !== "off";
    if (timed && !((mins(start) ?? 0) < (mins(end) ?? 0))) return setError("badRange");
    setBusy("add");
    setError(null);
    try {
      await addOverride({
        override_date: date,
        is_available: kind === "extra",
        ...(timed && { start_time: start, end_time: end }),
        ...(reason.trim() && { reason: reason.trim() }),
      });
      onChange(await reload());
      setReason("");
    } catch {
      setError("addFailed");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (o: ScheduleOverride) => {
    setBusy(o.id);
    setError(null);
    try {
      await deleteOverride(o.id);
      onChange((data ?? []).filter((x) => x.id !== o.id));
    } catch {
      setError("delFailed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-5 sm:p-7">
      <h2 className="font-display text-[26px] font-bold">{t.special}</h2>
      <p className="mt-1 text-ink-soft">{t.specialSub}</p>
      {!overrides ? (
        <p role="status" className="py-8 text-center text-ink-soft">{t.loading}</p>
      ) : overrides.status === "error" ? (
        <div role="alert" className="py-8 text-center">
          <p className="text-danger">{t.failed}</p>
          <Button variant="line" size="sm" className="mt-3" onClick={onRetry}>{t.retry}</Button>
        </div>
      ) : (
        <>
          {data && data.length === 0 ? (
            <p className="py-6 text-ink-soft">{t.noSpecial}</p>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-line">
              {(data ?? []).map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  {o.is_available ? <PiCalendarCheck className="h-5 w-5 text-success" aria-hidden /> : <PiCalendarX className="h-5 w-5 text-danger" aria-hidden />}
                  <div className="min-w-0 flex-1 basis-[220px]">
                    <b className="block">{fmtDate(o.override_date)}</b>
                    <span className="text-sm text-ink-soft">
                      {o.is_available ? t.extraHours : t.unavailable} · {o.start_time && o.end_time ? `${fmtTime(o.start_time)} – ${fmtTime(o.end_time)}` : t.wholeDay}
                      {o.reason ? ` · ${o.reason}` : ""}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" disabled={busy === o.id} aria-label={`${t.remove}: ${fmtDate(o.override_date)}`} onClick={() => remove(o)}>
                    <PiTrash className="h-[18px] w-[18px]" aria-hidden />
                    {t.remove}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-5"
            onSubmit={(e) => {
              e.preventDefault();
              void add();
            }}
          >
            <label className="flex flex-col gap-1">
              <span className={labelClass}>{t.date}</span>
              <input type="date" required min={today} value={date} onChange={(e) => setDate(e.target.value)} className={`${fieldClass} w-[180px]`} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>{t.kind}</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={`${fieldClass} w-[260px]`}>
                <option value="off">{t.kinds.off}</option>
                <option value="offHours">{t.kinds.offHours}</option>
                <option value="extra">{t.kinds.extra}</option>
              </select>
            </label>
            {kind !== "off" && (
              <>
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>{t.from}</span>
                  <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={`${fieldClass} w-[140px]`} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>{t.to}</span>
                  <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={`${fieldClass} w-[140px]`} />
                </label>
              </>
            )}
            <label className="flex min-w-[200px] flex-1 flex-col gap-1">
              <span className={labelClass}>{t.reason}</span>
              <input type="text" maxLength={120} value={reason} onChange={(e) => setReason(e.target.value)} className={fieldClass} />
            </label>
            <Button type="submit" variant="navy" disabled={busy === "add" || !date}>
              <PiPlus className="h-4 w-4" aria-hidden />
              {busy === "add" ? t.adding : t.addDay}
            </Button>
          </form>
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{t[error]}</p>}
        </>
      )}
    </Card>
  );
}
