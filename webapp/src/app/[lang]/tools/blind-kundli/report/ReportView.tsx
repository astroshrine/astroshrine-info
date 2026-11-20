"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PiCheckCircle, PiCopy, PiEye, PiXCircle } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { INTL_LOCALE, type Locale } from "@/i18n/config";
import type { BirthPlace } from "@/lib/jyotish";
import { grahaName, rashiName } from "@/lib/jyotish";
import { GRAHAS, chartHouses, getBlindKundli, houseOf, revealBlindKundli, type BkGraha, type Prediction } from "@/lib/services/toolsBBlindKundli";
import { toolErrorText } from "@/lib/services/toolsBCommon";
import NorthIndianChart from "../../../kundli/_components/NorthIndianChart";
import PlaceSearch from "../../../kundli/_components/PlaceSearch";
import { Card, ErrorBox, KV, Notice, Skeleton, btnPrimary, btnSecondary, btnSmall, inputCls, labelCls } from "../../../kundli/_components/ui";
import { ToolPage } from "../../_b/shell";
import BkGate from "../BkGate";
import Checks from "../Checks";
import { bkText } from "../text";

export default function ReportView() {
  const t = useT(bkText);
  return (
    <ToolPage eyebrow={t.reportEyebrow} title={t.title}>
      <BkGate>
        <Report />
      </BkGate>
    </ToolPage>
  );
}

const rashisFrom = (m: Record<BkGraha, { rashi: number }>) => Object.fromEntries(GRAHAS.map((g) => [g, m[g].rashi])) as Record<BkGraha, number>;

