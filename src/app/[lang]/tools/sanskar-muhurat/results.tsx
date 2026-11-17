"use client";

import { useLocale, useT } from "@/i18n/LocaleProvider";
import { fill } from "@/lib/services/toolsBCommon";
import { Card, Notice, Skeleton, btnPrimary, btnSmall } from "../../kundli/_components/ui";
import type { CrossCheck } from "./_logic/crosscheck";
import type { Draft } from "./_logic/draft";
import { BASE_TRADITION, VERDICT, rulesFor, sourceLabel, tagName, type Bi, type Kb, type Rule, type Sanskar, type Weights } from "./_logic/kb";
import { ORD_EN } from "./_logic/names";
import type { Candidate, SearchResult } from "./_logic/search";
import { smText } from "./messages";
import { Tx, Txt, bs, fmtDate, hm, vaarName } from "./text";

export type Results = Partial<Record<Sanskar, SearchResult>>;
const SUB_KEYS: (keyof Weights)[] = ["panchang", "nakshatra", "tarabala", "chandrabala", "lagna", "planetary", "tradition", "local"];

const ENGINE_META: Bi = {
  hi: "प्राथमिक गणना: AstroShrine UniversalMuhurta (इसी ब्राउज़र में): सूर्य VSOP87 (संक्षिप्त), चन्द्र Meeus 47.A; अयनांश लाहिरी (न्यूटेशन रहित); राहु: स्पष्ट (true) पात",
  en: "Primary computation: AstroShrine UniversalMuhurta (in this browser): Sun VSOP87 (abridged), Moon Meeus 47.A; Lahiri ayanamsha (no nutation); Rahu: true node",
};

const RANK: Bi[] = [
  { hi: "उपलब्ध विकल्पों में सर्वोत्तम", en: "Best among the available options" },
  { hi: "विकल्प 1", en: "Alternate 1" },
  { hi: "विकल्प 2", en: "Alternate 2" },
];

function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-1.5">
      <dt className="caption-1 text-ink-soft">{k}</dt>
      <dd className="caption-1 min-w-0 text-right text-ink">{v}</dd>
    </div>
  );
}

