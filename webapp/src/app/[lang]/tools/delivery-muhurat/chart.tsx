"use client";

import { useState } from "react";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { GRAHAS, dignityName, grahaAbbr, grahaName, nakshatraName, rashiName, type Graha } from "@/lib/jyotish";
import { fill } from "@/lib/services/toolsBCommon";
import { SAPTA_GRAHAS, type Bi, type FullChart, type Lang, type ReportKind } from "@/lib/services/toolsBDelivery";
import NorthIndianChart from "../../kundli/_components/NorthIndianChart";
import { Card, Notice } from "../../kundli/_components/ui";
import { Pills } from "./fields";
import { dateLabel, dms, hm12, offsetMsOf, pickBi, wallClock } from "./logic";
import { dmText } from "./messages";

type Tab = "panchang" | "avakhada" | "vargas" | "ashtakavarga" | "dasha";
const TABS: Tab[] = ["panchang", "avakhada", "vargas", "ashtakavarga", "dasha"];

/** Every chart that is not a ranked muhurat says what it is. */
export function KindBanner({ kind }: { kind: ReportKind }) {
  const t = useT(dmText);
  if (kind === "muhurat") return null;
  return (
    <Notice tone="warning">
      <strong>{t.kind[kind]}.</strong> {t.kindHint[kind]}
    </Notice>
  );
}

type Placement = { graha: Graha; sign: number; retro?: boolean };

/** Whole sign houses from the lagna sign (house 1) for the North Indian chart. */
function northHouses(ascSign: number, placements: Placement[]) {
  return Array.from({ length: 12 }, (_, i) => {
    const rashi = ((ascSign - 1 + i) % 12) + 1;
    return { house: i + 1, rashi, planets: placements.filter((p) => p.sign === rashi).map((p) => ({ graha: p.graha, retro: !!p.retro })) };
  });
}

// South Indian chart: signs never move; [sign, col, row] on a 4x4 grid, Meena top left, clockwise.
const CELLS: [number, number, number][] = [
  [12, 0, 0], [1, 1, 0], [2, 2, 0], [3, 3, 0], [4, 3, 1], [5, 3, 2], [6, 3, 3], [7, 2, 3], [8, 1, 3], [9, 0, 3], [10, 0, 2], [11, 0, 1],
];
const C = 100;

function SouthIndianChart({ ascSign, placements, title, label }: { ascSign: number; placements: Placement[]; title: string; label: string }) {
  const locale = useLocale();
  const t = useT(dmText);
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={label} className="mx-auto h-auto w-full max-w-sm">
      <rect x={1} y={1} width={398} height={398} className="fill-surface-sunken stroke-brand" strokeWidth={2} rx={8} />
      {CELLS.map(([sign, col, row]) => {
        const x = col * C;
        const y = row * C;
        const here = placements.filter((p) => p.sign === sign);
        return (
          <g key={sign}>
            <rect x={x} y={y} width={C} height={C} className={`stroke-line-strong ${sign === ascSign ? "fill-surface-card" : "fill-transparent"}`} strokeWidth={1} />
            {sign === ascSign && <line x1={x} y1={y + 22} x2={x + 22} y2={y} className="stroke-brand" strokeWidth={1.5} />}
            <text x={x + C - 5} y={y + 13} fontSize={10} textAnchor="end" className="fill-ink-muted">
              {rashiName(sign, locale)}
            </text>
            {sign === ascSign && (
              <text x={x + 5} y={y + C - 6} fontSize={10} fontWeight={700} className="fill-brand-strong">
                {t.lagna}
              </text>
            )}
            {here.map((p, i) => (
              <text key={p.graha} x={x + (i % 2 ? 75 : 25)} y={y + 40 + Math.floor(i / 2) * 18} fontSize={14} fontWeight={700} textAnchor="middle" className="fill-ink">
                {grahaAbbr(p.graha, locale)}
                {p.retro ? "ᴿ" : ""}
              </text>
            ))}
          </g>
        );
      })}
      <text x={200} y={205} fontSize={16} fontWeight={700} textAnchor="middle" className="fill-brand-strong">
        {title}
      </text>
    </svg>
  );
}

