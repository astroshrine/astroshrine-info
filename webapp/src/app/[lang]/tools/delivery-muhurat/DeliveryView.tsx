"use client";

import { useCallback, useEffect, useState } from "react";
import { PiArrowLeft, PiArrowRight, PiPlus } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { fill } from "@/lib/services/toolsBCommon";
import {
  dmErrorKey, getDmConfig, getDmReport, getDmRequest, listDmRequests, saveDmRequest, selectDmTime,
  type DmConfig, type DmRequest, type Lang, type RequestDraft, type RequestSummary,
} from "@/lib/services/toolsBDelivery";
import { Card, ErrorBox, Skeleton, btnPrimary, btnSecondary } from "../../kundli/_components/ui";
import { Gate, LowBalance } from "../_b/shell";
import ChartStep from "./chart";
import { draftFrom, draftPayload, firstInvalidStep, nextStep, pickBi, prevStep, resumeStep, STEP_KEYS, stepError, type StepNo } from "./logic";
import { dmText } from "./messages";
import MuhuratStep, { type Selection } from "./muhurat";
import ReportStep from "./report";
import { HospitalStep, MedicalStep, ParentStep } from "./steps";

const DEFAULT_MAX_WINDOW_DAYS = 10;

export default function DeliveryView() {
  const t = useT(dmText);
  return (
    <Gate what={t.title}>
      <Flow />
    </Gate>
  );
}

