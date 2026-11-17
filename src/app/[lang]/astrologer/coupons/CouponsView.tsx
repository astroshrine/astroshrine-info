"use client";

import { useEffect, useRef, useState } from "react";
import { PiPlus, PiTicket } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import {
  CODE_RE,
  MAX_ACTIVE,
  MAX_DAYS,
  SCOPE_CAP_PERCENT,
  createCoupon,
  getCoupons,
  setCouponStatus,
  type Coupon,
  type CouponScope,
} from "@/lib/services/astrologerCoupons";
import { Accent, Button, Card, IconBadge, Page, PageTitle, Pill, fieldClass, labelClass } from "../_console/ui";
import { useAstrologer } from "../_console/useAstrologer";

const text = defineMessages({
  hi: {
    eyebrow: "कूपन",
    titleA: "आपके ",
    titleB: "कूपन कोड",
    sub: (n: number, d: number) => `ग्राहकों के लिए अपना छूट कोड बनाएँ। एक समय में अधिकतम ${n} सक्रिय कूपन, और अंतिम तिथि ${d} दिन के भीतर।`,
    newBtn: "नया कूपन",
    listTitle: "आपके कूपन",
    loading: "लोड हो रहा है…",
    failed: "कूपन नहीं खुल सके।",
    retry: "फिर कोशिश करें",
    empty: "आपने अभी कोई कूपन नहीं बनाया।",
    scopes: { puja: "पूजा", stone: "रत्न", puja_stone: "पूजा और रत्न" },
    statuses: { active: "सक्रिय", paused: "रुका हुआ", expired: "समाप्त", disabled: "बंद" },
    off: (p: string) => `${p}% छूट`,
    until: "अंतिम तिथि",
    perUser: (n: number) => `प्रति ग्राहक ${n} बार`,
    uses: (n: number) => `${n} बार उपयोग`,
    sales: (v: string) => `बिक्री ₹${v}`,
    pause: "रोकें",
    resume: "फिर चालू करें",
    end: "कूपन समाप्त करें",
    endConfirm: (c: string) => `कूपन ${c} अभी समाप्त करें? इसे दोबारा चालू नहीं किया जा सकेगा।`,
    endYes: "हाँ, समाप्त करें",
    keep: "रहने दें",
    ended: (c: string) => `कूपन ${c} समाप्त हो गया।`,
    formTitle: "नया कूपन",
    code: "कोड",
    codeHint: "4 से 16 अक्षर या अंक, बिना खाली जगह",
    codeBad: "कोड में 4 से 16 अंग्रेज़ी अक्षर या अंक होने चाहिए।",
    scope: "किस पर लागू",
    percent: "छूट (%)",
    percentBad: (cap: number) => `छूट 0 से अधिक और अधिकतम ${cap}% हो सकती है।`,
    ends: "अंतिम तिथि",
    endsBad: (d: number) => `तिथि आज के बाद और ${d} दिन के भीतर होनी चाहिए।`,
    usesPerUser: "प्रति ग्राहक कितनी बार",
    usesBad: "1 या अधिक, पूरी संख्या।",
    title: "नाम",
    titleOptional: "(वैकल्पिक)",
    create: "बनाएँ",
    creating: "बना रहे हैं…",
    cancel: "रद्द करें",
    created: (c: string) => `कूपन ${c} बन गया।`,
    genericError: "यह नहीं हो सका। फिर कोशिश करें।",
    limit: (n: number) => `${n} सक्रिय कूपन पूरे हैं। पहले किसी को रोकें।`,
  },
  en: {
    eyebrow: "Coupons",
    titleA: "Your ",
    titleB: "coupon codes",
    sub: (n, d) => `Make your own discount codes for customers. Up to ${n} active at a time, ending within ${d} days.`,
    newBtn: "New coupon",
    listTitle: "Your coupons",
    loading: "Loading…",
    failed: "Could not load your coupons.",
    retry: "Try again",
    empty: "You have not made any coupon yet.",
    scopes: { puja: "Puja", stone: "Gemstones", puja_stone: "Puja and gemstones" },
    statuses: { active: "Active", paused: "Paused", expired: "Expired", disabled: "Disabled" },
    off: (p) => `${p}% off`,
    until: "Ends",
    perUser: (n) => `${n} per customer`,
    uses: (n) => `${n} uses`,
    sales: (v) => `Sales ₹${v}`,
    pause: "Pause",
    resume: "Resume",
    end: "End coupon",
    endConfirm: (c) => `End coupon ${c} now? It cannot be turned on again.`,
    endYes: "Yes, end it",
    keep: "Keep it",
    ended: (c) => `Coupon ${c} has ended.`,
    formTitle: "New coupon",
    code: "Code",
    codeHint: "4 to 16 letters or digits, no spaces",
    codeBad: "The code needs 4 to 16 letters or digits.",
    scope: "Applies to",
    percent: "Discount (%)",
    percentBad: (cap) => `Discount must be above 0 and at most ${cap}%.`,
    ends: "End date",
    endsBad: (d) => `Pick a date after today and within ${d} days.`,
    usesPerUser: "Uses per customer",
    usesBad: "A whole number, 1 or more.",
    title: "Name",
    titleOptional: "(optional)",
    create: "Create",
    creating: "Creating…",
    cancel: "Cancel",
    created: (c) => `Coupon ${c} created.`,
    genericError: "Could not do that. Please try again.",
    limit: (n) => `You already have ${n} active coupons. Pause one first.`,
  },
});

