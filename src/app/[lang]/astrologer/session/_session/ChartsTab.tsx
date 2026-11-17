"use client";

import { PiDiamond, PiStar, PiTrendUp } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { sheetChartHouses, type Sheet } from "@/lib/jyotish";
import NorthIndianChart from "../../../kundli/_components/NorthIndianChart";
import { Card } from "../../_console/ui";
import { text } from "./messages";
import { Head, sectionClass } from "./parts";

/** The charts the kundli sheet sends ready made, and the Sarvashtakavarga points. */
export default function ChartsTab({ sheet }: { sheet: Sheet }) {
  const t = useT(text);
  const max = Math.max(...sheet.sav, 1);
  return (
    <div className="flex flex-col gap-6">
      <Card className={sectionClass}>
        <Head icon={PiStar}>{t.moonChart}</Head>
        <div className="mx-auto mt-3.5 w-full max-w-[470px]">
          <NorthIndianChart houses={sheetChartHouses(sheet.charts.chandra)} label={t.moonChart} lagnaLabel={t.moon} />
        </div>
      </Card>
      <Card className={sectionClass}>
        <Head icon={PiDiamond}>{t.navamsha}</Head>
        <div className="mx-auto mt-3.5 w-full max-w-[470px]">
          <NorthIndianChart houses={sheetChartHouses(sheet.charts.navamsha)} label={t.navamsha} />
        </div>
      </Card>
      <Card className={sectionClass}>
        <Head icon={PiDiamond}>{t.chalit}</Head>
        <div className="mx-auto mt-3.5 w-full max-w-[470px]">
          <NorthIndianChart houses={sheetChartHouses(sheet.charts.lagna_chalit)} label={t.chalit} />
        </div>
      </Card>
      <Card className={sectionClass}>
        <Head icon={PiTrendUp}>{t.savTitle}</Head>
        <p className="m-0 mt-2 text-sm text-ink-soft">{t.savHint(sheet.sav_total)}</p>
        <ol className="m-0 mt-3.5 grid list-none grid-cols-6 gap-2 p-0">
          {sheet.sav.map((b, i) => (
            <li key={i} className="flex flex-col items-center gap-1">
              <span aria-hidden className="flex h-20 w-full items-end overflow-hidden rounded-xl bg-surface-sunken">
                <span className="block w-full rounded-xl bg-brand" style={{ height: `${Math.round((b / max) * 100)}%` }} />
              </span>
              <span className="text-sm font-bold">{b}</span>
              <span className="text-center text-xs text-ink-soft">{t.house(i + 1)}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
