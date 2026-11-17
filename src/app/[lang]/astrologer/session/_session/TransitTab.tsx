"use client";

import { PiPlanet, PiSparkle } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { day, grahaName, rashiName, saturnName, type ChartHouse, type Sheet, type Transits } from "@/lib/jyotish";
import NorthIndianChart from "../../../kundli/_components/NorthIndianChart";
import { Card, Pill } from "../../_console/ui";
import { text } from "./messages";
import { Head, sectionClass } from "./parts";
import type { Request } from "../../../kundli/_components/useJyotish";

/** Today's transits over the birth chart (from the sheet), and Sade Sati / Dhaiya for the next 36 months (POST /v1/jyotish/transits). */
export default function TransitTab({ sheet, transits, now }: { sheet: Sheet; transits: Request<Transits>; now: number }) {
  const t = useT(text);
  const locale = useLocale();
  const g = sheet.gochar;
  const fromLagna = g ? g.planets.every((p) => p.house_from_lagna !== null) : true;
  const baseRashi = (fromLagna ? sheet.rows.find((r) => r.graha === "Lagna") : sheet.rows.find((r) => r.graha === "Moon"))?.rashi ?? 1;
  const houses: ChartHouse[] = g
    ? Array.from({ length: 12 }, (_, i) => ({
        house: i + 1,
        rashi: ((baseRashi - 1 + i) % 12) + 1,
        planets: g.planets.filter((p) => (fromLagna ? p.house_from_lagna : p.house_from_moon) === i + 1).map((p) => ({ graha: p.graha, retro: p.retro })),
      }))
    : [];

  return (
    <div className="flex flex-col gap-6">
      {g && (
        <Card className={sectionClass}>
          <Head icon={PiPlanet}>{t.gocharTitle}</Head>
          <p className="m-0 mt-2 text-sm text-ink-soft">{t.gocharHint(day(g.at), fromLagna)}</p>
          <div className="mx-auto mt-3.5 w-full max-w-[420px]">
            <NorthIndianChart houses={houses} label={t.gocharTitle} lagnaLabel={fromLagna ? undefined : t.moon} />
          </div>
          <ul className="m-0 mt-3.5 flex list-none flex-col p-0">
            {g.planets.map((p) => (
              <li key={p.graha} className="grid grid-cols-[110px_1fr] gap-2.5 border-t border-line py-[9px] text-[14.5px]">
                <span className="font-semibold text-ink-soft">{grahaName(p.graha, locale)}</span>
                <span className="font-semibold">{t.gocharRow(rashiName(p.rashi, locale), p.dms, p.retro && p.graha !== "Rahu" && p.graha !== "Ketu", p.house_from_lagna ?? p.house_from_moon)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className={sectionClass}>
        <Head icon={PiSparkle}>{t.saturnTitle}</Head>
        <p className="m-0 mt-2 text-sm text-ink-soft">{t.saturnHint}</p>
        {transits.loading ? (
          <div aria-busy="true" aria-label={t.loading} className="mt-3 h-20 animate-pulse rounded-2xl bg-surface-sunken" />
        ) : transits.error ? (
          <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 rounded-[14px] bg-danger-soft px-4 py-3 text-sm text-danger">
            {t.calcFailed}
            <button type="button" onClick={transits.retry} className="cursor-pointer font-bold underline">
              {t.retry}
            </button>
          </div>
        ) : transits.data && transits.data.saturn_cycles.length === 0 ? (
          <p className="m-0 mt-3 text-[15px]">{t.saturnNone}</p>
        ) : (
          <ul className="m-0 mt-3.5 flex list-none flex-col gap-2.5 p-0">
            {transits.data?.saturn_cycles.map((c) => {
              const current = Date.parse(c.start) <= now && now < Date.parse(c.end);
              return (
                <li key={c.kind + c.start} className={`rounded-2xl px-4 py-3.5 ${current ? "border-[1.5px] border-brand bg-surface-sunken" : "border border-line bg-surface-page"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-base">{saturnName(c.kind, locale)}</b>
                    {current && <Pill className="h-6 text-xs">{t.now}</Pill>}
                  </div>
                  <div className="text-sm text-ink-soft">{t.period(day(c.start), day(c.end))}</div>
                  {c.phases.length > 1 && (
                    <ul className="m-0 mt-2 list-none p-0 text-[13.5px] text-ink-soft">
                      {c.phases.map((p) => (
                        <li key={p.phase + p.start}>
                          {saturnName(p.phase, locale)}: {t.period(day(p.start), day(p.end))}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
