"use client";

import { useEffect, useMemo, useState } from "react";
import { PiChatCircleText, PiClock, PiFileText, PiInfo, PiPhone, PiTrendUp, PiUsersThree } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import {
  amountsHidden,
  bucketAmount,
  bucketMinutes,
  bucketOrders,
  getEarnings,
  getOrders,
  type EarningsBucket,
  type EarningsResponse,
  type OrderRow,
  type Period,
} from "@/lib/services/astrologerEarnings";
import { Accent, Button, Card, IconBadge, Page, PageTitle, Pill, StatTile } from "../_console/ui";
import { useAstrologer } from "../_console/useAstrologer";

const text = defineMessages({
  hi: {
    eyebrow: "कमाई",
    titleA: "आपके ",
    titleB: "सत्र",
    sub: "आपके पूरे हुए चैट और कॉल, उनमें लगा समय और ग्राहकों के नाम, सीधे AstroShrine के रिकॉर्ड से।",
    period: "अवधि",
    periods: { day: "7 दिन", week: "5 सप्ताह", month: "12 महीने" },
    total: "कुल कमाई",
    sessions: "परामर्श",
    minutes: "कुल समय",
    min: (n: number) => `${n.toLocaleString("hi-IN")} मिनट`,
    chart: { day: "पिछले 7 दिन", week: "पिछले 5 सप्ताह", month: "पिछले 12 महीने (30-30 दिन)" },
    chartAmount: "रुपये में, चैट और कॉल",
    chartOrders: "परामर्शों की संख्या, चैट और कॉल",
    chat: "चैट",
    call: "कॉल",
    chartEmpty: "इस अवधि में कोई परामर्श नहीं हुआ।",
    barLabel: (label: string, n: number) => `${label}: ${n} परामर्श`,
    hiddenTitle: "रुपये की राशि अभी छिपी है",
    hiddenBody: "AstroShrine ने अभी आपके ऐप और वेबसाइट पर रुपये की राशि छिपा रखी है। परामर्शों की संख्या और समय नीचे सही दिख रहे हैं।",
    hiddenTile: "राशि छिपी",
    payouts: "भुगतान AstroShrine टीम संभालती है। निकासी, बैंक या KYC के लिए सहायता से संपर्क करें।",
    payoutsLink: "सहायता खोलें",
    recent: "हाल के सत्र",
    range: "अवधि चुनें",
    last30: "पिछले 30 दिन",
    channel: "प्रकार",
    channels: { all: "सब", chat: "चैट", call: "कॉल" },
    ordersFailed: "सत्र नहीं खुल सके।",
    head: { date: "दिनांक", type: "प्रकार", who: "ग्राहक", dur: "अवधि", amt: "राशि" },
    kinds: { chat: "चैट", call: "कॉल", livestream: "लाइव उपहार" } as Record<string, string>,
    customer: "ग्राहक",
    noOrders: "इस चयन में कोई सत्र नहीं।",
    more: "और दिखाएँ",
    loading: "कमाई लोड हो रही है…",
    retry: "फिर कोशिश करें",
    failed: "कमाई नहीं खुल सकी।",
    forbidden: "यह खाता ज्योतिषी कंसोल की कमाई नहीं देख सकता।",
  },
  en: {
    eyebrow: "Earnings",
    titleA: "Your ",
    titleB: "sessions",
    sub: "Your completed chats and calls, the time they took and who they were with, straight from AstroShrine's records.",
    period: "Period",
    periods: { day: "7 days", week: "5 weeks", month: "12 months" },
    total: "Total earned",
    sessions: "Sessions",
    minutes: "Time spent",
    min: (n) => `${n.toLocaleString("en-IN")} min`,
    chart: { day: "Last 7 days", week: "Last 5 weeks", month: "Last 12 months (30-day blocks)" },
    chartAmount: "In rupees, chat and call",
    chartOrders: "Number of sessions, chat and call",
    chat: "Chat",
    call: "Call",
    chartEmpty: "No sessions in this period.",
    barLabel: (label, n) => `${label}: ${n} sessions`,
    hiddenTitle: "Rupee amounts are hidden for now",
    hiddenBody: "AstroShrine currently hides rupee amounts in the astrologer app and here. The number of sessions and the time spent below are accurate.",
    hiddenTile: "Amounts hidden",
    payouts: "Payouts are handled by the AstroShrine team. For withdrawals, bank details or KYC, contact support.",
    payoutsLink: "Open help",
    recent: "Recent sessions",
    range: "Choose range",
    last30: "Last 30 days",
    channel: "Type",
    channels: { all: "All", chat: "Chat", call: "Call" },
    ordersFailed: "Could not load the sessions.",
    head: { date: "Date", type: "Type", who: "Customer", dur: "Duration", amt: "Amount" },
    kinds: { chat: "Chat", call: "Call", livestream: "Live gift" } as Record<string, string>,
    customer: "Customer",
    noOrders: "No sessions for this selection.",
    more: "Show more",
    loading: "Loading your earnings…",
    retry: "Try again",
    failed: "Could not load your earnings.",
    forbidden: "This account cannot view astrologer earnings.",
  },
});

