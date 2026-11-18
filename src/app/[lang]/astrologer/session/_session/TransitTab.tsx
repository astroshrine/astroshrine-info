"use client";

import { PiCalendarCheck, PiPlanet } from "react-icons/pi";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { day, grahaAbbr, lordName, nakshatraName, rashiName, type Sheet, type Transits } from "@/lib/jyotish";
import { Card } from "../../_console/ui";
import DesignChart, { type ChartCell } from "./DesignChart";
import { dt } from "./design";
import { dashaChanges, GRAHA_COLOR, lagnaRow, rowOf } from "./kundliData";
import { text } from "./messages";
import { Head } from "./parts";
import type { Request } from "../../../kundli/_components/useJyotish";

const COLS = "grid grid-cols-[1.1fr_.3fr_1fr_.9fr_1.6fr_.7fr_.7fr] gap-2";
const NO_RETRO = new Set(["Rahu", "Ketu"]);

/** Today's planets over the birth chart (from the sheet), and the changes in the next 12 months: dasha periods and sign changes. */
export default function TransitTab({ sheet, transits, now, name }: { sheet: Sheet; transits: Request<Transits>; now: number; name: string }) {
  const t = useT(dt);
  const m = useT(text);
  const locale = useLocale();
  const g = sheet.gochar;
  const fromLagna = g ? g.planets.every((p) => p.house_from_lagna !== null) : true;
  const base = (fromLagna ? lagnaRow(sheet) : rowOf(sheet, "Moon"))?.rashi ?? 1;
  const cells: ChartCell[] = Array.from({ length: 12 }, (_, i) => ({
    sign: ((base - 1 + i) % 12) + 1,
    items: g
      ? g.planets
          .filter((p) => (fromLagna ? p.house_from_lagna : p.house_from_moon) === i + 1)
          .map((p) => ({ ab: grahaAbbr(p.graha, locale) + (p.retro && !NO_RETRO.has(p.graha) ? ` (${t.retroMark})` : ""), deg: `${parseInt(p.dms, 10)}°` }))
      : [],
  }));
  const fmt = (iso: string) => new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(Date.parse(iso.slice(0, 10) + "T00:00:00Z"));

  const to = new Date(now);
  to.setMonth(to.getMonth() + 12);
  type Ev = { at: string; kind: "dasha" | "transit"; text: string };
  const events: Ev[] = [
    ...dashaChanges(sheet, now).map((c) => ({
      at: c.at,
      kind: "dasha" as const,
      text: t.evDasha(t.levels[c.lords.length - 1] ?? "", c.lords.map((l) => lordName(l, locale)).join(" – ")),
    })),
    ...(transits.data?.segments ?? [])
      .filter((s) => Date.parse(s.start) > now && Date.parse(s.start) <= to.getTime())
      .map((s) => ({ at: s.start, kind: "transit" as const, text: t.evTransit(lordName(s.planet, locale), rashiName(s.rashi, locale), t.ord[s.house_from_lagna - 1] ?? String(s.house_from_lagna)) })),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  return (
    <div className="flex flex-col gap-6">
      {g && (
        <Card className="px-6 py-[22px]">
          <Head icon={PiPlanet} id="trt">
            {t.trTitle(day(g.at))}
          </Head>
          <div className="mb-3.5 mt-1 text-[13.5px] text-ink-soft">{t.trSub(name)}</div>
          <DesignChart cells={cells} label={t.trAlt(name)} />
          <div className="mt-4 overflow-x-auto">
            <div role="table" aria-labelledby="trt" className="min-w-[560px] text-[15px]">
              <div role="row" className={`${COLS} rounded-[10px] bg-surface-inverse px-2.5 py-2.5 text-[12.5px] font-bold text-ink-inverse`}>
                <span role="columnheader">{t.hPlanet}</span>
                <span role="columnheader" title={t.retro}>
                  {t.hR}
                </span>
                <span role="columnheader">{t.hDeg}</span>
                <span role="columnheader">{t.hSign}</span>
                <span role="columnheader">{t.hNak}</span>
                <span role="columnheader">{t.hFromAsc}</span>
                <span role="columnheader">{t.hFromMoon}</span>
              </div>
              {g.planets.map((p) => (
                <div key={p.graha} role="row" className={`${COLS} items-center border-b border-line px-2.5 py-[9px] transition hover:bg-[#FFF7E3]`}>
                  <span role="cell" className="flex items-center gap-2 font-bold">
                    <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: GRAHA_COLOR[p.graha] }} />
                    {lordName(p.graha, locale)}
                  </span>
                  <span role="cell" className="font-extrabold text-danger">
                    {p.retro ? t.retroMark : ""}
                  </span>
                  <span role="cell" className="tabular-nums">
                    {p.dms}
                  </span>
                  <span role="cell">{rashiName(p.rashi, locale)}</span>
                  <span role="cell">
                    {nakshatraName(p.nakshatra, locale)} {p.pada}
                  </span>
                  <span role="cell" className="font-bold">
                    {p.house_from_lagna !== null ? t.ord[p.house_from_lagna - 1] : "—"}
                  </span>
                  <span role="cell">{t.ord[p.house_from_moon - 1]}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card className="px-6 py-[22px]">
        <Head icon={PiCalendarCheck} id="evt">
          {t.evTitle}
        </Head>
        {transits.loading && <div aria-busy="true" aria-label={t.loadingTool} className="mt-3 h-16 animate-pulse rounded-2xl bg-surface-sunken" />}
        {transits.error != null && (
          <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-sm text-danger">
            {t.transitFailed}
            <button type="button" onClick={transits.retry} className="cursor-pointer font-bold underline">
              {m.retry}
            </button>
          </div>
        )}
        {!transits.loading && events.length === 0 && <p className="m-0 mt-3 text-[15px] text-ink-soft">{t.evNone}</p>}
        <div className="mt-3 flex flex-col">
          {events.map((e) => (
            <div key={e.kind + e.at + e.text} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[10px] border-t border-line px-1.5 py-3 transition hover:bg-[#FFF7E3]">
              <span className="min-w-[120px] font-extrabold tabular-nums">{fmt(e.at)}</span>
              <span className={`inline-flex h-6 items-center rounded-full px-[9px] text-[11.5px] font-bold ${e.kind === "dasha" ? "bg-surface-inverse text-brand" : "bg-surface-sunken text-brand-strong"}`}>{e.kind === "dasha" ? t.dashaTag : t.transitTag}</span>
              <span className="min-w-0 flex-[1_1_220px] text-[15px]">
                {e.text} {e.kind === "transit" && <span className="text-[13px] text-ink-soft">({t.approx})</span>}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
