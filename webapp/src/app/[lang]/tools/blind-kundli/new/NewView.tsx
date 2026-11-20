"use client";

import { useState } from "react";
import { PiCheckCircle, PiLockKey } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { grahaName, rashiName } from "@/lib/jyotish";
import {
  ENTERED, bodyOf, checkBlindKundli, chartHouses, emptyForm, houseOf, lockBlindKundli, missing, rashiFromHouse, rashisOf,
  type CheckResult, type Confidence, type Entered, type Form, type Mode, type Row, type Source,
} from "@/lib/services/toolsBBlindKundli";
import { toolErrorText } from "@/lib/services/toolsBCommon";
import NorthIndianChart from "../../../kundli/_components/NorthIndianChart";
import { Card, ErrorBox, Notice, btnPrimary, btnSecondary, inputCls, labelCls } from "../../../kundli/_components/ui";
import { ToolPage } from "../../_b/shell";
import BkGate from "../BkGate";
import Checks, { Chips } from "../Checks";
import { bkText } from "../text";

const NUMS = Array.from({ length: 12 }, (_, i) => ({ v: i + 1, label: String(i + 1) }));

export default function NewView() {
  const t = useT(bkText);
  return (
    <ToolPage eyebrow={t.newEyebrow} title={t.title} intro={t.newIntro}>
      <BkGate>
        <Flow />
      </BkGate>
    </ToolPage>
  );
}

type Busy = "" | "check" | "lock";

