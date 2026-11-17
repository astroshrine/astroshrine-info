"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PiBuildings, PiCheck, PiHouseLine, PiPrinter } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { saveResult, type SavedResult } from "@/lib/services/toolsBSaved";
import {
  buildReport,
  clearAnswers,
  gradeOf,
  loadAnswers,
  loadMaster,
  saveAnswers,
  zoneFromDegree,
  type Answers,
  type Bucket,
  type Master,
  type PlaceKey,
  type Question,
  type Report,
} from "@/lib/services/toolsBVastuCheck";
import { Card, ErrorBox, Notice, btnPrimary, btnSecondary, btnSmall, inputCls, labelCls } from "../../kundli/_components/ui";
import SavedList from "../_b/SavedList";
import { PanelSkeleton, ToolPage } from "../_b/shell";

const text = defineMessages({
  hi: {
    eyebrow: "वास्तु",
    title: "वास्तु जाँच",
    intro: "घर या फैक्ट्री के कुछ सवालों के जवाब दें। हर ज़ोन घर या प्लॉट के केंद्र (ब्रह्मस्थान) से मापें, किसी कोने से नहीं।",
    home: "घर",
    factory: "फैक्ट्री",
    resume: (place: string) => `जारी रखें: ${place}`,
    loadFailed: "वास्तु का डेटा नहीं खुल सका। फिर कोशिश करें।",
    retry: "फिर कोशिश करें",
    required: "आवश्यक",
    pickWallFirst: "पहले दीवार चुनें।",
    padaDevta: "पद-देवता",
    useDegrees: "डिग्री से चुनें",
    degreesLabel: "कम्पास की डिग्री, उत्तर से (0 से 360)",
    degreesHint: "केंद्र में खड़े होकर उस स्थान की दिशा का कम्पास कोण लिखें। ऊपर कोई ज़ोन चुनने पर वही मान्य होगा।",
    missing: (n: number) => `* वाले ${n} आवश्यक प्रश्नों के उत्तर दें।`,
    build: "रिपोर्ट बनाएं",
    clear: "साफ़ करें",
    back: "जवाब बदलें",
    newCheck: "नई जाँच",
    print: "प्रिंट / PDF",
    report: "वास्तु जाँच",
    saved: "रिपोर्ट आपके सहेजे नतीजों में रख दी गई है।",
    sections: ["सारांश और सूचकांक", "उच्च गंभीरता के दोष", "मध्यम दोष", "मिश्रित / सावधानी", "शुभ बिंदु", "बिना तोड़फोड़ के उपाय (क्रम से)", "प्रभावित ज़ोन और देवता-मंत्र", "सूचना"],
    severity: { high: "उच्च", medium: "मध्यम", mixed: "मिश्रित", good: "शुभ" },
    grade: { excellent: "उत्तम", good: "संतोषजनक", improve: "सुधार आवश्यक", serious: "गंभीर दोष, विशेषज्ञ परामर्श लें" },
    matched: (n: number, total: number) => `${n} नियम मिले · कुल स्कोर ${total}`,
    contentNote: "जाँच की सामग्री AstroShrine वास्तु मास्टर से है, जो हिंदी में है।",
  },
  en: {
    eyebrow: "Vastu",
    title: "Vastu Check",
    intro: "Answer a few questions about a home or factory. Measure every zone from the centre (Brahmasthan) of the house or plot, not from a corner.",
    home: "Home",
    factory: "Factory",
    resume: (place) => `Resume: ${place}`,
    loadFailed: "The Vastu data could not be opened. Try again.",
    retry: "Try again",
    required: "Required",
    pickWallFirst: "Pick the wall first.",
    padaDevta: "Pada devta",
    useDegrees: "Pick by degrees",
    degreesLabel: "Compass reading in degrees from north (0 to 360)",
    degreesHint: "Stand at the centre and enter the compass bearing of that spot. Choosing a zone above overrides the reading.",
    missing: (n) => `Answer the ${n} required question(s) marked *.`,
    build: "Build report",
    clear: "Clear",
    back: "Change answers",
    newCheck: "New check",
    print: "Print / PDF",
    report: "Vastu Check",
    saved: "The report has been kept in your saved results.",
    sections: ["Summary and index", "High-severity faults", "Moderate faults", "Mixed / caution", "Favourable points", "Remedies without demolition (in order)", "Affected zones and devta mantras", "Disclaimer"],
    severity: { high: "High", medium: "Medium", mixed: "Mixed", good: "Favourable" },
    grade: { excellent: "Excellent", good: "Satisfactory", improve: "Needs improvement", serious: "Serious faults, consult an expert" },
    matched: (n, total) => `${n} rules matched · total score ${total}`,
    contentNote: "The findings come from the AstroShrine Vastu Master, which is written in Hindi.",
  },
});