function KV({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2">
          <dt className="caption-1 text-ink-soft">{k}</dt>
          <dd className="body-5 min-w-0 text-right text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Step 05: the newborn chart: North/South D1, planets, panchang, avakhada, the 16 vargas, ashtakavarga and dasha. */
export default function ChartStep({ full, kind, birthLocal, disclaimer, lang }: { full: FullChart; kind: ReportKind; birthLocal: string; disclaimer: Bi; lang: Lang }) {
  const t = useT(dmText);
  const locale = useLocale();
  const [style, setStyle] = useState<"north" | "south">("north");
  const [tab, setTab] = useState<Tab>("panchang");
  const [div, setDiv] = useState(9);
  const [openMd, setOpenMd] = useState<number | null>(null);
  const { chart, panchang: p, avakhada: av, ashtakavarga: ak, dasha } = full;
  const offset = offsetMsOf(birthLocal, chart.utcMs);
  const clock = (ms: number) => wallClock(ms, offset);
  const g = (x: Graha) => grahaName(x, locale);
  const [date, time] = birthLocal.split("T");

  const draw = (ascSign: number, placements: Placement[], title: string) =>
    style === "north" ? (
      <div className="mx-auto w-full max-w-sm">
        <NorthIndianChart houses={northHouses(ascSign, placements)} label={title} />
      </div>
    ) : (
      <SouthIndianChart ascSign={ascSign} placements={placements} title={title} label={title} />
    );
  const d1: Placement[] = GRAHAS.map((x) => ({ graha: x, sign: chart.planets[x].sign, retro: chart.planets[x].retro }));
  const varga = full.vargas.find((v) => v.div === div) ?? full.vargas[0];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="heading-6 text-ink">{t.chartTitle}</h2>
        <p className="body-6 mt-1 text-ink-soft">
          {fill(t.bornAt, { date: dateLabel(date, locale), time: hm12(time), place: chart.place?.name ?? "", tz: chart.place?.tz ?? "" })}
        </p>
      </div>
      <KindBanner kind={kind} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <Pills
            label={t.chartTitle}
            value={style}
            options={[
              { value: "north", label: t.north },
              { value: "south", label: t.south },
            ]}
            onChange={setStyle}
          />
          <div className="mt-4">{draw(chart.ascSign, d1, "D1")}</div>
          <p className="caption-2 mt-3 text-center text-ink-soft">
            {fill(t.lagnaLine, { sign: rashiName(chart.ascSign, locale), deg: dms(chart.ascDegInSign), nakshatra: nakshatraName(chart.ascNakshatra, locale), pada: chart.ascPada })}
          </p>
        </Card>

        <Card title={t.planetTable}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] border-collapse text-left">
              <thead>
                <tr className="caption-3 text-ink-muted">
                  {(["graha", "rashi", "nakshatra", "house"] as const).map((k) => (
                    <th key={k} scope="col" className="py-1 pr-2 font-medium">
                      {t.col[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GRAHAS.map((x) => {
                  const pp = chart.planets[x];
                  return (
                    <tr key={x} className="border-t border-line align-top">
                      <td className="body-5 py-1.5 pr-2 text-ink">
                        {g(x)}
                        {pp.retro ? ` (${t.retroShort})` : ""}
                        {pp.combust ? ` (${t.combustShort})` : ""}
                      </td>
                      <td className="caption-1 py-1.5 pr-2 text-ink-soft">
                        {rashiName(pp.sign, locale)} {dms(pp.degInSign)}
                        <span className="caption-3 block text-ink-muted">{dignityName(pp.dignity, locale)}</span>
                      </td>
                      <td className="caption-1 py-1.5 pr-2 text-ink-soft">
                        {nakshatraName(pp.nakshatra, locale)} {pp.pada}
                      </td>
                      <td className="caption-1 py-1.5 text-ink-soft">{pp.house}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Pills label={t.chartTitle} value={tab} options={TABS.map((k) => ({ value: k, label: t.tab[k] }))} onChange={setTab} />

      {tab === "panchang" && (
        <Card>
          <KV
            rows={[
              [t.p.vara, pickBi(p.varaName, lang)],
              [t.p.tithi, `${pickBi(p.tithi.name, lang)} (${t.paksha[p.tithi.paksha]})`],
              [t.p.nakshatra, `${pickBi(p.nakshatra.name, lang)} ${p.nakshatra.pada} · ${g(p.nakshatra.lord)}`],
              [t.p.yoga, pickBi(p.yoga.name, lang)],
              [t.p.karana, pickBi(p.karana.name, lang)],
              [t.p.sunrise, hm12(clock(p.sunrise).time)],
              [t.p.sunset, hm12(clock(p.sunset).time)],
            ]}
          />
          <p className="caption-3 mt-3 text-ink-muted">{fill(t.meta, { ayanamsa: chart.meta?.ayanamsaDeg?.toFixed(4) ?? "", node: chart.meta?.node ?? "", engine: chart.meta?.engine ?? "" })}</p>
        </Card>
      )}

      {tab === "avakhada" && (
        <Card>
          <KV
            rows={[
              ...(["varna", "vashya", "yoni", "gana", "nadi", "tatva", "tithi", "yoga", "karana", "vara"] as const).map((k): [string, string] => [t.av[k], pickBi(av[k], lang)]),
              [t.av.rashi, `${pickBi(av.rashi, lang)} · ${g(av.rashiLord)}`],
              [t.av.nakshatra, `${pickBi(av.nakshatra, lang)} ${av.pada} · ${g(av.nakshatraLord)}`],
              [t.av.paya, pickBi(av.paya?.value, lang)],
              [t.av.akshar, pickBi(av.akshar, lang)],
            ]}
          />
          <p className="caption-3 mt-2 text-ink-muted">{pickBi(av.paya?.method, lang)}</p>
        </Card>
      )}

      {tab === "vargas" && varga && (
        <Card>
          <Notice tone="warning">{pickBi(full.highVargaNote, lang)}</Notice>
          <div className="mt-3">
            <Pills label={t.allVargas} value={String(varga.div)} options={full.vargas.map((v) => ({ value: String(v.div), label: `D${v.div}${v.timeSensitive ? "*" : ""}` }))} onChange={(v) => setDiv(Number(v))} />
          </div>
          <h3 className="heading-6 mt-4 text-ink">{pickBi(varga.name, lang)}</h3>
          <p className="caption-2 text-ink-soft">{pickBi(varga.signifies, lang)}</p>
          {varga.timeSensitive && <p className="caption-2 mt-1 text-warning">{t.timeSensitive}</p>}
          <div className="mt-4">{draw(varga.ascSign, GRAHAS.map((x) => ({ graha: x, sign: varga.signs[x] })), `D${varga.div}`)}</div>
          <h4 className="title-4 mt-5 text-ink">{t.allVargas}</h4>
          <KV rows={full.vargas.map((v): [string, string] => [`D${v.div}${v.timeSensitive ? "*" : ""} ${pickBi(v.name, lang)}`, `${t.lagna} ${rashiName(v.ascSign, locale)} · ${g("Moon")} ${rashiName(v.signs.Moon, locale)}`])} />
        </Card>
      )}

      {tab === "ashtakavarga" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-center">
              <thead>
                <tr className="caption-3 text-ink-muted">
                  <th scope="col" className="py-1 text-left font-medium" />
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} scope="col" className="py-1 font-medium">
                      {rashiName(i + 1, locale)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAPTA_GRAHAS.map((x) => (
                  <tr key={x} className="border-t border-line">
                    <th scope="row" className="body-5 py-1.5 text-left font-medium text-ink">
                      {g(x)}
                    </th>
                    {(ak.bav[x] ?? []).map((n, i) => (
                      <td key={i} className="body-6 py-1.5 text-ink-soft">
                        {n}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-line-strong">
                  <th scope="row" className="body-5 py-1.5 text-left font-semibold text-ink">
                    {t.sav}
                  </th>
                  {ak.sav.map((n, i) => (
                    <td key={i} className="body-5 py-1.5 font-semibold text-ink">
                      {n}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="title-4 mt-3 text-ink">{fill(t.savTotal, { n: ak.total })}</p>
          <ul className="mt-2 space-y-1">
            {ak.houseNotes?.map((hn, i) => (
              <li key={i} className="caption-2 text-ink-soft">
                {fill(t.houseN, { n: hn.house })} · {hn.bindus}: {pickBi(hn.note, lang)}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === "dasha" && (
        <Card>
          <p className="title-4 text-ink">{fill(t.dashaBalance, { lord: g(dasha.balance.lord), y: dasha.balance.years, m: dasha.balance.months, d: dasha.balance.days })}</p>
          <ul className="mt-2 divide-y divide-line">
            {dasha.mahadashas.map((md, i) => (
              <li key={`${md.lord}-${md.startMs}`}>
                <button type="button" aria-expanded={openMd === i} onClick={() => setOpenMd(openMd === i ? null : i)} className="flex w-full flex-wrap justify-between gap-2 py-2 text-left">
                  <span className="body-5 text-ink">
                    {openMd === i ? "▾" : "▸"} {g(md.lord)}
                  </span>
                  <span className="caption-1 text-ink-soft">
                    {dateLabel(clock(md.startMs).date, locale)} → {dateLabel(clock(md.endMs).date, locale)}
                  </span>
                </button>
                {openMd === i &&
                  md.children?.map((ad) => (
                    <div key={`${ad.lord}-${ad.startMs}`} className="flex flex-wrap justify-between gap-2 py-1 pl-5">
                      <span className="caption-1 text-ink-soft">
                        {g(md.lord)} / {g(ad.lord)}
                      </span>
                      <span className="caption-1 text-ink-soft">
                        {dateLabel(clock(ad.startMs).date, locale)} → {dateLabel(clock(ad.endMs).date, locale)}
                      </span>
                    </div>
                  ))}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="caption-3 text-ink-muted">{pickBi(disclaimer, lang)}</p>
    </div>
  );
}