function Flow() {
  const t = useT(bkText);
  const locale = useLocale();
  const router = useRouter();
  const [form, setForm] = useState<Form>(emptyForm);
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [busy, setBusy] = useState<Busy>("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Any edit clears the last check, as in the app: the check belongs to exactly this table.
  const edit = (f: (p: Form) => Form) => {
    setForm(f);
    setCheck(null);
    setConfirming(false);
    setError(null);
  };
  const setRow = (key: "lagna" | Entered, patch: Partial<Row>) =>
    edit((p) => (key === "lagna" ? { ...p, lagna: { ...p.lagna, ...patch } } : { ...p, planets: { ...p.planets, [key]: { ...p.planets[key], ...patch } } }));

  // Switching between rashi and house converts every graha through the lagna instead of wiping the table.
  const switchMode = (mode: Mode) =>
    edit((p) => {
      if (p.mode === mode) return p;
      const l = p.lagna.value;
      const conv = (v: number | null) => (v == null || l == null ? null : mode === "rashi" ? rashiFromHouse(l, v) : houseOf(v, l));
      return { ...p, mode, planets: Object.fromEntries(ENTERED.map((g) => [g, { ...p.planets[g], value: conv(p.planets[g].value) }])) as Form["planets"] };
    });

  const rashis = rashisOf(form);
  const lagna = form.lagna.value;
  const todo = missing(form);

  async function run(kind: "check" | "lock") {
    if (todo.length) {
      setError(t.incomplete(todo.join(", ")));
      return;
    }
    setBusy(kind);
    setError(null);
    try {
      if (kind === "check") setCheck(await checkBlindKundli(bodyOf(form)));
      else {
        const p = await lockBlindKundli(bodyOf(form));
        router.replace(`/tools/blind-kundli/report?id=${encodeURIComponent(p.id)}`);
        return;
      }
    } catch (e) {
      setError(serverMessage(e, locale));
    } finally {
      setBusy("");
      setConfirming(false);
    }
  }

  const line = (key: "lagna" | Entered) => {
    const v = key === "lagna" ? lagna : form.planets[key].value;
    if (v == null) return "";
    if (key === "lagna" || form.mode === "rashi") return t.rashiLine(v, rashiName(v, locale));
    const r = rashis[key];
    return r ? t.houseLine(v, r, rashiName(r, locale)) : `${t.houseWord(v)}`;
  };

  const rowCard = (key: "lagna" | Entered) => {
    const row = key === "lagna" ? form.lagna : form.planets[key];
    const title = key === "lagna" ? t.lagna : grahaName(key, locale);
    const numLabel = key === "lagna" || form.mode === "rashi" ? t.rashi : t.bhav;
    const id = `bk-${key}`;
    return (
      <Card key={key} title={title}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className={labelCls.replace("mb-2 ", "")}>{numLabel}</p>
          <p className="caption-2 text-ink-soft" aria-live="polite">{line(key)}</p>
        </div>
        <div className="mt-2">
          <Chips items={NUMS} value={row.value} onPick={(v) => setRow(key, { value: v })} label={`${title}, ${numLabel}`} />
        </div>
        <p className="title-4 mt-4 text-ink">{t.confidence}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          <Chips<Confidence>
            items={(["low", "medium", "high"] as const).map((v) => ({ v, label: t.conf[v] }))}
            value={row.confidence}
            onPick={(v) => setRow(key, { confidence: v })}
            label={`${title}, ${t.confidence}`}
          />
          <Chips<Source>
            items={(["palm", "face"] as const).map((v) => ({ v, label: t.source[v] }))}
            value={row.source}
            onPick={(v) => setRow(key, { source: v })}
            label={`${title}, ${t.source.palm} / ${t.source.face}`}
          />
        </div>
        <label htmlFor={id} className={`${labelCls} mt-4`}>
          {t.evidence}
        </label>
        <textarea id={id} rows={2} maxLength={500} value={row.note} onChange={(e) => setRow(key, { note: e.target.value })} placeholder={t.evidencePlaceholder} className={inputCls} />
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <Card>
          <label htmlFor="bk-label" className={labelCls}>
            {t.label}
          </label>
          <input id="bk-label" maxLength={100} value={form.label} onChange={(e) => edit((p) => ({ ...p, label: e.target.value }))} placeholder={t.labelPlaceholder} className={inputCls} />
          <p className={`${labelCls} mt-4`}>{t.enterBy}</p>
          <Chips<Mode>
            items={[
              { v: "house", label: t.byHouse },
              { v: "rashi", label: t.byRashi },
            ]}
            value={form.mode}
            onPick={switchMode}
            label={t.enterBy}
          />
          <div className="mt-4">
            <Notice>{t.fromReadingsSkipped}</Notice>
          </div>
        </Card>
        {rowCard("lagna")}
        {ENTERED.map(rowCard)}
        <p className="caption-2 text-ink-soft">
          {t.ketu}
          {rashis.Ketu ? ` → ${t.rashiLine(rashis.Ketu, rashiName(rashis.Ketu, locale))}${lagna ? `, ${t.houseWord(houseOf(rashis.Ketu, lagna))}` : ""}` : ""}
        </p>
      </div>

      <aside className="space-y-4 lg:col-span-2">
        <div className="space-y-4 lg:sticky lg:top-24">
          <Card title={t.preview}>
            {lagna != null ? (
              <NorthIndianChart houses={chartHouses(lagna, rashis)} label={t.preview} lagnaLabel={t.asc} className="mx-auto w-full max-w-sm" />
            ) : (
              <p className="body-6 text-ink-soft">{t.previewEmpty}</p>
            )}
          </Card>
          {check && <Checks result={check} />}
          {error && <ErrorBox message={error} />}
          {confirming && (
            <div role="alertdialog" aria-labelledby="bk-lock-title" className="rounded-2xl border border-line bg-warning-soft p-4">
              <p id="bk-lock-title" className="title-3 text-warning">{t.lockTitle}</p>
              <p className="body-6 mt-1 text-ink-soft">{t.lockBody}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={btnPrimary} disabled={!!busy} onClick={() => void run("lock")}>
                  <PiLockKey className="h-5 w-5" aria-hidden /> {busy === "lock" ? t.locking : t.confirmLock}
                </button>
                <button type="button" className={btnSecondary} disabled={!!busy} onClick={() => setConfirming(false)}>
                  {t.cancel}
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btnSecondary} disabled={!!busy} onClick={() => void run("check")}>
              <PiCheckCircle className="h-5 w-5" aria-hidden /> {busy === "check" ? t.checking : t.check}
            </button>
            <button type="button" className={btnPrimary} disabled={!!busy || !check?.ok} onClick={() => setConfirming(true)}>
              <PiLockKey className="h-5 w-5" aria-hidden /> {t.lock}
            </button>
          </div>
          {!check?.ok && <p className="caption-2 text-ink-soft">{t.needCheck}</p>}
        </div>
      </aside>
    </div>
  );
}

/** The server's validation details are English field messages: shown as they are, after the generic text. */
function serverMessage(e: unknown, locale: "hi" | "en"): string {
  const base = toolErrorText(e, locale);
  if (e instanceof ApiError && e.status === 400 && e.message && !/^Request failed/.test(e.message)) return e.message;
  return base;
}
