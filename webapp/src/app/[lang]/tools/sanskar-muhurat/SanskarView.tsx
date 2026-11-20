"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PiArrowLeft, PiArrowRight, PiPlus } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { ApiError } from "@/lib/api";
import { chargeSanskar } from "@/lib/services/toolsBSanskar";
import { fill } from "@/lib/services/toolsBCommon";
import { saveResult } from "@/lib/services/toolsBSaved";
import { Card, ErrorBox, Skeleton, btnPrimary, btnSecondary } from "../../kundli/_components/ui";
import SavedList from "../_b/SavedList";
import { Gate, LowBalance } from "../_b/shell";
import { crossCheck, withCrossCheck, type CrossCheck } from "./_logic/crosscheck";
import { clearDraft, loadDraft, newDraft, saveDraft, stepError, toSearchInput, type Draft } from "./_logic/draft";
import { ensureEngine, tzHours } from "./_logic/engine";
import { SEED_KB, loadKb, type Kb, type Sanskar } from "./_logic/kb";
import { searchMuhuratAsync, type SearchResult } from "./_logic/search";
import { ChildStep, RitualStep, TraditionStep, VenueStep } from "./forms";
import FinishStep from "./finish";
import { smText } from "./messages";
import ResultsStep, { type Results } from "./results";

const STEPS = ["child", "ritual", "venue", "tradition", "muhurat", "report"] as const;
type Shown = { results: Results; cross: Record<string, CrossCheck> };
const DST_FLAG = {
  hi: "इस तिथि पर स्थान का समय-अन्तर (DST) खोज से भिन्न — समय स्थानीय घड़ी से जाँचें",
  en: "The venue’s UTC offset (DST) differs on this date — check the time against the local clock",
};

export default function SanskarView() {
  const t = useT(smText);
  return (
    <Gate what={t.title}>
      <Flow />
    </Gate>
  );
}

