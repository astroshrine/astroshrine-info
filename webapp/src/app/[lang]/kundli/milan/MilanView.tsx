"use client";

import { use, useState, useSyncExternalStore } from "react";
import { browser } from "react-dom";
import { PiHeart, PiUserCircle } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { generateChart } from "@/lib/endpoints";
import { day, isValidTimeZone, localToday, toBirth, type BirthPlace, type BirthProfile } from "@/lib/jyotish";
import PlaceSearch from "../_components/PlaceSearch";
import { useKundliName, useKundlis } from "../_components/kundlis";
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
import { KOOTAS, KUNDLI_MAX_SCORE, birthChartOf, matchKundli, type KundliMatchReport, type VerdictKey } from "./milan";

// Both people travel in the URL hash (#v.n=…&k.n=…), so a match can be bookmarked or shared without birth
// details reaching the server. v = var (groom), k = kanya (bride), as in the app's matching engine.

type Side = "v" | "k";
type Person = { name: string; dob: string; tob: string; place: BirthPlace | null };
const EMPTY: Person = { name: "", dob: "", tob: "", place: null };
type KootaKey = (typeof KOOTAS)[number]["key"];
/** The first detail a side is missing. */
type Problem = "name" | "dob" | "tob" | "place";

// The report itself (koota notes, doshas, navamsha rows) comes from milan.ts in the page's language.
// English terms follow the app (matching.* in its en.json, and the detailed milan's form labels).
const text = defineMessages({
  hi: {
    eyebrow: "कुंडली मिलान",
    title: "अष्टकूट गुण मिलान",
    intro: "वर और कन्या का जन्म विवरण भरें। 36 में से गुण, दोष और उनके परिहार, और नवांश मिलान, वही नियम जो AstroShrine ऐप में हैं।",
    side: { v: "वर (लड़का)", k: "कन्या (लड़की)" },
    /** A side inside a sentence. */
    who: { v: "वर", k: "कन्या" },
    fillFromSaved: "सहेजी कुंडली से भरें",
    fillFromSavedLabel: (side: string) => `${side}: सहेजी कुंडली से भरें`,
    choose: "चुनें",
    name: "नाम",
    dob: "जन्म तिथि",
    tob: "जन्म समय",
    place: "जन्म स्थान",
    problem: {
      name: (who: string) => `${who} का नाम लिखें।`,
      dob: (who: string) => `${who} की जन्म तिथि चुनें।`,
      tob: (who: string) => `${who} का जन्म समय चुनें।`,
      place: (who: string) => `${who} का जन्म स्थान खोजकर चुनें।`,
    },
    submit: "गुण मिलान करें",
    howTo: "दोनों का विवरण भरकर मिलान करें। हर मिलान का अपना लिंक बनता है, जिसे बाद में फिर खोला जा सकता है।",
    signInFor: "गुण मिलान",
    total: "कुल गुण",
    verdict: { excellent: "उत्तम मिलान", good: "अच्छा मिलान", average: "सामान्य मिलान", poor: "कमज़ोर मिलान" },
    couple: (groom: string, bride: string) => `${groom} और ${bride}`,
    kootas: "आठ कूट",
    /** Each koota's name, then a quieter second label: here its Latin name. */
    koota: {
      varna: ["वर्ण", "Varna"],
      vashya: ["वश्य", "Vashya"],
      tara: ["तारा", "Tara"],
      yoni: ["योनि", "Yoni"],
      grahaMaitri: ["ग्रह मैत्री", "Graha Maitri"],
      gana: ["गण", "Gana"],
      bhakoot: ["भकूट", "Bhakoot"],
      nadi: ["नाड़ी", "Nadi"],
    } satisfies Record<KootaKey, [string, string]>,
    doshas: "दोष और परिहार",
    absent: "नहीं है",
    remedy: "परिहार / उपाय",
    navamsha: (score: number, max: number) => `नवांश मिलान: ${score} / ${max}`,
    column: { check: "जाँच", groom: "वर", bride: "कन्या", points: "अंक" },
    guidance: "गुण मिलान मार्गदर्शन है, अंतिम निर्णय नहीं। विवाह जैसे निर्णय से पहले किसी ज्योतिषी से दोनों कुंडली दिखाएँ।",
  },
  en: {
    eyebrow: "Kundli matching",
    title: "Ashtakoot Guna Milan",
    intro:
      "Enter the birth details of the groom and the bride. See the gunas out of 36, doshas and their cancellations, and Navamsha matching, worked out with the same rules as the AstroShrine app.",
    side: { v: "Groom", k: "Bride" },
    who: { v: "groom", k: "bride" },
    fillFromSaved: "Fill from a saved kundli",
    fillFromSavedLabel: (side) => `${side}: fill from a saved kundli`,
    choose: "Choose",
    name: "Name",
    dob: "Date of birth",
    tob: "Time of birth",
    place: "Place of birth",
    problem: {
      name: (who) => `Enter the ${who}'s name.`,
      dob: (who) => `Select the ${who}'s date of birth.`,
      tob: (who) => `Select the ${who}'s time of birth.`,
      place: (who) => `Search and pick the ${who}'s place of birth.`,
    },
    submit: "Match kundlis",
    howTo: "Fill in both people's details and run the match. Each match gets its own link, which you can open again later.",
    signInFor: "Guna Milan",
    total: "Total gunas",
    verdict: { excellent: "Excellent match", good: "Good match", average: "Average match", poor: "Weak match" },
    couple: (groom, bride) => `${groom} and ${bride}`,
    kootas: "The eight kootas",
    /** Each koota's name, then what it stands for (the app's matching.koota). */
    koota: {
      varna: ["Varna", "Work and ego"],
      vashya: ["Vashya", "Mutual attraction"],
      tara: ["Tara", "Destiny and health"],
      yoni: ["Yoni", "Physical compatibility"],
      grahaMaitri: ["Graha Maitri", "Mental harmony"],
      gana: ["Gana", "Temperament"],
      bhakoot: ["Bhakoot", "Love and family"],
      nadi: ["Nadi", "Health and progeny"],
    },
    doshas: "Doshas and their cancellations",
    absent: "Not present",
    remedy: "Cancellation / remedy",
    navamsha: (score, max) => `Navamsha matching: ${score} / ${max}`,
    column: { check: "Check", groom: "Groom", bride: "Bride", points: "Points" },
    guidance: "Guna Milan is guidance, not a final decision. Before a decision like marriage, have an astrologer read both kundlis.",
  },
});

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

