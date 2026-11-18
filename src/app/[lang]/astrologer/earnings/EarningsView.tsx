"use client";

import { useEffect, useMemo, useState } from "react";
import { PiBank, PiChatCircleText, PiClock, PiDownloadSimple, PiFileText, PiInfo, PiPhone, PiTrendUp, PiUsersThree, PiWallet } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { getOrders, type OrderRow } from "@/lib/services/astrologerEarnings";
import { clockText } from "../session/_session/kundliData";
import { Accent, Button, Card, IconBadge, Ornament, Page, PageTitle } from "../_console/ui";
import { useAstrologer } from "../_console/useAstrologer";

const text = defineMessages({
  hi: {
    eyebrow: "कमाई",
    titleA: "आपकी ",
    titleB: "कमाई",
    sub: "आपके पूरे हुए चैट और कॉल, उनमें लगा समय और ग्राहकों के नाम, सीधे AstroShrine के रिकॉर्ड से।",
    statement: "विवरण डाउनलोड करें",
    balance: (month: string) => `${month} में अब तक की कमाई`,
    payouts: "भुगतान AstroShrine टीम संभालती है। निकासी, बैंक या KYC के लिए सहायता से संपर्क करें।",
    withdraw: "भुगतान कैसे होता है",
    hideRules: "भुगतान जानकारी छिपाएँ",
    rulesTitle: "भुगतान",
    helpLink: "सहायता खोलें",
    period: "अवधि",
    pDay: "आज",
    pWeek: "इस सप्ताह",
    pMonth: "इस महीने",
    total: "कुल कमाई",
    sessions: "परामर्श",
    avg: "प्रति मिनट औसत",
    yourShare: "आपका हिस्सा",
    min: (n: number) => `${n.toLocaleString("hi-IN")} मिनट`,
    cDay: "आज, घंटे के अनुसार",
    cWeek: "पिछले 7 दिन",
    cMonth: "इस महीने, सप्ताह के अनुसार",
    rupees: "रुपये में",
    counts: "परामर्शों की संख्या",
    today: "आज",
    week: (n: number) => `सप्ताह ${n}`,
    moreThan: (d: string, w: string) => `${w} से ${d} अधिक`,
    lessThan: (d: string, w: string) => `${w} से ${d} कम`,
    pctMore: (p: number) => `पिछले 7 दिनों से ${p}% अधिक`,
    pctLess: (p: number) => `पिछले 7 दिनों से ${p}% कम`,
    yesterday: "कल",
    lastMonth: (v: string) => `पिछला महीना: ${v}`,
    recent: "हाल के सत्र",
    head: { date: "दिनांक", type: "प्रकार", who: "ग्राहक", dur: "अवधि", amt: "राशि" },
    kinds: { chat: "चैट", call: "कॉल", livestream: "लाइव उपहार" } as Record<string, string>,
    customer: "ग्राहक",
    noOrders: "इस अवधि में कोई सत्र नहीं।",
    more: "और दिखाएँ",
    loading: "कमाई लोड हो रही है…",
    retry: "फिर कोशिश करें",
    failed: "कमाई नहीं खुल सकी।",
    forbidden: "यह खाता ज्योतिषी कंसोल की कमाई नहीं देख सकता।",
    hiddenTitle: "रुपये की राशि अभी छिपी है",
    hiddenBody: "AstroShrine ने अभी आपके ऐप और वेबसाइट पर रुपये की राशि छिपा रखी है। परामर्शों की संख्या और समय नीचे सही दिख रहे हैं।",
    hiddenTile: "राशि छिपी",
    csvHead: ["दिनांक", "प्रकार", "ग्राहक", "मिनट", "राशि (रुपये)"],
    months: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
  },
  en: {
    eyebrow: "Earnings",
    titleA: "Your ",
    titleB: "earnings",
    sub: "Your completed chats and calls, the time they took and who they were with, straight from AstroShrine's records.",
    statement: "Download statement",
    balance: (month) => `Earned in ${month} so far`,
    payouts: "Payouts are handled by the AstroShrine team. For withdrawals, bank details or KYC, contact support.",
    withdraw: "How payouts work",
    hideRules: "Hide payout information",
    rulesTitle: "Payouts",
    helpLink: "Open help",
    period: "Period",
    pDay: "Today",
    pWeek: "This week",
    pMonth: "This month",
    total: "Total earned",
    sessions: "Consultations",
    avg: "Average per minute",
    yourShare: "your share",
    min: (n) => `${n.toLocaleString("en-IN")} min`,
    cDay: "Today, by hour",
    cWeek: "Last 7 days",
    cMonth: "This month, by week",
    rupees: "In rupees",
    counts: "Number of consultations",
    today: "Today",
    week: (n) => `Week ${n}`,
    moreThan: (d, w) => `${d} more than ${w}`,
    lessThan: (d, w) => `${d} less than ${w}`,
    pctMore: (p) => `${p}% more than the last 7 days`,
    pctLess: (p) => `${p}% less than the last 7 days`,
    yesterday: "yesterday",
    lastMonth: (v) => `Last month: ${v}`,
    recent: "Recent sessions",
    head: { date: "Date", type: "Type", who: "Customer", dur: "Duration", amt: "Amount" },
    kinds: { chat: "Chat", call: "Call", livestream: "Live gift" },
    customer: "Customer",
    noOrders: "No sessions in this period.",
    more: "Show more",
    loading: "Loading your earnings…",
    retry: "Try again",
    failed: "Could not load your earnings.",
    forbidden: "This account cannot view astrologer earnings.",
    hiddenTitle: "Rupee amounts are hidden for now",
    hiddenBody: "AstroShrine currently hides rupee amounts in the astrologer app and here. The number of sessions and the time spent below are accurate.",
    hiddenTile: "Amounts hidden",
    csvHead: ["Date", "Type", "Customer", "Minutes", "Amount (rupees)"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  },
});

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const IST = 5.5 * HOUR;
const PAGE = 8;
const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);