const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
type T = (typeof text)["en"];
type Load = { id: string; status: "ready"; items: Coupon[] } | { id: string; status: "error" };

const DAY = 86_400_000;
/** yyyy-mm-dd for a date input, in the viewer's own calendar. */
const ymd = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
/** The end of the chosen day, local time. */
const endOfDay = (v: string) => new Date(`${v}T23:59:59`);

export default function CouponsView() {
  const t = useT(text);
  const intl = INTL_LOCALE[useLocale()];
  const { id, status } = useAstrologer();
  const { session } = useAuth();
  const [load, setLoad] = useState<Load | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState("");
  const [busyCode, setBusyCode] = useState("");
  const [rowError, setRowError] = useState("");
  const [ending, setEnding] = useState<Coupon | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (status !== "ready" || !id || !session) return;
    const controller = new AbortController();
    getCoupons(controller.signal).then(
      (items) => setLoad({ id, status: "ready", items }),
      () => !controller.signal.aborted && setLoad({ id, status: "error" }),
    );
    return () => controller.abort();
  }, [id, status, session, attempt]);

  const current = load && load.id === id ? load : null;
  const reload = () => setAttempt((n) => n + 1);
  const date = (iso: string) => new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", year: "numeric" }).format(Date.parse(iso));
  const percent = (bps: number) => (bps / 100).toLocaleString(intl, { maximumFractionDigits: 2 });
  const activeCount = current?.status === "ready" ? current.items.filter((c) => c.status === "active").length : 0;

  const toggle = async (c: Coupon) => {
    setBusyCode(c.code);
    setRowError("");
    try {
      await setCouponStatus(c.code, c.status === "active" ? "paused" : "active");
      reload();
    } catch (e) {
      setRowError(e instanceof ApiError && e.message ? e.message : t.genericError);
    } finally {
      setBusyCode("");
    }
  };

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (ending && !d.open) d.showModal();
    if (!ending && d.open) d.close();
  }, [ending]);

  const endIt = async () => {
    const c = ending;
    if (!c) return;
    setBusyCode(c.code);
    setRowError("");
    try {
      await setCouponStatus(c.code, "expired");
      setDone(t.ended(c.code));
      setEnding(null);
      reload();
    } catch (e) {
      setEnding(null);
      setRowError(e instanceof ApiError && e.message ? e.message : t.genericError);
    } finally {
      setBusyCode("");
    }
  };

  return (
    <Page>
      <dialog
        ref={dialogRef}
        onClose={() => setEnding(null)}
        aria-labelledby="cp-end-q"
        className="m-auto w-[min(92vw,26rem)] rounded-[20px] bg-surface-card p-6 text-ink backdrop:bg-black/40"
      >
        <p id="cp-end-q" className="font-semibold">
          {ending && t.endConfirm(ending.code)}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={endIt} disabled={!!busyCode}>
            {t.endYes}
          </Button>
          <Button variant="line" onClick={() => setEnding(null)} disabled={!!busyCode}>
            {t.keep}
          </Button>
        </div>
      </dialog>
      <PageTitle
        eyebrow={t.eyebrow}
        title={
          <>
            {t.titleA}
            <Accent>{t.titleB}</Accent>
          </>
        }
        sub={t.sub(MAX_ACTIVE, MAX_DAYS)}
      />

      {done && (
        <p role="status" className="rounded-[14px] bg-success-soft px-4 py-3 font-semibold text-success">
          {done}
        </p>
      )}

      {open ? (
        <CreateForm
          t={t}
          activeCount={activeCount}
          onCancel={() => setOpen(false)}
          onCreated={(code) => {
            setOpen(false);
            setDone(t.created(code));
            setLoad(null);
            reload();
          }}
        />
      ) : (
        <div>
          <Button
            onClick={() => {
              setDone("");
              setOpen(true);
            }}
          >
            <PiPlus aria-hidden /> {t.newBtn}
          </Button>
        </div>
      )}

      <Card className="p-6 sm:p-7" aria-labelledby="cp-list">
        <div className="flex items-center gap-3">
          <IconBadge icon={PiTicket} size={42} />
          <h2 id="cp-list" className="font-display text-2xl font-bold">
            {t.listTitle}
          </h2>
        </div>
        {rowError && (
          <p role="alert" className="mt-3 text-danger">
            {rowError}
          </p>
        )}
        {!current ? (
          <p className="mt-4 text-ink-soft" role="status">
            {t.loading}
          </p>
        ) : current.status === "error" ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4" role="alert">
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
          </div>
        ) : current.items.length === 0 ? (
          <p className="mt-4 text-ink-soft">{t.empty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {current.items.map((c) => (
              <li key={c.code} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-lg font-bold tracking-wide">{c.code}</span>
                    <Pill tone={c.status === "active" ? "green" : c.status === "paused" ? "amber" : "neutral"}>{t.statuses[c.status]}</Pill>
                  </div>
                  {c.title && (
                    <p className="text-[15px]" lang={hasDevanagari(c.title) ? "hi" : undefined}>
                      {c.title}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-ink-soft">
                    {t.off(percent(c.bps))} · {t.scopes[c.scope]} · {t.perUser(c.usesPerUser)}
                    {c.endsAt && ` · ${t.until} ${date(c.endsAt)}`}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {t.uses(c.uses)} · {t.sales(c.sales.toLocaleString("en-IN", { maximumFractionDigits: 0 }))}
                  </p>
                </div>
                {(c.status === "active" || c.status === "paused") && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="line" size="sm" disabled={busyCode === c.code} onClick={() => toggle(c)}>
                      {c.status === "active" ? t.pause : t.resume}
                    </Button>
                    <Button variant="line" size="sm" disabled={busyCode === c.code} onClick={() => { setDone(""); setEnding(c); }}>
                      {t.end}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}

function CreateForm({ t, activeCount, onCancel, onCreated }: { t: T; activeCount: number; onCancel: () => void; onCreated: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [scope, setScope] = useState<CouponScope>("puja_stone");
  const [pct, setPct] = useState("");
  // Mounted on click, so reading the clock here is fine.
  const [minDate] = useState(() => ymd(Date.now() + DAY));
  const [maxDate] = useState(() => ymd(Date.now() + (MAX_DAYS - 1) * DAY));
  const [ends, setEnds] = useState("");
  const [uses, setUses] = useState("1");
  const [title, setTitle] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const normalized = code.trim().toUpperCase();
  const cap = SCOPE_CAP_PERCENT[scope];
  const pctN = Number(pct);
  const bad = {
    code: !CODE_RE.test(normalized),
    pct: !pct.trim() || !Number.isFinite(pctN) || pctN <= 0 || pctN > cap || Math.round(pctN * 100) !== pctN * 100,
    ends: !ends || ends < minDate || ends > maxDate,
    uses: !/^\d+$/.test(uses.trim()) || Number(uses) < 1,
  };
  const full = activeCount >= MAX_ACTIVE;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (busy || full || bad.code || bad.pct || bad.ends || bad.uses) return;
    setBusy(true);
    setError("");
    try {
      const c = await createCoupon({ code: normalized, scope, percent: pctN, endsAt: endOfDay(ends), usesPerUser: Number(uses), title: title.trim() });
      onCreated(c.code || normalized);
    } catch (err) {
      setError(err instanceof ApiError && err.message ? err.message : t.genericError);
      setBusy(false);
    }
  };

  const err = (show: boolean, msg: string) => show && tried && <p className="text-sm text-danger">{msg}</p>;

  return (
    <Card as="div" className="p-6 sm:p-7">
      <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
        <h2 className="font-display text-2xl font-bold sm:col-span-2">{t.formTitle}</h2>
        {full && (
          <p role="alert" className="text-danger sm:col-span-2">
            {t.limit(MAX_ACTIVE)}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cp-code" className={labelClass}>
            {t.code}
          </label>
          <input
            id="cp-code"
            className={`${fieldClass} font-mono uppercase`}
            value={code}
            maxLength={16}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
            autoComplete="off"
            aria-invalid={tried && bad.code}
            aria-describedby="cp-code-hint"
          />
          <p id="cp-code-hint" className="text-sm text-ink-soft">
            {t.codeHint}
          </p>
          {err(bad.code, t.codeBad)}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cp-scope" className={labelClass}>
            {t.scope}
          </label>
          <select id="cp-scope" className={fieldClass} value={scope} onChange={(e) => setScope(e.target.value as CouponScope)}>
            {(["puja_stone", "puja", "stone"] as const).map((s) => (
              <option key={s} value={s}>
                {t.scopes[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cp-pct" className={labelClass}>
            {t.percent}
          </label>
          <input id="cp-pct" className={fieldClass} inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} placeholder={`1 – ${cap}`} aria-invalid={tried && bad.pct} />
          {err(bad.pct, t.percentBad(cap))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cp-ends" className={labelClass}>
            {t.ends}
          </label>
          <input id="cp-ends" type="date" className={fieldClass} value={ends} min={minDate} max={maxDate} onChange={(e) => setEnds(e.target.value)} aria-invalid={tried && bad.ends} />
          {err(bad.ends, t.endsBad(MAX_DAYS))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cp-uses" className={labelClass}>
            {t.usesPerUser}
          </label>
          <input id="cp-uses" className={fieldClass} inputMode="numeric" value={uses} onChange={(e) => setUses(e.target.value)} aria-invalid={tried && bad.uses} />
          {err(bad.uses, t.usesBad)}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cp-title" className={labelClass}>
            {t.title} <span className="font-normal text-ink-soft">{t.titleOptional}</span>
          </label>
          <input id="cp-title" className={fieldClass} value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {error && (
          <p role="alert" className="text-danger sm:col-span-2">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy || full}>
            {busy ? t.creating : t.create}
          </Button>
          <Button variant="line" onClick={onCancel} disabled={busy}>
            {t.cancel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