function Flow() {
  const t = useT(dmText);
  const locale = useLocale();
  const lang: Lang = locale;
  const [config, setConfig] = useState<DmConfig | null>(null);
  const [configFailed, setConfigFailed] = useState<"" | "disabled" | "failed">("");
  const [requests, setRequests] = useState<RequestSummary[] | null>(null);
  const [step, setStep] = useState<StepNo | null>(null); // null = the entry page
  const [draft, setDraft] = useState<RequestDraft>({});
  const [request, setRequest] = useState<DmRequest | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [busy, setBusy] = useState<"" | "open" | "next" | "chart">("");
  const [error, setError] = useState<unknown>(null);
  const [reload, setReload] = useState(0);

  const maxWindowDays = config?.maxWindowDays ?? DEFAULT_MAX_WINDOW_DAYS;
  const singleFixed = !!draft.singleFixedTime;
  const price = config?.pricePoints ?? 0;
  const fail = useCallback((e: unknown) => setError(e), []);

  useEffect(() => {
    let alive = true;
    getDmConfig().then(
      (c) => alive && (setConfig(c), setConfigFailed("")),
      (e) => alive && setConfigFailed(dmErrorKey(e) === "disabled" ? "disabled" : "failed"),
    );
    listDmRequests().then(
      (r) => alive && setRequests(r),
      () => alive && setRequests([]),
    );
    return () => {
      alive = false;
    };
  }, [reload]);

  async function open(id: string) {
    setBusy("open");
    setError(null);
    try {
      const r = await getDmRequest(id);
      const d = draftFrom(r);
      setRequest(r);
      setDraft(d);
      setSelection(null);
      setStep(Math.min(resumeStep(r), firstInvalidStep(d, Infinity)) as StepNo);
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
    }
  }

  // The chart of a resumed request: read it from the saved report instead of selecting a time again.
  const reportId = selection?.reportId ?? request?.selectedReportId ?? null;
  useEffect(() => {
    if (step !== 5 || selection || !reportId) return;
    let alive = true;
    setTimeout(() => alive && setBusy("chart"), 0);
    getDmReport(reportId)
      .then((r) => alive && setSelection({ reportId: r.id, kind: r.kind, full: r.full, disclaimer: r.disclaimer, birthLocal: r.birthLocal }))
      .catch((e) => alive && fail(e))
      .finally(() => alive && setBusy(""));
    return () => {
      alive = false;
    };
  }, [step, selection, reportId, fail]);

  const patch = (p: Partial<RequestDraft>) => setDraft((d) => ({ ...d, ...p }));
  const invalid = step ? stepError(step, draft, maxWindowDays) : null;

  async function next() {
    if (!step || invalid || busy) return;
    setBusy("next");
    setError(null);
    try {
      let saved: DmRequest | null = null;
      try {
        saved = await saveDmRequest(draftPayload(draft, step));
        setRequest(saved);
        setDraft((d) => ({ ...d, id: saved!.id, step: saved!.step ?? d.step }));
      } catch (e) {
        // Steps 1 to 3 must be saved: the search reads the stored request. Later steps only move the resume point.
        if (step <= 3) throw e;
      }
      const id = saved?.id ?? draft.id;
      const fixed = draft.singleFixedTime;
      if (step === 3 && fixed && id && selection?.birthLocal?.slice(0, 16) !== fixed.local.slice(0, 16)) {
        // A single medically fixed time is never searched: its chart is made directly (this can charge).
        const res = await selectDmTime(id, { fixedTimeLocal: fixed.local });
        setSelection({ ...res, birthLocal: fixed.local });
        setRequest((r) => (r ? { ...r, status: "time_selected", selectedReportId: res.reportId } : r));
      }
      setStep(nextStep(step, singleFixed));
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
    }
  }

  function toEntry() {
    setStep(null);
    setError(null);
    setReload((n) => n + 1);
  }

  const onSelected = (sel: Selection) => {
    setSelection(sel);
    setRequest((r) => (r ? { ...r, status: "time_selected", selectedReportId: sel.reportId } : r));
    setStep(5);
  };

  const errorBox = error ? <ErrorView error={error} onRetry={() => setError(null)} /> : null;

  if (busy === "open") return <Skeleton className="h-40 w-full" />;

  // ===== Entry =====
  if (step === null) {
    const disabled = configFailed === "disabled" || (config && !config.enabled);
    return (
      <div className="space-y-5">
        {errorBox}
        {configFailed === "failed" ? (
          <ErrorBox message={t.error.failed} onRetry={() => setReload((n) => n + 1)} />
        ) : !config && !configFailed ? (
          <Skeleton className="h-40 w-full" />
        ) : disabled ? (
          <Card>
            <p className="body-5 text-ink">{t.disabled}</p>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <h2 className="heading-6 text-ink">{t.howTitle}</h2>
              <p className="body-5 mt-2 text-ink-soft">{t.howBody}</p>
              {price > 0 ? (
                <p className="title-3 mt-3 text-ink">{fill(t.price, { points: price })}</p>
              ) : null}
              <button
                type="button"
                className={`${btnPrimary} mt-4`}
                onClick={() => {
                  setDraft({});
                  setRequest(null);
                  setSelection(null);
                  setStep(1);
                }}
              >
                <PiPlus className="h-5 w-5" aria-hidden /> {t.newRequest}
              </button>
            </Card>
            {!!requests?.length && (
              <section className="lg:col-span-2" aria-labelledby="dm-resume">
                <h2 id="dm-resume" className="heading-6 text-ink">
                  {t.resume}
                </h2>
                <ul className="mt-3 space-y-3">
                  {requests.map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => void open(r.id)} className="w-full rounded-2xl border border-line bg-surface-card p-4 text-left transition hover:border-line-strong active:scale-98">
                        <span className="flex items-start justify-between gap-2">
                          <span className="title-3 min-w-0 break-words text-ink">{r.motherName || t.untitled}</span>
                          <span className="caption-3 shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-ink-soft">{t.status[r.status]}</span>
                        </span>
                        {!!r.hospitalName && <span className="caption-2 mt-1 block text-ink-soft">{r.hospitalName}</span>}
                        <span className="caption-2 mt-1 block text-ink-muted">{fill(t.updated, { date: (r.updatedAt || r.createdAt || "").slice(0, 10) })}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
        <p className="caption-3 max-w-3xl text-ink-muted">{pickBi(config?.disclaimer, lang) || t.disclaimer}</p>
      </div>
    );
  }

  // ===== Wizard =====
  const requestId = draft.id ?? request?.id;
  const nextLabel = step === 3 && singleFixed ? (price > 0 && !request?.pointsCharged ? fill(t.viewFixedChartPaid, { points: price }) : t.viewFixedChart) : t.next;

  return (
    <div className="space-y-5">
      <nav aria-label={t.title}>
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {STEP_KEYS.map((k, i) => {
            const n = (i + 1) as StepNo;
            const skipped = n === 4 && singleFixed;
            return (
              <li
                key={k}
                aria-current={n === step ? "step" : undefined}
                className={`button-sm shrink-0 rounded-full border px-3 py-1.5 ${
                  n === step ? "border-ink bg-surface-inverse text-ink-inverse" : skipped ? "border-line bg-surface-sunken text-ink-muted" : "border-line-strong bg-surface-card text-ink-soft"
                }`}
              >
                {String(n).padStart(2, "0")} {t.step[k]}
              </li>
            );
          })}
        </ol>
      </nav>

      {errorBox}

      <div className="rounded-2xl border border-line bg-surface-card p-5 shadow-sm">
        {step === 1 && <ParentStep value={draft.mother} onChange={(mother) => patch({ mother })} />}
        {step === 2 && <MedicalStep draft={draft} onChange={patch} maxWindowDays={maxWindowDays} />}
        {step === 3 && <HospitalStep value={draft.hospital} onChange={(hospital) => patch({ hospital })} />}
        {step === 4 &&
          (requestId ? (
            <MuhuratStep requestId={requestId} windows={draft.windows} pricePoints={request?.pointsCharged ? 0 : price} lang={lang} onSelected={onSelected} onError={fail} />
          ) : (
            <p className="body-6 text-danger">{t.error.notFound}</p>
          ))}
        {step === 5 &&
          (selection ? (
            <ChartStep full={selection.full} kind={selection.kind} birthLocal={selection.birthLocal} disclaimer={selection.disclaimer} lang={lang} />
          ) : busy === "chart" ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <p className="body-6 text-warning">{t.noSelection}</p>
          ))}
        {step === 6 &&
          (requestId && reportId ? <ReportStep requestId={requestId} reportId={reportId} lang={lang} onError={fail} /> : <p className="body-6 text-warning">{t.noSelection}</p>)}
        {invalid && (
          <p role="alert" className="caption-1 mt-4 text-danger">
            {t.invalid[invalid]}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={btnSecondary} disabled={busy === "next"} onClick={() => (step === 1 ? toEntry() : setStep(prevStep(step, singleFixed)))}>
          <PiArrowLeft className="h-4 w-4" aria-hidden /> {t.back}
        </button>
        {step === 6 ? (
          <button type="button" className={btnPrimary} onClick={toEntry}>
            {t.done}
          </button>
        ) : step === 4 ? null : (
          <button type="button" className={btnPrimary} onClick={() => void next()} disabled={!!invalid || !!busy || (step === 5 && !selection)}>
            {busy === "next" ? "..." : nextLabel} <PiArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
      <p className="caption-3 max-w-3xl text-ink-muted">{pickBi(config?.disclaimer, lang) || t.disclaimer}</p>
    </div>
  );
}

function ErrorView({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const t = useT(dmText);
  const key = dmErrorKey(error);
  if (key === "insufficientBalance") return <LowBalance />;
  return <ErrorBox message={t.error[key].replace("{{minutes}}", "60")} onRetry={onRetry} />;
}