const filled = (v: Answers[string] | undefined) => (Array.isArray(v) ? v.length > 0 : !!v);
/** The Master's own words are Hindi; mark them so the English pages stay correct for readers and tools. */
const Hi = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span lang="hi" className={className}>
    {children}
  </span>
);
const chip = (active: boolean) =>
  `button-sm rounded-full border px-3 py-1.5 transition active:scale-98 ${
    active ? "border-ink bg-surface-inverse text-ink-inverse on-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"
  }`;

type Stage = { kind: "pick" } | { kind: "ask"; place: PlaceKey } | { kind: "report"; report: Report; saved: boolean };

export default function VastuCheckView() {
  const t = useT(text);
  const { status, session } = useAuth();
  const scope = session?.user.id ?? "guest";
  const [master, setMaster] = useState<Master | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [stage, setStage] = useState<Stage>({ kind: "pick" });

  useEffect(() => {
    let live = true;
    loadMaster().then(
      (m) => live && setMaster(m),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [attempt]);

  function openSaved(s: SavedResult<Report, { place?: PlaceKey; answers?: Answers }>) {
    const r = s.result;
    if (!r?.summary) return;
    // The app saved the grade as Hindi text; the grade is worked out again from the index.
    setStage({ kind: "report", report: { ...r, summary: { ...r.summary, grade: gradeOf(r.summary.index) } }, saved: true });
    window.scrollTo({ top: 0 });
  }

  return (
    <ToolPage eyebrow={t.eyebrow} title={t.title} intro={t.intro}>
      <div className="space-y-6">
        {failed && !master ? (
          <ErrorBox
            message={t.loadFailed}
            onRetry={() => {
              setFailed(false);
              setAttempt((a) => a + 1);
            }}
          />
        ) : !master ? (
          <PanelSkeleton />
        ) : stage.kind === "pick" ? (
          <Picker scope={scope} onPick={(place) => setStage({ kind: "ask", place })} />
        ) : stage.kind === "ask" ? (
          <Questionnaire
            master={master}
            scope={scope}
            place={stage.place}
            signedIn={status === "signedIn"}
            onBuild={(report, saved) => setStage({ kind: "report", report, saved })}
            onBack={() => setStage({ kind: "pick" })}
          />
        ) : (
          <ReportView
            report={stage.report}
            alreadySaved={stage.saved}
            signedIn={status === "signedIn"}
            onEdit={() => setStage({ kind: "ask", place: stage.report.place })}
            onNew={() => setStage({ kind: "pick" })}
          />
        )}
        {status === "signedIn" && <SavedList<Report, { place?: PlaceKey; answers?: Answers }> tool="vastu_check" onOpen={openSaved} />}
      </div>
    </ToolPage>
  );
}

function Picker({ scope, onPick }: { scope: string; onPick: (p: PlaceKey) => void }) {
  const t = useT(text);
  // Rendered only after the Master data has loaded in the browser, so the saved answers can be read directly.
  const has = (p: PlaceKey) => {
    const a = loadAnswers(scope, p);
    return !!a && Object.values(a).some(filled);
  };
  const saved: Record<PlaceKey, boolean> = { home: has("home"), factory: has("factory") };
  const places: { key: PlaceKey; label: string; icon: typeof PiHouseLine }[] = [
    { key: "home", label: t.home, icon: PiHouseLine },
    { key: "factory", label: t.factory, icon: PiBuildings },
  ];
  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {places.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick(key)}
            className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface-sunken p-8 transition hover:border-line-strong active:scale-98"
          >
            <Icon className="h-10 w-10 text-brand-strong" aria-hidden />
            <span className="title-2 text-ink">{label}</span>
            {saved[key] && <span className="caption-2 text-ink-soft">{t.resume(label)}</span>}
          </button>
        ))}
      </div>
    </Card>
  );
}

