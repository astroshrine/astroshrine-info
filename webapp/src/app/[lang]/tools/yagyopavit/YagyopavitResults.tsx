"use client";

import { useMemo, useState } from "react";
import { PiCaretDown } from "react-icons/pi";
import { yagyopavitLagnaRows, yagyopavitView, type Last } from "@/lib/services/toolsBYagyopavit";
import { Card, btnSmall } from "../../kundli/_components/ui";
import { Bullets, Counts, GRADE_BAR, GRADE_TONE, H4, LagnaTable, PersonCard, Pill, Tx, bestLagnasText, toggleCls, useBi, useLagnaLines } from "../_b/muhuratUi";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PAGE = 40; // windows shown at once; "Show more" adds the next batch

export default function YagyopavitResults({ L }: { L: Last }) {
  const bi = useBi();
  const V = useMemo(() => yagyopavitView(bi, L), [bi, L]);
  const [filt, setFilt] = useState(0);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [shown, setShown] = useState(PAGE);
  const ws = L.r.wins.filter((w: any) => !filt || w.grade === filt);
  const none = bi("No muhurat in this period meets every condition. Widen the period or choose the full day.", "इस अवधि में सभी शर्तें पूरी करने वाला कोई मुहूर्त नहीं मिला। अवधि बढ़ाएँ या पूर्ण दिन चुनें।");

  return (
    <div className="space-y-6">
      <Card title={bi("Batuk summary", "बटुक सारांश")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PersonCard role={bi("Batuk", "बटुक")} name={L.meta.name} rows={V.batuk} />
          <PersonCard role={bi("Age and basis of calculation", "आयु एवं गणना आधार")} name={V.age} rows={V.basis} />
        </div>
        <div className="mt-4">
          <Counts items={V.counts} />
        </div>
      </Card>

      <Card title={bi("Best suggestions", "सर्वोत्तम सुझाव")}>
        {V.top ? <p className="title-3 rounded-xl bg-brand p-3 text-brand-ink">{V.top}</p> : <p className="body-5 text-ink">{none}</p>}
        <p className="caption-2 mt-3 text-ink-soft">{V.note}</p>
      </Card>

      <Card title={bi("Available muhurats", "उपलब्ध मुहूर्त")}>
        <div className="mb-3 flex flex-wrap gap-2">
          {[bi("All", "सभी"), bi("Grade 1", "ग्रेड 1"), bi("Grade 2", "ग्रेड 2"), bi("Grade 3", "ग्रेड 3")].map((label, g) => (
            <button
              key={g}
              type="button"
              aria-pressed={filt === g}
              className={toggleCls(filt === g)}
              onClick={() => {
                setFilt(g);
                setShown(PAGE);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="caption-2 mb-4 text-ink-soft">
          {bi("Leave 2-3 minutes at the start and end of a window; it is best to begin the samskara near the “best moment”.", "समय के आरम्भ व अन्त के 2-3 मिनट छोड़कर \"श्रेष्ठ क्षण\" के निकट संस्कार आरम्भ करना उचित है।")}
        </p>
        {!ws.length && <p className="body-5 text-ink">{bi("No muhurat in this grade.", "इस ग्रेड में कोई मुहूर्त नहीं है।")}</p>}
        <ul className="space-y-3">
          {ws.slice(0, shown).map((w: any) => (
            <Win key={w.s} L={L} V={V} w={w} open={!!open[w.s]} onToggle={() => setOpen((o) => ({ ...o, [w.s]: !o[w.s] }))} />
          ))}
        </ul>
        {ws.length > shown && (
          <button type="button" className={`${btnSmall} mt-4`} onClick={() => setShown((n) => n + PAGE)}>
            {bi(`Show more (${ws.length - shown})`, `और दिखाएँ (${ws.length - shown})`)}
          </button>
        )}
      </Card>
    </div>
  );
}

function Win({ L, V, w, open, onToggle }: { L: Last; V: ReturnType<typeof yagyopavitView>; w: any; open: boolean; onToggle: () => void }) {
  const h = V.head(w);
  return (
    <li className={`overflow-hidden rounded-xl border border-l-4 border-line bg-surface-card print:break-inside-avoid ${GRADE_BAR[w.grade]}`}>
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-start justify-between gap-3 p-4 text-left">
        <span className="min-w-0 space-y-1">
          <span className="title-3 block text-ink">
            <Tx>{h.date}</Tx>
          </span>
          <span className="heading-6 block text-brand-strong">
            {h.time} <span className="caption-2 font-normal text-ink-soft">{h.dur}</span>
          </span>
          <span className="caption-2 block text-ink-soft">
            <Tx>{h.meta}</Tx>
          </span>
          <span className="pt-1">
            <Pill tone="mid">{h.best}</Pill>
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <Pill tone={GRADE_TONE[w.grade] ?? "mid"}>{h.grade}</Pill>
          <span className="heading-6 text-ink">
            {w.ev.score}
            <span className="caption-2 font-normal text-ink-soft">/100</span>
          </span>
          <PiCaretDown className={`h-4 w-4 text-ink-muted transition ${open ? "rotate-180" : ""}`} aria-hidden />
        </span>
      </button>
      {open && <Details L={L} V={V} w={w} />}
    </li>
  );
}

function Details({ L, V, w }: { L: Last; V: ReturnType<typeof yagyopavitView>; w: any }) {
  const bi = useBi();
  const lines = useLagnaLines();
  const d = V.det(w);
  const rows = yagyopavitLagnaRows(L, w.iso);
  const hm = (s: string) => s.replace(/\b\d{1,2}:\d{2}\b(?!\s*[AaPp]\.?[Mm]\b)/g, L.E.hm12);
  const tone = { shubh: "good", mid: "mid", bad: "bad" } as const;
  return (
    <div className="border-t border-line p-4">
      <H4>{bi("Panchang", "पंचांग")}</H4>
      <dl className="mt-1 grid grid-cols-1 gap-x-8 md:grid-cols-2">
        {d.panchang.map(([k, v], i) => (
          <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-line py-1.5">
            <dt className="caption-1 text-ink-soft">{k}</dt>
            <dd className="body-5 text-right text-ink">
              <Tx>{v}</Tx>
            </dd>
          </div>
        ))}
      </dl>
      <H4>{bi("Bala shuddhi", "बल शुद्धि")}</H4>
      <dl className="mt-1 grid grid-cols-1 gap-x-8 md:grid-cols-2">
        {d.bala.map(([k, v, c]) => (
          <div key={k} className="flex items-center justify-between gap-x-4 border-b border-line py-1.5">
            <dt className="caption-1 text-ink-soft">{k}</dt>
            <dd>
              <Pill tone={tone[c]}>
                <Tx>{v}</Tx>
              </Pill>
            </dd>
          </div>
        ))}
      </dl>
      <H4>{d.planetsTitle}</H4>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {d.planets.map((p) => (
          <span key={p} className="caption-1 rounded-lg bg-surface-sunken px-2 py-1 text-ink">
            <Tx>{p}</Tx>
          </span>
        ))}
      </div>
      <p className="body-6 mt-3 text-ink-soft">
        <b className="text-ink">{lines.head}</b> <Tx>{bestLagnasText(rows, hm) || lines.none}</Tx>
      </p>
      <LagnaTable rows={rows} card={{ s: w.s, e: w.e }} hm={hm} />
      <H4>{bi("Favourable points", "अनुकूल बिन्दु")}</H4>
      <Bullets items={d.good} tone="good" />
      <H4>{bi("Limitations", "सीमाएँ")}</H4>
      {d.mid.length ? <Bullets items={d.mid} tone="mid" /> : <p className="body-6 text-success">{bi("No notable limitation.", "कोई उल्लेखनीय सीमा नहीं।")}</p>}
      {!!d.upay.length && (
        <>
          <H4>{bi("Traditional remedies", "पारंपरिक उपाय")}</H4>
          <Bullets items={d.upay} tone="muted" />
        </>
      )}
    </div>
  );
}
