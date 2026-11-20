"use client";

import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import type { YearAhead } from "@/lib/services/toolsMansik";
import { Card } from "../../kundli/_components/ui";

const text = defineMessages({
  hi: { title: "आने वाला साल", good: "अनुकूल", challenges: "ध्यान रखें", steady: "इस अवधि में कोई खास बात नहीं, सामान्य गति।" },
  en: { title: "The year ahead", good: "Favourable", challenges: "Handle with care", steady: "Nothing in particular this period: a steady stretch." },
});

/** The next 12 months every AI reading can carry: the overall impact, then four quarters. Renders nothing for older reports. */
export default function YearAheadCard({ yearAhead }: { yearAhead?: YearAhead | null }) {
  const t = useT(text);
  if (!yearAhead) return null;
  return (
    <Card title={t.title}>
      {yearAhead.impact && <p className="body-5 text-ink">{yearAhead.impact}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(yearAhead.quarters ?? []).map((q, i) => (
          <div key={i} className="rounded-lg bg-surface-sunken p-3">
            <h3 className="title-4 text-ink">{q.period}</h3>
            <Bullets label={t.good} items={q.good} tone="text-success" />
            <Bullets label={t.challenges} items={q.challenges} tone="text-warning" />
            {!q.good?.length && !q.challenges?.length && <p className="caption-2 mt-1 text-ink-soft">{t.steady}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}

function Bullets({ label, items, tone }: { label: string; items?: string[]; tone: string }) {
  if (!items?.length) return null;
  return (
    <>
      <p className={`caption-4 mt-2 ${tone}`}>{label}</p>
      <ul className="body-6 list-disc space-y-1 pl-5 text-ink">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </>
  );
}