function Flow() {
  const t = useT(smText);
  const locale = useLocale();
  const { session } = useAuth();
  const scope = session?.user.id ?? "";
  const [kb, setKb] = useState<Kb>(SEED_KB);
  const [kbReady, setKbReady] = useState(false);
  const [kbSeed, setKbSeed] = useState(false);
  const [saved, setSaved] = useState<Draft | null>(null);
  const [d, setD] = useState<Draft | null>(null);
  const [results, setResults] = useState<Results>({});
  const [cross, setCross] = useState<Record<string, CrossCheck>>({});
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const run = useRef(0);

  useEffect(() => {
    let alive = true;
    loadKb().then((k) => {
      if (!alive) return;
      setKb(k);
      setKbSeed(!k.fromServer);
      setKbReady(true);
    });
    const runs = run;
    return () => {
      alive = false;
      runs.current++; // drops a search still running when the page closes
    };
  }, []);
  useEffect(() => {
    // The draft lives in this browser: read after hydration.
    const id = setTimeout(() => setSaved(loadDraft(scope)), 0);
    return () => clearTimeout(id);
  }, [scope]);

  useEffect(() => {
    if (!d) return;
    const h = setTimeout(() => {
      saveDraft(d, scope);
      setSaved(d);
    }, 300);
    return () => clearTimeout(h);
  }, [d, scope]);

  const patch = useCallback((p: Partial<Draft>) => setD((x) => (x ? { ...x, ...p } : x)), []);
  const step = d?.step ?? 0;
  const goStep = (n: number) => patch({ step: n });

  /** Search one samskara; the cross-check follows for its candidates. */
  const search = useCallback(
    async (draft: Draft, sk: Sanskar, relaxed = false, tradition?: string): Promise<Shown | null> => {
      const id = ++run.current;
      await ensureEngine();
      const inp = toSearchInput(tradition ? { ...draft, tradition } : draft, sk, relaxed, locale);
      setProgress([0, 1]);
      let r: SearchResult | null = null;
      try {
        r = await searchMuhuratAsync(inp, kb, (done, total) => id === run.current && setProgress([done, total]), () => id !== run.current);
      } catch (e) {
        setError(e);
      }
      if (id === run.current) setProgress(null);
      if (!r) return null;
      const zone = draft.venue.place!.tz;
      r.candidates = r.candidates.map((c) => (tzHours(zone, c.date, c.start) === inp.venue.tz ? c : { ...c, flags: [...c.flags, DST_FLAG] }));
      setResults((x) => ({ ...x, [sk]: r! }));
      const xc = await crossCheck(r.candidates, inp.venue);
      setCross((x) => ({ ...x, ...xc }));
      const done = { ...r, candidates: r.candidates.map((c) => (xc[c.id] ? withCrossCheck(c, xc[c.id]) : c)) };
      setResults((x) => (x[sk] === r ? { ...x, [sk]: done } : x));
      return id === run.current ? { results: { [sk]: done }, cross: xc } : null;
    },
    [kb, locale],
  );

  /** Each new search shown goes to the saved results, as the app does. */
  const keep = (draft: Draft, shown: Shown) => {
    const sks = Object.keys(shown.results) as Sanskar[];
    if (!sks.length) return;
    void saveResult("sanskar_muhurat", shown, { ...draft, step: 5 }, `${draft.child.name.trim()} · ${sks.map((sk) => t[sk]).join(", ")}`);
  };
  const runAndKeep = async (sk: Sanskar, relaxed: boolean, tradition?: string) => {
    const x = d && (await search(d, sk, relaxed, tradition));
    if (d && x) keep(d, { results: { ...results, ...x.results }, cross: { ...cross, ...x.cross } });
  };

  /** The one step that costs points: POST /charge with the draft's own idempotency key, only on the button press. */
  async function charge(draft: Draft): Promise<boolean> {
    if (draft.charged || !kb.fromServer || !(kb.config.price_points > 0)) return true;
    try {
      await chargeSanskar(draft.chargeKey);
      patch({ charged: true });
      return true;
    } catch (e) {
      setError(e);
      return false;
    }
  }

  const invalid = d ? stepError(step, d) : null;

  async function next() {
    if (!d || busy || invalid) return;
    setError(null);
    if (step === 4) {
      setBusy(true);
      const ok = await charge(d);
      setBusy(false);
      if (!ok) return;
      goStep(5);
      setResults({});
      setCross({});
      const shown: Shown = { results: {}, cross: {} };
      for (const sk of d.sanskars) {
        const x = await search(d, sk);
        Object.assign(shown.results, x?.results);
        Object.assign(shown.cross, x?.cross);
      }
      keep(d, shown);
      return;
    }
    if (step < STEPS.length) goStep(step + 1);
  }

  function leave() {
    run.current++;
    setProgress(null);
    setD(null);
    setError(null);
  }

  const errorBox = error ? <ErrorView error={error} points={kb.config.price_points} onRetry={() => setError(null)} /> : null;

  // ===== Entry =====
  if (!d) {
    const price = kb.fromServer ? kb.config.price_points : 0;
    return (
      <div className="space-y-5">
        {errorBox}
        {!kbReady ? (
          <Skeleton className="h-40 w-full" />
        ) : !kb.config.enabled ? (
          <Card>
            <p className="body-5 text-ink">{t.disabled}</p>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <h2 className="heading-6 text-ink">{t.howTitle}</h2>
              <p className="body-5 mt-2 text-ink-soft">{t.howBody}</p>
              {price > 0 && (
                <>
                  <p className="title-3 mt-3 text-ink">{fill(t.price, { points: price })}</p>
                  <p className="caption-2 text-ink-soft">{t.priceNote}</p>
                </>
              )}
              {kbSeed && <p className="caption-2 mt-2 text-warning">{t.kbLoadFailed}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className={btnPrimary}
                  onClick={() => {
                    const n = newDraft();
                    setResults({});
                    setCross({});
                    setD(n);
                  }}
                >
                  <PiPlus className="h-5 w-5" aria-hidden /> {t.new}
                </button>
                {saved && (
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => {
                      setResults({});
                      setCross({});
                      // Results live only in memory: a draft reopened at the results is searched again (no new charge).
                      setD(saved.step >= 5 ? { ...saved, step: 4 } : saved);
                    }}
                  >
                    {t.resumeDraft}: {saved.child.name || "-"}
                  </button>
                )}
                {saved && (
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => {
                      clearDraft(scope);
                      setSaved(null);
                    }}
                  >
                    {t.discardDraft}
                  </button>
                )}
              </div>
            </Card>
            <div className="lg:col-span-2">
              <SavedList<Shown, Draft>
                tool="sanskar_muhurat"
                onOpen={async (sv) => {
                  await ensureEngine();
                  setD({ ...sv.input, step: 5 });
                  setResults(sv.result.results);
                  setCross(sv.result.cross);
                }}
              />
            </div>
          </div>
        )}
        <p className="caption-3 max-w-3xl text-ink-muted">{t.disclaimerDraft}</p>
      </div>
    );
  }

  // ===== Wizard =====
  const needsPick = step === 5 && !d.sanskars.some((sk) => d.selected[sk]);
  return (
    <div className="space-y-5">
      <nav aria-label={t.title}>
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {STEPS.map((k, i) => (
            <li
              key={k}
              aria-current={i + 1 === step ? "step" : undefined}
              className={`button-sm shrink-0 rounded-full border px-3 py-1.5 ${i + 1 === step ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink-soft"}`}
            >
              {String(i + 1).padStart(2, "0")} {k === "report" ? `${t.step.sankalpa} · ${t.step.report}` : t.step[k]}
            </li>
          ))}
        </ol>
      </nav>

      {errorBox}

      <div className="rounded-2xl border border-line bg-surface-card p-5 shadow-sm">
        {step === 1 && <ChildStep d={d} patch={patch} />}
        {step === 2 && <RitualStep d={d} patch={patch} />}
        {step === 3 && <VenueStep d={d} patch={patch} />}
        {step === 4 && <TraditionStep d={d} patch={patch} kb={kb} />}
        {step === 5 && <ResultsStep d={d} patch={patch} kb={kb} results={results} cross={cross} progress={progress} onRun={(sk, relaxed, tr) => void runAndKeep(sk, relaxed, tr)} />}
        {step === 6 && <FinishStep d={d} patch={patch} kb={kb} results={results} />}
        {invalid && (
          <p role="alert" className="caption-1 mt-4 text-danger">
            {t.invalid[invalid as keyof typeof t.invalid]}
          </p>
        )}
        {step === 4 && kb.fromServer && kb.config.price_points > 0 && !d.charged && <p className="caption-2 mt-4 text-ink-soft">{`${fill(t.price, { points: kb.config.price_points })}. ${t.priceNote}`}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={btnSecondary} disabled={busy} onClick={() => (step <= 1 ? leave() : goStep(step - 1))}>
          <PiArrowLeft className="h-4 w-4" aria-hidden /> {t.back}
        </button>
        {step < STEPS.length && (
          <button type="button" className={btnPrimary} onClick={() => void next()} disabled={!!invalid || busy || (step === 5 && (!!progress || needsPick))}>
            {busy ? "..." : step === 4 ? (kb.fromServer && kb.config.price_points > 0 && !d.charged ? fill(t.findPaid, { points: kb.config.price_points }) : t.find) : t.next}{" "}
            <PiArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
      <p className="caption-3 max-w-3xl text-ink-muted">{t.disclaimerDraft}</p>
    </div>
  );
}

function ErrorView({ error, points, onRetry }: { error: unknown; points: number; onRetry: () => void }) {
  const t = useT(smText);
  if (error instanceof ApiError && error.status === 402) return <LowBalance need={points} />;
  const msg = error instanceof ApiError && error.status === 403 ? t.disabled : error instanceof ApiError ? t.chargeFailed : t.searchFailed;
  return <ErrorBox message={msg} onRetry={onRetry} />;
}
