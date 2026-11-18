"use client";

import { PiCompass, PiMoonStars, PiSparkle, PiStar } from "react-icons/pi";
import { PiClock } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { lordName, nakshatraName, rashiName, runningIndex, type Sheet } from "@/lib/jyotish";
import { Card } from "../../_console/ui";
import DesignChart from "./DesignChart";
import { dt } from "./design";
import { d1Cells, GRAHA_COLOR, houseOf, lagnaRow, rowOf } from "./kundliData";
import { Head } from "./parts";

const COLS = "grid grid-cols-[1.2fr_.35fr_1.1fr_.9fr_1.4fr_.5fr_.5fr] gap-2";

/** The birth chart, the four facts under it and the planet table, from the customer's kundli sheet. */
export default function KundliTab({ sheet, now, name }: { sheet: Sheet; now: number; name: string }) {
  const t = useT(dt);
  const locale = useLocale();
  const lagna = lagnaRow(sheet);
  const moon = rowOf(sheet, "Moon");
  const periods = sheet.dasha.vimshottari.periods;
  const md = periods[runningIndex(periods, now)];
  const ad = md?.sub?.find((p) => Date.parse(p.start) <= now && now < Date.parse(p.end));
  const pd = ad?.sub?.find((p) => Date.parse(p.start) <= now && now < Date.parse(p.end));
  const running = [md, ad, pd].filter(Boolean).map((p) => lordName(p!.lord, locale)).join(" – ");
  const tiles = [
    { icon: PiSparkle, label: t.tLagna, value: rashiName(lagna.rashi, locale) },
    { icon: PiMoonStars, label: t.tMoon, value: moon ? rashiName(moon.rashi, locale) : "" },
    { icon: PiStar, label: t.tNak, value: moon ? nakshatraName(moon.nakshatra, locale) : "" },
    { icon: PiClock, label: t.tDasha, value: running },
  ];
  return (
    <div className="flex flex-col gap-6">
      <Card className="px-6 py-[22px]">
        <div className="flex flex-col gap-3.5">
          <DesignChart cells={d1Cells(sheet, locale, t.ascAb, t.retroMark)} label={t.chartAlt(name)} max={500} />
          <div className="text-center text-[13px] font-semibold text-ink">{t.chartSub}</div>
          <div className="grid grid-cols-2 gap-2.5">
            {tiles.map((x) => (
              <div key={x.label} className="flex min-w-0 items-center gap-2.5 rounded-[14px] border border-line bg-surface-page px-3 py-2.5">
                <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-surface-sunken text-brand-strong">
                  <x.icon className="h-[17px] w-[17px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink-soft">{x.label}</div>
                  <div className="text-[15px] font-bold">{x.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="px-6 py-[22px]">
        <Head icon={PiCompass} id="ptt">
          {t.tableTitle}
        </Head>
        <div className="mt-3 overflow-x-auto">
          <div role="table" aria-labelledby="ptt" className="min-w-[560px] text-[15px]">
            <div role="row" className={`${COLS} py-2 text-[12.5px] font-bold text-ink-soft`}>
              <span role="columnheader">{t.hPlanet}</span>
              <span role="columnheader" title={t.retro}>
                {t.hR}
              </span>
              <span role="columnheader">{t.hDeg}</span>
              <span role="columnheader">{t.hSign}</span>
              <span role="columnheader">{t.hNak}</span>
              <span role="columnheader">{t.hPada}</span>
              <span role="columnheader">{t.hHouse}</span>
            </div>
            {sheet.rows.map((r) => (
              <div key={r.graha} role="row" className={`${COLS} items-center border-t border-line py-[9px] transition hover:bg-[#FFF7E3]`}>
                <span role="cell" className="flex items-center gap-2 font-bold">
                  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: GRAHA_COLOR[r.graha] }} />
                  {r.graha === "Lagna" ? t.ascFull : lordName(r.graha, locale)}
                </span>
                <span role="cell" className="font-extrabold text-danger">
                  {r.retro && r.graha !== "Lagna" ? t.retroMark : ""}
                </span>
                <span role="cell" className="tabular-nums">
                  {r.dms}
                </span>
                <span role="cell">{rashiName(r.rashi, locale)}</span>
                <span role="cell">{nakshatraName(r.nakshatra, locale)}</span>
                <span role="cell">{r.pada}</span>
                <span role="cell" className="font-bold">
                  {houseOf(sheet, r)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