/** Step 05: the ranked muhurats of each samskara, with every reason, limit and tradition view, and the choice. */
export default function ResultsStep({
  d, patch, kb, results, cross, progress, onRun,
}: {
  d: Draft;
  patch: (p: Partial<Draft>) => void;
  kb: Kb;
  results: Results;
  cross: Record<string, CrossCheck>;
  progress: [number, number] | null;
  onRun: (sanskar: Sanskar, relaxed: boolean, tradition?: string) => void;
}) {
  const t = useT(smText);
  const locale = useLocale();
  return (
    <div className="space-y-6">
      <h2 className="heading-6 text-ink">{t.step.muhurat}</h2>
      {progress && (
        <div role="status" className="space-y-2">
          <p className="body-6 text-ink-soft">{fill(t.searching, { done: progress[0], total: progress[1] })}</p>
          <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress[1] ? (progress[0] / progress[1]) * 100 : 0}%` }} />
          </div>
        </div>
      )}
      {!progress && !Object.keys(results).length && <Skeleton className="h-24 w-full" />}
      {d.sanskars.map((sk) => {
        const r = results[sk];
        if (!r) return null;
        const traditions = [BASE_TRADITION, ...new Set(rulesFor(kb, sk).filter((x) => x.condition && x.tradition_tag !== BASE_TRADITION).map((x) => x.tradition_tag))];
        return (
          <section key={sk} className="space-y-4" aria-label={t[sk]}>
            <h3 className="caption-4 text-brand-strong uppercase">{t[sk]}</h3>
            <div className="flex flex-wrap gap-2">
              {traditions.map((tr) => {
                const on = r.input.tradition === tr;
                const label = tr === BASE_TRADITION ? t.traditionBase : tagName(tr, locale);
                return (
                  <button
                    key={tr}
                    type="button"
                    aria-pressed={on}
                    disabled={!!progress}
                    onClick={() => onRun(sk, !!r.input.relaxed, tr)}
                    className={`button-sm rounded-full border px-3 py-1.5 transition active:scale-98 disabled:opacity-60 ${on ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"}`}
                  >
                    <Txt text={label} />
                  </button>
                );
              })}
            </div>
            {r.searchedTo < r.input.to && <p className="caption-2 text-warning">{fill(t.capped, { date: fmtDate(r.searchedTo, locale) })}</p>}
            {r.fixedReject.length > 0 && (
              <Notice tone="warning">
                {r.fixedReject.map((x) => (
                  <span key={x} className="block">
                    <Txt text={x} />
                  </span>
                ))}
              </Notice>
            )}
            {r.candidates[0] && (
              <div className="rounded-2xl border border-brand bg-surface-sunken p-4">
                <p className="caption-4 text-brand-strong uppercase">{t.overallBest}</p>
                <p className="heading-6 mt-1 text-ink">{`${fmtDate(r.candidates[0].date, locale)} · ${hm(r.candidates[0].best)}`}</p>
                <p className="caption-2 text-ink-soft">{fill(t.overallBestNote, { window: hm(`${r.candidates[0].start}–${r.candidates[0].end}`) })}</p>
              </div>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
              {r.candidates.map((c, i) => (
                <CandidateCard key={c.id} c={c} rank={i} kb={kb} cross={cross[c.id]} selected={d.selected[sk] === c.id} onSelect={() => patch({ selected: { ...d.selected, [sk]: c.id } })} />
              ))}
            </div>
            {r.candidates.length > 1 && <CompareTable sk={sk} cs={r.candidates} selected={d.selected[sk]} />}
            {r.candidates.length < 3 && !r.fixedReject.length && (
              <Card>
                <p className="title-3 text-ink">{r.candidates.length ? fill(t.few, { n: r.candidates.length }) : t.none}</p>
                <p className="caption-2 mt-2 text-ink-soft">{t.excludedTitle}</p>
                <ul className="mt-1 space-y-1">
                  {r.excluded.slice(0, 6).map((x) => (
                    <li key={x.reason} className="body-6 text-ink-soft">
                      • <Txt text={x.reason} />: {fill(t.days, { n: x.days })}
                    </li>
                  ))}
                </ul>
                {!r.input.relaxed ? (
                  <button type="button" className={`${btnSmall} mt-3`} disabled={!!progress} onClick={() => onRun(sk, true, r.input.tradition)}>
                    {t.relaxed}
                  </button>
                ) : (
                  <p className="caption-2 mt-2 text-warning">{t.relaxedOn}</p>
                )}
              </Card>
            )}
          </section>
        );
      })}
    </div>
  );
}

