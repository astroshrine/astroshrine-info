"use client";

import { PiPrinter } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { fill } from "@/lib/services/toolsBCommon";
import { Card, Notice, btnSecondary, btnSmall, inputCls } from "../../kundli/_components/ui";
import { Choice } from "../delivery-muhurat/fields";
import { monthSystemOf, samvatsaraSystemOf, toSearchInput, type Draft } from "./_logic/draft";
import { contentFor, rulesFor, type Kb, type Sanskar } from "./_logic/kb";
import { fillSankalpa, sankalpaFields } from "./_logic/sankalpa";
import type { Candidate } from "./_logic/search";
import type { Results } from "./results";
import { smText } from "./messages";
import { Tx, Txt, bs, fmtDate, hm } from "./text";

export function selectedCandidates(d: Draft, results: Results): Candidate[] {
  return d.sanskars.map((sk) => results[sk]?.candidates.find((c) => c.id === d.selected[sk])).filter((c): c is Candidate => !!c);
}

export function sankalpaText(d: Draft, kb: Kb, c: Candidate): string {
  const f = sankalpaFields(c, monthSystemOf(d), samvatsaraSystemOf(d));
  return fillSankalpa(contentFor(kb, c.sanskar, "sankalpa_template"), f, {
    gotra: d.gotra,
    father: d.father,
    child: d.child.name,
    sanskarName: c.sanskar === "annaprashan" ? "अन्नप्राशन" : "चूडाकरण",
    venue: { city: d.venue.city, state: d.venue.state, country: d.venue.country },
    withGeo: /india|भारत/i.test(d.venue.country),
  });
}

const ENGINE_META = {
  hi: "प्राथमिक गणना: AstroShrine UniversalMuhurta (इसी ब्राउज़र में): सूर्य VSOP87 (संक्षिप्त), चन्द्र Meeus 47.A; अयनांश लाहिरी (न्यूटेशन रहित); राहु: स्पष्ट (true) पात",
  en: "Primary computation: AstroShrine UniversalMuhurta (in this browser): Sun VSOP87 (abridged), Moon Meeus 47.A; Lahiri ayanamsha (no nutation); Rahu: true node",
};

function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-1.5">
      <dt className="caption-1 text-ink-soft">{k}</dt>
      <dd className="caption-1 min-w-0 text-right text-ink">{v}</dd>
    </div>
  );
}