/** Start of the IST day that holds `ms`. IST is UTC+5:30 with no daylight saving. */
const istDay = (ms: number) => Math.floor((ms + IST) / DAY) * DAY - IST;
const istMonthStart = (y: number, m: number) => Date.UTC(y, m, 1) - IST;

type Load = { key: string; rows: OrderRow[] | null; error?: "failed" | "forbidden" };

export default function EarningsView() {
  const t = useT(text);
  const locale = useLocale();
  const intl = INTL_LOCALE[locale];
  const { id, status } = useAstrologer();
  const { session } = useAuth();
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [rules, setRules] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<Load | null>(null);
  const [now] = useState(() => Date.now());

  // The windows everything below reads: this IST month and the one before, and the last 14 days.
  const w = useMemo(() => {
    const ist = new Date(now + IST);
    const y = ist.getUTCFullYear();
    const m = ist.getUTCMonth();
    const today = istDay(now);
    const monthStart = istMonthStart(y, m);
    const prevMonthStart = istMonthStart(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1);
    return { today, monthStart, prevMonthStart, month: m, from: Math.min(prevMonthStart, today - 13 * DAY) };
  }, [now]);

  const key = `${id}|${attempt}`;
  const ready = status === "ready" && !!id && !!session;
  useEffect(() => {
    if (!ready || !id) return;
    const controller = new AbortController();
    getOrders(id, w.from, Date.now(), controller.signal).then(
      (rows) => setLoad({ key, rows }),
      (e: unknown) => {
        if (!controller.signal.aborted) setLoad({ key, rows: null, error: e instanceof ApiError && e.status === 403 ? "forbidden" : "failed" });
      },
    );
    return () => controller.abort();
  }, [ready, id, key, w.from]);
  const cur = load && load.key === key ? load : null;
  const rows = useMemo(() => (cur?.rows ?? []).filter((r) => r.orderType === "chat" || r.orderType === "call"), [cur]);

  const inRange = (a: number, b: number) => rows.filter((r) => r.orderTs >= a && r.orderTs < b);
  const sum = (list: OrderRow[]) => list.reduce((a, r) => a + r.amount, 0);
  const hidden = rows.length > 0 && rows.every((r) => r.amount === 0);
  const val = (list: OrderRow[]) => (hidden ? list.length : sum(list));

  const inr = (n: number) => new Intl.NumberFormat(intl, { style: "currency", currency: "INR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
  const compact = (n: number) => (hidden ? String(n) : n >= 1000 ? `₹${(n / 1000).toFixed(1).replace(".0", "")}k` : `₹${Math.round(n)}`);

  const end = now + 1;
  const day = inRange(w.today, end);
  const weekRows = inRange(w.today - 6 * DAY, end);
  const monthRows = inRange(w.monthStart, end);
  const sel = period === "day" ? day : period === "week" ? weekRows : monthRows;
  const minutes = Math.round(sel.reduce((a, r) => a + r.timeSpent, 0) / 60_000);
  const total = sum(sel);

  // The chart: today in 4-hour blocks, the last 7 days, or this month by week.
  const istHour = (ms: number) => Math.floor(((ms + IST) % DAY) / HOUR);
  const weekday = (ms: number) => new Intl.DateTimeFormat(intl, { weekday: "short", timeZone: "Asia/Kolkata" }).format(ms + 60_000);
  const bars: { label: string; value: number; strong?: boolean }[] =
    period === "day"
      ? [0, 4, 8, 12, 16, 20].map((h) => ({ label: `${h}:00`, value: val(day.filter((r) => istHour(r.orderTs) >= h && istHour(r.orderTs) < h + 4)) }))
      : period === "week"
        ? Array.from({ length: 7 }, (_, i) => {
            const a = w.today - (6 - i) * DAY;
            return { label: i === 6 ? t.today : weekday(a), value: val(inRange(a, a + DAY)), strong: i === 6 };
          })
        : Array.from({ length: Math.ceil((Math.floor((w.today - w.monthStart) / DAY) + 1) / 7) }, (_, i) => {
            const a = w.monthStart + i * 7 * DAY;
            return { label: t.week(i + 1), value: val(inRange(a, a + 7 * DAY)) };
          });
  const top = Math.max(0, ...bars.map((b) => b.value));
  const topIndex = top > 0 ? bars.findIndex((b) => b.value === top) : -1;
  const chartTitle = period === "day" ? t.cDay : period === "week" ? t.cWeek : t.cMonth;

  // How it compares with before, only when there is something real to compare with.
  const prevWeek = val(inRange(w.today - 13 * DAY, w.today - 6 * DAY));
  const yesterday = val(inRange(w.today - DAY, w.today));
  const prevMonthTotal = sum(inRange(w.prevMonthStart, w.monthStart));
  let delta = "";
  if (!hidden && cur?.rows) {
    if (period === "day" && yesterday > 0) delta = total >= yesterday ? t.moreThan(inr(total - yesterday), t.yesterday) : t.lessThan(inr(yesterday - total), t.yesterday);
    if (period === "week" && prevWeek > 0) delta = total >= prevWeek ? t.pctMore(Math.round(((total - prevWeek) / prevWeek) * 100)) : t.pctLess(Math.round(((prevWeek - total) / prevWeek) * 100));
    if (period === "month" && prevMonthTotal > 0) delta = t.lastMonth(inr(prevMonthTotal));
  }

  // The month figure counts up once when it arrives, as in the design.
  const monthTotal = sum(monthRows);
  const [counted, setCounted] = useState({ target: 0, value: 0 });
  useEffect(() => {
    if (!cur?.rows) return;
    const start = Date.now();
    const tm = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 1100);
      setCounted({ target: monthTotal, value: Math.round(monthTotal * (1 - Math.pow(1 - p, 3))) });
      if (p >= 1) clearInterval(tm);
    }, 30);
    return () => clearInterval(tm);
  }, [cur, monthTotal]);
  const wallet = counted.target === monthTotal ? counted.value : 0;

  const dayLabel = (ts: number) => {
    const d0 = istDay(ts);
    const clock = clockText(locale, new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(ts));
    if (d0 === w.today) return `${t.today}, ${clock}`;
    if (d0 > w.today - 7 * DAY) return `${new Intl.DateTimeFormat(intl, { weekday: "long", timeZone: "Asia/Kolkata" }).format(ts)}, ${clock}`;
    return `${new Intl.DateTimeFormat(intl, { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" }).format(ts)}, ${clock}`;
  };

  const download = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [(hidden ? t.csvHead.slice(0, 4) : t.csvHead).map(esc).join(",")];
    for (const r of rows.filter((x) => x.orderTs >= w.prevMonthStart)) {
      const cells = [new Intl.DateTimeFormat("en-CA", { dateStyle: "short", timeStyle: "short", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(r.orderTs), t.kinds[r.orderType] ?? r.orderType, r.customerName?.trim() || t.customer, Math.round(r.timeSpent / 60_000)];
      lines.push((hidden ? cells : [...cells, r.amount]).map(esc).join(","));
    }
    const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `astroshrine-earnings-${new Date(now + IST).toISOString().slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthName = t.months[w.month];
  const cards = [
    { icon: PiTrendUp, label: t.total, value: hidden ? t.hiddenTile : inr(total), hint: delta, tone: "text-success" },
    { icon: PiUsersThree, label: t.sessions, value: sel.length.toLocaleString(intl), hint: t.min(minutes), tone: "text-ink-soft" },
    { icon: PiClock, label: t.avg, value: hidden || minutes === 0 ? "—" : inr(total / minutes), hint: t.yourShare, tone: "text-ink-soft" },
  ];

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          className="min-w-0 flex-[1_1_520px]"
          eyebrow={t.eyebrow}
          title={
            <>
              {t.titleA}
              <Accent>{t.titleB}</Accent>
            </>
          }
          sub={t.sub}
        />
        {cur?.rows && (
          <Button variant="line" onClick={download}>
            <PiDownloadSimple className="h-[18px] w-[18px]" aria-hidden />
            {t.statement}
          </Button>
        )}
      </div>
      <Ornament />

      {!cur ? (
        <Card className="p-8 text-ink-soft" role="status">
          {t.loading}
        </Card>
      ) : cur.error ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-8" role="alert">
          <p className="text-danger">{cur.error === "forbidden" ? t.forbidden : t.failed}</p>
          {cur.error === "failed" && (
            <Button
              variant="line"
              size="sm"
              onClick={() => {
                setLoad(null);
                setAttempt((n) => n + 1);
              }}
            >
              {t.retry}
            </Button>
          )}
        </Card>
      ) : (
        <>
          {hidden && (
            <Card className="flex items-start gap-3 border-brand-soft bg-surface-sunken p-5" role="note">
              <PiInfo size={22} className="mt-0.5 shrink-0 text-brand-strong" aria-hidden="true" />
              <div>
                <p className="font-bold">{t.hiddenTitle}</p>
                <p className="mt-0.5 text-[15px] text-ink-soft">{t.hiddenBody}</p>
              </div>
            </Card>
          )}

          <div className="flex flex-wrap items-stretch gap-7">
            <section aria-label={t.balance(monthName)} className="flex min-w-0 flex-[1_1_400px] flex-wrap items-center gap-x-6 gap-y-5 rounded-[22px] border border-[#F2D58A] bg-surface-sunken px-[30px] py-7 motion-safe:animate-reveal-down">
              <div className="min-w-0 flex-[1_1_220px]">
                <div className="text-[13px] font-semibold text-ink-soft">{t.balance(monthName)}</div>
                <div className="mt-1.5 font-display text-[44px] font-bold leading-[1.05] tracking-[-0.01em] tabular-nums sm:text-[54px]">{hidden ? t.hiddenTile : inr(wallet)}</div>
                <p className="mt-2 flex items-start gap-2 text-[15px] text-ink-soft">
                  <PiBank size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{t.payouts}</span>
                </p>
                <Button variant="navy" onClick={() => setRules((v) => !v)} aria-expanded={rules} className="mt-5">
                  <PiInfo size={18} aria-hidden="true" />
                  {rules ? t.hideRules : t.withdraw}
                </Button>
              </div>
              {rules && (
                <div className="basis-full rounded-2xl border border-[#F2D58A] bg-surface-card px-[18px] py-4 motion-safe:animate-reveal-down">
                  <b className="block text-base">{t.rulesTitle}</b>
                  <p className="mt-2 text-[14.5px]">{t.payouts}</p>
                  <Button href="/astrologer/help" variant="line" size="sm" className="mt-3">
                    {t.helpLink}
                  </Button>
                </div>
              )}
              <div aria-hidden="true" className="relative size-[132px] flex-none max-sm:hidden">
                <span className="absolute inset-0 rounded-full border-2 border-dashed border-brand motion-safe:animate-[spin_22s_linear_infinite]" />
                <span className="absolute inset-[22px] flex items-center justify-center rounded-full bg-surface-inverse text-brand shadow-[0_0_0_4px_var(--color-surface-sunken)]">
                  <PiWallet size={40} />
                </span>
              </div>
            </section>
            <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-[18px] motion-safe:animate-reveal-down">
              <div role="group" aria-label={t.period} className="grid w-full max-w-[480px] grid-cols-3 gap-1 rounded-2xl bg-[#F4ECDB] p-1">
                {(["day", "week", "month"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={period === p}
                    onClick={() => setPeriod(p)}
                    className={`h-[46px] cursor-pointer rounded-xl text-[15px] font-bold transition ${period === p ? "bg-surface-inverse text-ink-inverse" : "bg-transparent text-ink hover:bg-surface-card"}`}
                  >
                    {p === "day" ? t.pDay : p === "week" ? t.pWeek : t.pMonth}
                  </button>
                ))}
              </div>
              <div className="flex flex-1 flex-wrap gap-[18px]">
                {cards.map((c) => (
                  <Card key={c.label} as="div" className="min-w-0 flex-[1_1_180px] p-[22px]">
                    <div className="flex items-center gap-2.5">
                      <IconBadge icon={c.icon} size={38} />
                      <span className="text-[13px] font-semibold text-ink-soft">{c.label}</span>
                    </div>
                    <div key={`${period}-${c.label}`} className="mt-3 font-display text-[34px] font-bold leading-[1.15] tabular-nums motion-safe:animate-reveal-down">
                      {c.value}
                    </div>
                    <div className={`mt-0.5 text-sm font-semibold ${c.tone}`}>{c.hint}</div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <style>{"@keyframes earn-grow{from{transform:scaleY(.02)}to{transform:scaleY(1)}}"}</style>
          <Card className="px-7 py-[26px]" aria-labelledby="ch">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex items-center gap-3">
                <IconBadge icon={PiTrendUp} size={42} />
                <h2 id="ch" className="font-display text-2xl font-bold">
                  {chartTitle}
                </h2>
              </div>
              <span className="text-sm text-ink-soft">{hidden ? t.counts : t.rupees}</span>
            </div>
            <div className="mt-5 flex h-60 items-end gap-3 border-b border-line px-2 sm:gap-[18px]">
              {bars.map((b, i) => (
                <div key={`${period}-${i}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span className={`text-[13px] font-bold ${i === topIndex ? "text-ink" : "text-ink-soft"}`}>{b.value > 0 ? compact(b.value) : ""}</span>
                  <div
                    className={`w-full max-w-16 origin-bottom rounded-[12px_12px_4px_4px] transition-[height] duration-700 motion-safe:animate-[earn-grow_1s_cubic-bezier(.2,.8,.2,1)_both] ${i === topIndex ? "bg-brand" : "bg-[#F2D58A]"}`}
                    style={{ height: `${top > 0 ? Math.max(b.value > 0 ? 6 : 2, Math.round((b.value / top) * 100)) : 2}%`, animationDelay: `${i * 0.06}s` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 px-2 pt-2.5 sm:gap-[18px]" aria-hidden="true">
              {bars.map((b, i) => (
                <span key={i} className={`min-w-0 flex-1 truncate text-center text-xs sm:text-sm ${i === topIndex ? "font-bold text-ink" : "font-medium text-ink-soft"}`}>
                  {b.label}
                </span>
              ))}
            </div>
          </Card>

          <Card className="px-7 py-[26px]" aria-labelledby="tx">
            <div className="flex items-center gap-3">
              <IconBadge icon={PiFileText} size={42} />
              <h2 id="tx" className="font-display text-2xl font-bold">
                {t.recent}
              </h2>
            </div>
            {rows.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-surface-sunken p-6 text-center text-ink-soft">{t.noOrders}</p>
            ) : (
              <>
                <div className="mt-3 overflow-x-auto">
                  <div role="table" aria-labelledby="tx" className="min-w-[640px] text-base">
                    <div role="row" className={`grid items-center gap-3 py-2.5 text-[13px] font-semibold text-ink-soft ${hidden ? "grid-cols-[1.5fr_1fr_1.3fr_1fr]" : "grid-cols-[1.5fr_1fr_1.3fr_1fr_1fr]"}`}>
                      <span role="columnheader">{t.head.date}</span>
                      <span role="columnheader">{t.head.type}</span>
                      <span role="columnheader">{t.head.who}</span>
                      <span role="columnheader">{t.head.dur}</span>
                      {!hidden && (
                        <span role="columnheader" className="text-right">
                          {t.head.amt}
                        </span>
                      )}
                    </div>
                    {rows.slice(0, shown).map((r, i) => {
                      const name = r.customerName?.trim() || t.customer;
                      const mins = Math.round(r.timeSpent / 60_000);
                      return (
                        <div key={`${r.orderTs}-${r.customerId}-${i}`} role="row" className={`grid items-center gap-3 border-t border-line py-3.5 transition hover:bg-[#FFF7E3] ${hidden ? "grid-cols-[1.5fr_1fr_1.3fr_1fr]" : "grid-cols-[1.5fr_1fr_1.3fr_1fr_1fr]"}`}>
                          <span role="cell">{dayLabel(r.orderTs)}</span>
                          <span role="cell">
                            <span className={`inline-flex h-[30px] items-center gap-1.5 rounded-full px-3 text-[13px] font-bold ${r.orderType === "call" ? "bg-[#E9EDF7] text-ink" : "bg-surface-sunken text-brand-strong"}`}>
                              {r.orderType === "call" ? <PiPhone size={14} aria-hidden="true" /> : <PiChatCircleText size={14} aria-hidden="true" />}
                              {t.kinds[r.orderType] ?? r.orderType}
                            </span>
                          </span>
                          <span role="cell" lang={hasDevanagari(name) ? "hi" : undefined}>
                            {name}
                          </span>
                          <span role="cell" className="text-ink-soft">
                            {mins > 0 ? t.min(mins) : "—"}
                          </span>
                          {!hidden && (
                            <span role="cell" className="text-right font-bold tabular-nums">
                              +{inr(r.amount)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {rows.length > shown && (
                  <div className="mt-4 flex justify-center">
                    <Button variant="line" size="sm" onClick={() => setShown((n) => n + PAGE)}>
                      {t.more}
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}
    </Page>
  );
}
