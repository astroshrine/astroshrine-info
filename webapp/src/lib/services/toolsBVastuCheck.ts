// Vastu Check, ported from the app (React-native-app/src/features/vastuCheck): the AstroShrine Vastu Master v2.0
// rules answered from a questionnaire, scored and put in report order. Everything runs in the browser; the only
// network call is saving the finished report to the account's history (toolsBSaved). The Master's own text is
// Hindi throughout, so on the English pages it is shown as it is, marked lang="hi".

export type PlaceKey = "home" | "factory";

export type Question = {
  id: string;
  text: string;
  type: "info" | "gate_side" | "gate_pada" | "zone" | "zone_multi" | "choice";
  required: boolean;
  options: { value: string; label: string }[];
  rule_pattern?: string;
  help?: string;
  /** gate_pada only: wall side + pada ("E1") -> devta_key. */
  lookup?: Record<string, string>;
  object_code?: string;
};
/** Question id -> the picked option value(s). */
export type Answers = Record<string, string | string[]>;
export type Rule = {
  rule_id: string;
  object: string;
  zone_code: string;
  zone: string;
  phal: string;
  severity: string;
  score: number;
  app_sentence: string;
  remedy: string;
};
export type Zone16 = { code: string; hindi: string; santulan: string };
export type Pada = { devta_key: string; devta: string; zone_code: string; mantra: string };
export type Master = {
  zones16: Zone16[];
  padas: Pada[];
  rules: Rule[];
  questionnaire: Record<PlaceKey, Question[]>;
  disclaimer?: string;
};

let loading: Promise<Master> | null = null;
/** The Master data, fetched as its own chunk the first time a Vastu Check is opened. */
export function loadMaster(): Promise<Master> {
  return (loading ??= import("@/lib/vastu/vastuMaster.json").then((m) => (m.default ?? m) as unknown as Master));
}

// ─── Zones ────────────────────────────────────────────────────────────────────

/** The 16 Vastu zones clockwise from north, 22.5 degrees each; N is centred on 0 (348.75 to 11.25). */
export const ZONE_ORDER = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"] as const;

/** Zone of a compass bearing (degrees from north, wraps); null for a non-number. */
export const zoneFromDegree = (deg: number): string | null =>
  Number.isFinite(deg) ? ZONE_ORDER[Math.floor(((((deg + 11.25) % 360) + 360) % 360) / 22.5)] : null;

// ─── Matching and scoring (report_logic.matching / scoring) ─────────────────────

/**
 * Each answer fills its question's rule_pattern ({zone} / {value} = the option; gate_pada: wall side + pada ->
 * lookup -> {devta_key}). "NA" answers are skipped and an id with no rule is ignored.
 */
export function matchRules(master: Master, place: PlaceKey, answers: Answers): Rule[] {
  const qs = master.questionnaire[place] ?? [];
  const index = new Map(master.rules.map((r) => [r.rule_id, { ...r, score: Number(r.score) }]));
  const side = answers[qs.find((q) => q.type === "gate_side")?.id ?? ""];
  const out: Rule[] = [];
  for (const q of qs) {
    const pattern = q.rule_pattern ?? (q.object_code ? `${q.object_code}-{zone}` : "");
    if (!pattern) continue;
    for (const v of ([] as unknown[]).concat(answers[q.id] ?? [])) {
      if (typeof v !== "string" || !v || v === "NA") continue;
      const key = q.type === "gate_pada" && typeof side === "string" ? q.lookup?.[side + v] : undefined;
      const id = q.type === "gate_pada" ? (key ? pattern.replace("{devta_key}", key) : "") : pattern.replace("{zone}", v).replace("{value}", v);
      const rule = id ? index.get(id) : undefined;
      if (rule) out.push(rule);
    }
  }
  return out;
}

