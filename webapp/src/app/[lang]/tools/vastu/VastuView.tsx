"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PiArrowLeft, PiArrowRight, PiCheck, PiImage, PiPrinter, PiSquaresFour, PiTrash } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { fill, toolErrorText } from "@/lib/services/toolsBCommon";
import {
  PLAN_IMAGE_MAX,
  PLAN_IMAGE_TYPES,
  analyzeVastu,
  getVastuAccess,
  getVastuReport,
  listVastuReports,
  saveVastuReport,
  uploadPlanImage,
  vastuErrorKey,
  type Analysis,
  type Finding,
  type ReportSummary,
  type VastuAccess,
} from "@/lib/services/toolsBVastu";
import { canvasBox, overlaySvg } from "@/lib/vastu/chakraSvg";
import {
  DISCLAIMERS,
  ELEMENTS,
  INDUSTRIES,
  PROPERTY_LABELS,
  PROPERTY_TYPES,
  angleFromCentre,
  bearingToOffset,
  buildAnalysisRequest,
  industryLabel,
  itemLabel,
  itemTypesFor,
  offsetToBearing,
  padaInfo,
  placeItem,
  polygonCentroid,
  remedyInfo,
  zoneCoverage,
  zoneOf,
  zonePurpose,
  ZONES,
  type Industry,
  type ItemType,
  type PlacedItem,
  type PropertyType,
  type Pt,
  type TaggedItem,
  type ZoneId,
} from "@/lib/vastu/engine";
import { Card, ErrorBox, Notice, SignInPrompt, btnPrimary, btnSecondary, btnSmall, inputCls, labelCls } from "../../kundli/_components/ui";
import { LowBalance, PanelSkeleton, ToolPage } from "../_b/shell";
import PlanCanvas from "./PlanCanvas";
import { text } from "./messages";

type Step = "plan" | "boundary" | "north" | "centre" | "tags" | "review" | "result";
const STEPS: Step[] = ["plan", "boundary", "north", "centre", "tags", "review", "result"];
type Plan = { url?: string; width: number; height: number };

const chip = (active: boolean) =>
  `button-sm rounded-full border px-3 py-1.5 transition active:scale-98 ${
    active ? "border-ink bg-surface-inverse text-ink-inverse on-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"
  }`;

/** Strips the outer <svg> of the engine's drawing so it can sit inside the canvas's own SVG. */
const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

export default function VastuView() {
  const t = useT(text);
  const { status, user } = useAuth();
  const [access, setAccess] = useState<VastuAccess | null>(null);
  const [accessError, setAccessError] = useState(false);
  const astrologer = user?.role === "ASTROLOGER";

  useEffect(() => {
    if (status !== "signedIn" || !user || astrologer) return;
    const c = new AbortController();
    getVastuAccess(c.signal).then(setAccess, () => !c.signal.aborted && setAccessError(true));
    return () => c.abort();
  }, [status, user, astrologer]);

  let body: React.ReactNode;
  if (status === "loading" || (status === "signedIn" && !user)) body = <PanelSkeleton />;
  else if (status === "signedOut") body = <SignInPrompt what={t.title} />;
  else if (astrologer) body = <Flow price={0} />;
  else if (accessError) body = <ErrorBox message={t.error.failed} onRetry={() => setAccessError(false)} />;
  else if (!access) body = <PanelSkeleton />;
  else if (!access.customerEnabled) {
    body = (
      <Card>
        <h2 className="title-2 text-ink">{t.notAvailableTitle}</h2>
        <p className="body-6 mt-2 text-ink-soft">{t.notAvailableBody}</p>
      </Card>
    );
  } else body = <Flow price={access.price} />;

  return (
    <ToolPage eyebrow="Vastu" title={t.title}>
      {body}
    </ToolPage>
  );
}