const TZ = "Asia/Kolkata";
const DAY = 24 * 60 * 60 * 1000;
const PAGE = 12;

/** Start of an IST month (month is 0-11), ms. IST is UTC+5:30 with no daylight saving. */
const istMonthStart = (y: number, m: number) => Date.UTC(y, m, 1) - 5.5 * 60 * 60 * 1000;
/** The last 12 IST calendar months, newest first: value "yyyy-mm", with its [start, end) range. */
function monthOptions(now: number) {
  const ist = new Date(now + 5.5 * 60 * 60 * 1000);
  let y = ist.getUTCFullYear();
  let m = ist.getUTCMonth();
  const out: { value: string; start: number; end: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const ny = m === 11 ? y + 1 : y;
    const nm = (m + 1) % 12;
    out.push({ value: `${y}-${String(m + 1).padStart(2, "0")}`, start: istMonthStart(y, m), end: istMonthStart(ny, nm) - 1 });
    if (m === 0) {
      y -= 1;
      m = 11;
    } else m -= 1;
  }
  return out;
}

type Channel = "all" | "chat" | "call";
type Orders = { key: string; rows: OrderRow[] | null };

const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);

type Data = { earnings: EarningsResponse };
type State = { id: string; status: "ready"; data: Data } | { id: string; status: "error"; message: "failed" | "forbidden" };

