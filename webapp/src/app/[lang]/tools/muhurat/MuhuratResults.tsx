"use client";

import { useMemo, useRef, useState } from "react";
import { PiCaretDown } from "react-icons/pi";
import { useLocale } from "@/i18n/LocaleProvider";
import { dmy } from "@/lib/services/toolsBBi";
import { muhuratText } from "@/lib/services/toolsBMuhurat";
import { Card } from "../../kundli/_components/ui";
import { btnSmall } from "../../kundli/_components/ui";
import { Bullets, Counts, Fold, GRADE_BAR, GRADE_TONE, H4, LagnaTable, PersonCard, Pill, Tx, bestLagnasText, toggleCls, useBi, useLagnaLines } from "../_b/muhuratUi";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PAGE = 30; // cards shown at a time: a year's search can return hundreds
const FILTERS: [string, string][] = [
  ["All", "सभी"],
  ["Grade 1", "ग्रेड 1"],
  ["Grade 2", "ग्रेड 2"],
  ["Grade 3", "ग्रेड 3"],
];

/**
 * The result of UM.find(): summary (persons, grade counts), best suggestions, choghadiya, the karya's rules, barred
 * days, and the filterable list whose cards open to the detail with the day's lagna table.
 */
export default function MuhuratResults({ UM, out, input }: { UM: any; out: any; input: any }) {
  const locale = useLocale();
  const bi = useBi();
  const x = useMemo(() => muhuratText(bi), [bi]);
  const [filter, setFilter] = useState(0);
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const lagnaCache = useRef<Record<string, any>>({}).current; // one search per mount: the page keys this view by search
  const choghadiya = useMemo(() => {
    try {
      return UM.dailyPanchang(input.from, input.place);
    } catch {
      return null;
    }
  }, [UM, input]);
  const hm = (s: string) => UM.hm12All(s) as string;
  const R = out.rule;
  const top = x.topFive(out.results);
  const rows = out.results.filter((r: any) => !filter || r.grade === filter);
  const barred = x.barredSegments(UM, out.rejectedDays);
  const note = x.bestNote(out);
  /** The day's lagna table, worked out on first open and kept per date. */
  const lagnaRows = (date: string) => {
    if (!(date in lagnaCache)) {
      try {
        const wins = out.results.filter((r: any) => r.date === date).map(x.winSpan);
        lagnaCache[date] = UM.lagnaDay({ ...input, date, lang: locale, wins });
      } catch {
        lagnaCache[date] = null;
      }
    }
    return lagnaCache[date];
  };

  return (
    <div className="space-y-6">
      <Card title={`${R.name} — ${bi("summary", "सारांश")}`} description={x.rangeText(input)}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {out.persons.map((p: any) => (
            <PersonCard key={p.role} role={x.roleLabel(UM, out.karya, p.role)} name={p.name || "—"} rows={x.personRows(UM, p)} />
          ))}
        </div>
        <div className="mt-4">
          <Counts items={[1, 2, 3].map((g) => ({ n: out.counts["g" + g], label: bi(x.GRADE_LABEL[g - 1] as [string, string]) }))} />
        </div>
        {(out.fixedReject || []).map((m: string) => (
          <p key={m} role="note" className="body-6 mt-3 rounded-2xl bg-danger-soft p-3 text-danger">
            <Tx>{m}</Tx>
          </p>
        ))}
      </Card>

      <Card title={bi("Best suggestions", "सर्वोत्तम सुझाव")}>
        {top.length ? (
          <div className="space-y-3">
            <p className="title-3 rounded-xl bg-brand p-3 text-brand-ink">
              {`${bi("Best muhurat", "सर्वोत्तम मुहूर्त")}: ${x.dateStr(top[0])} · ${top[0].vaar} · ${hm(top[0].start)}–${hm(top[0].end)} · ${x.bestMoment()} ${hm(top[0].best)}`}
            </p>
            <ul className="space-y-2">
              {top.map((r: any) => {
                const [line, sub] = x.bestRow(UM, r);
                return (
                  <li key={r.startJD} className="flex items-start justify-between gap-3 rounded-xl border border-l-4 border-line border-l-brand bg-surface-sunken p-3">
                    <div className="min-w-0">
                      <p className="title-4 text-ink">
                        <Tx>{line}</Tx>
                      </p>
                      <p className="caption-2 text-ink-soft">
                        <Tx>{sub}</Tx>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Pill tone={GRADE_TONE[r.grade] ?? "mid"}>{`${bi("Grade", "ग्रेड")} ${r.grade}`}</Pill>
                      <span className="heading-6 text-ink">{r.score}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="body-5 text-ink">{x.bestEmpty(out)}</p>
        )}
        {note && <p className="caption-2 mt-3 text-ink-soft">{note}</p>}
      </Card>

      {choghadiya && (
        <Card title={`${bi("Choghadiya", "चौघड़िया")} — ${input.place.name || ""} · ${dmy(input.from)} (${choghadiya.vaar})`}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              { head: bi("Day · sunrise ", "दिन · सूर्योदय ") + hm(choghadiya.sunrise), list: choghadiya.choghadiya.day },
              { head: bi("Night · sunset ", "रात्रि · सूर्यास्त ") + hm(choghadiya.sunset), list: choghadiya.choghadiya.night },
            ].map((g) => (
              <div key={g.head}>
                <H4>{g.head}</H4>
                <dl className="mt-1 divide-y divide-line">
                  {g.list.map((c: any) => (
                    <div key={c.from} className="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5">
                      <dt className="caption-1 text-ink-soft">{hm(`${c.from}–${c.to}`)}</dt>
                      <dd className={`body-5 font-semibold ${c.good ? "text-success" : "text-danger"}`}>
                        <Tx>{c.name}</Tx>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <p className="caption-2 mt-3 text-ink-soft">{bi("Good: Shubh, Amrit, Labh, Char · Bad: Rog, Kaal, Udveg", "शुभ: शुभ, अमृत, लाभ, चर · अशुभ: रोग, काल, उद्वेग")}</p>
        </Card>
      )}

      <Card title={bi("Classical rules applied to this karya", "इस कार्य पर लागू शास्त्रीय नियम")}>
        <Fold title={bi("Show the rules", "नियम देखें")}>
          {x.ruleRows(UM, R).map(([h, body]) => (
            <div key={h}>
              <H4>{h}</H4>
              <p className="body-6 whitespace-pre-line text-ink">
                <Tx>{body}</Tx>
              </p>
            </div>
          ))}
        </Fold>
      </Card>

      <Card title={bi("Barred days", "वर्जित दिन")}>
        {barred.length ? (
          <Fold title={bi(`${out.rejectedDays.length} barred days: show the list`, `${out.rejectedDays.length} वर्जित दिन: सूची देखें`)}>
            <ul className="divide-y divide-line">
              {barred.map(([d, why]) => (
                <li key={d} className="py-2">
                  <p className="title-4 text-ink">{d}</p>
                  <p className="body-6 text-danger">
                    <Tx>{why}</Tx>
                  </p>
                </li>
              ))}
            </ul>
          </Fold>
        ) : (
          <p className="body-5 text-success">{bi("No day-level bars in this period.", "इस अवधि में कोई दिन-स्तरीय वर्जन नहीं।")}</p>
        )}
      </Card>

      <Card title={bi("Available muhurats", "उपलब्ध मुहूर्त")}>
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f, g) => (
            <button
              key={g}
              type="button"
              aria-pressed={filter === g}
              className={toggleCls(filter === g)}
              onClick={() => {
                setFilter(g);
                setShown(PAGE);
              }}
            >
              {bi(f)}
            </button>
          ))}
        </div>
        {rows.length ? (
          <ul className="space-y-3">
            {rows.slice(0, shown).map((r: any) => (
              <ResultCard
                key={r.startJD}
                UM={UM}
                r={r}
                out={out}
                x={x}
                open={!!open[r.startJD]}
                onToggle={() => setOpen((o) => ({ ...o, [r.startJD]: !o[r.startJD] }))}
                lagnaRows={lagnaRows}
              />
            ))}
          </ul>
        ) : (
          <p className="body-5 text-ink">{bi("No muhurat in this grade.", "इस ग्रेड में कोई मुहूर्त नहीं।")}</p>
        )}
        {rows.length > shown && (
          <button type="button" className={`${btnSmall} mt-4`} onClick={() => setShown((n) => n + PAGE)}>
            {bi(`Show more (${rows.length - shown} left)`, `और दिखाएँ (${rows.length - shown} शेष)`)}
          </button>
        )}
      </Card>

      <Card title={bi("Disclaimers and limits (where errors are possible)", "अस्वीकरण एवं सीमाएँ (जहाँ त्रुटि सम्भव है)")}>
        <Bullets items={out.disclaimers || UM.DISCLAIMERS} />
        <p className="caption-2 mt-3 text-ink-soft">
          {bi(
            "AstroShrine Private Limited · The calculation is a mathematical reading of classical rules; the final muhurat decision rests with the acharya.",
            "AstroShrine Private Limited · गणना शास्त्रीय नियमों की गणितीय व्याख्या है; अन्तिम मुहूर्त-निर्णय आचार्य का है।",
          )}
        </p>
      </Card>
    </div>
  );
}

function ResultCard({ UM, r, out, x, open, onToggle, lagnaRows }: { UM: any; r: any; out: any; x: ReturnType<typeof muhuratText>; open: boolean; onToggle: () => void; lagnaRows: (date: string) => any }) {
  const bi = useBi();
  const lines = useLagnaLines();
  const hm = (s: string) => UM.hm12All(s) as string;
  const d = r.detail;
  const who = (p: any) => p.name || x.roleLabel(UM, out.karya, p.role);
  const moonOf = (role: string) => UM.RASHI[out.persons.find((p: any) => p.role === role)?.moonSign];
  const lr = open ? lagnaRows(r.date) : null;
  const houses = d.houses ? Object.keys(d.houses).sort((a, b) => +a - +b) : [];
  const kv: Array<[string, string] | false> = open
    ? [
        [bi("Sunrise / sunset", "सूर्योदय / सूर्यास्त"), `${hm(UM.fmtHM(r.sunrise))} / ${hm(UM.fmtHM(r.sunset))}`],
        [bi("Karana", "करण"), d.karana],
        [bi("Lagna lord", "लग्नेश"), d.lagnesh],
        [bi("Navamsha lagna", "नवांश लग्न"), UM.RASHI[d.navLag]],
        [bi("Moon sign", "चन्द्र राशि"), UM.RASHI[d.moonSign]],
        [bi("Lagna degree (best moment)", "लग्न अंश (श्रेष्ठ क्षण)"), `${d.lagDeg.toFixed(1)}°`],
        ...d.persons.flatMap((p: any): Array<[string, string]> => [
          [
            `${who(p)} — ${bi("Chandra bala", "चन्द्र बल")}`,
            p.chandra ? `${bi(`${p.chandra.house} from ${moonOf(p.role)}`, `${moonOf(p.role)} से ${p.chandra.house}`)} · ${UM.tw(p.chandra.status)}` : "—",
          ],
          [`${who(p)} — ${bi("Tara", "तारा")}`, p.tara ? `${p.tara.name} (${p.tara.tara})` : "—"],
        ]),
        !!d.tribal && [bi("Surya bala (groom)", "सूर्य बल (वर)"), `${d.tribal.surya.house} · ${UM.tw(d.tribal.surya.status)}`],
        !!d.tribal && [bi("Guru bala (bride)", "गुरु बल (कन्या)"), `${d.tribal.guru.house} · ${UM.tw(d.tribal.guru.status)}`],
        !!d.dirInfo?.yogini && [bi("Disha-shool", "दिशा-शूल"), UM.DIR_HI[d.dirInfo.shool]],
        !!d.dirInfo?.yogini && [bi("Yogini", "योगिनी"), `${UM.DIR_HI[d.dirInfo.yogini]} — ${UM.tw(d.dirInfo.yoginiRel)}`],
        !!d.dirInfo?.yogini && [bi("Chandra-vaas", "चन्द्रवास"), `${UM.DIR_HI[d.dirInfo.chandraVaas]} — ${UM.tw(d.dirInfo.chandraRel)}`],
      ]
    : [];
  const tone = r.grade as 1 | 2 | 3;
  return (
    <li className={`overflow-hidden rounded-xl border border-l-4 border-line bg-surface-card print:break-inside-avoid ${GRADE_BAR[tone]}`}>
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-start justify-between gap-3 p-4 text-left">
        <span className="min-w-0 space-y-1">
          <span className="title-3 block text-ink">
            {`${x.dateStr(r)} · ${r.vaar}`}
            {r.nextDay && <span className="caption-2 text-ink-soft">{bi(" (early morning of the next date)", " (अगली तिथि प्रातः)")}</span>}
          </span>
          <span className="heading-6 block text-brand-strong">
            {`${hm(r.start)} – ${hm(r.end)} `}
            <span className="caption-2 font-normal text-ink-soft">{`(${r.durMin} ${bi("min", "मिनट")})`}</span>
          </span>
          <span className="caption-2 block text-ink-soft">
            <Tx>{`${r.lagna} ${bi("lagna", "लग्न")} (${d.lagClass}) · ${d.tithi} · ${d.nak}-${d.pada} · ${d.yoga} ${bi("yoga", "योग")} · ${r.maas} (${bi("purnimanta", "पूर्णिमान्त")} ${r.maasP})`}</Tx>
          </span>
          <span className="flex flex-wrap gap-1.5 pt-1">
            <Pill tone="mid">{`${x.bestMoment()} ${hm(r.best)}`}</Pill>
            {r.godhuli && <Pill tone="mid">{bi("Godhuli lagna", "गोधूलि लग्न")}</Pill>}
            {d.yogas.map((y: string) => (
              <Pill key={y} tone="good">
                <Tx>{y}</Tx>
              </Pill>
            ))}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <Pill tone={GRADE_TONE[tone] ?? "mid"}>{`${bi("Grade", "ग्रेड")} ${r.grade}`}</Pill>
          <span className="heading-6 text-ink">
            {r.score}
            <span className="caption-2 font-normal text-ink-soft"> / 100</span>
          </span>
          <PiCaretDown className={`h-4 w-4 text-ink-muted transition ${open ? "rotate-180" : ""}`} aria-hidden />
        </span>
      </button>
      {open && (
        <div className="border-t border-line p-4">
          <H4>{bi("Panchang and lagna", "पंचांग एवं लग्न")}</H4>
          <dl className="mt-1 grid grid-cols-1 gap-x-8 divide-y divide-line md:grid-cols-2 md:divide-y-0">
            {kv.filter((row): row is [string, string] => !!row).map(([k, v], i) => (
              <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-line py-1.5">
                <dt className="caption-1 text-ink-soft">{k}</dt>
                <dd className="body-5 text-right text-ink">
                  <Tx>{v}</Tx>
                </dd>
              </div>
            ))}
          </dl>
          {houses.length > 0 && (
            <>
              <H4>{bi("Planets by house (from the lagna)", "भाव-स्थिति (लग्न से)")}</H4>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {houses.map((h) => (
                  <span key={h} className="caption-1 rounded-lg bg-surface-sunken px-2 py-1 text-ink">
                    <Tx>{`${h}: ${d.houses[h].map((g: string) => UM.GRAHA_HI[g]).join(", ")}`}</Tx>
                  </span>
                ))}
              </div>
            </>
          )}
          {lr && (
            <>
              <p className="body-6 mt-3 text-ink-soft">
                <b className="text-ink">{lines.head}</b> <Tx>{bestLagnasText(lr, hm) || (lr.o.allowed ? lines.none : lines.none24)}</Tx>
              </p>
              <LagnaTable rows={lr} card={x.winSpan(r)} hm={hm} />
            </>
          )}
          <H4>{bi("Strengths", "शुभ बिन्दु")}</H4>
          {d.plus.length ? <Bullets items={d.plus} tone="good" /> : <p className="body-6 text-ink-soft">—</p>}
          <H4>{bi("Doshas / weak points", "दोष / न्यूनताएँ")}</H4>
          {d.dosha.length ? <Bullets items={d.dosha} tone="bad" /> : <p className="body-6 text-success">{bi("No dosha", "कोई दोष नहीं")}</p>}
          {d.upaay.length > 0 && (
            <>
              <H4>{bi("Remedies", "उपाय")}</H4>
              <Bullets items={d.upaay} tone="muted" />
            </>
          )}
          {(d.notes || []).length > 0 && (
            <>
              <H4>{bi("Notes", "सूचना")}</H4>
              <Bullets items={d.notes} />
            </>
          )}
        </div>
      )}
    </li>
  );
}