/** Steps 07 and 08: the Sankalpa text for the chosen muhurats (editable) and the report: checks, sources, print. */
export default function FinishStep({ d, patch, kb, results }: { d: Draft; patch: (p: Partial<Draft>) => void; kb: Kb; results: Results }) {
  const t = useT(smText);
  const locale = useLocale();
  const chosen = selectedCandidates(d, results);
  const ms = monthSystemOf(d);
  const ss = samvatsaraSystemOf(d);
  if (!chosen.length) return <p className="body-6 text-warning">{t.selectFirst}</p>;
  const rules = d.sanskars.flatMap((sk) => rulesFor(kb, sk));
  const verified = rules.filter((r) => r.verification_status === "verified").length;
  const blocked = chosen.some((c) => c.checks.some((k) => k.status === "fail"));

  return (
    <div className="space-y-6">
      <section className="space-y-4" aria-label={t.step.sankalpa}>
        <h2 className="heading-6 text-ink">{t.step.sankalpa}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Choice
            label={t.monthSystem}
            value={ms}
            options={[
              { value: "purnimanta", label: t.purnimanta },
              { value: "amanta", label: t.amanta },
            ]}
            onChange={(monthSystem) => patch({ monthSystem })}
          />
          <Choice
            label={t.k.samvatsara}
            value={ss}
            options={[
              { value: "north", label: t.samNorth },
              { value: "south", label: t.samSouth },
            ]}
            onChange={(samvatsaraSystem) => patch({ samvatsaraSystem })}
          />
        </div>
        {chosen.map((c) => {
          const f = sankalpaFields(c, ms, ss);
          const tpl = contentFor(kb, c.sanskar, "sankalpa_template");
          const text = d.sankalpa[c.id] ?? sankalpaText(d, kb, c);
          const verifiedTpl = tpl?.verification_status === "verified";
          return (
            <Card key={c.id}>
              <p className="caption-4 text-brand-strong uppercase">{`${t[c.sanskar]} · ${fmtDate(c.date, locale)} ${hm(c.start)}`}</p>
              <dl className="mt-2 divide-y divide-line">
                <Row k={t.k.samvatsara} v={<><Tx b={f.samvatsara} /> ({ss === "north" ? t.samNorth : t.samSouth})</>} />
                <Row k={t.k.samvat} v={`${f.vikram} / ${f.shaka}`} />
                <Row k={t.k.ayana} v={<Tx b={f.ayana} />} />
                <Row k={t.k.ritu} v={<Tx b={f.ritu} />} />
                <Row k={t.k.masa} v={<><Tx b={f.masa} /> ({ms === "amanta" ? t.amanta : t.purnimanta})</>} />
                <Row k={t.k.paksha} v={<><Tx b={f.paksha} /> <Tx b={f.tithi} /></>} />
                <Row k={t.k.vaar} v={<Tx b={f.vaar} />} />
                <Row k={t.k.nakshatra} v={<><Tx b={f.nakshatra} /> · <Tx b={f.yoga} /> · <Tx b={f.karana} /></>} />
              </dl>
              <p className={`caption-3 mt-3 w-fit rounded-full px-2 py-0.5 ${verifiedTpl ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
                {verifiedTpl ? t.templateVerified : t.check.uncertain}
              </p>
              {!verifiedTpl && <p className="caption-2 mt-1 text-ink-soft">{t.templatePending}</p>}
              {/* The Sankalpa itself is Sanskrit and Hindi, whatever the page's language. */}
              <textarea
                lang="hi"
                value={text}
                onChange={(e) => patch({ sankalpa: { ...d.sankalpa, [c.id]: e.target.value } })}
                aria-label={t.step.sankalpa}
                className={`${inputCls} mt-3 min-h-44 leading-7`}
              />
              <button
                type="button"
                className={`${btnSmall} mt-2`}
                onClick={() => {
                  const rest = { ...d.sankalpa };
                  delete rest[c.id];
                  patch({ sankalpa: rest });
                }}
              >
                {t.resetSankalpa}
              </button>
            </Card>
          );
        })}
        {[...new Set(chosen.map((c) => c.sanskar))].map((sk) => (
          <Checklist key={sk} d={d} patch={patch} kb={kb} sanskar={sk} />
        ))}
      </section>

      <section className="space-y-4" aria-label={t.step.report}>
        <h2 className="heading-6 text-ink">{t.step.report}</h2>
        {chosen.map((c) => (
          <Card key={c.id}>
            <p className="caption-4 text-brand-strong uppercase">{`${t[c.sanskar]} · ${fmtDate(c.date, locale)} ${hm(`${c.start}–${c.end}`)}`}</p>
            <p className="title-4 mt-2 text-ink">{t.preCheck}</p>
            <dl className="divide-y divide-line">
              {c.checks.map((k) => (
                <Row key={k.item.en} k={<Tx b={k.item} />} v={`${k.status === "pass" ? "✓" : k.status === "fail" ? "✗" : "⚠"} ${t.check[k.status]}`} />
              ))}
            </dl>
            {c.flags.map((f) => (
              <p key={f.en} className="caption-2 mt-2 text-warning">
                {t.check.uncertain}: <Tx b={f} />
              </p>
            ))}
          </Card>
        ))}
        <Card>
          <p className="title-4 text-ink">{t.sourceTitle}</p>
          <p className="caption-3 mt-1 text-ink-muted">{bs(ENGINE_META, locale)}</p>
          <p className="caption-3 text-ink-muted">{fill(t.kbCount, { verified, total: rules.length, from: kb.fromServer ? t.kbServer : t.kbBundled })}</p>
          <dl className="mt-2 divide-y divide-line">
            <Row k={t.venue} v={`${d.venue.name || d.venue.city} (${d.venue.place?.lat.toFixed(4)}, ${d.venue.place?.lng.toFixed(4)}) · ${d.venue.place?.tz}`} />
            <Row k={t.k.masaSystem} v={ms === "amanta" ? t.amanta : t.purnimanta} />
            <Row k={t.child_} v={<Txt text={toSearchInput(d, chosen[0].sanskar).child.name} />} />
          </dl>
        </Card>
        {blocked && <Notice tone="warning">{t.pdfBlocked}</Notice>}
        <button type="button" className={btnSecondary} onClick={() => window.print()} disabled={blocked}>
          <PiPrinter className="h-4 w-4" aria-hidden /> {t.printReport}
        </button>
        <p className="caption-3 text-ink-muted">{t.disclaimerDraft}</p>
      </section>
    </div>
  );
}

function Checklist({ d, patch, kb, sanskar }: { d: Draft; patch: (p: Partial<Draft>) => void; kb: Kb; sanskar: Sanskar }) {
  const t = useT(smText);
  const c = contentFor(kb, sanskar, "checklist");
  if (!c) return null;
  return (
    <Card title={fill(t.checklist, { name: t[sanskar] })}>
      {c.verification_status !== "verified" && <p className="caption-3 mb-2 w-fit rounded-full bg-warning-soft px-2 py-0.5 text-warning">{t.check.uncertain}</p>}
      <div lang="hi" className="space-y-4">
        {(c.body.sections as { title: string; items: string[] }[]).map((sec, i) => (
          <div key={sec.title}>
            <p className="title-4 text-ink">{sec.title}</p>
            <ul className="mt-1 space-y-1">
              {sec.items.map((it, j) => {
                const key = `${c.content_id}:${i}:${j}`;
                return (
                  <li key={key}>
                    <label className="flex cursor-pointer items-start gap-2">
                      <input type="checkbox" checked={!!d.checklist[key]} onChange={(e) => patch({ checklist: { ...d.checklist, [key]: e.target.checked } })} className="mt-1 h-4 w-4 accent-[var(--color-brand)]" />
                      <span className="body-6 text-ink">{it}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