export default function EarningsView() {
  const t = useT(text);
  const locale = useLocale();
  const intl = INTL_LOCALE[locale];
  const { id, status } = useAstrologer();
  const { session } = useAuth();
  const [state, setState] = useState<State | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [period, setPeriod] = useState<Period>("day");
  const [shown, setShown] = useState(PAGE);
  const [range, setRange] = useState("last30");
  const [channel, setChannel] = useState<Channel>("all");
  const [orders, setOrders] = useState<Orders | null>(null);
  const [months] = useState(() => monthOptions(Date.now()));
  const [ordersAttempt, setOrdersAttempt] = useState(0);

  useEffect(() => {
    if (status !== "ready" || !id || !session) return;
    const controller = new AbortController();
    getEarnings(id, controller.signal).then(
      (earnings) => setState({ id, status: "ready", data: { earnings } }),
      (e: unknown) => {
        if (controller.signal.aborted) return;
        setState({ id, status: "error", message: e instanceof ApiError && e.status === 403 ? "forbidden" : "failed" });
      },
    );
    return () => controller.abort();
  }, [id, status, session, attempt]);

  // Order history follows the chosen range on its own, so the charts above are not reloaded.
  const ready = status === "ready" && !!id && !!session;
  const ordersKey = `${id}|${range}|${ordersAttempt}`;
  useEffect(() => {
    if (!ready || !id) return;
    const controller = new AbortController();
    const now = Date.now();
    const m = range === "last30" ? null : months.find((o) => o.value === range);
    const [start, end] = m ? [m.start, Math.min(m.end, now)] : [now - 30 * DAY, now];
    getOrders(id, start, end, controller.signal).then(
      (rows) => setOrders({ key: ordersKey, rows }),
      () => !controller.signal.aborted && setOrders({ key: ordersKey, rows: null }),
    );
    return () => controller.abort();
  }, [ready, id, range, ordersAttempt, ordersKey, months]);
  const ordersNow = orders && orders.key === ordersKey ? orders : null;
  const rowsAll = ordersNow?.rows ?? null;
  const rows = useMemo(() => (rowsAll ? rowsAll.filter((r) => channel === "all" || r.orderType === channel) : null), [rowsAll, channel]);
  
  const current = state && state.id === id ? state : null;
  const data = current?.status === "ready" ? current.data : null;

  const hidden = useMemo(() => (data ? amountsHidden(data.earnings) : false), [data]);
  const list: EarningsBucket[] = data ? (period === "day" ? data.earnings.daily : period === "week" ? data.earnings.weekly : data.earnings.monthly) : [];

  const labelOf = (b: EarningsBucket) =>
    new Intl.DateTimeFormat(intl, period === "day" ? { weekday: "short", day: "numeric", timeZone: TZ } : { day: "numeric", month: "short", timeZone: TZ }).format(
      // Daily buckets start at IST midnight; read the date a moment after it.
      b.createTs + 60_000,
    );

  const value = (b: EarningsBucket) => (hidden ? bucketOrders(b) : bucketAmount(b));
  const max = Math.max(0, ...list.map(value));
  const sessions = list.reduce((a, b) => a + bucketOrders(b), 0);
  const minutes = list.reduce((a, b) => a + bucketMinutes(b), 0);
  const total = list.reduce((a, b) => a + bucketAmount(b), 0);
  const inr = (n: number) => new Intl.NumberFormat(intl, { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  const dateTime = (ts: number) => new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: TZ }).format(ts);

  return (
    <Page>
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

      {!current ? (
        <Card className="p-8 text-ink-soft" role="status">
          {t.loading}
        </Card>
      ) : current.status === "error" ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-8" role="alert">
          <p className="text-danger">{current.message === "forbidden" ? t.forbidden : t.failed}</p>
          {current.message === "failed" && (
            <Button
              variant="line"
              size="sm"
              onClick={() => {
                setState(null);
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

          <div className="flex flex-wrap items-stretch gap-5">
            <div role="group" aria-label={t.period} className="grid w-full max-w-md grid-cols-3 gap-1 self-start rounded-2xl bg-surface-sunken p-1">
              {(["day", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={period === p}
                  onClick={() => setPeriod(p)}
                  className={`h-11 cursor-pointer rounded-xl text-[15px] font-bold transition ${period === p ? "bg-surface-inverse text-ink-inverse" : "text-ink hover:bg-surface-card"}`}
                >
                  {t.periods[p]}
                </button>
              ))}
            </div>
            <div className="flex w-full flex-wrap gap-4">
              <StatTile icon={PiTrendUp} label={t.total} value={hidden ? t.hiddenTile : inr(total)} tone="inverse" />
              <StatTile icon={PiUsersThree} label={t.sessions} value={sessions.toLocaleString(intl)} />
              <StatTile icon={PiClock} label={t.minutes} value={t.min(minutes)} />
            </div>
          </div>

          <Card className="p-7" aria-labelledby="earn-chart">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <IconBadge icon={PiTrendUp} size={42} />
                <h2 id="earn-chart" className="font-display text-2xl font-bold">
                  {t.chart[period]}
                </h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded-sm bg-surface-inverse" aria-hidden="true" />
                  {t.chat}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded-sm bg-brand" aria-hidden="true" />
                  {t.call}
                </span>
              </div>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{hidden ? t.chartOrders : t.chartAmount}</p>
            {max === 0 ? (
              <p className="mt-6 rounded-2xl bg-surface-sunken p-6 text-center text-ink-soft">{t.chartEmpty}</p>
            ) : (
              <ul className="mt-5 flex h-60 items-end gap-3 border-b border-line px-1 sm:gap-4">
                {list.map((b) => {
                  const chat = hidden ? b.numberOfOrders.chat : b.earnings.chat;
                  const call = hidden ? b.numberOfOrders.call : b.earnings.call;
                  const sum = chat + call;
                  const label = labelOf(b);
                  return (
                    <li
                      key={b.createTs}
                      aria-label={t.barLabel(label, bucketOrders(b))}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
                    >
                      <span className="text-[12px] font-bold text-ink-soft">{sum > 0 ? (hidden ? sum : inr(sum)) : ""}</span>
                      <div className="flex w-full max-w-14 flex-col justify-end overflow-hidden rounded-t-xl" style={{ height: `${Math.max(sum > 0 ? 4 : 0, Math.round((sum / max) * 82))}%` }}>
                        {call > 0 && <div className="bg-brand" style={{ flexGrow: call }} />}
                        {chat > 0 && <div className="bg-surface-inverse" style={{ flexGrow: chat }} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <ul className="flex gap-3 px-1 pt-2.5 sm:gap-4" aria-hidden="true">
              {list.map((b) => (
                <li key={b.createTs} className="min-w-0 flex-1 truncate text-center text-[12px] font-medium text-ink-soft sm:text-sm">
                  {labelOf(b)}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-7" aria-labelledby="earn-recent">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <IconBadge icon={PiFileText} size={42} />
                <h2 id="earn-recent" className="font-display text-2xl font-bold">
                  {t.recent}
                </h2>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-ink-soft">{t.range}</span>
                <select
                  className="h-11 cursor-pointer rounded-xl border border-line-strong bg-surface-card px-3 text-[15px] font-semibold"
                  value={range}
                  onChange={(e) => {
                    setRange(e.target.value);
                    setShown(PAGE);
                  }}
                >
                  <option value="last30">{t.last30}</option>
                  {months.map((o) => (
                    <option key={o.value} value={o.value}>
                      {new Intl.DateTimeFormat(intl, { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.parse(`${o.value}-15T00:00:00Z`))}
                    </option>
                  ))}
                </select>
              </label>
              <div role="group" aria-label={t.channel} className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-sunken p-1">
                {(["all", "chat", "call"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={channel === c}
                    onClick={() => {
                      setChannel(c);
                      setShown(PAGE);
                    }}
                    className={`h-9 min-w-16 cursor-pointer rounded-xl px-3 text-[14px] font-bold transition ${channel === c ? "bg-surface-inverse text-ink-inverse" : "text-ink hover:bg-surface-card"}`}
                  >
                    {t.channels[c]}
                  </button>
                ))}
              </div>
            </div>
            {!ordersNow ? (
              <p className="mt-5 text-ink-soft" role="status">
                {t.loading}
              </p>
            ) : !rows ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4" role="alert">
                <p className="text-danger">{t.ordersFailed}</p>
                <Button variant="line" size="sm" onClick={() => setOrdersAttempt((n) => n + 1)}>
                  {t.retry}
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <p className="mt-5 rounded-2xl bg-surface-sunken p-6 text-center text-ink-soft">{t.noOrders}</p>
            ) : (
              <>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse text-left">
                    <thead>
                      <tr className="text-[13px] font-semibold text-ink-soft">
                        <th scope="col" className="py-2.5 pr-3 font-semibold">{t.head.date}</th>
                        <th scope="col" className="py-2.5 pr-3 font-semibold">{t.head.type}</th>
                        <th scope="col" className="py-2.5 pr-3 font-semibold">{t.head.who}</th>
                        <th scope="col" className="py-2.5 pr-3 font-semibold">{t.head.dur}</th>
                        {!hidden && <th scope="col" className="py-2.5 text-right font-semibold">{t.head.amt}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, shown).map((r, i) => {
                        const name = r.customerName?.trim() || t.customer;
                        const mins = Math.round(r.timeSpent / 60_000);
                        return (
                          <tr key={`${r.orderTs}-${r.customerId}-${i}`} className="border-t border-line">
                            <td className="py-3.5 pr-3">{dateTime(r.orderTs)}</td>
                            <td className="py-3.5 pr-3">
                              <Pill tone={r.orderType === "call" ? "gold" : "navy"}>
                                {r.orderType === "call" ? <PiPhone size={14} aria-hidden="true" /> : <PiChatCircleText size={14} aria-hidden="true" />}
                                {t.kinds[r.orderType] ?? r.orderType}
                              </Pill>
                            </td>
                            <td className="py-3.5 pr-3" lang={hasDevanagari(name) ? "hi" : undefined}>
                              {name}
                            </td>
                            <td className="py-3.5 pr-3 text-ink-soft">{mins > 0 ? t.min(mins) : "—"}</td>
                            {!hidden && <td className="py-3.5 text-right font-bold tabular-nums">{inr(r.amount)}</td>}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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

          <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="max-w-2xl text-[15px] text-ink-soft">{t.payouts}</p>
            <Button href="/astrologer/help" variant="line" size="sm">
              {t.payoutsLink}
            </Button>
          </Card>
        </>
      )}
    </Page>
  );
}