export type GradeKey = "excellent" | "good" | "improve" | "serious";
/** 80+ excellent, 60-79 satisfactory, 40-59 needs improvement, below 40 serious faults. */
export const gradeOf = (index: number): GradeKey => (index >= 80 ? "excellent" : index >= 60 ? "good" : index >= 40 ? "improve" : "serious");

export type Bucket = "high" | "medium" | "mixed" | "good";
export type AffectedZone = { code: string; name: string; santulan: string; mantras: string[]; score: number };
export type Report = {
  place: PlaceKey;
  answers: Answers;
  summary: { index: number; grade: GradeKey; n: number; total: number };
  high: Rule[];
  medium: Rule[];
  mixed: Rule[];
  good: Rule[];
  remedies: string[];
  zones: AffectedZone[];
  disclaimer: string;
};

const MANTRAS_PER_ZONE = 3;
const DISCLAIMER_FALLBACK = "यह विश्लेषण वास्तु सिद्धांतों पर आधारित संभावनाएँ दर्शाता है; संरचनात्मक परिवर्तन से पूर्व विशेषज्ञ परामर्श लें।";

function bucket(r: Rule): Bucket {
  if (r.severity === "उच्च") return "high";
  if (r.severity === "मध्यम") return "medium";
  if (r.score > 0 && r.phal !== "मिश्रित" && r.severity !== "निम्न") return "good";
  return "mixed";
}

/** index = round(100 * (total - min) / (max - min)), min = -3n, max = +2n; n = 0 (nothing matched) is 100. */
export function buildReport(master: Master, place: PlaceKey, answers: Answers): Report {
  const matched = matchRules(master, place, answers);
  const n = matched.length;
  const byZone: Record<string, number> = {};
  let total = 0;
  for (const r of matched) {
    total += Number(r.score);
    byZone[r.zone_code] = (byZone[r.zone_code] ?? 0) + Number(r.score);
  }
  const index = n ? Math.round((100 * (total + 3 * n)) / (5 * n)) : 100;
  const affected = Object.keys(byZone)
    .filter((z) => byZone[z] < 0)
    .sort((a, b) => byZone[a] - byZone[b]);

  const by: Record<Bucket, Rule[]> = { high: [], medium: [], mixed: [], good: [] };
  for (const r of matched) by[bucket(r)].push(r);
  const remedies = [...new Set([...by.high, ...by.medium, ...by.mixed].map((r) => r.remedy).filter(Boolean))];
  const zones = affected.map((code) => {
    const z = master.zones16.find((x) => x.code === code);
    return {
      code,
      name: z?.hindi ?? matched.find((r) => r.zone_code === code)?.zone ?? code,
      santulan: z?.santulan ?? "",
      mantras: [...new Set(master.padas.filter((p) => p.zone_code === code).map((p) => p.mantra).filter(Boolean))].slice(0, MANTRAS_PER_ZONE),
      score: byZone[code],
    };
  });
  return { place, answers, summary: { index, grade: gradeOf(index), n, total }, ...by, remedies, zones, disclaimer: master.disclaimer || DISCLAIMER_FALLBACK };
}

// ─── Answers kept in this browser (the app's storage.ts) ────────────────────────

const answersKey = (scope: string, place: PlaceKey) => `vastucheck:${scope}:${place}`;

export function loadAnswers(scope: string, place: PlaceKey): Answers | null {
  try {
    const raw = localStorage.getItem(answersKey(scope, place));
    return raw ? (JSON.parse(raw) as Answers) : null;
  } catch {
    return null;
  }
}
export function saveAnswers(scope: string, place: PlaceKey, a: Answers) {
  try {
    localStorage.setItem(answersKey(scope, place), JSON.stringify(a));
  } catch {
    // Private window or full storage: the questionnaire still works, it just is not remembered.
  }
}
export function clearAnswers(scope: string, place: PlaceKey) {
  try {
    localStorage.removeItem(answersKey(scope, place));
  } catch {
    // Nothing to clear.
  }
}
