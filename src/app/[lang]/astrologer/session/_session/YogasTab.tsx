"use client";

import { PiSparkle } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { cancelName, type Chart, type YogaHit } from "@/lib/jyotish";
import { Card, Pill } from "../../_console/ui";
import { text } from "./messages";
import { Head, sectionClass } from "./parts";
import type { Request } from "../../../kundli/_components/useJyotish";

/** Yogas and doshas of the customer's chart (POST /v1/jyotish/chart on the sheet's birth details). */
export default function YogasTab({ chart }: { chart: Request<Chart> }) {
  const t = useT(text);
  if (chart.loading) return <div aria-busy="true" aria-label={t.loading} className="h-40 animate-pulse rounded-[22px] bg-surface-sunken" />;
  if (chart.error || !chart.data)
    return (
      <Card className={sectionClass}>
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-danger">
          {t.calcFailed}
          <button type="button" onClick={chart.retry} className="cursor-pointer font-bold underline">
            {t.retry}
          </button>
        </div>
      </Card>
    );
  const c = chart.data;
  return (
    <div className="flex flex-col gap-6">
      <Card className={sectionClass}>
        <Head icon={PiSparkle}>{t.yogasTitle}</Head>
        <HitList hits={c.yogas} empty={t.noYogas} dosha={false} />
      </Card>
      <Card className={sectionClass}>
        <Head icon={PiSparkle}>{t.doshasTitle}</Head>
        <HitList hits={c.doshas.list} empty={t.noDoshas} dosha />
        {c.doshas.kaal_sarp !== "none" && <p className="m-0 mt-4 text-[15px] font-semibold">{t.kaalSarp(c.doshas.kaal_sarp === "full")}</p>}
      </Card>
    </div>
  );
}

function HitList({ hits, empty, dosha }: { hits: YogaHit[]; empty: string; dosha: boolean }) {
  const t = useT(text);
  const locale = useLocale();
  // One line per yoga or dosha; it counts as formed if any instance is not cancelled.
  const byId = new Map<string, { hit: YogaHit; active: boolean; reasons: Set<string> }>();
  for (const h of hits) {
    const e = byId.get(h.id) ?? { hit: h, active: false, reasons: new Set<string>() };
    e.active ||= !h.cancelled;
    if (h.cancelled) h.cancelled_by.forEach((r) => e.reasons.add(r));
    byId.set(h.id, e);
  }
  const list = [...byId.values()].sort((a, b) => Number(b.active) - Number(a.active));
  if (!list.length) return <p className="m-0 mt-3.5 text-[15px] text-ink-soft">{empty}</p>;
  return (
    <ul className="m-0 mt-3.5 flex list-none flex-col gap-2 p-0">
      {list.map(({ hit, active, reasons }) => (
        <li key={hit.id} className="rounded-[14px] border border-line bg-surface-page px-3.5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-[15.5px]">{locale === "hi" ? hit.name_hi : hit.name_en}</b>
            <Pill tone={!active ? "neutral" : dosha ? "amber" : "green"} className="h-6 text-xs">
              {!active ? t.cancelled : dosha ? t.present : t.formed}
            </Pill>
          </div>
          {locale === "hi" && <div className="text-[13px] text-ink-soft">{hit.name_en}</div>}
          {!active && reasons.size > 0 && <div className="mt-1 text-[13.5px] text-ink-soft">{[...reasons].map((r) => cancelName(r, locale)).join("; ")}</div>}
        </li>
      ))}
    </ul>
  );
}
