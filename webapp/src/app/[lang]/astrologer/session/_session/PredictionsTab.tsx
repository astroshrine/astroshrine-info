"use client";

import { PiInfo, PiTarget } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { dignityName, lordName, rashiName, runningIndex, SLOW_GRAHAS, type Graha, type Sheet } from "@/lib/jyotish";
import { Card } from "../../_console/ui";
import { dt } from "./design";
import { housesRuledBy, houseOf, rowOf } from "./kundliData";
import { Head } from "./parts";

/** What the kundli calculates about the running dasha lords and the slow transits now. No verdicts: those are the astrologer's. */
export default function PredictionsTab({ sheet, now }: { sheet: Sheet; now: number }) {
  const t = useT(dt);
  const locale = useLocale();
  const periods = sheet.dasha.vimshottari.periods;
  const md = periods[runningIndex(periods, now)];
  const within = (nodes?: typeof periods) => nodes?.find((p) => Date.parse(p.start) <= now && now < Date.parse(p.end));
  const ad = within(md?.sub);
  const pd = within(ad?.sub);
  const lords = [md, ad, pd].flatMap((p, i) => (p ? [{ level: t.lordLevels[i], lord: p.lord }] : []));
  const lagna = sheet.rows.find((r) => r.graha === "Lagna");
  const moon = rowOf(sheet, "Moon");
  const ordOf = (h: number) => t.ord[h - 1];
  const lordLine = (g: Graha) => {
    const r = rowOf(sheet, g);
    if (!r) return "";
    const ruled = housesRuledBy(sheet, g);
    return t.lordLine(
      ordOf(houseOf(sheet, r)),
      rashiName(r.rashi, locale),
      r.dignity ? dignityName(r.dignity, locale) : "",
      ruled.length ? ruled.map(ordOf).join(locale === "hi" ? ", " : " and ") : "—",
      r.shadbala ? r.shadbala.ratio.toFixed(2) : "",
    );
  };
  const g = sheet.gochar;
  return (
    <div className="flex flex-col gap-6">
      <Card className="px-6 py-[22px]">
        <Head icon={PiTarget} id="lt">
          {t.lordsTitle}
        </Head>
        <div className="mt-3.5 flex flex-col gap-2.5">
          {lords.map((l) => (
            <div key={l.level} className="rounded-2xl border-[1.5px] border-line-strong bg-surface-page px-4 py-3.5">
              <b className="block text-base text-brand-strong">{t.lordTitle(l.level, lordName(l.lord, locale))}</b>
              <span className="text-[14.5px]">{lordLine(l.lord as Graha)}</span>
            </div>
          ))}
        </div>
        {g && lagna && moon && (
          <div className="mt-3.5 flex flex-col">
            {g.planets
              .filter((p) => SLOW_GRAHAS.includes(p.graha))
              .map((p) => (
                <div key={p.graha} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line py-2.5">
                  <span className="min-w-0 flex-[1_1_240px] text-[15px]">
                    {t.trLine(
                      lordName(p.graha, locale) + (p.retro && p.graha !== "Rahu" && p.graha !== "Ketu" ? ` (${t.retroMark})` : ""),
                      p.house_from_lagna !== null ? ordOf(p.house_from_lagna) : "—",
                      ordOf(p.house_from_moon),
                      sheet.sav[p.rashi - 1] ?? null,
                    )}
                  </span>
                </div>
              ))}
          </div>
        )}
        <div className="mt-2 flex items-start gap-2.5 rounded-[14px] bg-[#F7F3EA] px-3.5 py-3 text-sm font-semibold">
          <PiInfo className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand-strong" aria-hidden />
          {t.predNote}
        </div>
      </Card>
    </div>
  );
}