function problemOf(p: Person): Problem | null {
  if (!p.name.trim()) return "name";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.dob) || p.dob > localToday()) return "dob";
  if (!/^\d{2}:\d{2}$/.test(p.tob)) return "tob";
  if (!p.place) return "place";
  return null;
}

/** The app's report text keeps a few hyphenated words; the website's copy avoids hyphens (design rule B1). */
const clean = (s: string) => s.replace(/(\S)-(\S)/g, "$1 $2");

export default function MilanView() {
  use(browser("Both people come from the URL hash; the saved profile fills a side."));
  const t = useT(text);
  const locale = useLocale();
  const { status } = useAuth();
  // Any saved kundli with a known birth time can fill a side (matching needs the time).
  const withTime = useKundlis().entries.filter((k) => !k.profile.timeUnknown);
  const nameOf = useKundliName();
  const hash = useSyncExternalStore(subscribeHash, () => location.hash, () => "");
  const q = new URLSearchParams(hash.slice(1));
  const groom = personFromParams(q, "v");
  const bride = personFromParams(q, "k");
  const ready = groom && bride;

  const [form, setForm] = useState<Record<Side, Person>>({
    v: groom ? { ...groom } : EMPTY,
    k: bride ? { ...bride } : EMPTY,
  });
  const [error, setError] = useState<{ side: Side; problem: Problem } | null>(null);

  // The report's text is in the page's language, so the language is part of the key.
  const req = useJyotish(status === "signedIn" && ready ? `milan|${locale}|${hash}` : null, async (signal) => {
    const [cv, ck] = await Promise.all([generateChart(toBirth(groom!), signal), generateChart(toBirth(bride!), signal)]);
    return matchKundli({ name: bride!.name }, { name: groom!.name }, locale, { bride: birthChartOf(ck), groom: birthChartOf(cv) });
  });

  function submit() {
    for (const side of ["v", "k"] as Side[]) {
      const problem = problemOf(form[side]);
      if (problem) {
        setError({ side, problem });
        return;
      }
    }
    setError(null);
    const params = new URLSearchParams();
    for (const side of ["v", "k"] as Side[]) {
      const p = form[side];
      personToParams(params, side, { name: p.name.trim(), dob: p.dob, tob: p.tob, timeUnknown: false, place: p.place! });
    }
    window.location.hash = params.toString(); // a history entry: Back returns to the previous match
  }

  const sideCard = (side: Side) => {
    const title = t.side[side];
    const p = form[side];
    const set = (patch: Partial<Person>) => setForm((f) => ({ ...f, [side]: { ...f[side], ...patch } }));
    return (
      <Card
        title={title}
        action={
          withTime.length > 0 ? (
            <label className="caption-1 flex items-center gap-2 text-ink-soft">
              <PiUserCircle className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
              <span className="sr-only sm:not-sr-only">{t.fillFromSaved}</span>
              <select
                value=""
                onChange={(e) => {
                  const k = withTime.find((x) => x.id === e.target.value);
                  if (k) set({ name: nameOf(k.profile), dob: k.profile.dob, tob: k.profile.tob, place: k.profile.place });
                }}
                className="button-sm rounded-xl border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken"
                aria-label={t.fillFromSavedLabel(title)}
              >
                <option value="">{t.choose}</option>
                {withTime.map((k) => (
                  <option key={k.id} value={k.id}>
                    {nameOf(k.profile)}
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
              {t.name}
            </label>
            <input id={`${side}-name`} maxLength={100} value={p.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${side}-dob`} className={labelCls}>
                {t.dob}
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
                {t.tob}
              </label>
              <input id={`${side}-tob`} type="time" value={p.tob} onChange={(e) => set({ tob: e.target.value })} className={inputCls} />
            </div>
          </div>
          <PlaceSearch
            key={p.place ? `${p.place.lat},${p.place.lon}` : "none"}
            id={`${side}-place`}
            label={t.place}
            value={p.place}
            onPick={(place) => set({ place })}
          />
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t.eyebrow} title={t.title}>
        {t.intro}
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
          {sideCard("v")}
          {sideCard("k")}
        </div>
        {error && (
          <p role="alert" className="body-5 text-danger">
            {t.problem[error.problem](t.who[error.side])}
          </p>
        )}
        <button type="submit" className={btnPrimary}>
          <PiHeart className="h-5 w-5" aria-hidden /> {t.submit}
        </button>
      </form>

      {!ready ? (
        <Notice>{t.howTo}</Notice>
      ) : status === "loading" || req.loading ? (
        <CardSkeleton rows={8} />
      ) : status === "signedOut" || (req.error instanceof ApiError && req.error.status === 401) ? (
        <SignInPrompt what={t.signInFor} />
      ) : req.error ? (
        <ErrorBox message={jyotishErrorText(req.error, locale)} onRetry={req.retry} />
      ) : req.data ? (
        <Report r={req.data} groom={groom!} bride={bride!} />
      ) : null}

      <Disclaimer />
    </div>
  );
}

const VERDICT_TONE: Record<VerdictKey, string> = {
  excellent: "bg-success-soft text-success",
  good: "bg-success-soft text-success",
  average: "bg-warning-soft text-warning",
  poor: "bg-danger-soft text-danger",
};

function Report({ r, groom, bride }: { r: KundliMatchReport; groom: BirthProfile; bride: BirthProfile }) {
  const t = useT(text);
  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
          <div className="text-center md:text-left">
            <p className="caption-4 text-ink-soft">{t.total}</p>
            <p className="heading-3 text-ink">
              {r.totalScore} <span className="title-2 text-ink-soft">/ {KUNDLI_MAX_SCORE}</span>
            </p>
            <p className={`caption-3 mt-2 inline-block rounded-xl px-3 py-1 ${VERDICT_TONE[r.verdictKey]}`}>{t.verdict[r.verdictKey]}</p>
          </div>
          <div className="md:col-span-2">
            <p className="body-5 text-ink">{t.couple(`${groom.name} (${day(groom.dob)})`, `${bride.name} (${day(bride.dob)})`)}</p>
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
        <Card title={t.kootas}>
          <ul className="divide-y divide-line">
            {r.kootas.map((k) => {
              const [name, sub] = t.koota[k.key as KootaKey];
              return (
                <li key={k.key} className="py-3">
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="body-4 text-ink">
                      {name} <span className="caption-5 text-ink-muted">{sub}</span>
                    </span>
                    <span className={`title-4 ${k.score === k.max ? "text-success" : k.score === 0 ? "text-danger" : "text-ink"}`}>
                      {k.score} / {k.max}
                    </span>
                  </p>
                  <p className="caption-2 mt-1 text-ink-soft">{clean(k.note)}</p>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title={t.doshas}>
          <ul className="space-y-3">
            {r.doshas.map((d, i) => (
              <li key={i} className="rounded-xl border border-line p-3">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="body-4 text-ink">{clean(d.name)}</span>
                  <span
                    className={`caption-3 rounded-full px-2 py-0.5 ${
                      !d.present ? "bg-success-soft text-success" : d.severityKey === "bad" || d.severityKey === "tyajya" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
                    }`}
                  >
                    {d.present ? clean(d.severity) : t.absent}
                  </span>
                </p>
                <p className="caption-2 mt-1 text-ink-soft">{clean(d.description)}</p>
                {d.remedy && <p className="caption-2 mt-1 text-ink">{d.present ? `${t.remedy}: ` : ""}{clean(d.remedy)}</p>}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title={t.navamsha(r.navamsha.score, r.navamsha.max)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left">
            <thead>
              <tr className="text-ink-soft">
                <th scope="col" className="caption-4 pb-2 pr-4">{t.column.check}</th>
                <th scope="col" className="caption-4 pb-2 pr-4">{t.column.groom}</th>
                <th scope="col" className="caption-4 pb-2 pr-4">{t.column.bride}</th>
                <th scope="col" className="caption-4 pb-2">{t.column.points}</th>
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

      <Notice>{t.guidance}</Notice>
    </div>
  );
}
