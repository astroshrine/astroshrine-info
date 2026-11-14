"use client";

import { use, useState, useSyncExternalStore } from "react";
import { browser } from "react-dom";
import { PiHeart, PiUserCircle } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";
import { generateChart } from "@/lib/endpoints";
import { day, isValidTimeZone, localToday, toBirth, type BirthPlace, type BirthProfile } from "@/lib/jyotish";
import PlaceSearch from "../_components/PlaceSearch";
import { useKundlis } from "../_components/kundlis";
import {
  Card,
  CardSkeleton,
  Disclaimer,
  ErrorBox,
  Notice,
  PageHeader,
  SignInPrompt,
  btnPrimary,
  inputCls,
  labelCls,
} from "../_components/ui";
import { jyotishErrorText, useJyotish } from "../_components/useJyotish";
import { KUNDLI_MAX_SCORE, birthChartOf, matchKundli, type KundliMatchReport, type VerdictKey } from "./milan";

// Both people travel in the URL hash (#v.n=…&k.n=…), so a match can be bookmarked or shared without birth
// details reaching the server. v = var (groom), k = kanya (bride), as in the app's matching engine.

type Side = "v" | "k";
type Person = { name: string; dob: string; tob: string; place: BirthPlace | null };
const EMPTY: Person = { name: "", dob: "", tob: "", place: null };

function personToParams(q: URLSearchParams, side: Side, p: BirthProfile) {
  q.set(`${side}.n`, p.name);
  q.set(`${side}.d`, p.dob);
  q.set(`${side}.t`, p.tob);
  q.set(`${side}.p`, p.place.name);
  q.set(`${side}.lat`, String(p.place.lat));
  q.set(`${side}.lon`, String(p.place.lon));
  q.set(`${side}.tz`, p.place.tz);
}

function personFromParams(q: URLSearchParams, side: Side): BirthProfile | null {
  const g = (k: string) => q.get(`${side}.${k}`) ?? "";
  const lat = Number(g("lat")), lon = Number(g("lon")), tz = g("tz");
  const p: BirthProfile = {
    name: g("n").slice(0, 100),
    dob: g("d"),
    tob: g("t"),
    timeUnknown: false,
    place: { name: g("p").slice(0, 200), lat, lon, tz },
  };
  const ok =
    !!p.name.trim() &&
    /^\d{4}-\d{2}-\d{2}$/.test(p.dob) &&
    /^\d{2}:\d{2}$/.test(p.tob) &&
    !!p.place.name &&
    !!g("lat") &&
    !!g("lon") &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180 &&
    isValidTimeZone(tz);
  return ok ? p : null;
}

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

function validate(p: Person, who: string): string | null {
  if (!p.name.trim()) return `${who} का नाम लिखें।`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.dob) || p.dob > localToday()) return `${who} की जन्म तिथि चुनें।`;
  if (!/^\d{2}:\d{2}$/.test(p.tob)) return `${who} का जन्म समय चुनें।`;
  if (!p.place) return `${who} का जन्म स्थान खोजकर चुनें।`;
  return null;
}

/** The app's report text keeps a few hyphenated words; the website's copy avoids hyphens (design rule B1). */
const clean = (s: string) => s.replace(/(\S)-(\S)/g, "$1 $2");