function Questionnaire({
  master,
  scope,
  place,
  signedIn,
  onBuild,
  onBack,
}: {
  master: Master;
  scope: string;
  place: PlaceKey;
  signedIn: boolean;
  onBuild: (r: Report, saved: boolean) => void;
  onBack: () => void;
}) {
  const t = useT(text);
  const qs = master.questionnaire[place];
  const [answers, setAnswers] = useState<Answers>(() => loadAnswers(scope, place) ?? {});
  const [deg, setDeg] = useState<Record<string, string>>({});
  const touched = useRef(false);

  useEffect(() => {
    if (touched.current) saveAnswers(scope, place, answers);
  }, [scope, place, answers]);

  const set = (id: string, v: string | string[]) => {
    touched.current = true;
    setAnswers((p) => ({ ...p, [id]: v }));
  };
  const toggle = (id: string, v: string) => {
    const cur = answers[id];
    const arr = Array.isArray(cur) ? cur : [];
    set(id, arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };
  const onDegree = (id: string, value: string) => {
    setDeg((p) => ({ ...p, [id]: value }));
    const z = value.trim() ? zoneFromDegree(Number(value.replace(",", "."))) : null;
    if (z) set(id, z);
  };
  const sideQ = qs.find((q) => q.type === "gate_side");
  const devtaOf = (q: Question) => {
    const side = sideQ ? answers[sideQ.id] : undefined;
    const pada = answers[q.id];
    const key = typeof side === "string" && typeof pada === "string" ? q.lookup?.[side + pada] : undefined;
    return key ? master.padas.find((p) => p.devta_key === key)?.devta : undefined;
  };
  const missing = qs.filter((q) => q.required && !filled(answers[q.id])).length;

  async function build() {
    const report = buildReport(master, place, answers);
    if (signedIn) {
      const label = place === "home" ? text.en.home : text.en.factory;
      const id = await saveResult("vastu_check", report, { place, answers }, `${label} · ${report.summary.index}/100`);
      onBuild(report, !!id);
    } else onBuild(report, false);
  }

  return (
    <div className="space-y-4">
      <Notice>{t.contentNote}</Notice>
      {qs.map((q, i) => {
        const v = answers[q.id];
        const devta = q.type === "gate_pada" ? devtaOf(q) : undefined;
        return (
          <Card key={q.id}>
            <fieldset>
              <legend className="title-3 text-ink">
                <Hi>{`${i + 1}. ${q.text}`}</Hi>
                {q.required && <span aria-label={t.required}> *</span>}
              </legend>
              {q.help && (
                <p className="caption-2 mt-1 text-ink-soft">
                  <Hi>{q.help}</Hi>
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {q.options.map((o) => {
                  const active = Array.isArray(v) ? v.includes(o.value) : v === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={active}
                      className={chip(active)}
                      onClick={() => (q.type === "zone_multi" ? toggle(q.id, o.value) : set(q.id, o.value))}
                    >
                      <Hi>{o.label}</Hi>
                    </button>
                  );
                })}
              </div>
              {q.type === "gate_pada" &&
                (devta ? (
                  <p className="body-6 mt-3 text-ink">
                    {t.padaDevta}: <Hi>{devta}</Hi>
                  </p>
                ) : !sideQ || !answers[sideQ.id] ? (
                  <p className="caption-2 mt-3 text-ink-muted">{t.pickWallFirst}</p>
                ) : null)}
              {q.type === "zone" && (
                <div className="mt-3">
                  <button
                    type="button"
                    className={chip(deg[q.id] !== undefined)}
                    aria-pressed={deg[q.id] !== undefined}
                    onClick={() =>
                      setDeg((p) => {
                        const { [q.id]: open, ...rest } = p;
                        return open === undefined ? { ...p, [q.id]: "" } : rest;
                      })
                    }
                  >
                    {t.useDegrees}
                  </button>
                  {deg[q.id] !== undefined && (
                    <div className="mt-3 max-w-xs">
                      <label htmlFor={`deg-${q.id}`} className={labelCls}>
                        {t.degreesLabel}
                      </label>
                      <input
                        id={`deg-${q.id}`}
                        inputMode="decimal"
                        maxLength={6}
                        placeholder="0–360"
                        value={deg[q.id]}
                        onChange={(e) => onDegree(q.id, e.target.value)}
                        className={inputCls}
                      />
                      <p className="caption-2 mt-2 text-ink-soft">{t.degreesHint}</p>
                    </div>
                  )}
                </div>
              )}
            </fieldset>
          </Card>
        );
      })}
      {missing > 0 && <p className="body-6 text-ink-soft">{t.missing(missing)}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" className={btnPrimary} disabled={missing > 0} onClick={() => void build()}>
          {t.build}
        </button>
        <button
          type="button"
          className={btnSecondary}
          onClick={() => {
            touched.current = false;
            setAnswers({});
            setDeg({});
            clearAnswers(scope, place);
          }}
        >
          {t.clear}
        </button>
        <button type="button" className={btnSmall} onClick={onBack}>
          {t.newCheck}
        </button>
      </div>
    </div>
  );
}

const FINDINGS: { key: Bucket; section: number; tone: string }[] = [
  { key: "high", section: 1, tone: "bg-warning-soft text-warning" },
  { key: "medium", section: 2, tone: "bg-surface-sunken text-ink" },
  { key: "mixed", section: 3, tone: "bg-surface-sunken text-ink-soft" },
  { key: "good", section: 4, tone: "bg-success-soft text-success" },
];

function ReportView({ report, alreadySaved, signedIn, onEdit, onNew }: { report: Report; alreadySaved: boolean; signedIn: boolean; onEdit: () => void; onNew: () => void }) {
  const t = useT(text);
  const { index, grade, n, total } = report.summary;
  const place = useMemo(() => (report.place === "home" ? t.home : t.factory), [report.place, t]);
  const bar = index >= 80 ? "bg-success" : index >= 40 ? "bg-brand" : "bg-warning";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="heading-6 text-ink">
          {t.report}: {place}
        </h2>
        <div className="flex gap-2 print:hidden">
          <button type="button" className={btnSmall} onClick={() => window.print()}>
            <PiPrinter className="h-4 w-4" aria-hidden /> {t.print}
          </button>
          <button type="button" className={btnSmall} onClick={onEdit}>
            {t.back}
          </button>
          <button type="button" className={btnSmall} onClick={onNew}>
            {t.newCheck}
          </button>
        </div>
      </div>
      {signedIn && alreadySaved && (
        <p role="status" className="body-6 flex items-center gap-2 rounded-2xl bg-success-soft p-3 text-success">
          <PiCheck className="h-4 w-4" aria-hidden /> {t.saved}
        </p>
      )}

      <Card title={t.sections[0]}>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="heading-3 text-ink">{index}</span>
          <span className="body-5 text-ink-soft">/100</span>
          <span className="title-3 ml-2 text-brand-strong">{t.grade[grade]}</span>
        </p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-sunken" role="img" aria-label={`${index}/100`}>
          <div className={`h-full rounded-full ${bar}`} style={{ width: `${index}%` }} />
        </div>
        <p className="caption-2 mt-2 text-ink-soft">{t.matched(n, total)}</p>
      </Card>

      {FINDINGS.map(({ key, section, tone }) =>
        report[key].length ? (
          <Card key={key} title={t.sections[section]}>
            <ul className="divide-y divide-line">
              {report[key].map((r, j) => (
                <li key={`${r.rule_id}-${j}`} className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className={`caption-3 rounded-full px-2 py-0.5 ${tone}`}>{t.severity[key]}</span>
                    <Hi className="title-4 text-ink">{`${r.object} · ${r.zone}`}</Hi>
                  </p>
                  <Hi className="body-6 block text-ink-soft">{r.app_sentence}</Hi>
                </li>
              ))}
            </ul>
          </Card>
        ) : null,
      )}

      {report.remedies.length > 0 && (
        <Card title={t.sections[5]}>
          <ol className="list-decimal space-y-2 pl-5">
            {report.remedies.map((x, j) => (
              <li key={j} className="body-6 text-ink">
                <Hi>{x}</Hi>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {report.zones.length > 0 && (
        <Card title={t.sections[6]}>
          <ul className="divide-y divide-line">
            {report.zones.map((z) => (
              <li key={z.code} className="space-y-1 py-3 first:pt-0 last:pb-0">
                <Hi className="title-4 block text-ink">{`${z.name} (${z.code})`}</Hi>
                {z.santulan && <Hi className="body-6 block text-ink-soft">{z.santulan}</Hi>}
                {z.mantras.map((m) => (
                  <Hi key={m} className="body-5 block text-brand-strong">
                    {m}
                  </Hi>
                ))}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title={t.sections[7]}>
        <Hi className="body-6 block text-ink-soft">{report.disclaimer}</Hi>
      </Card>
    </div>
  );
}