function Flow({ price }: { price: number }) {
  const t = useT(text);
  const locale = useLocale();
  const L = locale === "hi" ? 1 : 0;
  const [step, setStep] = useState<Step>("plan");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [polygon, setPolygon] = useState<Pt[]>([]);
  const [closed, setClosed] = useState(false);
  const [centre, setCentre] = useState<Pt | null>(null);
  const [upBearing, setUpBearing] = useState(0);
  const [upText, setUpText] = useState("0");
  const [propertyType, setPropertyType] = useState<PropertyType>("home");
  const [industry, setIndustry] = useState<Industry | undefined>();
  const [items, setItems] = useState<TaggedItem[]>([]);
  const [savedItems, setSavedItems] = useState<PlacedItem[] | null>(null);
  const [itemType, setItemType] = useState<ItemType>("main_door");
  const [areaMode, setAreaMode] = useState(false);
  const [pending, setPending] = useState<Pt | null>(null);
  const [opacity, setOpacity] = useState(0.85);
  const [zoneLines, setZoneLines] = useState(true);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selected, setSelected] = useState<ZoneId | null>(null);
  const [upload, setUpload] = useState<{ url: string; path: string } | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"" | "analyze" | "save" | "load">("");
  const [error, setError] = useState<string | null>(null);
  const [low, setLow] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const northOffset = bearingToOffset(upBearing);
  const centreAuto = useMemo(() => (polygon.length >= 3 ? polygonCentroid(polygon) : null), [polygon]);
  const chakraOn = closed && !!centre && step !== "plan" && step !== "boundary";
  const coverage = useMemo(() => (chakraOn ? zoneCoverage(polygon, centre as Pt, northOffset) : []), [chakraOn, polygon, centre, northOffset]);
  const statusMap = useMemo(() => Object.fromEntries(coverage.map((z) => [z.zone, z.status])), [coverage]);
  const placed = useMemo(() => savedItems ?? (centre ? items.map((it) => placeItem(it, centre, northOffset)) : []), [savedItems, items, centre, northOffset]);
  const entrances = placed.filter((p) => p.type === "main_door" && p.pada);
  const upValid = /^\d{1,3}$/.test(upText.trim()) && Number(upText) < 360;
  const index = STEPS.indexOf(step);
  const inResults = step === "review" || step === "result";

  const box = useMemo(
    () => (plan ? canvasBox({ width: plan.width, height: plan.height, polygon, centre: chakraOn ? centre : null, northOffset }) : { x: 0, y: 0, w: 1, h: 1 }),
    [plan, polygon, centre, chakraOn, northOffset],
  );

  function buildOverlay(scale: number) {
    if (!plan) return "";
    return inner(
      overlaySvg({
        width: plan.width,
        height: plan.height,
        lang: locale,
        polygon,
        closed,
        showVertices: step === "boundary",
        centre: chakraOn ? centre : null,
        centreAuto,
        northOffset: chakraOn ? northOffset : null,
        opacity,
        zoneLines,
        zoneStatus: step === "tags" || inResults ? statusMap : undefined,
        selectedZone: step === "result" ? selected : null,
        items: step === "tags" || inResults ? items : [],
        pendingPoint: pending,
        displayScale: scale,
        box,
      }),
    );
  }

  // The object URL of a chosen plan is released when it is replaced or the page closes.
  const urlRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  function resetFor(p: Plan, f: File | null) {
    if (urlRef.current && urlRef.current !== p.url) URL.revokeObjectURL(urlRef.current);
    urlRef.current = p.url && f ? p.url : null;
    setPlan(p);
    setFile(f);
    setPolygon([]);
    setClosed(false);
    setCentre(null);
    setItems([]);
    setSavedItems(null);
    setUpload(null);
    setAnalysis(null);
    setSavedId(null);
    setError(null);
    setLow(false);
    setNotice(null);
    setStep("boundary");
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (!PLAN_IMAGE_TYPES.includes(f.type) || f.size > PLAN_IMAGE_MAX) {
      setError(t.planError);
      return;
    }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => resetFor({ url, width: img.naturalWidth, height: img.naturalHeight }, f);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError(t.planError);
    };
    img.src = url;
  }

  function onPoint(p: Pt) {
    if (step === "boundary" && !closed) setPolygon((ps) => [...ps, p]);
    else if (step === "centre") setCentre(p);
    else if (step === "tags" && centre) {
      const id = String(Date.now());
      if (!areaMode) setItems((xs) => [...xs, { id, type: itemType, kind: "point", p }]);
      else if (!pending) setPending(p);
      else {
        setItems((xs) => [...xs, { id, type: itemType, kind: "rect", a: pending, b: p }]);
        setPending(null);
      }
    } else if (step === "result" && centre) setSelected(zoneOf(angleFromCentre(p, centre, northOffset)));
  }

  function finishBoundary() {
    if (polygon.length < 3) {
      setError(t.needCorners);
      return;
    }
    setError(null);
    setClosed(true);
    setCentre(polygonCentroid(polygon));
    setStep("north");
  }

  const nudge = (dx: number, dy: number) => plan && centre && setCentre({ x: centre.x + (dx * plan.width) / 200, y: centre.y + (dy * plan.height) / 200 });
  const go = (s: Step) => {
    setPending(null);
    setError(null);
    setStep(s);
  };

  async function analyze() {
    if (!centre || !plan || busy) return;
    setBusy("analyze");
    setError(null);
    setLow(false);
    setNotice(null);
    try {
      let up = upload;
      if (!up && file) {
        up = await uploadPlanImage(file).catch(() => {
          setNotice(t.uploadWarn);
          return null;
        });
        setUpload(up);
      }
      const res = await analyzeVastu(buildAnalysisRequest({ lang: locale, propertyType, industry, northOffset, polygon, centre, items, planImageUrl: up?.url }));
      setAnalysis(res);
      setSelected(res.priorityOrder?.[0] ?? null);
      setSavedId(null);
      setStep("result");
    } catch (e) {
      if (vastuErrorKey(e) === "insufficientBalance") setLow(true);
      else setError(t.error[vastuErrorKey(e)]);
    } finally {
      setBusy("");
    }
  }

  async function save() {
    if (!analysis || busy) return;
    setBusy("save");
    setError(null);
    try {
      setSavedId(await saveVastuReport({ analysisId: analysis.analysisId, title: t.reportTitle, planImagePath: upload?.path, planImageUrl: upload?.url }));
    } catch (e) {
      setError(vastuErrorKey(e) === "failed" ? t.saveFailed : t.error[vastuErrorKey(e)]);
    } finally {
      setBusy("");
    }
  }

  async function openReport(id: string) {
    setBusy("load");
    setError(null);
    try {
      const r = await getVastuReport(id);
      const xs = r.polygon.map((p) => p.x);
      const ys = r.polygon.map((p) => p.y);
      let size = { width: Math.max(...xs) * 1.1, height: Math.max(...ys) * 1.1 };
      if (r.planImageUrl) {
        size = await new Promise((res) => {
          const img = new Image();
          img.onload = () => res({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => res(size);
          img.src = r.planImageUrl as string;
        });
      }
      setPlan({ url: r.planImageUrl, ...size });
      setFile(null);
      setPolygon(r.polygon);
      setClosed(true);
      setCentre(r.centre);
      setUpBearing(offsetToBearing(r.northOffset));
      setUpText(String(Math.round(offsetToBearing(r.northOffset))));
      setPropertyType(r.propertyType ?? "home");
      setIndustry(r.industry);
      setItems([]);
      setSavedItems(r.items ?? []);
      setAnalysis({ analysisId: r.analysisId ?? r.id, findings: r.findings ?? [], summary: r.summary ?? { en: "", hi: "" }, priorityOrder: r.priorityOrder ?? [] });
      setSelected(r.priorityOrder?.[0] ?? null);
      setSavedId(r.id);
      setStep("result");
    } catch {
      setError(t.error.load);
    } finally {
      setBusy("");
    }
  }

  // ─── Step 1: plan, property type, saved reports ───────────────────────────────
  if (step === "plan" || !plan) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="space-y-5">
            <div>
              <p className={labelCls}>{t.propertyType}</p>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((p) => (
                  <button key={p} type="button" aria-pressed={propertyType === p} className={chip(propertyType === p)} onClick={() => (setPropertyType(p), setItemType("main_door"))}>
                    {PROPERTY_LABELS[p][L]}
                  </button>
                ))}
              </div>
            </div>
            {propertyType === "industrial" && (
              <div>
                <p className={labelCls}>{t.industry}</p>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map(([id]) => (
                    <button key={id} type="button" aria-pressed={industry === id} className={chip(industry === id)} onClick={() => setIndustry(id)}>
                      {industryLabel(id, locale)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="body-6 text-ink-soft">{t.hint.plan}</p>
            <div className="flex flex-wrap gap-3">
              <label className={`${btnPrimary} cursor-pointer`}>
                <PiImage className="h-5 w-5" aria-hidden /> {t.upload}
                <input type="file" accept={PLAN_IMAGE_TYPES.join(",")} className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
              </label>
              <button type="button" className={btnSecondary} onClick={() => resetFor({ width: 1000, height: 1000 }, null)}>
                <PiSquaresFour className="h-5 w-5" aria-hidden /> {t.blank}
              </button>
            </div>
            {error && <ErrorBox message={error} />}
            {busy === "load" && <p className="caption-2 text-ink-soft">…</p>}
          </div>
        </Card>
        <SavedReports onOpen={(id) => void openReport(id)} />
        <Disclaimers L={L} title={t.disclaimerTitle} />
      </div>
    );
  }

  const stepNav = (
    <div className="print:hidden">
      <p className="caption-4 text-brand-strong">{fill(t.stepOf, { n: index, total: STEPS.length - 1 })} · {t.step[step]}</p>
      <p className="body-6 mt-1 text-ink-soft" aria-live="polite">
        {step === "review" ? fill(t.hint.review, { cut: 70, ext: 100 }) : step === "tags" && pending ? t.tapSecondCorner : t.hint[step]}
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {stepNav}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PlanCanvas
            plan={plan}
            box={box}
            label={t.planLabel}
            onPoint={step === "boundary" || step === "centre" || step === "tags" || step === "result" ? onPoint : undefined}
            buildOverlay={buildOverlay}
          />
        </div>
        <div className="space-y-4 lg:col-span-2">
          {error && <ErrorBox message={error} />}
          {notice && <Notice>{notice}</Notice>}
          {low && <LowBalance need={price || undefined} />}

          {step === "boundary" && (
            <Card className="print:hidden">
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnSmall} disabled={!polygon.length || closed} onClick={() => setPolygon((ps) => ps.slice(0, -1))}>
                  {t.undo}
                </button>
                <button type="button" className={btnSmall} disabled={!polygon.length} onClick={() => (setPolygon([]), setClosed(false))}>
                  {t.clear}
                </button>
              </div>
            </Card>
          )}

          {step === "north" && (
            <Card className="print:hidden">
              <label htmlFor="north" className={labelCls}>
                {t.manual}
              </label>
              <input
                id="north"
                inputMode="numeric"
                maxLength={3}
                placeholder="0–359"
                value={upText}
                onChange={(e) => {
                  setUpText(e.target.value);
                  if (/^\d{1,3}$/.test(e.target.value.trim()) && Number(e.target.value) < 360) setUpBearing(Number(e.target.value));
                }}
                className={inputCls}
              />
              <p className="caption-2 mt-2 text-ink-soft">{t.manualHint}</p>
              <p className="caption-2 mt-1 text-ink-muted">{t.noCompass}</p>
              {!upValid && <p role="alert" className="caption-2 mt-2 text-danger">{t.invalidDegrees}</p>}
            </Card>
          )}

          {step === "centre" && centre && centreAuto && plan && (
            <Card className="print:hidden">
              <div className="flex flex-wrap gap-2">
                {([["↑", 0, -1], ["↓", 0, 1], ["←", -1, 0], ["→", 1, 0]] as const).map(([a, dx, dy]) => (
                  <button key={a} type="button" className={btnSmall} aria-label={a} onClick={() => nudge(dx, dy)}>
                    {a}
                  </button>
                ))}
                <button type="button" className={btnSmall} onClick={() => setCentre(centreAuto)}>
                  {t.resetCentre}
                </button>
              </div>
              <p className="caption-2 mt-2 text-ink-soft">
                {fill(t.centreMoved, { d: Math.round((Math.hypot(centre.x - centreAuto.x, centre.y - centreAuto.y) / Math.max(plan.width, plan.height)) * 1000) / 10 })}
              </p>
            </Card>
          )}

          {(step === "tags" || step === "result") && (
            <Card className="print:hidden">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <label className="flex items-center gap-2">
                  <span className="caption-1 text-ink-soft">{t.opacity}</span>
                  <input type="range" min={0.2} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={zoneLines} onChange={(e) => setZoneLines(e.target.checked)} />
                  <span className="caption-1 text-ink-soft">{t.zoneLines}</span>
                </label>
              </div>
            </Card>
          )}

          {step === "tags" && (
            <Card title={t.step.tags} className="print:hidden">
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                {itemTypesFor(propertyType).map((id) => (
                  <button key={id} type="button" aria-pressed={itemType === id} className={chip(itemType === id)} onClick={() => setItemType(id)}>
                    {itemLabel(id, locale)}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" aria-pressed={!areaMode} className={chip(!areaMode)} onClick={() => (setAreaMode(false), setPending(null))}>
                  {t.marker}
                </button>
                <button type="button" aria-pressed={areaMode} className={chip(areaMode)} onClick={() => setAreaMode(true)}>
                  {t.area}
                </button>
              </div>
              {items.length === 0 ? (
                <p className="caption-2 mt-3 text-ink-muted">{t.noItems}</p>
              ) : (
                <ol className="mt-3 divide-y divide-line">
                  {items.map((it, i) => (
                    <li key={it.id} className="flex items-center justify-between gap-2 py-2">
                      <span className="body-6 min-w-0 text-ink">
                        {i + 1}. {itemLabel(it.type, locale)}
                        {placed[i] && <span className="text-ink-soft"> · {placed[i].zone}</span>}
                      </span>
                      <button type="button" className={btnSmall} aria-label={`${t.remove} ${i + 1}`} onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))}>
                        <PiTrash className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          )}

          {step === "review" && (
            <>
              <CoverageCard coverage={coverage} L={L} />
              <Card className="print:hidden">
                {price > 0 ? <p className="body-6 text-ink-soft">{fill(t.priceLine, { points: price })}</p> : <p className="body-6 text-ink-soft">{t.freeLine}</p>}
                <button type="button" className={`${btnPrimary} mt-3`} disabled={busy === "analyze"} onClick={() => void analyze()}>
                  {busy === "analyze" ? t.analyzing : price > 0 ? fill(t.analyzePaid, { points: price }) : t.analyze}
                </button>
              </Card>
            </>
          )}

          {step === "result" && analysis && (
            <ResultPanel
              analysis={analysis}
              coverage={coverage}
              placed={placed}
              entrances={entrances}
              propertyType={propertyType}
              selected={selected}
              onSelect={setSelected}
              savedId={savedId}
              busy={busy === "save"}
              onSave={() => void save()}
              L={L}
            />
          )}

          <div className="flex flex-wrap gap-2 print:hidden">
            {step !== "result" ? (
              <>
                <button type="button" className={btnSecondary} onClick={() => (index <= 1 ? (setPlan(null), setStep("plan")) : go(STEPS[index - 1]))}>
                  <PiArrowLeft className="h-4 w-4" aria-hidden /> {t.back}
                </button>
                {step === "boundary" && !closed && (
                  <button type="button" className={btnPrimary} onClick={finishBoundary}>
                    {t.done} <PiCheck className="h-4 w-4" aria-hidden />
                  </button>
                )}
                {step !== "boundary" && step !== "review" && (
                  <button type="button" className={btnPrimary} disabled={step === "north" && !upValid} onClick={() => go(STEPS[index + 1])}>
                    {t.next} <PiArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" className={btnSecondary} onClick={() => window.print()}>
                  <PiPrinter className="h-4 w-4" aria-hidden /> {t.printBtn}
                </button>
                <button type="button" className={btnSecondary} onClick={() => (setPlan(null), setStep("plan"))}>
                  {t.newPlan}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {step === "result" && <Disclaimers L={L} title={t.disclaimerTitle} />}
    </div>
  );
}

function Disclaimers({ L, title }: { L: number; title: string }) {
  return (
    <Card title={title}>
      <ul className="list-disc space-y-1 pl-5">
        {DISCLAIMERS.map((d, i) => (
          <li key={i} className="caption-1 text-ink-soft">
            {d[L]}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function CoverageCard({ coverage, L }: { coverage: ReturnType<typeof zoneCoverage>; L: number }) {
  const t = useT(text);
  const flagged = coverage.filter((z) => z.status !== "ok");
  return (
    <Card title={t.cutsAndExtensions}>
      {flagged.length === 0 ? (
        <p className="body-6 text-ink-soft">{t.status.ok}</p>
      ) : (
        <ul className="divide-y divide-line">
          {flagged.map((z) => (
            <li key={z.zone} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
              <span className="body-5 text-ink">
                {z.zone} · {ZONES[z.zone].name[L]}
              </span>
              <span className={`caption-3 rounded-full px-2 py-0.5 ${z.status === "cut" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}`}>
                {t.status[z.status]} · {z.coveragePct}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const VERDICT_TONE: Record<Finding["verdict"], string> = {
  good: "bg-success-soft text-success",
  bad: "bg-danger-soft text-danger",
  mixed: "bg-warning-soft text-warning",
  neutral: "bg-surface-sunken text-ink-soft",
};

function ResultPanel({
  analysis,
  coverage,
  placed,
  entrances,
  propertyType,
  selected,
  onSelect,
  savedId,
  busy,
  onSave,
  L,
}: {
  analysis: Analysis;
  coverage: ReturnType<typeof zoneCoverage>;
  placed: PlacedItem[];
  entrances: PlacedItem[];
  propertyType: PropertyType;
  selected: ZoneId | null;
  onSelect: (z: ZoneId) => void;
  savedId: string | null;
  busy: boolean;
  onSave: () => void;
  L: number;
}) {
  const t = useT(text);
  const lang = L === 1 ? "hi" : "en";
  const byZone = new Map(analysis.findings.map((f) => [f.zone, f]));
  const sel = selected ? byZone.get(selected) : undefined;
  const ordered = [...analysis.findings].sort((a, b) => a.priority - b.priority);
  const summary = analysis.summary?.[lang];

  return (
    <>
      {summary && (
        <Card title={t.summary}>
          <p className="body-6 text-ink">{summary}</p>
          {analysis.priorityOrder?.length > 0 && (
            <p className="caption-2 mt-3 text-ink-soft">
              {t.priority}: {analysis.priorityOrder.slice(0, 5).join(" › ")}
            </p>
          )}
        </Card>
      )}

      <Card title={selected ? `${selected} · ${ZONES[selected].name[L]}` : t.found}>
        {!selected ? (
          <p className="body-6 text-ink-soft">{t.tapZone}</p>
        ) : (
          <div className="space-y-3">
            <p className="caption-2 text-ink-soft">
              {zonePurpose(selected, propertyType)[L]} · {ELEMENTS[ZONES[selected].element][L]}
            </p>
            {sel ? <FindingBody f={sel} lang={lang} /> : <p className="body-6 text-ink-soft">{t.verdict.neutral}</p>}
          </div>
        )}
      </Card>

      <Card title={t.zoneTable}>
        <div className="flex flex-wrap gap-1.5">
          {coverage.map((z) => {
            const f = byZone.get(z.zone);
            return (
              <button
                key={z.zone}
                type="button"
                aria-pressed={selected === z.zone}
                onClick={() => onSelect(z.zone)}
                className={`caption-3 rounded-lg border px-2 py-1 transition ${selected === z.zone ? "border-ink" : "border-line"} ${f ? VERDICT_TONE[f.verdict] : "bg-surface-card text-ink-soft"}`}
              >
                {z.zone}
              </button>
            );
          })}
        </div>
      </Card>

      {placed.length > 0 && (
        <Card title={t.itemsHead}>
          <ul className="divide-y divide-line">
            {placed.map((p, i) => (
              <li key={i} className="py-2">
                <p className="body-5 text-ink">
                  {i + 1}. {p.label || itemLabel(p.type, lang)} · {p.zone}
                </p>
                {p.pada && padaInfo(p.pada) && (
                  <p className="caption-2 text-ink-soft">
                    {t.entrance}: {padaInfo(p.pada)!.id} {padaInfo(p.pada)!.devta[L]} ({t.pada[padaInfo(p.pada)!.verdict]}), {padaInfo(p.pada)!.effect[L]}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {entrances.length === 0 && <p className="caption-2 mt-2 text-ink-muted">{t.noEntrance}</p>}
        </Card>
      )}

      {ordered.length > 0 && (
        <Card title={t.remediesByPriority}>
          <ol className="space-y-4">
            {ordered.map((f) => (
              <li key={f.zone}>
                <button type="button" className="title-4 text-left text-ink underline-offset-2 hover:underline" onClick={() => onSelect(f.zone)}>
                  {f.priority}. {f.zone} · {ZONES[f.zone].name[L]}
                </button>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {f.remedies.map((r, i) => (
                    <li key={i} className="body-6 text-ink-soft">
                      {r[lang]}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="print:hidden">
        {savedId ? (
          <p role="status" className="body-6 flex items-center gap-2 rounded-2xl bg-success-soft p-3 text-success">
            <PiCheck className="h-4 w-4" aria-hidden /> {t.saved}
          </p>
        ) : (
          <button type="button" className={btnSecondary} disabled={busy} onClick={onSave}>
            {t.saveBtn}
          </button>
        )}
      </div>
    </>
  );
}

function FindingBody({ f, lang }: { f: Finding; lang: "hi" | "en" }) {
  const t = useT(text);
  return (
    <>
      <p className="flex items-center gap-2">
        <span className={`caption-3 rounded-full px-2 py-0.5 ${VERDICT_TONE[f.verdict]}`}>{t.verdict[f.verdict]}</span>
      </p>
      <div>
        <p className="title-4 text-ink">{t.impact}</p>
        <p className="body-6 text-ink-soft">{f.impact[lang]}</p>
      </div>
      {f.remedies.length > 0 && (
        <div>
          <p className="title-4 text-ink">{t.remedies}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {f.remedies.map((r, i) => (
              <li key={i} className="body-6 text-ink-soft">
                {r[lang]}
                {r.type && remedyInfo(r.type) && <span className="caption-2 text-ink-muted"> ({remedyInfo(r.type)!.label[lang === "hi" ? 1 : 0]})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function SavedReports({ onOpen }: { onOpen: (id: string) => void }) {
  const t = useT(text);
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ReportSummary[] | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(offset: number) {
    setBusy(true);
    setError(null);
    try {
      const page = await listVastuReports(offset);
      setRows((r) => (offset ? [...(r ?? []), ...page.reports] : page.reports));
      setMore(page.hasMore);
    } catch (e) {
      setError(toolErrorText(e, locale));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title={t.reports}
      action={
        <button
          type="button"
          className={btnSmall}
          aria-expanded={open}
          onClick={() => {
            setOpen((o) => !o);
            if (!rows && !busy) void load(0);
          }}
        >
          {t.history}
        </button>
      }
    >
      {open && (
        <div className="space-y-3" aria-live="polite">
          {error && <ErrorBox message={error} onRetry={() => void load(0)} />}
          {rows && rows.length === 0 && <p className="body-6 text-ink-soft">{t.historyEmpty}</p>}
          {rows && rows.length > 0 && (
            <ul className="divide-y divide-line">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="body-5 text-ink">{r.title || t.reportTitle}</p>
                    <p className="caption-2 text-ink-soft">{new Date(r.createdAt).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <button type="button" className={btnSmall} onClick={() => onOpen(r.id)}>
                    {t.open}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {more && (
            <button type="button" className={btnSmall} disabled={busy} onClick={() => void load(rows?.length ?? 0)}>
              {t.loadMore}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
