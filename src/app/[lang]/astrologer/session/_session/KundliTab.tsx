"use client";

import { PiClock, PiStar } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import {
  day,
  dignityName,
  grahaName,
  lordName,
  nakshatraName,
  rashiName,
  runningIndex,
  sheetLagnaHouses,
  type DashaNode,
  type Sheet,
} from "@/lib/jyotish";
import NorthIndianChart from "../../../kundli/_components/NorthIndianChart";
import { Card, Pill } from "../../_console/ui";
import { text } from "./messages";
import { Head, sectionClass } from "./parts";

/** The lagna chart, the planet table and the dasha timelines, all from the customer's kundli sheet. */
export default function KundliTab({ sheet, now }: { sheet: Sheet; now: number }) {
  const t = useT(text);
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-6">
      <Card className={sectionClass}>
        <Head icon={PiStar}>{t.chartTitle}</Head>
        <div className="mx-auto mt-3.5 w-full max-w-[500px]">
          <NorthIndianChart houses={sheetLagnaHouses(sheet)} label={t.chartAlt} />
        </div>
      </Card>

      <Card className={sectionClass}>
        <Head icon={PiStar} id="ptt">
          {t.planetTitle}
        </Head>
        <p className="m-0 mt-2 text-sm text-ink-soft">{t.planetHint}</p>
        <div className="mt-3 overflow-x-auto">
          <table aria-labelledby="ptt" className="w-full min-w-[560px] text-left text-[15px]">
            <thead>
              <tr className="text-[12.5px] font-bold text-ink-soft">
                {t.columns.map((h) => (
                  <th key={h} scope="col" className="py-2 pr-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((r) => {
                const tags = [
                  r.dignity ? dignityName(r.dignity, locale) : null,
                  r.retro && r.graha !== "Rahu" && r.graha !== "Ketu" && r.graha !== "Lagna" ? t.retro : null,
                  r.combust ? t.combust : null,
                ].filter(Boolean);
                return (
                  <tr key={r.graha} className="border-t border-line transition hover:bg-[#FFF7E3]">
                    <th scope="row" className="py-[9px] pr-3 font-bold">
                      {r.graha === "Lagna" ? t.lagna : grahaName(r.graha, locale)}
                    </th>
                    <td className="py-[9px] pr-3">
                      {rashiName(r.rashi, locale)} <span className="text-[13px] tabular-nums text-ink-soft">{r.dms}</span>
                    </td>
                    <td className="py-[9px] pr-3">
                      {nakshatraName(r.nakshatra, locale)} {r.pada}
                    </td>
                    <td className="py-[9px] pr-3">{grahaName(r.nak_lord, locale)}</td>
                    <td className="py-[9px] pr-3">{tags.length ? tags.join(", ") : t.neutral}</td>
                    <td className="py-[9px] pr-3 font-bold tabular-nums">
                      {r.shadbala ? <span className={r.shadbala.ratio >= 1 ? "text-success" : "text-warning"}>{r.shadbala.ratio.toFixed(2)}</span> : <span className="font-normal text-ink-soft">{t.none}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <DashaCard title={t.dashaTitle} tree={sheet.dasha.vimshottari} depth={3} now={now} />
      <DashaCard title={t.yoginiTitle} tree={sheet.dasha.yogini} depth={2} now={now} />
    </div>
  );
}

function DashaCard({ title, tree, depth, now }: { title: string; tree: Sheet["dasha"]["vimshottari"]; depth: number; now: number }) {
  const t = useT(text);
  const locale = useLocale();
  const idx = runningIndex(tree.periods, now);
  return (
    <Card className={sectionClass}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <Head icon={PiClock}>{title}</Head>
        <Pill className="h-8 text-[13px]">{t.balance(lordName(tree.balance.lord, locale), tree.balance.years.toFixed(1))}</Pill>
      </div>
      {idx >= 0 && (
        <div className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
          <span className="inline-block h-[9px] w-[9px] shrink-0 rounded-full bg-online" />
          {t.levels[0]}: <b className="text-ink">{lordName(tree.periods[idx].lord, locale)}</b>
        </div>
      )}
      <div className="mt-3 flex flex-col gap-1">
        {tree.periods.map((p) => (
          <DashaRow key={p.start} p={p} level={0} depth={depth} now={now} />
        ))}
      </div>
    </Card>
  );
}

/** One period; it opens to the periods inside it, and starts open while it is running. */
function DashaRow({ p, level, depth, now }: { p: DashaNode; level: number; depth: number; now: number }) {
  const t = useT(text);
  const locale = useLocale();
  const running = Date.parse(p.start) <= now && now < Date.parse(p.end);
  const label = (
    <span className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
      <span className={level === 0 ? "font-bold" : "font-semibold"}>
        {lordName(p.lord, locale)}
        {p.graha ? <span className="ml-1 text-[13px] font-normal text-ink-soft">({grahaName(p.graha, locale)})</span> : null}
        {running && <span className="ml-2 text-[13px] font-bold text-brand-strong">{t.running}</span>}
      </span>
      <span className="text-[13px] tabular-nums text-ink-soft">{t.period(day(p.start), day(p.end))}</span>
    </span>
  );
  const children = level + 1 < depth ? p.sub : undefined;
  if (!children?.length) return <div className={`flex rounded-xl px-3 py-2 ${running ? "bg-surface-sunken" : ""}`}>{label}</div>;
  return (
    <details open={running} className={`rounded-xl ${running ? "bg-surface-sunken" : ""}`}>
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-surface-sunken">{label}</summary>
      <div className="flex flex-col gap-1 pb-2 pl-4">
        <p className="m-0 px-3 text-[12.5px] font-bold text-ink-soft">{t.levels[level + 1]}</p>
        {children.map((c) => (
          <DashaRow key={c.start} p={c} level={level + 1} depth={depth} now={now} />
        ))}
      </div>
    </details>
  );
}
