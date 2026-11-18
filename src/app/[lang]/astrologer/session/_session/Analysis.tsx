"use client";

import { useState } from "react";
import { PiCheckCircle, PiClockCounterClockwise, PiDiamond, PiNotePencil, PiSparkle, PiTrendUp, PiWarning } from "react-icons/pi";
import { PiSun } from "react-icons/pi";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { cancelName, lordName, nakshatraName, rashiName, saturnName, termName, vaarName, wallToEpoch, type Chart, type Panchang, type Sheet, type Transits, type YogaHit } from "@/lib/jyotish";
import type { OrderRow } from "@/lib/services/astrologerEarnings";
import { Card } from "../../_console/ui";
import type { Request } from "../../../kundli/_components/useJyotish";
import { avakahada } from "./avakahada";
import { dt } from "./design";
import { houseFrom, lagnaRow, rowOf, SIGN_LORD } from "./kundliData";
import { Head } from "./parts";

const card = "px-6 py-[22px]";
const heading = "text-[21px]";
const NOTES_KEY = (clientId: string) => `astroshrine.astrologer.notes.${clientId}`;

function readNotes(clientId: string): string {
  try {
    return localStorage.getItem(NOTES_KEY(clientId)) ?? "";
  } catch {
    return "";
  }
}

/** The three columns under the dasha: basic details, planet strength with Sade Sati, yogas with earlier consultations. */
export default function Analysis({
  sheet,
  now,
  name,
  chart,
  transits,
  panchang,
  orders,
}: {
  sheet: Sheet;
  now: number;
  name: string;
  chart: Request<Chart>;
  transits: Request<Transits>;
  panchang: Request<Panchang>;
  orders: OrderRow[] | null;
}) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-6 min-[1101px]:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-6 [&>section:last-child]:flex-1">
        <Basic sheet={sheet} panchang={panchang} />
      </div>
      <div className="flex min-w-0 flex-col gap-6 [&>section:last-child]:flex-1">
        <Strength sheet={sheet} />
        <SadeSati sheet={sheet} now={now} transits={transits} />
      </div>
      <div className="flex min-w-0 flex-col gap-6 [&>section:last-child]:flex-1">
        <Yogas chart={chart} />
        <History name={name} orders={orders} />
      </div>
    </div>
  );
}

