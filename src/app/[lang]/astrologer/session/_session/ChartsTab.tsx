"use client";

import { PiDiamond, PiMoonStars, PiTrendUp } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { sheetChartHouses, type Sheet } from "@/lib/jyotish";
import { Card } from "../../_console/ui";
import DesignChart from "./DesignChart";
import { dt } from "./design";
import { houseCells, lagnaRow, savCells } from "./kundliData";
import { Head } from "./parts";

/** The charts the kundli sheet sends ready made (Moon chart, navamsha) and the Sarvashtakavarga bindus. */
export default function ChartsTab({ sheet, name }: { sheet: Sheet; name: string }) {
  const t = useT(dt);
  const locale = useLocale();
  const retro = () => ` (${t.retroMark})`;
  return (
    <div className="flex flex-col gap-6">
      <Card className="px-6 py-[22px]">
        <Head icon={PiMoonStars}>{t.moonTitle}</Head>
        <div className="mt-3.5">
          <DesignChart cells={houseCells(sheetChartHouses(sheet.charts.chandra), locale, retro, { rashi: lagnaRow(sheet).rashi, label: t.ascAb })} label={t.moonAlt(name)} />
        </div>
      </Card>
      <Card className="px-6 py-[22px]">
        <Head icon={PiDiamond}>{t.d9Title}</Head>
        <div className="mt-3.5">
          <DesignChart cells={houseCells(sheetChartHouses(sheet.charts.navamsha), locale, retro)} label={t.d9Alt(name)} />
        </div>
      </Card>
      <Card className="px-6 py-[22px]">
        <Head icon={PiTrendUp}>{t.savTitle(sheet.sav_total)}</Head>
        <div className="mt-3.5">
          <DesignChart cells={savCells(sheet)} label={t.savAlt(name)} />
        </div>
        <div className="mt-2.5 text-center text-[13.5px] font-semibold text-ink">{t.savNote}</div>
      </Card>
    </div>
  );
}