function Report() {
  const t = useT(bkText);
  const locale = useLocale();
  const id = useSearchParams().get("id") ?? "";
  const [p, setP] = useState<Prediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const c = new AbortController();
    getBlindKundli(id, c.signal).then(
      (r) => setP(r),
      (e) => !c.signal.aborted && setError(toolErrorText(e, locale)),
    );
    return () => c.abort();
  }, [id, attempt, locale]);

  if (!id) return <Notice>{toolErrorText(null, locale)}</Notice>;
  if (error) return <ErrorBox message={error} onRetry={() => { setError(null); setAttempt((a) => a + 1); }} />;
  if (!p) {
    return (
      <div aria-hidden className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const pr = p.prediction;
  const lagna = pr.lagna.rashi;
  const revealed = p.revealed_at && p.comparison && p.actual;
  const name = (k: string) => (k === "Lagna" ? t.lagna : grahaName(k, locale));

  async function copy() {
    try {
      await navigator.clipboard.writeText(p!.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card title={p.label || t.untitled}>
            <p className="body-5 break-words text-ink">{p.statement}</p>
            <p className="caption-2 mt-2 text-ink-soft">
              {t.lockedAt} {new Date(p.locked_at).toLocaleString(INTL_LOCALE[locale])}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className={`caption-2 flex items-center gap-1 break-all ${p.hash_valid ? "text-ink" : "text-danger"}`}>
                {p.hash_valid ? <PiCheckCircle className="h-4 w-4 shrink-0 text-success" aria-hidden /> : <PiXCircle className="h-4 w-4 shrink-0" aria-hidden />}
                sha256 {p.hash.slice(0, 16)}… ({t.hashHint})
              </p>
              <button type="button" onClick={() => void copy()} className={btnSmall} aria-live="polite">
                <PiCopy className="h-4 w-4" aria-hidden /> {copied ? t.copied : t.copyHash}
              </button>
            </div>
          </Card>

          <Card title={t.lockedChart}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <NorthIndianChart houses={chartHouses(lagna, rashisFrom(pr.planets))} label={t.lockedChart} lagnaLabel={t.asc} className="mx-auto w-full max-w-sm" />
              <ul className="space-y-2">
                {[["Lagna", pr.lagna] as const, ...GRAHAS.map((g) => [g, pr.planets[g]] as const)].map(([k, pl]) => (
                  <li key={k} className="caption-1 text-ink-soft">
                    <span className="body-5 text-ink">{name(k)}</span> · {t.rashiLine(pl.rashi, rashiName(pl.rashi, locale))}
                    {k !== "Lagna" ? `, ${t.houseWord(houseOf(pl.rashi, lagna))}` : ""} · {pl.derived ? t.auto : t.conf[pl.confidence]}
                    {pl.evidence.map((e, i) => (
                      <span key={i} className="block break-words pl-3">
                        {t.source[e.source]}: {e.note}
                      </span>
                    ))}
                  </li>
                ))}
                {p.kundli.clusters.map((cl) => (
                  <li key={cl.house} className="caption-1 text-ink-soft">
                    {t.cluster}: {t.houseWord(cl.house)} ({rashiName(cl.rashi, locale)}) {cl.members.map((g) => grahaName(g, locale)).join(" + ")}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
        <aside className="space-y-6 lg:col-span-2">
          <Checks result={p.checks} />
          {!revealed && <RevealForm id={p.id} onDone={setP} />}
        </aside>
      </div>
      {revealed && <Comparison p={p} locale={locale} name={name} />}
      <Link href="/tools/blind-kundli" className={btnSecondary}>
        {t.back}
      </Link>
    </div>
  );
}

function RevealForm({ id, onDone }: { id: string; onDone: (p: Prediction) => void }) {
  const t = useT(bkText);
  const locale = useLocale();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState<BirthPlace | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    if (!place) return;
    setBusy(true);
    setError(null);
    try {
      onDone(await revealBlindKundli(id, { date, time, tz: place.tz, lat: place.lat, lon: place.lon }));
    } catch (e) {
      setError(`${t.revealFailed}: ${toolErrorText(e, locale)}`);
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  return (
    <Card title={t.revealTitle} description={t.revealHint}>
      <div className="space-y-4">
        <div>
          <label htmlFor="bk-dob" className={labelCls}>{t.dob}</label>
          <input id="bk-dob" type="date" min="1900-01-01" max={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="bk-tob" className={labelCls}>{t.tob}</label>
          <input id="bk-tob" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
        </div>
        <PlaceSearch id="bk-pob" label={t.pob} value={place} onPick={setPlace} />
        {error && <ErrorBox message={error} />}
        {confirm ? (
          <div role="alertdialog" aria-labelledby="bk-rev-title" className="rounded-2xl border border-line bg-warning-soft p-4">
            <p id="bk-rev-title" className="title-3 text-warning">{t.revealConfirmTitle}</p>
            <p className="body-6 mt-1 text-ink-soft">{t.revealConfirmBody}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={btnPrimary} disabled={busy} onClick={() => void reveal()}>
                {busy ? t.revealing : t.reveal}
              </button>
              <button type="button" className={btnSecondary} disabled={busy} onClick={() => setConfirm(false)}>{t.cancel}</button>
            </div>
          </div>
        ) : (
          <button type="button" className={btnPrimary} disabled={!date || !time || !place} onClick={() => setConfirm(true)}>
            <PiEye className="h-5 w-5" aria-hidden /> {t.reveal}
          </button>
        )}
      </div>
    </Card>
  );
}

function Comparison({ p, locale, name }: { p: Prediction; locale: Locale; name: (k: string) => string }) {
  const t = useT(bkText);
  const c = p.comparison!;
  const a = p.actual!;
  const gl = (gs: BkGraha[]) => (gs.length ? gs.map((g) => grahaName(g, locale)).join(" + ") : "—");
  const tick = (ok: boolean) => (ok ? <PiCheckCircle className="inline h-4 w-4 text-success" aria-label={t.yes} /> : <PiXCircle className="inline h-4 w-4 text-danger" aria-label={t.no} />);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <Card title={`${t.score} ${c.score.points}/${c.score.max}`}>
          <KV
            rows={[
              [t.houseMatches, `${c.house_matches.points}/${c.house_matches.max}`],
              [t.clusterScore, `${c.cluster_score.points}/${c.cluster_score.max}`],
              [t.byChance, t.chanceLine(c.chance.expected_points, c.chance.p_value, c.chance.samples)],
            ]}
          />
          <div className="mt-3"><Notice>{t.oneChart}</Notice></div>
        </Card>
        <Card title={t.eachGraha}>
          <ul className="divide-y divide-line">
            {c.items.map((it) => (
              <li key={it.key} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="body-5 flex items-center gap-2 text-ink">{tick(it.match)} {name(it.key)}</span>
                <span className="caption-1 text-ink-soft">
                  {rashiName(it.predicted, locale)} → {rashiName(it.actual, locale)}
                  {it.key !== "Lagna" ? ` (${t.houseWord(it.predicted_house ?? 0)} → ${it.actual_house})` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title={t.eachBhav}>
          <ul className="divide-y divide-line">
            {c.bhava.map((b) => (
              <li key={b.house} className="py-2">
                <p className="body-5 flex items-center gap-2 text-ink">{tick(b.rashi_match)} {t.houseWord(b.house)} · {rashiName(b.predicted.rashi, locale)} / {rashiName(b.actual.rashi, locale)}</p>
                <p className="caption-1 text-ink-soft">{gl(b.predicted.planets)} / {gl(b.actual.planets)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <aside className="space-y-6 lg:col-span-2">
        <Card title={t.realChart}>
          <NorthIndianChart houses={chartHouses(a.lagna.rashi, rashisFrom(a.planets))} label={t.realChart} lagnaLabel={t.asc} className="mx-auto w-full max-w-sm" />
          {(a.warnings ?? []).map((w) => (
            <p key={w} className="caption-2 mt-2 text-ink-soft">{w}</p>
          ))}
        </Card>
        {c.clusters.length > 0 && (
          <Card title={t.clusters}>
            <ul className="space-y-2">
              {c.clusters.map((cl) => (
                <li key={cl.house} className="caption-1 text-ink-soft">
                  {t.houseWord(cl.house)} ({rashiName(cl.rashi, locale)}) {gl(cl.members)}: {t.together} {tick(cl.together)}, {t.sameRashi} {tick(cl.same_rashi)}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </aside>
    </div>
  );
}