function Basic({ sheet, panchang }: { sheet: Sheet; panchang: Request<Panchang> }) {
  const t = useT(dt);
  const locale = useLocale();
  const lagna = lagnaRow(sheet);
  const moon = rowOf(sheet, "Moon");
  const sun = rowOf(sheet, "Sun");
  const items: { k: string; v: string; wide?: boolean }[] = [];
  if (lagna) items.push({ k: t.bLagna, v: t.lordOf(rashiName(lagna.rashi, locale), lordName(SIGN_LORD[lagna.rashi - 1], locale)) });
  if (moon) items.push({ k: t.bMoon, v: t.lordOf(rashiName(moon.rashi, locale), lordName(SIGN_LORD[moon.rashi - 1], locale)) });
  if (moon) items.push({ k: t.bNak, v: t.nakLine(nakshatraName(moon.nakshatra, locale), moon.pada, lordName(moon.nak_lord, locale)), wide: true });
  if (sun) items.push({ k: t.bSun, v: rashiName(sun.rashi, locale) });
  if (moon) {
    const a = avakahada(moon);
    items.push({ k: t.bVarna, v: t.varna[a.varna] }, { k: t.bVashya, v: t.vashya[a.vashya] }, { k: t.bYoni, v: t.yoni[a.yoni] }, { k: t.bGana, v: t.gana[a.gana] }, { k: t.bNadi, v: t.nadi[a.nadi] });
  }
  // Tithi, yoga and karana: the ones running at the minute of birth, from the panchang of the birth date.
  const p = panchang.data;
  if (p) {
    const at = wallToEpoch(sheet.birth.date, sheet.birth.time.slice(0, 5), sheet.birth.tz);
    const endMs = (iso: string) => (/[zZ]$|[+-]\d\d:?\d\d$/.test(iso) ? Date.parse(iso) : wallToEpoch(iso.slice(0, 10), iso.slice(11, 16), sheet.birth.tz));
    const at_ = (list: { name: string; end: string }[]) => list.find((a) => endMs(a.end) > at) ?? list[list.length - 1];
    const yoga = at_(p.yoga);
    const tithi = at_(p.tithi);
    const karana = at_(p.karana);
    if (yoga) items.push({ k: t.bYoga, v: termName(yoga.name, locale) });
    if (tithi) items.push({ k: t.bTithi, v: t.tithiLine(termName(tithi.name, locale), t.paksha[p.paksha] ?? "") });
    if (karana) items.push({ k: t.bKarana, v: termName(karana.name, locale) });
  }
  items.push({ k: t.bDay, v: vaarName(sheet.vaar, locale), wide: true });
  return (
    <Card className={card}>
      <Head icon={PiDiamond} small>
        {t.basicTitle}
      </Head>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        {items.map((x) => (
          <div key={x.k} className={`min-w-0 rounded-xl border border-line bg-surface-page px-3 py-[9px] ${x.wide ? "col-span-full" : ""}`}>
            <div className="text-xs font-bold text-brand-strong">{x.k}</div>
            <div className="text-[14.5px] font-bold">{x.v}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Strength({ sheet }: { sheet: Sheet }) {
  const t = useT(dt);
  const locale = useLocale();
  const rows = sheet.rows.filter((r) => r.shadbala && r.graha !== "Lagna" && r.graha !== "Rahu" && r.graha !== "Ketu");
  return (
    <Card className={card}>
      <Head icon={PiTrendUp} small>
        {t.sbTitle}
      </Head>
      <div className="mt-3 flex flex-col gap-1">
        {rows.map((r) => {
          const v = r.shadbala!.ratio;
          const weak = v < 1;
          return (
            <div key={r.graha} className="grid grid-cols-[78px_1fr_92px] items-center gap-2.5 py-1.5">
              <span className="text-[14.5px] font-bold">{lordName(r.graha, locale)}</span>
              <span className="relative block h-3 rounded-xl bg-[#F1ECE1]">
                <span className={`block h-full rounded-xl ${weak ? "bg-[#E07A2E]" : "bg-online"}`} style={{ width: `${Math.min(100, (v / 1.5) * 100).toFixed(1)}%` }} />
                <span className="absolute -bottom-[5px] -top-[5px] left-[66.6%] w-0.5 bg-surface-inverse" />
              </span>
              <span className="flex items-center gap-1.5 font-extrabold tabular-nums">
                {v.toFixed(2)}
                {weak && <span className="inline-flex h-[22px] items-center rounded-full bg-danger-soft px-[7px] text-[11px] font-bold text-danger">{t.weak}</span>}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[13.5px] text-ink-soft">{t.sbNote}</div>
    </Card>
  );
}

function SadeSati({ sheet, now, transits }: { sheet: Sheet; now: number; transits: Request<Transits> }) {
  const t = useT(dt);
  const locale = useLocale();
  const intl = INTL_LOCALE[locale];
  const saturn = sheet.gochar?.planets.find((p) => p.graha === "Saturn");
  const moon = rowOf(sheet, "Moon");
  const pos = saturn && moon ? houseFrom(saturn.rashi, moon.rashi) : null;
  const cycles = transits.data?.saturn_cycles ?? [];
  const current = cycles.find((c) => Date.parse(c.start) <= now && now < Date.parse(c.end));
  const next = cycles.find((c) => Date.parse(c.start) > now);
  const nowRunning = current ? true : pos !== null && [12, 1, 2, 4, 8].includes(pos);
  const date = (iso: string) => new Intl.DateTimeFormat(intl, { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.parse(iso.slice(0, 10) + "T00:00:00Z"));
  return (
    <Card className={card}>
      <Head icon={PiSun} small>
        {t.ssTitle}
      </Head>
      <div className="mt-3">
        <span className={`inline-flex h-[30px] items-center gap-1.5 rounded-full px-3 text-[13px] font-bold ${nowRunning ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>
          {nowRunning ? <PiWarning className="h-3.5 w-3.5" aria-hidden /> : <PiCheckCircle className="h-3.5 w-3.5" aria-hidden />}
          {current ? saturnName(current.kind, locale) : nowRunning ? t.ssRunning : t.ssNow}
        </span>
      </div>
      {saturn && moon && pos !== null && <p className="m-0 mt-2.5 text-[14.5px] leading-[1.6]">{t.ssText(rashiName(saturn.rashi, locale), t.ord[pos - 1], rashiName(moon.rashi, locale))}</p>}
      {transits.loading && <div aria-busy="true" aria-label={t.ssLoading} className="mt-2.5 h-10 animate-pulse rounded-xl bg-surface-sunken" />}
      {next && <div className="mt-2.5 rounded-xl bg-surface-sunken px-3 py-2.5 text-sm font-semibold">{t.ssNext(saturnName(next.kind, locale), date(next.start))}</div>}
    </Card>
  );
}

function Yogas({ chart }: { chart: Request<Chart> }) {
  const t = useT(dt);
  const locale = useLocale();
  const c = chart.data;
  // One card per yoga or dosha; it counts as formed if any instance is not cancelled.
  const group = (hits: YogaHit[]) => {
    const byId = new Map<string, { hit: YogaHit; active: boolean; reasons: Set<string> }>();
    for (const h of hits) {
      const e = byId.get(h.id) ?? { hit: h, active: false, reasons: new Set<string>() };
      e.active ||= !h.cancelled;
      if (h.cancelled) h.cancelled_by.forEach((r) => e.reasons.add(r));
      byId.set(h.id, e);
    }
    return [...byId.values()];
  };
  const yogas = c ? group(c.yogas).filter((x) => x.active) : [];
  const doshas = c ? group(c.doshas.list).filter((x) => x.active) : [];
  return (
    <Card className={card}>
      <Head icon={PiSparkle} small>
        {t.yogaTitle}
      </Head>
      <div className="mt-3.5 flex flex-col gap-2">
        {chart.loading && <div aria-busy="true" aria-label={t.loadingTool} className="h-24 animate-pulse rounded-[14px] bg-surface-sunken" />}
        {chart.error != null && (
          <button type="button" onClick={chart.retry} className="cursor-pointer text-left text-sm font-bold text-danger underline">
            {t.loadingTool} ↻
          </button>
        )}
        {c && yogas.length === 0 && doshas.length === 0 && <p className="m-0 text-[15px] text-ink-soft">{t.yogaNone}</p>}
        {yogas.map(({ hit }) => (
          <div key={hit.id} className="rounded-[14px] border-[1.5px] border-[#9ED3B0] bg-[#EEF8F1] px-3.5 py-3">
            <b className="block text-[15.5px] text-success">{locale === "hi" ? hit.name_hi : hit.name_en}</b>
            {locale === "hi" && <span className="text-sm">{hit.name_en}</span>}
          </div>
        ))}
        {doshas.map(({ hit }) => (
          <div key={hit.id} className="rounded-[14px] border-[1.5px] border-[#F2B98A] bg-[#FFF1E6] px-3.5 py-3">
            <b className="block text-[15.5px] text-warning">{locale === "hi" ? hit.name_hi : hit.name_en}</b>
            {locale === "hi" && <span className="text-sm">{hit.name_en}</span>}
          </div>
        ))}
        {c && group([...c.yogas, ...c.doshas.list]).some((x) => !x.active) && (
          <p className="m-0 text-[13px] text-ink-soft">
            {t.yogaCancelled}:{" "}
            {group([...c.yogas, ...c.doshas.list])
              .filter((x) => !x.active)
              .map((x) => (locale === "hi" ? x.hit.name_hi : x.hit.name_en) + (x.reasons.size ? ` (${[...x.reasons].map((r) => cancelName(r, locale)).join("; ")})` : ""))
              .join(", ")}
          </p>
        )}
      </div>
    </Card>
  );
}

function History({ name, orders }: { name: string; orders: OrderRow[] | null }) {
  const t = useT(dt);
  const locale = useLocale();
  const intl = INTL_LOCALE[locale];
  const fmt = (ts: number) => new Intl.DateTimeFormat(intl, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata" }).format(ts);
  return (
    <Card className={card}>
      <Head icon={PiClockCounterClockwise} small>
        {t.histTitle(name)}
      </Head>
      <div className="mt-2.5 flex flex-col">
        {orders && orders.length === 0 && <p className="m-0 border-t border-line pt-2.5 text-[14.5px] text-ink-soft">{t.histNone}</p>}
        {orders?.slice(0, 6).map((o, i) => {
          const mins = Math.round(o.timeSpent / 60_000);
          return (
            <div key={`${o.orderTs}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line py-2.5 text-[14.5px]">
              <b className="tabular-nums">{fmt(o.orderTs)}</b>
              <span>
                {o.orderType === "call" ? t.callKind : t.chatKind}
                {mins > 0 ? ` · ${t.minShort(mins)}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** Notes have no backend: they stay in this browser, per customer, and say so. */
export function Notes({ clientId }: { clientId: string }) {
  const t = useT(dt);
  const [notes, setNotes] = useState(() => readNotes(clientId));
  const change = (value: string) => {
    setNotes(value);
    try {
      if (value) localStorage.setItem(NOTES_KEY(clientId), value);
      else localStorage.removeItem(NOTES_KEY(clientId));
    } catch {
      /* private window: the notes last until the page closes */
    }
  };
  return (
    <Card className={card}>
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-surface-inverse text-brand shadow-[0_0_0_4px_var(--color-surface-sunken)]">
          <PiNotePencil className="h-5 w-5" />
        </span>
        <label htmlFor="nt" className={`font-display font-bold leading-tight ${heading}`}>
          {t.notesTitle}
        </label>
      </div>
      <div className="mb-2.5 mt-1.5 text-sm text-ink-soft">{t.notesSub}</div>
      <textarea
        id="nt"
        value={notes}
        onChange={(e) => change(e.target.value)}
        rows={5}
        className="w-full resize-y rounded-[14px] border border-line-strong bg-surface-page px-3.5 py-3 text-[15px] leading-[1.55] text-ink"
      />
    </Card>
  );
}