export default function MilanView() {
  use(browser("Both people come from the URL hash; the saved profile fills a side."));
  const { status } = useAuth();
  // Any saved kundli with a known birth time can fill a side (matching needs the time).
  const withTime = useKundlis().entries.filter((k) => !k.profile.timeUnknown);
  const hash = useSyncExternalStore(subscribeHash, () => location.hash, () => "");
  const q = new URLSearchParams(hash.slice(1));
  const groom = personFromParams(q, "v");
  const bride = personFromParams(q, "k");
  const ready = groom && bride;

  const [form, setForm] = useState<Record<Side, Person>>({
    v: groom ? { ...groom } : EMPTY,
    k: bride ? { ...bride } : EMPTY,
  });
  const [error, setError] = useState<string | null>(null);

  const req = useJyotish(status === "signedIn" && ready ? `milan|${hash}` : null, async (signal) => {
    const [cv, ck] = await Promise.all([generateChart(toBirth(groom!), signal), generateChart(toBirth(bride!), signal)]);
    return matchKundli({ name: bride!.name }, { name: groom!.name }, "hi", { bride: birthChartOf(ck), groom: birthChartOf(cv) });
  });

  function submit() {
    const problem = validate(form.v, "वर") ?? validate(form.k, "कन्या");
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    const params = new URLSearchParams();
    for (const side of ["v", "k"] as Side[]) {
      const p = form[side];
      personToParams(params, side, { name: p.name.trim(), dob: p.dob, tob: p.tob, timeUnknown: false, place: p.place! });
    }
    window.location.hash = params.toString(); // a history entry: Back returns to the previous match
  }

  const sideCard = (side: Side, title: string) => {
    const p = form[side];
    const set = (patch: Partial<Person>) => setForm((f) => ({ ...f, [side]: { ...f[side], ...patch } }));
    return (
      <Card
        title={title}
        action={
          withTime.length > 0 ? (
            <label className="caption-1 flex items-center gap-2 text-ink-soft">
              <PiUserCircle className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
              <span className="sr-only sm:not-sr-only">सहेजी कुंडली से भरें</span>
              <select
                value=""
                onChange={(e) => {
                  const k = withTime.find((x) => x.id === e.target.value);
                  if (k) set({ name: k.profile.name, dob: k.profile.dob, tob: k.profile.tob, place: k.profile.place });
                }}
                className="button-sm rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken"
                aria-label={`${title}: सहेजी कुंडली से भरें`}
              >
                <option value="">चुनें</option>
                {withTime.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.profile.name}
                  </option>
                ))}
              </select>
            </label>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor={`${side}-name`} className={labelCls}>
              नाम
            </label>
            <input id={`${side}-name`} maxLength={100} value={p.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${side}-dob`} className={labelCls}>
                जन्म तिथि
              </label>
              <input
                id={`${side}-dob`}
                type="date"
                min="1900-01-01"
                max={localToday()}
                value={p.dob}
                onChange={(e) => set({ dob: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor={`${side}-tob`} className={labelCls}>
                जन्म समय
              </label>
              <input id={`${side}-tob`} type="time" value={p.tob} onChange={(e) => set({ tob: e.target.value })} className={inputCls} />
            </div>
          </div>
          <PlaceSearch
            key={p.place ? `${p.place.lat},${p.place.lon}` : "none"}
            id={`${side}-place`}
            label="जन्म स्थान"
            value={p.place}
            onPick={(place) => set({ place })}
          />
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="कुंडली मिलान" title="अष्टकूट गुण मिलान">
        वर और कन्या का जन्म विवरण भरें। 36 में से गुण, दोष और उनके परिहार, और नवांश मिलान, वही नियम जो AstroShrine ऐप में हैं।
      </PageHeader>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {sideCard("v", "वर (लड़का)")}
          {sideCard("k", "कन्या (लड़की)")}
        </div>
        {error && (
          <p role="alert" className="body-5 text-danger">
            {error}
          </p>
        )}
        <button type="submit" className={btnPrimary}>
          <PiHeart className="h-5 w-5" aria-hidden /> गुण मिलान करें
        </button>
      </form>

      {!ready ? (
        <Notice>दोनों का विवरण भरकर मिलान करें। हर मिलान का अपना लिंक बनता है, जिसे बाद में फिर खोला जा सकता है।</Notice>
      ) : status === "loading" || req.loading ? (
        <CardSkeleton rows={8} />
      ) : status === "signedOut" || (req.error instanceof ApiError && req.error.status === 401) ? (
        <SignInPrompt what="गुण मिलान" />
      ) : req.error ? (
        <ErrorBox message={jyotishErrorText(req.error)} onRetry={req.retry} />
      ) : req.data ? (
        <Report r={req.data} groom={groom!} bride={bride!} />
      ) : null}

      <Disclaimer />
    </div>
  );
}

const VERDICT: Record<VerdictKey, { label: string; cls: string }> = {
  excellent: { label: "उत्तम मिलान", cls: "bg-success-soft text-success" },
  good: { label: "अच्छा मिलान", cls: "bg-success-soft text-success" },
  average: { label: "सामान्य मिलान", cls: "bg-warning-soft text-warning" },
  poor: { label: "कमज़ोर मिलान", cls: "bg-danger-soft text-danger" },
};

const KOOTA_HI: Record<string, string> = {
  varna: "वर्ण",
  vashya: "वश्य",
  tara: "तारा",
  yoni: "योनि",
  grahaMaitri: "ग्रह मैत्री",
  gana: "गण",
  bhakoot: "भकूट",
  nadi: "नाड़ी",
};

function Report({ r, groom, bride }: { r: KundliMatchReport; groom: BirthProfile; bride: BirthProfile }) {
  const verdict = VERDICT[r.verdictKey];
  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
          <div className="text-center md:text-left">
            <p className="caption-4 text-ink-soft">कुल गुण</p>
            <p className="heading-3 text-ink">
              {r.totalScore} <span className="title-2 text-ink-soft">/ {KUNDLI_MAX_SCORE}</span>
            </p>
            <p className={`caption-3 mt-2 inline-block rounded-full px-3 py-1 ${verdict.cls}`}>{verdict.label}</p>
          </div>
          <div className="md:col-span-2">
            <p className="body-5 text-ink">
              {groom.name} ({day(groom.dob)}) और {bride.name} ({day(bride.dob)})
            </p>
            <p className="caption-2 mt-1 text-ink-soft">{clean(r.positions)}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken" aria-hidden>
              <div className="h-full w-full origin-left rounded-full bg-brand" style={{ transform: `scaleX(${r.totalScore / KUNDLI_MAX_SCORE})` }} />
            </div>
          </div>
        </div>
        {r.summary && (
          <div className="mt-4">
            <Notice tone="warning">{clean(r.summary)}</Notice>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card title="आठ कूट">
          <ul className="divide-y divide-line">
            {r.kootas.map((k) => (
              <li key={k.key} className="py-3">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="body-4 text-ink">
                    {KOOTA_HI[k.key] ?? k.name} <span className="caption-5 text-ink-muted">{k.name}</span>
                  </span>
                  <span className={`title-4 ${k.score === k.max ? "text-success" : k.score === 0 ? "text-danger" : "text-ink"}`}>
                    {k.score} / {k.max}
                  </span>
                </p>
                <p className="caption-2 mt-1 text-ink-soft">{clean(k.note)}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="दोष और परिहार">
          <ul className="space-y-3">
            {r.doshas.map((d, i) => (
              <li key={i} className="rounded-lg border border-line p-3">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="body-4 text-ink">{clean(d.name)}</span>
                  <span
                    className={`caption-3 rounded-full px-2 py-0.5 ${
                      !d.present ? "bg-success-soft text-success" : d.severity.includes("परिहार नहीं") || d.severity.includes("अनुचित") ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
                    }`}
                  >
                    {d.present ? clean(d.severity) : "नहीं है"}
                  </span>
                </p>
                <p className="caption-2 mt-1 text-ink-soft">{clean(d.description)}</p>
                {d.remedy && <p className="caption-2 mt-1 text-ink">{d.present ? "परिहार / उपाय: " : ""}{clean(d.remedy)}</p>}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title={`नवांश मिलान: ${r.navamsha.score} / ${r.navamsha.max}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left">
            <thead>
              <tr className="text-ink-soft">
                <th scope="col" className="caption-4 pb-2 pr-4">जाँच</th>
                <th scope="col" className="caption-4 pb-2 pr-4">वर</th>
                <th scope="col" className="caption-4 pb-2 pr-4">कन्या</th>
                <th scope="col" className="caption-4 pb-2">अंक</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {r.navamsha.rows.map((row) => (
                <tr key={row.label} className="body-6 text-ink">
                  <th scope="row" className="body-5 py-2 pr-4">{clean(row.label)}</th>
                  <td className="py-2 pr-4">{clean(row.groom)}</td>
                  <td className="py-2 pr-4">{clean(row.bride)}</td>
                  <td className="py-2">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 space-y-1">
          {r.navamsha.notes.map((n) => (
            <li key={n} className="caption-2 text-ink-soft">
              {clean(n)}
            </li>
          ))}
        </ul>
      </Card>

      <Notice>गुण मिलान मार्गदर्शन है, अंतिम निर्णय नहीं। विवाह जैसे निर्णय से पहले किसी ज्योतिषी से दोनों कुंडली दिखाएँ।</Notice>
    </div>
  );
}
