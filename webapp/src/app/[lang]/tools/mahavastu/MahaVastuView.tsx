"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PiArrowLeft, PiArrowRight, PiCheck, PiPrinter, PiTrash } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale } from "@/i18n/LocaleProvider";
import {
  EMPTY_CONSULTANT,
  consultantOf,
  deleteProject,
  lastProject,
  listProjects,
  loadProject,
  photoDataUrl,
  saveAnalysis,
  saveProject,
  type IndexEntry,
} from "@/lib/services/toolsBMahavastu";
import type { SavedResult } from "@/lib/services/toolsBSaved";
import { bi, setLang } from "@/lib/vastu/mahavastu/bi";
import {
  ITEMS,
  ITEM,
  MARKER_HIT,
  RCOL,
  RL,
  Z,
  analyse,
  blank,
  devtas,
  dialSvg,
  itemL,
  newUid,
  planGeom,
  planSvg,
  rateItem,
  sampleProject,
  scoreColor,
  short,
  zh,
  zoneArea,
  type Consultant,
  type Cut,
  type Project,
  type Rate,
} from "@/lib/vastu/mahavastu/engine";
import { Card, Notice, btnPrimary, btnSecondary, btnSmall, inputCls, labelCls } from "../../kundli/_components/ui";
import SavedList from "../_b/SavedList";
import { Gate, ToolPage } from "../_b/shell";
import PlanCanvas from "../vastu/PlanCanvas";

// MahaVastu analyser for astrologers: the app's own engine (project -> plan and chakra -> site survey -> 45-devta
// score -> report). Its text comes in the page's language through the same [en, hi] pairs the app uses (bi).

const STEPS: [string, string][] = [
  ["Project", "परियोजना"],
  ["Plan & chakra", "नक्शा व चक्र"],
  ["Site survey", "स्थल सर्वे"],
  ["45-devta score", "45 देवता स्कोर"],
  ["Report", "रिपोर्ट"],
];
const CUTS: [Cut, string, string][] = [
  ["none", "Normal", "सामान्य"],
  ["cut", "Cut", "कटा हुआ"],
  ["ext", "Extended", "विस्तार"],
];
const UPS: [number, string, string][] = [
  [0, "North up", "ऊपर उत्तर"],
  [90, "East up", "ऊपर पूर्व"],
  [180, "South up", "ऊपर दक्षिण"],
  [270, "West up", "ऊपर पश्चिम"],
];
const chip = (active: boolean) =>
  `button-sm rounded-full border px-3 py-1.5 transition active:scale-98 ${
    active ? "border-ink bg-surface-inverse text-ink-inverse on-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"
  }`;
const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const RATE_TONE: Record<Rate, string> = { g: "bg-success-soft text-success", o: "bg-warning-soft text-warning", b: "bg-danger-soft text-danger", x: "bg-danger-soft text-danger" };

export default function MahaVastuView() {
  const locale = useLocale();
  setLang(locale);
  return (
    <ToolPage eyebrow="Vastu" title={bi("Vastu Chakra (MahaVastu)", "वास्तु चक्र (महावास्तु)")} intro={bi("Place rooms and equipment on the plan, fill in the site survey and get the 45-devta score with doshas and remedies. Projects stay in this browser.", "नक्शे पर कक्ष और उपकरण रखें, स्थल सर्वे भरें और 45 देवताओं का स्कोर, दोष और उपाय पाएं। परियोजनाएँ इसी ब्राउज़र में रहती हैं।")}>
      <Gate what={bi("MahaVastu", "महावास्तु")} astrologerOnly>
        <Project_ />
      </Gate>
    </ToolPage>
  );
}

type Ui = { armed: string | null; sel: string | null; filter: "all" | "bad"; open: number | null; chakra: boolean; grid: boolean; names: boolean };
const UI0: Ui = { armed: null, sel: null, filter: "all", open: null, chakra: true, grid: true, names: false };

