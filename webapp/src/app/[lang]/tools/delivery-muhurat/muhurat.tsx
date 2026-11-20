"use client";

import { useEffect, useState } from "react";
import { PiArrowsLeftRight } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { dignityName, grahaName, nakshatraName, rashiName } from "@/lib/jyotish";
import { fill } from "@/lib/services/toolsBCommon";
import {
  compareDmCandidates, dmErrorKey, getDmCandidates, selectDmTime, startDmSearch,
  type ApprovedWindow, type Bi, type Candidate, type CandidatesResponse, type DayLagnaTable, type Lang, type SelectResponse,
} from "@/lib/services/toolsBDelivery";
import { Card, Skeleton, btnPrimary, btnSecondary, btnSmall } from "../../kundli/_components/ui";
import { Field } from "./fields";
import { dateLabel, hm12, hm12All, insideWindows, pickBi } from "./logic";
import { dmText } from "./messages";

export type Selection = SelectResponse & { birthLocal: string };
const POLL_MS = 3000;

/** Step 04: search the doctor-approved windows (this is the step that can charge), list up to 3 ranked times, compare, select. */
export default function MuhuratStep({
  requestId, windows, pricePoints, lang, onSelected, onError,
}: {
  requestId: string;
  windows?: ApprovedWindow[];
  /** What the search costs now (0 once this request has been charged, or for astrologers). */
  pricePoints: number;
  lang: Lang;
  onSelected: (sel: Selection) => void;
  onError: (e: unknown) => void;
}) {
  const t = useT(dmText);
  const [data, setData] = useState<CandidatesResponse | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [kick, setKick] = useState(0);
  const [busy, setBusy] = useState<"" | "search" | "select" | "compare">("");
  const [compare, setCompare] = useState<{ candidates: Candidate[]; disclaimer: Bi } | null>(null);
  const [manual, setManual] = useState<{ date: string; time: string } | null>(null);

  // Reads the candidates, and again every 3 s while the server's job is still searching (also when the page was
  // opened mid-search). A never-searched request has no candidates yet: that is not an error.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = async () => {
      try {
        const r = await getDmCandidates(requestId);
        if (!alive) return;
        setData(r);
        setLoaded(true);
        if (r.status === "searching") timer = setTimeout(run, POLL_MS);
      } catch (e) {
        if (!alive) return;
        setLoaded(true);
        const k = dmErrorKey(e);
        if (k !== "notReady" && k !== "notFound") onError(e);
      }
    };
    void run();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [requestId, kick, onError]);

  async function search(relaxed: boolean) {
    if (busy) return;
    setBusy("search");
    try {
      await startDmSearch(requestId, relaxed);
      setData({ status: "searching", relaxed, candidates: [], rejected: [], scannedMinutes: 0, disclaimer: data?.disclaimer ?? { en: "", hi: "" } });
      setKick((n) => n + 1);
    } catch (e) {
      onError(e);
    } finally {
      setBusy("");
    }
  }
  async function select(body: { candidateId: string } | { fixedTimeLocal: string }, birthLocal: string) {
    if (busy) return;
    setBusy("select");
    try {
      onSelected({ ...(await selectDmTime(requestId, body)), birthLocal });
    } catch (e) {
      onError(e);
    } finally {
      setBusy("");
    }
  }
  async function openCompare() {
    const ids = (data?.candidates ?? []).map((c) => c.id).filter(Boolean) as string[];
    if (busy || ids.length < 2) return;
    setBusy("compare");
    try {
      setCompare(await compareDmCandidates(ids));
    } catch (e) {
      onError(e);
    } finally {
      setBusy("");
    }
  }

  if (!loaded) return <Skeleton className="h-40 w-full" />;

  if (compare) {
    return (
      <div className="space-y-4">
        <h2 className="heading-6 text-ink">{t.compareTitle}</h2>
        <CompareView candidates={compare.candidates} lang={lang} />
        <p className="caption-3 text-ink-muted">{pickBi(compare.disclaimer, lang)}</p>
        <button type="button" className={btnSecondary} onClick={() => setCompare(null)}>
          {t.backToList}
        </button>
      </div>
    );
  }

  const status = data?.status;
  const cands = [...(data?.candidates ?? [])].sort((a, b) => a.rank - b.rank);
  const manualLocal = manual?.date && manual.time ? `${manual.date}T${manual.time}` : "";

  if (!data || status === "draft" || (status === "failed" && !cands.length)) {
    return (
      <div className="space-y-4">
        <h2 className="heading-6 text-ink">{t.muhuratTitle}</h2>
        <p className="body-6 text-ink-soft">{t.muhuratIntro}</p>
        {status === "failed" && <p role="alert" className="body-6 text-danger">{t.searchFailed}</p>}
        {pricePoints > 0 && <p className="title-4 text-ink">{fill(t.price, { points: pricePoints })}</p>}
        <button type="button" className={btnPrimary} onClick={() => void search(false)} disabled={!!busy}>
          {pricePoints > 0 ? fill(t.createPaid, { points: pricePoints }) : t.create}
        </button>
      </div>
    );
  }

  if (status === "searching") {
    return (
      <div role="status" className="space-y-2 rounded-2xl border border-line bg-surface-sunken p-6 text-center">
        <p className="title-2 text-ink">{t.searching}</p>
        <p className="body-6 text-ink-soft">{t.searchingHintWeb}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="heading-6 text-ink">{t.muhuratTitle}</h2>
      {data.relaxed && (
        <div className="rounded-2xl bg-warning-soft p-3">
          <p className="title-4 text-warning">{t.relaxedLabel}</p>
          <p className="caption-2 mt-1 text-ink-soft">{t.relaxedHint}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {cands.map((c) => (
          <CandidateCard key={c.id ?? c.birthLocal} c={c} lang={lang} busy={!!busy} onSelect={() => c.id && void select({ candidateId: c.id }, c.birthLocal)} />
        ))}
      </div>

      {cands.length >= 2 && (
        <button type="button" className={btnSecondary} onClick={() => void openCompare()} disabled={!!busy}>
          <PiArrowsLeftRight className="h-4 w-4" aria-hidden /> {t.compare}
        </button>
      )}

      {!cands.length && (
        <Card>
          <h3 className="title-3 text-ink">{t.noneTitle}</h3>
          <p className="body-6 mt-1 text-ink-soft">{pickBi(data.noneReason, lang) || t.noneDefault}</p>
          <div className="mt-3 space-y-3">
            {!manual ? (
              <button type="button" className={btnSmall} onClick={() => setManual({ date: "", time: "" })}>
                {t.viewPreferred}
              </button>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t.preferredDate} type="date" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} />
                  <Field label={t.preferredTime} type="time" value={manual.time} onChange={(e) => setManual({ ...manual, time: e.target.value })} />
                </div>
                {!!manualLocal && !insideWindows(manualLocal, windows) && <p className="caption-2 text-warning">{t.outsideWindows}</p>}
                <button type="button" className={btnPrimary} disabled={!manualLocal || !!busy} onClick={() => void select({ fixedTimeLocal: manualLocal }, `${manualLocal}:00`)}>
                  {t.viewChart}
                </button>
              </>
            )}
            {!data.relaxed && (
              <button type="button" className={btnSmall} onClick={() => void search(true)} disabled={!!busy}>
                {t.rerunRelaxed}
              </button>
            )}
          </div>
        </Card>
      )}

      {data.rejected?.length > 0 && (
        <details className="rounded-2xl border border-line bg-surface-card p-4">
          <summary className="title-4 cursor-pointer text-ink">{t.excluded}</summary>
          <p className="caption-2 mt-2 text-ink-soft">{fill(t.scanned, { n: data.scannedMinutes })}</p>
          <dl className="mt-2 divide-y divide-line">
            {data.rejected.map((r) => (
              <div key={r.key} className="flex justify-between gap-3 py-2">
                <dt className="caption-1 text-ink-soft">{pickBi(r.label, lang)}</dt>
                <dd className="body-5 shrink-0 text-ink">{fill(t.minutes, { n: r.minutes })}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      <p className="caption-3 text-ink-muted">{pickBi(data.disclaimer, lang)}</p>
    </div>
  );
}

function CandidateCard({ c, lang, busy, onSelect }: { c: Candidate; lang: Lang; busy: boolean; onSelect: () => void }) {
  const t = useT(dmText);
  const locale = useLocale();
  const cs = c.chartSummary;
  const [date, time] = c.birthLocal.split("T");
  const p = c.panchang;
  const cells: [string, string][] = [
    [t.col.date, dateLabel(date, locale)],
    [t.col.time, hm12(time)],
    [t.col.lagna, rashiName(cs.ascSign, locale)],
    [t.col.rashi, rashiName(cs.moonSign, locale)],
    [t.col.nakshatra, nakshatraName(cs.nakshatra, locale)],
    [t.col.pada, String(cs.pada)],
  ];
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-card p-4 shadow-sm">
      <p className="caption-4 text-brand-strong">{fill(t.rankKicker, { rank: c.rank })}</p>
      {c.relaxed && <p className="caption-3 w-fit rounded-full bg-warning-soft px-2 py-0.5 text-warning">{t.relaxedLabel}</p>}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        {cells.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="caption-3 text-ink-muted">{k}</dt>
            <dd className="body-5 break-words text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="body-6 text-ink">
        <strong>{fill(t.scoreValue, { score: Math.round(c.totalScore) })}</strong> · {t.scoreLabel}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {[p?.tithi?.name, p?.yoga?.name, p?.karana?.name, p?.varaName].filter(Boolean).map((b, i) => (
          <span key={i} className="caption-2 rounded-full bg-surface-sunken px-2 py-0.5 text-ink-soft">
            {pickBi(b as Bi, lang)}
          </span>
        ))}
      </div>
      <div>
        <p className="title-4 text-ink">{t.keyPlanets}</p>
        <ul className="mt-1 space-y-0.5">
          {cs.keyPlanets.map((k) => (
            <li key={k.graha} className="caption-2 text-ink-soft">
              {grahaName(k.graha, locale)} · {rashiName(k.sign, locale)} · {fill(t.houseN, { n: k.house })} · {dignityName(k.dignity, locale)}
              {k.retro ? ` · ${t.retro}` : ""}
              {k.combust ? ` · ${t.combust}` : ""}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="title-4 text-ink">{t.analysisTitle}</p>
        <p className="body-6 mt-1 text-ink-soft">{pickBi(c.whyChosen, lang)}</p>
      </div>
      {!!pickBi(c.whyNotBetter, lang) && (
        <details>
          <summary className="button-sm cursor-pointer text-brand-strong">{t.whyNotHigher}</summary>
          <p className="body-6 mt-1 text-ink-soft">{pickBi(c.whyNotBetter, lang)}</p>
        </details>
      )}
      {c.softPenalties?.map((sp) => (
        <p key={sp.key} className="caption-2 text-warning">
          {fill(t.softPenalty, { label: pickBi(sp.label, lang), points: sp.points })}
        </p>
      ))}
      {c.lagnaTable && (
        <details>
          <summary className="button-sm cursor-pointer text-brand-strong">{t.lagnaT.title}</summary>
          <LagnaTable table={c.lagnaTable} lang={lang} />
        </details>
      )}
      <button type="button" className={`${btnPrimary} mt-auto`} onClick={onSelect} disabled={busy || !c.id}>
        {t.selectTime}
      </button>
    </section>
  );
}

const CLS: Record<string, string> = { shreshth: "bg-success-soft text-success", madhyam: "bg-surface-sunken text-ink-soft", varjit: "bg-danger-soft text-danger" };

/** The candidate day's lagnas, sunrise to next sunrise. Rows outside the doctor-approved windows are dimmed, never selectable. */
function LagnaTable({ table, lang }: { table: DayLagnaTable; lang: Lang }) {
  const t = useT(dmText);
  const locale = useLocale();
  return (
    <div className="mt-2">
      <p className="caption-2 mb-2 text-ink-soft">
        <strong>{t.lagnaT.head}</strong> {pickBi(table.best, lang)}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-left">
          <thead>
            <tr className="caption-3 text-ink-muted">
              {(["lagna", "time", "shuddhi", "notes"] as const).map((k) => (
                <th key={k} scope="col" className="py-1 pr-2 font-medium">
                  {t.lagnaT.col[k]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr key={r.startMs} className={`border-t border-line align-top ${r.out ? "opacity-50" : ""} ${r.here ? "bg-surface-sunken" : ""}`}>
                <td className="caption-1 py-1.5 pr-2 text-ink">
                  {rashiName(r.sign, locale)}
                  {r.here && <span className="caption-3 block text-brand-strong">{t.lagnaT.here}</span>}
                </td>
                <td className="caption-2 py-1.5 pr-2 text-ink-soft">{hm12All(r.time)}</td>
                <td className="py-1.5 pr-2">
                  <span className={`caption-3 rounded-full px-2 py-0.5 ${CLS[r.cls]}`}>{t.lagnaT.cls[r.cls]}</span>
                </td>
                <td className="caption-2 py-1.5 text-ink-soft">{r.notes.map((n) => pickBi(n, lang)).join("; ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="caption-3 mt-2 text-ink-muted">{t.lagnaNote}</p>
    </div>
  );
}

/** Side by side columns: the score breakdown bars (points of weight), panchang, lagna, Moon, D9, yogas, dasha at birth. */
function CompareView({ candidates, lang }: { candidates: Candidate[]; lang: Lang }) {
  const t = useT(dmText);
  const locale = useLocale();
  const cands = [...candidates].sort((a, b) => a.rank - b.rank);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cands.map((c) => {
        const cs = c.chartSummary;
        const [date, time] = c.birthLocal.split("T");
        const rows: [string, string][] = [
          [t.p.tithi, pickBi(c.panchang?.tithi?.name, lang)],
          [t.p.nakshatra, `${pickBi(c.panchang?.nakshatra?.name, lang)} ${cs.pada}`],
          [t.p.yoga, pickBi(c.panchang?.yoga?.name, lang)],
          [t.p.karana, pickBi(c.panchang?.karana?.name, lang)],
          [t.p.vara, pickBi(c.panchang?.varaName, lang)],
          [t.col.lagna, rashiName(cs.ascSign, locale)],
          [t.moon, rashiName(cs.moonSign, locale)],
          [t.d9Lagna, rashiName(cs.d9AscSign, locale)],
          [t.d9Moon, rashiName(cs.d9MoonSign, locale)],
          [t.keyYogas, cs.yogas.length ? cs.yogas.map((y) => pickBi(y.name, lang)).join(", ") : "-"],
          [t.dashaAtBirth, fill(t.dashaBalanceYears, { lord: grahaName(cs.dashaAtBirth.lord, locale), years: Math.round(cs.dashaAtBirth.balanceYears * 10) / 10 })],
        ];
        return (
          <Card key={c.id ?? c.birthLocal}>
            <p className="caption-4 text-brand-strong">{fill(t.rankKicker, { rank: c.rank })}</p>
            <h3 className="heading-6 mt-1 text-ink">
              {dateLabel(date, locale)} · {hm12(time)}
            </h3>
            <p className="body-5 mt-1 text-ink">{fill(t.scoreValue, { score: Math.round(c.totalScore) })}</p>
            <p className="caption-2 text-ink-soft">{t.scoreLabel}</p>
            <div className="mt-3 space-y-2">
              {c.breakdown.map((b) => {
                const pct = b.weight > 0 && b.computed ? Math.max(0, Math.min(100, (b.points / b.weight) * 100)) : 0;
                return (
                  <div key={b.component}>
                    <div className="flex justify-between gap-2">
                      <span className="caption-2 text-ink-soft">{t.component[b.component]}</span>
                      <span className="caption-2 text-ink-soft">{b.computed ? `${Math.round(b.points * 10) / 10}/${b.weight}` : t.notComputed}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <dl className="mt-3 divide-y divide-line">
              {rows.map(([k, v]) => (
                <div key={k} className="flex flex-wrap justify-between gap-2 py-1.5">
                  <dt className="caption-1 text-ink-soft">{k}</dt>
                  <dd className="caption-1 min-w-0 text-right text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        );
      })}
    </div>
  );
}