function CandidateCard({ c, rank, kb, cross, selected, onSelect }: { c: Candidate; rank: number; kb: Kb; cross?: CrossCheck; selected: boolean; onSelect: () => void }) {
  const t = useT(smText);
  const locale = useLocale();
  const needsVerify = c.flags.length > 0 || c.checks.some((k) => k.status !== "pass");
  const rankLabel = RANK[rank] ? bs(RANK[rank], locale) : `${locale === "hi" ? "विकल्प" : "Alternate"} ${rank}`;
  return (
    <section className={`flex flex-col gap-3 rounded-2xl border bg-surface-card p-4 shadow-sm ${selected ? "border-2 border-brand" : "border-line"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="caption-4 text-brand-strong uppercase">{rankLabel}</p>
        <span className={`caption-3 rounded-full px-2 py-0.5 ${needsVerify ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>{needsVerify ? t.check.uncertain : t.checked}</span>
      </div>
      <div>
        <h4 className="heading-6 text-ink">
          {fmtDate(c.date, locale)} · {hm(`${c.start}–${c.end}`)}
        </h4>
        <p className="title-4 mt-1 text-ink">{fill(t.bestTime, { time: hm(c.best) })}</p>
        <p className="caption-2 text-ink-soft">
          {vaarName(c.vaarIdx, locale)} · {fill(t.grade, { g: c.grade })} · {fill(t.durMin, { n: c.durMin })}
        </p>
      </div>
      <dl className="divide-y divide-line">
        <Row k={t.f.tithi} v={<Tx b={c.tithi} />} />
        <Row k={t.f.nakshatra} v={<><Tx b={c.nakshatra} /> · {t.f.pada} {c.pada}</>} />
        <Row k={t.f.yoga} v={<Tx b={c.yoga} />} />
        <Row k={t.f.karana} v={<Tx b={c.karana} />} />
        <Row k={t.f.lagna} v={<Tx b={c.lagna} />} />
        <Row k={t.f.moon} v={<Tx b={c.moonSign} />} />
        <Row k={t.f.chandrabal} v={<><Tx b={c.chandrabala.status} /> ({locale === "hi" ? `${c.chandrabala.house}वाँ भाव` : `${ORD_EN[c.chandrabala.house]} house`})</>} />
        <Row k={t.f.tarabal} v={<><Tx b={c.tarabala.name} /> ({c.tarabala.tara})</>} />
        <Row k={t.f.age} v={`${fill(c.age.unit === "months" ? t.ageMonth : t.ageYear, { n: c.age.n })}${c.age.family ? ` · ${t.familyTag}` : ""}`} />
      </dl>
      <div>
        <p className="title-4 text-ink">{t.planets}</p>
        <ul className="mt-1 space-y-0.5">
          {c.planets.map((x) => (
            <li key={x.en} className="caption-2 text-ink-soft">
              • <Tx b={x} />
            </li>
          ))}
        </ul>
      </div>
      {c.flags.map((f) => (
        <p key={f.en} className="caption-2 text-warning">
          ⚠ <Tx b={f} />
        </p>
      ))}
      <Details title={t.why}>
        <ul className="space-y-1">
          {c.why.map((x) => (
            <li key={x.en} className="body-6 text-ink-soft">
              • <Tx b={x} />
            </li>
          ))}
        </ul>
      </Details>
      <Details title={t.limits}>
        {c.limits.length ? (
          <ul className="space-y-1">
            {c.limits.map((x) => (
              <li key={x.en} className="body-6 text-ink-soft">
                • <Tx b={x} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="caption-2 text-ink-soft">{t.noLimits}</p>
        )}
      </Details>
      <Details title={t.traditions}>
        <dl className="divide-y divide-line">
          <Row k={t.traditionBase} v={fill(t.grade, { g: c.base.grade })} />
          {c.verdicts.map((v) => (
            <div key={v.tradition} className="py-1.5">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="caption-1 text-ink-soft">
                  <Txt text={tagName(v.tradition, locale)} />
                </dt>
                <dd className="caption-1 text-ink">
                  <Tx b={VERDICT[v.verdict]} />
                </dd>
              </div>
              {v.rules.map((r) => (
                <p key={r.rule_id} className="caption-3 mt-1 text-ink-muted">
                  <Txt text={locale === "hi" ? r.text_hi : r.text_en} /> · <Tx b={sourceLabel(r)} />
                </p>
              ))}
            </div>
          ))}
        </dl>
        {c.verdicts.some((v) => v.verdict === "nishiddh" || v.verdict === "madhyam") && <p className="caption-2 mt-2 text-warning">{t.differ}</p>}
      </Details>
      <Details title={t.chip.shastra}>
        <ShastraPanel c={c} kb={kb} />
      </Details>
      <Details title={t.chip.panchang}>
        <PanchangPanel cross={cross} />
      </Details>
      <Details title={t.chip.astro}>
        <p className="caption-3 mb-2 text-ink-muted">{bs(ENGINE_META, locale)}</p>
        <dl className="divide-y divide-line">
          <Row k={t.sunrise} v={hm(`${c.sunrise} / ${c.sunset}`)} />
          <Row k={t.rahu} v={hm(c.kaal.rahu)} />
          <Row k={t.yama} v={hm(c.kaal.yama)} />
          <Row k={t.gulik} v={hm(c.kaal.gulik)} />
          <Row k={t.bhadra} v={hm(c.kaal.bhadra.join(", ")) || "-"} />
          {c.checks.map((k) => (
            <Row key={k.item.en} k={<Tx b={k.item} />} v={<>{t.check[k.status]}{k.note ? <> : <Tx b={k.note} /></> : null}</>} />
          ))}
        </dl>
      </Details>
      <Details title={t.chip.astroshrine}>
        <dl className="divide-y divide-line">
          {SUB_KEYS.map((k) => (
            <Row key={k} k={t.sub[k]} v={String(c.subScores[k])} />
          ))}
          <Row k={t.weighted} v={String(c.weighted)} />
          <Row k={t.engineScore} v={String(c.score)} />
        </dl>
        <p className="caption-3 mt-2 text-ink-muted">{t.scoreAid}</p>
      </Details>
      <button type="button" className={`${btnPrimary} mt-auto`} onClick={onSelect} disabled={selected} aria-pressed={selected}>
        {selected ? t.selected : t.select}
      </button>
    </section>
  );
}

function Details({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="rounded-xl border border-line px-3 py-2">
      <summary className="button-sm cursor-pointer text-brand-strong">{title}</summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

function ShastraPanel({ c, kb }: { c: Candidate; kb: Kb }) {
  const t = useT(smText);
  const locale = useLocale();
  const described = rulesFor(kb, c.sanskar).filter((r) => !r.condition);
  const rows: Rule[] = [...described.filter((r) => r.tradition_tag === BASE_TRADITION), ...described.filter((r) => r.tradition_tag !== BASE_TRADITION), ...c.verdicts.flatMap((v) => v.rules)];
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.rule_id}>
          <p className="body-6 text-ink">
            <Txt text={locale === "hi" ? r.text_hi : r.text_en} />
          </p>
          <p className="caption-3 text-ink-muted">
            <Txt text={tagName(r.tradition_tag, locale)} /> · <Tx b={sourceLabel(r)} /> · {t.status[r.verification_status]}
          </p>
        </li>
      ))}
    </ul>
  );
}

function PanchangPanel({ cross }: { cross?: CrossCheck }) {
  const t = useT(smText);
  const locale = useLocale();
  if (!cross) return <Skeleton className="h-10 w-full" />;
  if (!cross.available) return <p className="caption-2 text-warning">{t.crossUnavailable}</p>;
  return (
    <div className="space-y-2">
      <p className="caption-3 text-ink-muted">{fill(t.crossSources, { primary: "AstroShrine UniversalMuhurta", secondary: cross.source })}</p>
      <dl className="divide-y divide-line">
        {cross.rows.map((r) => (
          <Row key={r.at + r.field.en} k={`${bs(r.field, locale)} (${t.at[r.at]})`} v={r.same ? <Tx b={r.primary} /> : <><Tx b={r.primary} /> ≠ <Tx b={r.secondary} /></>} />
        ))}
      </dl>
      {cross.mismatch && <p className="caption-2 text-warning">{t.crossDiffer}</p>}
      <p className="caption-3 text-ink-muted">{t.crossLimits}</p>
    </div>
  );
}

function CompareTable({ sk, cs, selected }: { sk: Sanskar; cs: Candidate[]; selected?: string }) {
  const t = useT(smText);
  const locale = useLocale();
  const traditions = cs[0].verdicts.map((v) => v.tradition);
  const rows: [string, (c: Candidate) => React.ReactNode][] = [
    [t.time, (c) => hm(`${c.start}–${c.end}`)],
    [t.best, (c) => hm(c.best)],
    [t.engineScore, (c) => `${c.score} (${fill(t.grade, { g: c.grade })})`],
    [t.weighted, (c) => String(c.weighted)],
    ...SUB_KEYS.map((k): [string, (c: Candidate) => React.ReactNode] => [t.sub[k], (c) => String(c.subScores[k])]),
    ...traditions.map((tr): [string, (c: Candidate) => React.ReactNode] => [tagName(tr, locale), (c) => <Tx b={VERDICT[c.verdicts.find((v) => v.tradition === tr)!.verdict]} />]),
  ];
  return (
    <Card title={`${t.compareTitle}: ${t[sk]}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-left">
          <thead>
            <tr>
              <th scope="col" className="w-1/4" />
              {cs.map((c) => (
                <th key={c.id} scope="col" className={`caption-1 py-1.5 pr-2 font-semibold ${selected === c.id ? "text-brand-strong" : "text-ink"}`}>
                  {fmtDate(c.date, locale)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, f]) => (
              <tr key={label} className="border-t border-line">
                <th scope="row" className="caption-2 py-1.5 pr-2 text-left font-normal text-ink-muted">
                  <Txt text={label} />
                </th>
                {cs.map((c) => (
                  <td key={c.id} className="caption-1 py-1.5 pr-2 text-ink">
                    {f(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="caption-3 mt-2 text-ink-muted">{t.scoreAid}</p>
    </Card>
  );
}