function Project_() {
  const locale = useLocale();
  setLang(locale);
  const { session } = useAuth();
  const scope = session?.user.id ?? "guest";
  const [P, setP] = useState<Project | null>(() => lastProject(scope) ?? blank(consultantOf(scope)));
  const [step, setStep] = useState(1);
  const [ui, setUi] = useState<Ui>(UI0);
  const [projects, setProjects] = useState<IndexEntry[]>(() => listProjects(scope));
  const [storeFull, setStoreFull] = useState(false);
  const [sent, setSent] = useState<"" | "busy" | "done" | "failed">("");
  const dirty = useRef(false);
  const unnamed = bi("Untitled", "बिना नाम");

  const fresh = useCallback(() => blank(consultantOf(scope)), [scope]);

  // Autosave 400 ms after an edit, as the app does.
  useEffect(() => {
    if (!P || !dirty.current) return;
    const id = setTimeout(() => {
      setStoreFull(!saveProject(scope, P, unnamed));
      setProjects(listProjects(scope));
    }, 400);
    return () => clearTimeout(id);
  }, [P, scope, unnamed]);

  const edit = useCallback((patch: Partial<Project> | ((p: Project) => Project)) => {
    dirty.current = true;
    setSent("");
    setP((p) => (p ? (typeof patch === "function" ? patch(p) : { ...p, ...patch }) : p));
  }, []);

  function load(p: Project) {
    dirty.current = false;
    setP(p);
    setUi(UI0);
    setSent("");
    setStep(1);
  }

  function openSaved(s: SavedResult<unknown, Project>) {
    if (s.input && Array.isArray(s.input.items)) load({ ...blank(consultantOf(scope)), ...s.input, img: null, id: "p" + Date.now().toString(36) });
  }

  if (!P) return null;
  const typeL = P.type === "res" ? bi("Residential", "आवासीय") : bi("Industrial", "औद्योगिक");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="title-3 min-w-0 break-words text-ink">
          {(P.name || bi("New project", "नई परियोजना")) + " · " + typeL}
        </p>
        <div className="flex gap-2">
          <button type="button" className={btnSmall} onClick={() => load(fresh())}>
            {bi("New project", "नई परियोजना")}
          </button>
        </div>
      </div>
      <nav className="print:hidden" aria-label={bi("Steps", "चरण")}>
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {STEPS.map(([en, hi], i) => (
            <li key={en}>
              <button type="button" aria-current={step === i + 1 ? "step" : undefined} className={`${chip(step === i + 1)} whitespace-nowrap`} onClick={() => setStep(i + 1)}>
                {i + 1}. {bi(en, hi)}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {storeFull && <Notice tone="warning">{bi("The plan photo is too large to keep in this browser. Add a smaller photo.", "फ़ोटो बड़ी है, इस ब्राउज़र में सहेजी नहीं जा सकी। छोटी फ़ोटो लगाएँ।")}</Notice>}

      {step === 1 && <ProjectStep P={P} edit={edit} setUi={setUi} go={setStep} onSample={() => load({ ...sampleProject(consultantOf(scope)) })} />}
      {step === 2 && <PlanStep P={P} edit={edit} ui={ui} setUi={setUi} go={setStep} />}
      {step === 3 && <SurveyStep P={P} edit={edit} go={setStep} />}
      {step === 4 && <ScoreStep P={P} edit={edit} ui={ui} setUi={setUi} go={setStep} />}
      {step === 5 && (
        <ReportStep
          P={P}
          edit={edit}
          go={setStep}
          sent={sent}
          onSend={async () => {
            setSent("busy");
            setSent((await saveAnalysis(P)) ? "done" : "failed");
          }}
        />
      )}

      <Projects
        projects={projects}
        scope={scope}
        current={P.id}
        onOpen={(id) => {
          const p = loadProject(scope, id);
          if (p) load(p);
        }}
        onDelete={(id) => {
          deleteProject(scope, id);
          setProjects(listProjects(scope));
        }}
        locale={locale}
      />
      <SavedList<unknown, Project> tool="mahavastu_analyser" onOpen={openSaved} />
      <p className="caption-5 text-ink-muted print:hidden">
        {bi(
          "Traditional Vastu guidance, not engineering, legal or medical advice. Do not make structural changes without a professional.",
          "यह पारंपरिक वास्तु मार्गदर्शन है, इंजीनियरिंग, क़ानूनी या चिकित्सीय सलाह नहीं। किसी विशेषज्ञ के बिना संरचनात्मक बदलाव न करें।",
        )}
      </p>
    </div>
  );
}

type Edit = (patch: Partial<Project> | ((p: Project) => Project)) => void;

function Nav({ back, next, label }: { back?: () => void; next?: () => void; label?: string }) {
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      {back && (
        <button type="button" className={btnSecondary} onClick={back}>
          <PiArrowLeft className="h-4 w-4" aria-hidden /> {bi("Back", "पीछे")}
        </button>
      )}
      {next && (
        <button type="button" className={btnPrimary} onClick={next}>
          {label ?? bi("Next", "आगे")} <PiArrowRight className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

function Field({ id, label, value, onChange, multiline, type = "text" }: { id: string; label: string; value: string; onChange: (v: string) => void; multiline?: boolean; type?: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {multiline ? (
        <textarea id={id} rows={4} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      ) : (
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      )}
    </div>
  );
}

/** A plot size: a value that is not above 0 is ignored while the typed text stays. */
function NumField({ id, label, value, onValid }: { id: string; label: string; value: number; onValid: (v: number) => void }) {
  const [text, setText] = useState(String(value));
  return (
    <Field
      id={id}
      label={label}
      value={text}
      onChange={(v) => {
        setText(v);
        const n = parseFloat(v);
        if (n > 0) onValid(n);
      }}
    />
  );
}

function ProjectStep({ P, edit, setUi, go, onSample }: { P: Project; edit: Edit; setUi: React.Dispatch<React.SetStateAction<Ui>>; go: (n: number) => void; onSample: () => void }) {
  return (
    <div className="space-y-4">
      <Card title={bi("Project details", "परियोजना विवरण")} description={bi("Residential or industrial decides which rooms and equipment you can place and which result rules apply.", "आवासीय या औद्योगिक से तय होता है कि कौन से कक्ष/उपकरण रखे जा सकते हैं और कौन से फल-नियम लगते हैं।")}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {([["res", "Residential", "आवासीय"], ["ind", "Industrial / commercial", "औद्योगिक / वाणिज्यिक"]] as const).map(([v, en, hi]) => (
              <button
                key={v}
                type="button"
                aria-pressed={P.type === v}
                className={chip(P.type === v)}
                onClick={() => {
                  edit({ type: v });
                  setUi((o) => ({ ...o, armed: null }));
                }}
              >
                {bi(en, hi)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field id="mv-name" label={bi("Project name", "परियोजना का नाम")} value={P.name} onChange={(v) => edit({ name: v })} />
            <Field id="mv-client" label={bi("Client name", "जातक / क्लाइंट का नाम")} value={P.client} onChange={(v) => edit({ client: v })} />
            <Field id="mv-addr" label={bi("Address / location", "पता / स्थान")} value={P.addr} onChange={(v) => edit({ addr: v })} />
            <Field id="mv-date" type="date" label={bi("Survey date", "सर्वे तिथि")} value={P.date} onChange={(v) => edit({ date: v })} />
            <NumField key={P.id + "W"} id="mv-w" label={bi("Plot width (left to right on the plan)", "प्लॉट चौड़ाई (नक्शे में बाएँ से दाएँ)")} value={P.W} onValid={(v) => edit({ W: v })} />
            <NumField key={P.id + "D"} id="mv-d" label={bi("Plot depth (top to bottom on the plan)", "प्लॉट गहराई (नक्शे में ऊपर से नीचे)")} value={P.D} onValid={(v) => edit({ D: v })} />
            <div>
              <p className={labelCls}>{bi("Unit", "इकाई")}</p>
              <div className="flex gap-2">
                {([["फीट", "Feet", "फीट"], ["मीटर", "Metres", "मीटर"]] as const).map(([v, en, hi]) => (
                  <button key={v} type="button" aria-pressed={P.unit === v} className={chip(P.unit === v)} onClick={() => edit({ unit: v })}>
                    {bi(en, hi)}
                  </button>
                ))}
              </div>
            </div>
            <Field id="mv-use" label={bi("Industry / building use", "उद्योग / भवन उपयोग विवरण")} value={P.use} onChange={(v) => edit({ use: v })} />
          </div>
        </div>
      </Card>
      <div className="flex flex-wrap gap-3">
        <button type="button" className={btnSecondary} onClick={onSample}>
          {bi("Open a sample project", "नमूना परियोजना खोलें")}
        </button>
        <button type="button" className={btnPrimary} onClick={() => go(2)}>
          {bi("Draw the plan", "नक्शा बनाएँ")} <PiArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function PlanStep({ P, edit, ui, setUi, go }: { P: Project; edit: Edit; ui: Ui; setUi: React.Dispatch<React.SetStateAction<Ui>>; go: (n: number) => void }) {
  const g = planGeom(P);
  const box = useMemo(() => ({ x: g.w / 2 - g.V, y: g.h / 2 - g.V, w: 2 * g.V, h: 2 * g.V }), [g.w, g.h, g.V]);
  const [photoError, setPhotoError] = useState(false);
  const [readout, setReadout] = useState("");
  const plotOnly = useMemo(() => ({ ...P, items: [] as Project["items"] }), [P]);

  // The plan's own markers are drawn by the engine; the plot's centre is the SVG's origin, the canvas's origin is its corner.
  const buildOverlay = () =>
    `<g transform="translate(${g.w / 2},${g.h / 2})">${inner(planSvg({ ...P, items: P.items }, { chakra: ui.chakra, grid: ui.grid, names: ui.names, sel: ui.sel }))}</g>`;
  void plotOnly;

  function onPoint(pt: { x: number; y: number }) {
    const hit = [...P.items].reverse().find((it) => Math.hypot(it.x * g.s - pt.x, it.y * g.s - pt.y) <= MARKER_HIT);
    if (hit) {
      setUi((o) => ({ ...o, sel: hit.uid }));
      flash(hit);
      return;
    }
    const x = +Math.min(P.W, Math.max(0, pt.x / g.s)).toFixed(2);
    const y = +Math.min(P.D, Math.max(0, pt.y / g.s)).toFixed(2);
    const inside = pt.x >= 0 && pt.x <= g.w && pt.y >= 0 && pt.y <= g.h;
    if (ui.armed && inside) {
      const it = { uid: newUid(), t: ui.armed, x, y };
      edit((p) => ({ ...p, items: [...p.items, it] }));
      setUi((o) => ({ ...o, sel: it.uid }));
      flash(it);
    } else setUi((o) => ({ ...o, sel: null }));
  }
  function flash(it: Project["items"][number]) {
    const m = rateItem(P, it);
    if (m) setReadout(`${itemL(m.def)}: ${m.L.center ? bi("Brahmasthan", "ब्रह्मस्थान") : zh(m.L.zone)} · ${m.L.deg.toFixed(0)}° · ${bi("pada", "पद")} ${short(m.L.dev)}`);
  }

  const setUp = (v: number | string) => edit({ up: (((parseFloat(String(v)) || 0) % 360) + 360) % 360 });
  const sel = P.items.find((i) => i.uid === ui.sel);
  const m = sel && rateItem(P, sel);
  const armed = ui.armed ? ITEM[ui.armed] : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <PlanCanvas plan={{ url: P.img ?? undefined, width: g.w, height: g.h }} box={box} label={bi("Plot plan", "प्लॉट का नक्शा")} onPoint={onPoint} buildOverlay={buildOverlay} />
        <p className="caption-2 mt-2 min-h-5 text-ink-soft" aria-live="polite">
          {readout}
        </p>
      </div>
      <div className="space-y-4 lg:col-span-2 print:hidden">
        <Card title={bi("Place rooms / equipment", "कक्ष / उपकरण रखें")}>
          <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
            {ITEMS.filter((i) => i.sc === "both" || i.sc === P.type).map((i) => (
              <button key={i.id} type="button" aria-pressed={ui.armed === i.id} className={chip(ui.armed === i.id)} onClick={() => setUi((o) => ({ ...o, armed: o.armed === i.id ? null : i.id }))}>
                {itemL(i)}
              </button>
            ))}
          </div>
          <p className="caption-2 mt-3 text-ink-soft" aria-live="polite">
            {armed ? bi(`Now click on the plan where the “${itemL(armed)}” goes.`, `अब नक्शे पर “${itemL(armed)}” का स्थान क्लिक करें।`) : bi("Pick an item, or click a placed marker to select it.", "कोई वस्तु चुनें, या रखे चिह्न पर क्लिक कर उसे चुनें।")}
          </p>
          {m && sel && (
            <div className="mt-3 space-y-1 rounded-2xl bg-surface-sunken p-3">
              <p className="flex flex-wrap items-center gap-2">
                <span className="title-4 text-ink">{itemL(m.def)}</span>
                <Pill r={m.r} />
              </p>
              <p className="body-6 text-ink">
                {bi("Zone", "जोन")}: {m.L.center ? bi("Brahmasthan", "ब्रह्मस्थान") : `${zh(m.L.zone)} (${m.L.zone})`} · {m.L.deg.toFixed(1)}°
              </p>
              <p className="body-6 text-ink">
                {bi("Pada devta", "पद देवता")}: {short(m.L.dev)}
              </p>
              {m.def.g.length > 0 && m.r !== "g" && (
                <p className="caption-2 text-ink-soft">
                  {bi("Right zones", "उचित जोन")}: {m.def.g.filter((z) => z !== "C").map(zh).join(", ")}
                </p>
              )}
              <button
                type="button"
                className={btnSmall}
                onClick={() => {
                  edit((p) => ({ ...p, items: p.items.filter((i) => i.uid !== sel.uid) }));
                  setUi((o) => ({ ...o, sel: null }));
                }}
              >
                <PiTrash className="h-4 w-4" aria-hidden /> {bi("Remove", "हटाएँ")}
              </button>
            </div>
          )}
        </Card>

        <Card title={bi("North direction", "उत्तर दिशा")}>
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={359} step={0.5} value={P.up} aria-label={bi("Compass degree at the top of the plan", "नक्शे के ऊपर की दिशा की कम्पास डिग्री")} onChange={(e) => setUp(e.target.value)} className="h-2 min-w-0 flex-1 accent-brand" />
            <div className="w-24 shrink-0">
              <input inputMode="decimal" aria-label={bi("Degrees", "डिग्री")} value={Math.round(P.up * 10) / 10} onChange={(e) => setUp(e.target.value)} className={inputCls} />
            </div>
          </div>
          <p className="caption-2 mt-2 text-ink-soft">{bi("Enter the compass reading for the top of the plan. 0° means the top is true north.", "नक्शे की ऊपर वाली दिशा में कम्पास जो डिग्री दिखाए, वह डालें। 0° यानी ऊपर ही सत्य उत्तर।")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {UPS.map(([v, en, hi]) => (
              <button key={v} type="button" className={btnSmall} onClick={() => setUp(v)}>
                {bi(en, hi)}
              </button>
            ))}
          </div>
        </Card>

        <Card title={bi("View", "दृश्य")}>
          <div className="space-y-2">
            {([["chakra", "16-zone chakra", "16 जोन चक्र"], ["grid", "9×9 padas", "9×9 पद"], ["names", "Devta names", "देवता नाम"]] as const).map(([k, en, hi]) => (
              <label key={k} className="flex items-center gap-2">
                <input type="checkbox" checked={ui[k]} onChange={(e) => setUi((o) => ({ ...o, [k]: e.target.checked }))} />
                <span className="body-6 text-ink">{bi(en, hi)}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className={`${btnSmall} cursor-pointer`}>
              {bi("Add a photo of the plan", "नक्शे की फ़ोटो लगाएँ")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setPhotoError(false);
                  try {
                    edit({ img: await photoDataUrl(f) });
                  } catch {
                    setPhotoError(true);
                  }
                }}
              />
            </label>
            {P.img && (
              <button type="button" className={btnSmall} onClick={() => edit({ img: null })}>
                {bi("Remove photo", "फ़ोटो हटाएँ")}
              </button>
            )}
          </div>
          {photoError && <p role="alert" className="caption-2 mt-2 text-danger">{bi("This image could not be opened.", "यह फ़ोटो नहीं खुल सकी।")}</p>}
          {P.img && (
            <label className="mt-3 flex items-center gap-2">
              <span className="caption-1 text-ink-soft">{bi("Opacity", "पारदर्शिता")}</span>
              <input type="range" min={0.1} max={1} step={0.05} value={P.imgOp} onChange={(e) => edit({ imgOp: Number(e.target.value) })} />
            </label>
          )}
          <p className="caption-2 mt-2 text-ink-muted">{bi("Crop the photo to the plot's outer walls so it lines up with the rectangle.", "फ़ोटो को प्लॉट की बाहरी दीवार तक क्रॉप करके लगाएँ, ताकि वह आयत से मेल खाए।")}</p>
        </Card>
        <Nav back={() => go(1)} next={() => go(3)} label={bi("Site survey", "स्थल सर्वे")} />
      </div>
    </div>
  );
}

function Pill({ r }: { r: Rate }) {
  return <span className={`caption-3 rounded-full px-2 py-0.5 ${RATE_TONE[r]}`}>{bi(RL[r])}</span>;
}

function SurveyStep({ P, edit, go }: { P: Project; edit: Edit; go: (n: number) => void }) {
  return (
    <div className="space-y-4">
      <Card
        title={bi("16 zones: cuts / extensions", "16 जोन: कटाव / विस्तार")}
        description={bi("Record cuts or extensions in each zone, the land slope, road vedha and load checks. These feed straight into the scores of the devtas concerned.", "प्रत्येक जोन में कटाव या विस्तार, भूमि का ढाल, मार्ग-वेध और भार की जाँच दर्ज करें। ये सीधे सम्बन्धित देवताओं के स्कोर में जुड़ते हैं।")}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Z.map((z) => (
            <div key={z} className="rounded-xl border border-line p-3">
              <p className="title-4 text-ink">{z}</p>
              <p className="caption-2 text-ink-soft">
                {zh(z)} · {zoneArea(z)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CUTS.map(([v, en, hi]) => (
                  <button key={v} type="button" aria-pressed={P.cuts[z] === v} className={chip(P.cuts[z] === v)} onClick={() => edit((p) => ({ ...p, cuts: { ...p.cuts, [z]: v } }))}>
                    {bi(en, hi)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select id="mv-slope" label={bi("Which way does the land slope?", "भूमि का ढाल किस ओर है")} value={P.slope} none={bi("Level / not applicable", "समतल / लागू नहीं")} onChange={(v) => edit({ slope: v as Project["slope"] })} />
            <Select id="mv-veedh" label={bi("Road vedha (T-point / road hitting the plot)", "मार्ग-वेध (T-पॉइंट / सड़क प्रहार)")} value={P.veedh} none={bi("No road vedha", "कोई वेध नहीं")} onChange={(v) => edit({ veedh: v as Project["veedh"] })} />
          </div>
          {([
            ["brahma", "Load on the Brahmasthan: pillar, stairs, tank, heavy puja room or machine", "ब्रह्मस्थान पर भार: स्तम्भ, सीढ़ी, टंकी, भारी पूजा-घर या मशीन"],
            ["neHeavy", "The North-East (NE) is higher or heavier than the South-West (SW), or upper-floor load sits on NE", "ईशान (NE) भाग नैऋत्य (SW) से ऊँचा या भारी है, या ऊपरी तल का भार NE पर"],
            ["fireWater", "Fire (stove/boiler) and water (sink/tank) in one line, very close together", "अग्नि (चूल्हा/बॉयलर) और जल (सिंक/टंकी) एक ही सीध में, अत्यन्त पास"],
          ] as const).map(([k, en, hi]) => (
            <label key={k} className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={!!P[k]} onChange={(e) => edit({ [k]: e.target.checked })} />
              <span className="body-6 text-ink">{bi(en, hi)}</span>
            </label>
          ))}
          <Field id="mv-notes" multiline label={bi("Surveyor's notes (these go into the report)", "सर्वेक्षक की टिप्पणी (रिपोर्ट में जाएगी)")} value={P.notes} onChange={(v) => edit({ notes: v })} />
        </div>
      </Card>
      <Nav back={() => go(2)} next={() => go(4)} label={bi("See the score", "स्कोर देखें")} />
    </div>
  );
}

function Select({ id, label, value, none, onChange }: { id: string; label: string; value: string; none: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        <option value="">{none}</option>
        {Z.map((z) => (
          <option key={z} value={z}>
            {zh(z)} ({z})
          </option>
        ))}
      </select>
    </div>
  );
}

function ScoreStep({ P, edit, ui, setUi, go }: { P: Project; edit: Edit; ui: Ui; setUi: React.Dispatch<React.SetStateAction<Ui>>; go: (n: number) => void }) {
  const A = analyse(P);
  const res = P.type === "res";
  const setOv = (id: number, v: number | null) =>
    edit((p) => {
      const ov = { ...p.ov };
      if (v === null) delete ov[id];
      else ov[id] = Math.min(5, Math.max(0, v));
      return { ...p, ov };
    });
  return (
    <div className="space-y-6">
      <Summary P={P} />
      <section aria-labelledby="mv-issues">
        <h2 id="mv-issues" className="heading-6 text-ink">
          {bi("Priority doshas and remedies", "प्राथमिक दोष व समाधान")}
        </h2>
        <p className="caption-2 mt-1 text-ink-soft">
          {bi("Order of priority: NE toilet/kitchen, load on the Brahmasthan, inauspicious entrance pada, SW cut, SE water/toilet, fire in the north.", "प्राथमिकता क्रम: NE शौच/रसोई, ब्रह्मस्थान भार, अशुभ द्वार-पद, SW कटाव, SE जल/शौच, उत्तर में अग्नि।")}
        </p>
        <ul className="mt-3 space-y-3">
          {A.issues.length ? (
            A.issues.map((i, k) => (
              <li key={k} className="rounded-2xl border border-line border-l-4 bg-surface-card p-4" style={{ borderLeftColor: RCOL[i.sev] }}>
                <p className="flex flex-wrap items-center justify-between gap-2">
                  <span className="title-4 text-ink">{i.title}</span>
                  <Pill r={i.sev} />
                </p>
                <p className="caption-1 mt-1 text-ink-soft">{i.detail}</p>
                {i.shift && <p className="body-6 mt-1 text-ink">{i.shift}</p>}
                <p className="body-6 mt-1 text-ink">
                  {bi("Remedy", "उपाय")}: {i.upay}
                </p>
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-line bg-surface-card p-4">
              <p className="title-4 text-ink">{bi("No doshas recorded", "कोई दोष दर्ज नहीं")}</p>
              <p className="caption-1 mt-1 text-ink-soft">{bi("Place rooms/equipment on the plan and fill in the site survey. Doshas will show up here in order of priority.", "नक्शे पर कक्ष/उपकरण रखें और स्थल सर्वे भरें। दोष यहाँ प्राथमिकता से दिखेंगे।")}</p>
            </li>
          )}
        </ul>
      </section>

      <section aria-labelledby="mv-devs">
        <h2 id="mv-devs" className="heading-6 text-ink">
          {bi("45 devtas: score for each", "45 देवता: विभागवार स्कोर")}
        </h2>
        <div className="mt-3 flex gap-2 print:hidden">
          <button type="button" aria-pressed={ui.filter === "all"} className={chip(ui.filter === "all")} onClick={() => setUi((o) => ({ ...o, filter: "all" }))}>
            {bi("All", "सभी")}
          </button>
          <button type="button" aria-pressed={ui.filter === "bad"} className={chip(ui.filter === "bad")} onClick={() => setUi((o) => ({ ...o, filter: "bad" }))}>
            {bi("Only with dosha", "केवल दोषयुक्त")}
          </button>
        </div>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface-card">
          {devtas()
            .filter((d) => ui.filter === "all" || A.sc[d.id] < 5)
            .map((d) => {
              const v = A.sc[d.id];
              const ov = P.ov[d.id] !== undefined && P.ov[d.id] !== null;
              const open = ui.open === d.id;
              const rows: [string, string][] = [
                [bi("Veethi", "वीथि"), d.veethi],
                [bi("Role / power", "कार्य / शक्ति"), d.karya],
                [bi("Dosha signs", "दोष संकेत"), d.dosha],
                [res ? bi("Residential effect", "आवासीय फल") : bi("Industrial effect", "औद्योगिक फल"), res ? d.res : d.ind],
                [bi("Remedy codes", "उपाय कोड"), d.upay],
              ];
              return (
                <li key={d.id}>
                  <button type="button" aria-expanded={open} className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setUi((o) => ({ ...o, open: o.open === d.id ? null : d.id }))}>
                    <span className="caption-3 w-6 shrink-0 text-ink-muted">{String(d.id).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="title-4 block text-ink">{d.name}</span>
                      <span className="caption-2 block text-ink-soft">
                        {d.zone}
                        {ov ? bi(" · adjusted by hand", " · हस्त-संशोधित") : ""}
                      </span>
                    </span>
                    <span className="hidden h-2 w-20 overflow-hidden rounded-full bg-surface-sunken sm:block" aria-hidden>
                      <span className="block h-full rounded-full" style={{ width: `${(v / 5) * 100}%`, backgroundColor: scoreColor(v) }} />
                    </span>
                    <span className="title-4 w-8 text-right text-ink">{v}</span>
                  </button>
                  {open && (
                    <div className="space-y-2 border-t border-line p-3">
                      {rows.map(([k, val]) => (
                        <div key={k}>
                          <p className="caption-2 text-ink-soft">{k}</p>
                          <p className="body-6 text-ink">{val}</p>
                        </div>
                      ))}
                      <p className="caption-2 text-ink-soft">{bi("Adjust the score after checking on site:", "स्थल पर जाँच से स्कोर बदलें:")}</p>
                      <div className="flex items-center gap-2 print:hidden">
                        <button type="button" className={btnSmall} aria-label={bi("Lower the score", "स्कोर घटाएँ")} onClick={() => setOv(d.id, v - 0.5)}>
                          −
                        </button>
                        <span className="title-4 w-10 text-center text-ink">{v}</span>
                        <button type="button" className={btnSmall} aria-label={bi("Raise the score", "स्कोर बढ़ाएँ")} onClick={() => setOv(d.id, v + 0.5)}>
                          +
                        </button>
                        {ov && (
                          <button type="button" className={btnSmall} onClick={() => setOv(d.id, null)}>
                            {bi("Auto", "स्वतः")}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
      </section>
      <Nav back={() => go(3)} next={() => go(5)} label={bi("Make the report", "रिपोर्ट बनाएँ")} />
    </div>
  );
}

function Summary({ P }: { P: Project }) {
  const A = analyse(P);
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-5">
        <div
          className="h-36 w-36 shrink-0"
          role="img"
          aria-label={`${A.total} / 225`}
          dangerouslySetInnerHTML={{ __html: dialSvg(A.total, A.grade.color, { track: "#E3E1DA", ink: "#0C2340", muted: "#667485" }) }}
        />
        <div className="min-w-0 flex-1">
          <p className="title-2" style={{ color: A.grade.color }}>
            {bi("Grade", "श्रेणी")}: {A.grade.label}
          </p>
          <p className="body-6 mt-1 text-ink-soft">
            {A.grade.note + bi(` ${A.issues.length} dosha points, ${A.goods.length} auspicious points.`, ` ${A.issues.length} दोष-बिन्दु, ${A.goods.length} शुभ-बिन्दु।`)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ReportStep({ P, edit, go, sent, onSend }: { P: Project; edit: Edit; go: (n: number) => void; sent: "" | "busy" | "done" | "failed"; onSend: () => void }) {
  const A = analyse(P);
  const locale = useLocale();
  const c = P.consultant;
  const setC = (k: keyof Consultant) => (v: string) => edit((p) => ({ ...p, consultant: { ...EMPTY_CONSULTANT, ...p.consultant, [k]: v } }));
  const g = planGeom(P);
  const planHtml = planSvg(P, { chakra: true, grid: true, names: false });
  void g;
  return (
    <div className="space-y-6">
      <Card title={bi("Report", "रिपोर्ट")} description={bi("Check the consultant details, then print or save as PDF (choose “Save as PDF” in the print window).", "परामर्शदाता विवरण जाँचें, फिर प्रिंट करें या PDF के रूप में सहेजें (प्रिंट विंडो में “Save as PDF” चुनें)।")} className="print:hidden">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field id="mv-c-name" label={bi("Consultant", "परामर्शदाता")} value={c.name} onChange={setC("name")} />
          <Field id="mv-c-title" label={bi("Title / designation", "उपाधि / पद")} value={c.title} onChange={setC("title")} />
          <Field id="mv-c-org" label={bi("Organisation", "संस्था")} value={c.org} onChange={setC("org")} />
          <Field id="mv-c-contact" label={bi("Contact", "सम्पर्क")} value={c.contact} onChange={setC("contact")} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className={btnPrimary} onClick={() => window.print()}>
            <PiPrinter className="h-5 w-5" aria-hidden /> {bi("Print / save PDF", "प्रिंट / PDF सहेजें")}
          </button>
          <button type="button" className={btnSecondary} disabled={sent === "busy" || sent === "done"} onClick={onSend}>
            {sent === "done" ? <PiCheck className="h-5 w-5" aria-hidden /> : null}
            {sent === "done" ? bi("Saved to my results", "सहेजे नतीजों में रखा गया") : bi("Save to my results", "मेरे नतीजों में सहेजें")}
          </button>
          {sent === "failed" && <span role="alert" className="caption-1 text-danger">{bi("Could not save. Try again.", "सहेजा नहीं जा सका। फिर कोशिश करें।")}</span>}
        </div>
      </Card>

      <div className="space-y-4">
        <header>
          <h2 className="heading-5 text-ink">{P.name || bi("MahaVastu report", "महावास्तु रिपोर्ट")}</h2>
          <p className="body-6 text-ink-soft">
            {[P.client, P.addr, new Date(P.date).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" }), `${P.W} × ${P.D} ${P.unit === "मीटर" ? bi("m", "मी") : bi("ft", "फीट")}`].filter(Boolean).join(" · ")}
          </p>
          {c.name && (
            <p className="caption-1 text-ink-soft">
              {[c.name, c.title, c.org, c.contact].filter(Boolean).join(" · ")}
            </p>
          )}
        </header>
        <Summary P={P} />
        <Card title={bi("Plan and chakra", "नक्शा व चक्र")}>
          <div
            className="mx-auto max-w-xl"
            role="img"
            aria-label={bi("Plot plan with the 16-zone chakra", "16 जोन चक्र के साथ प्लॉट का नक्शा")}
            dangerouslySetInnerHTML={{ __html: planHtml.replace("<svg ", '<svg style="width:100%;height:auto;background:#FFFDF8" ') }}
          />
        </Card>
        <Card title={bi("Priority doshas and remedies", "प्राथमिक दोष व समाधान")}>
          <ul className="space-y-3">
            {A.issues.map((i, k) => (
              <li key={k}>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="title-4 text-ink">{i.title}</span>
                  <Pill r={i.sev} />
                </p>
                <p className="caption-1 text-ink-soft">{i.detail}</p>
                <p className="body-6 text-ink">
                  {bi("Remedy", "उपाय")}: {i.upay}
                </p>
              </li>
            ))}
            {A.issues.length === 0 && <li className="body-6 text-ink-soft">{bi("No doshas recorded", "कोई दोष दर्ज नहीं")}</li>}
          </ul>
        </Card>
        {A.goods.length > 0 && (
          <Card title={bi("Auspicious points", "शुभ बिन्दु")}>
            <ul className="space-y-2">
              {A.goods.map((x, k) => (
                <li key={k}>
                  <p className="title-4 text-ink">{x.t}</p>
                  <p className="caption-1 text-ink-soft">{x.d}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {P.notes && (
          <Card title={bi("Surveyor's notes", "सर्वेक्षक की टिप्पणी")}>
            <p className="body-6 whitespace-pre-wrap text-ink">{P.notes}</p>
          </Card>
        )}
      </div>
      <Nav back={() => go(4)} />
    </div>
  );
}

function Projects({ projects, current, onOpen, onDelete, locale }: { projects: IndexEntry[]; scope: string; current: string; onOpen: (id: string) => void; onDelete: (id: string) => void; locale: "hi" | "en" }) {
  if (projects.length === 0) return null;
  return (
    <Card title={bi("Projects in this browser", "इस ब्राउज़र की परियोजनाएँ")} className="print:hidden">
      <ul className="divide-y divide-line">
        {projects.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="body-5 text-ink">
                {e.name} {e.id === current && <span className="caption-3 text-brand-strong">· {bi("open", "खुली")}</span>}
              </p>
              <p className="caption-2 text-ink-soft">
                {e.type === "res" ? bi("Residential", "आवासीय") : bi("Industrial", "औद्योगिक")} · {new Date(e.updated).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className={btnSmall} onClick={() => onOpen(e.id)}>
                {bi("Open", "खोलें")}
              </button>
              <button type="button" className={btnSmall} aria-label={`${bi("Delete", "हटाएँ")} ${e.name}`} onClick={() => onDelete(e.id)}>
                <PiTrash className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
