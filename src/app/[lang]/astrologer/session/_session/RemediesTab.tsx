"use client";

import { useState } from "react";
import { PiGift, PiLeaf, PiPaperPlaneTilt, PiSparkle, PiWarningCircle } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { ApiError } from "@/lib/api";
import { dignityName, grahaName, lordName, runningIndex, type Dignity, type Graha } from "@/lib/jyotish";
import {
  listSentRemedies,
  sendTextRemedy,
  suggestPuja,
  type ClientSheet,
  type PujaSuggestion,
  type UpayFlag,
} from "@/lib/services/astrologerSession";
import { Button, Card, Pill } from "../../_console/ui";
import { useJyotish } from "../../../kundli/_components/useJyotish";
import { dt } from "./design";
import { housesRuledBy, houseOf, rowOf } from "./kundliData";
import { text } from "./messages";
import { Head, lblClass, sectionClass } from "./parts";

const area = "w-full resize-y rounded-[14px] border border-line-strong bg-surface-page px-3.5 py-3 text-[15px] leading-[1.55] text-ink";
const sectionCard = "px-6 py-[22px]";
const pill = "inline-flex h-[26px] items-center rounded-full px-3 text-xs font-bold";

/** Remedies for this customer: what the kundli supports (doshas, gemstones, the planets' remedies), an AI puja suggestion, and sending a remedy to them. */
export default function RemediesTab({ sheet, now, chatId, clientId, astrologerId }: { sheet: ClientSheet; now: number; chatId: string; clientId: string; astrologerId: string }) {
  const t = useT(text);
  const d = useT(dt);
  const locale = useLocale();
  const u = sheet.upay;
  const periods = sheet.dasha.vimshottari.periods;
  const md = periods[runningIndex(periods, now)];
  const within = (nodes?: typeof periods) => nodes?.find((p) => Date.parse(p.start) <= now && now < Date.parse(p.end));
  const ad = within(md?.sub);
  const pd = within(ad?.sub);
  const [pick, setPick] = useState<string | null>(null);
  const tags = new Map<string, string>();
  if (md) tags.set(md.lord, d.tagMaha);
  if (ad && !tags.has(ad.lord)) tags.set(ad.lord, d.tagAntar);
  if (pd && !tags.has(pd.lord)) tags.set(pd.lord, d.tagPraty);
  const grahas = u ? [...u.grahas].sort((a, b) => Number(tags.has(b.graha)) - Number(tags.has(a.graha))) : [];
  const sel = grahas.find((g) => g.graha === pick) ?? grahas[0];
  const ordOf = (h: number) => d.ord[h - 1];
  const ruled = (g: string) => housesRuledBy(sheet, g as Graha).map(ordOf).join(locale === "hi" ? ", " : " and ") || "—";
  const flagPills = (flags: UpayFlag[]) => {
    const conj = flags.find((f) => f.code === "conjunct") as { grahas: string[] } | undefined;
    const asp = flags.find((f) => f.code === "aspected") as { grahas: string[] } | undefined;
    const names = (gs: string[]) => gs.map((g) => grahaName(g, locale)).join(", ");
    return [conj ? d.gemWith(names(conj.grahas)) : d.gemAlone, ...(asp ? [d.gemAspect(names(asp.grahas))] : [])];
  };
  return (
    <div className="flex flex-col gap-6">
      <Card className={sectionCard}>
        <div className="flex items-start gap-3">
          <span aria-hidden className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-surface-inverse text-brand shadow-[0_0_0_4px_var(--color-surface-sunken)]">
            <PiLeaf className="h-5 w-5" />
          </span>
          <p className="m-0 text-[15px] leading-[1.6]">{d.remNote}</p>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {md && <span className="inline-flex h-[30px] items-center rounded-full bg-surface-inverse px-3 text-[13px] font-bold text-brand">{d.mdChip(lordName(md.lord, locale))}</span>}
          {ad && <span className="inline-flex h-[30px] items-center rounded-full bg-surface-sunken px-3 text-[13px] font-bold text-brand-strong">{d.adChip(lordName(ad.lord, locale))}</span>}
        </div>
        <div className="mt-3.5 rounded-[14px] bg-[#F7F3EA] px-3.5 py-3 text-[14.5px]">{d.guard}</div>
      </Card>
      {u ? (
        <>
          <Card className={sectionCard}>
            <Head icon={PiSparkle} id="dsh">
              {d.doshaTitle}
            </Head>
            <div className={`${lblClass} mt-3.5`}>{d.confirmed}</div>
            {u.doshas.length === 0 ? (
              <p className="m-0 mt-2 text-[15px] text-ink-soft">{t.noConfirmed}</p>
            ) : (
              <div className="mt-2 flex flex-col gap-2.5">
                {u.doshas.map((x) => (
                  <div key={x.id} className="rounded-2xl border-[1.5px] border-[#F2B98A] bg-[#FFF1E6] px-4 py-3.5">
                    <b className="block text-base text-warning">{locale === "hi" ? x.name_hi : x.name_en}</b>
                    <span className="text-[14.5px]">{(locale === "hi" ? x.conditions_met_hi : x.conditions_met).join(" ")}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className={sectionCard}>
            <Head icon={PiGift} id="gmt">
              {d.gemTitle}
            </Head>
            <p className="m-0 mt-2 text-sm text-ink-soft">{d.gemRule}</p>
            {!u.gemstones.available ? (
              <p className="m-0 mt-3 text-[15px] text-ink-soft">{t.gemNeedsTime}</p>
            ) : (
              <>
                <div className={`${lblClass} mt-3.5 !text-success`}>{d.gemYes}</div>
                <div className="mt-2 flex flex-col gap-2.5">
                  {u.gemstones.suitable.map((g) => {
                    const r = rowOf(sheet, g.graha as Graha);
                    return (
                      <div key={g.graha} className="rounded-2xl border border-line bg-surface-page px-4 py-3.5">
                        <b className="block text-base">{g.gem}</b>
                        <span className="text-sm">
                          {[
                            grahaName(g.graha, locale),
                            r ? d.houseOrd(ordOf(houseOf(sheet, r))) : null,
                            ruled(g.graha),
                            r?.dignity ? dignityName(r.dignity as Dignity, locale) : null,
                            r?.shadbala ? `${r.shadbala.ratio.toFixed(2)}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        {g.upratna && (
                          <div className="mt-1.5 text-sm">
                            <b className="text-brand-strong">{d.gemSub}:</b> {g.upratna}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {flagPills(g.flags).map((x, i) => (
                            <span key={x} className={`${pill} ${i === 0 ? "bg-surface-sunken text-brand-strong" : "bg-[#EEF1F7] text-ink"}`}>
                              {x}
                            </span>
                          ))}
                          {g.flags.map((f) =>
                            f.code === "weak" ? (
                              <span key="w" className={`${pill} bg-danger-soft text-danger`}>
                                {d.gemWeak(f.ratio.toFixed(2))}
                              </span>
                            ) : f.code === "debilitated" ? (
                              <span key="d" className={`${pill} bg-danger-soft text-danger`}>
                                {d.gemDeb}
                              </span>
                            ) : f.code === "combust" ? (
                              <span key="c" className={`${pill} bg-danger-soft text-danger`}>
                                {d.gemComb}
                              </span>
                            ) : f.code === "dusthana" ? (
                              <span key="s" className={`${pill} bg-danger-soft text-danger`}>
                                {d.gemDus(f.house)}
                              </span>
                            ) : null,
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {u.gemstones.not_advised.length > 0 && (
                  <>
                    <div className={`${lblClass} mt-4 !text-danger`}>{d.gemNo}</div>
                    <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0 text-[14.5px]">
                      {u.gemstones.not_advised.map((g) => (
                        <li key={g.graha} className="rounded-xl bg-[#F7F3EA] px-3 py-2.5">
                          {g.gem} · {grahaName(g.graha, locale)}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </Card>

          {sel && (
            <Card className={sectionCard}>
              <Head icon={PiLeaf} id="prt">
                {d.prTitle}
              </Head>
              <div role="group" aria-label={d.prTitle} className="mt-3.5 flex flex-wrap gap-2">
                {grahas.map((g) => (
                  <button
                    key={g.graha}
                    type="button"
                    aria-pressed={g.graha === sel.graha}
                    onClick={() => setPick(g.graha)}
                    className={`h-10 cursor-pointer rounded-full px-3.5 text-sm font-bold transition ${g.graha === sel.graha ? "bg-surface-inverse text-brand" : "border border-line-strong bg-surface-page text-ink hover:bg-surface-sunken"}`}
                  >
                    {grahaName(g.graha, locale)}
                    {tags.has(g.graha) ? ` · ${tags.get(g.graha)}` : ""}
                  </button>
                ))}
              </div>
              <div className="mt-3.5 motion-safe:animate-reveal-down" key={sel.graha}>
                <div className="mb-2 text-sm">
                  {d.prSub(
                    sel.house !== null ? ordOf(sel.house) : "—",
                    ruled(sel.graha),
                    sel.dignity ? dignityName(sel.dignity as Dignity, locale) : "",
                    sel.shadbala_ratio !== null ? sel.shadbala_ratio.toFixed(2) : "",
                  )}
                </div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {flagPills(sel.flags).map((x, i) => (
                    <span key={x} className={`${pill} ${i === 0 ? "bg-surface-sunken text-brand-strong" : "bg-[#EEF1F7] text-ink"}`}>
                      {x}
                    </span>
                  ))}
                </div>
                {[
                  [d.mantra, (locale === "hi" ? sel.mantra.text_hi : null) || sel.mantra.text, true],
                  [d.japa, [sel.mantra.daily, sel.mantra.special].filter(Boolean).join("; "), false],
                  [d.daan, `${sel.daan.item} · ${sel.daan.day}`, false],
                  [d.vrat, `${sel.vrat.day} · ${sel.vrat.deity}`, false],
                ].map(([k, v, bold]) => (
                  <div key={k as string} className="grid grid-cols-[120px_1fr] gap-2.5 border-t border-line py-2.5 text-[15px]">
                    <b className="text-brand-strong">{k as string}</b>
                    <span className={bold ? "font-bold" : ""}>{v as string}</span>
                  </div>
                ))}
                {sel.lal_kitab && (
                  <div className="mt-3 rounded-[14px] border border-[#F2D58A] bg-surface-sunken px-4 py-3.5 text-[14.5px]">
                    <b className="mb-1 block text-brand-strong">{d.lalKitab}</b>
                    {sel.lal_kitab.reading[locale]}
                    <ul className="m-0 mt-1 list-disc pl-5">
                      {sel.lal_kitab.upay.map((x) => (
                        <li key={x.en}>{x[locale]}</li>
                      ))}
                    </ul>
                    {sel.lal_kitab.avoid.length > 0 && (
                      <div className="mt-1">
                        <b>{t.lalAvoid}:</b> {sel.lal_kitab.avoid.map((x) => x[locale]).join("; ")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className={sectionCard}>
          <p className="m-0 flex items-center gap-2 text-[15px] text-ink-soft">
            <PiWarningCircle className="h-5 w-5 shrink-0" aria-hidden />
            {t.noUpay}
          </p>
        </Card>
      )}
      <PujaCard chatId={chatId} />
      <SendRemedy astrologerId={astrologerId} clientId={clientId} />
    </div>
  );
}

/** POST /v1/chat/:id/puja-suggest: the astrologer reads it; nothing goes to the chat. */
function PujaCard({ chatId }: { chatId: string }) {
  const t = useT(text);
  const locale = useLocale();
  const [problem, setProblem] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "failed" | "rate">("idle");
  const [result, setResult] = useState<PujaSuggestion | null>(null);
  const go = async () => {
    setState("loading");
    try {
      setResult(await suggestPuja(chatId, problem.trim(), locale));
      setState("idle");
    } catch (error) {
      setState(error instanceof ApiError && error.status === 429 ? "rate" : "failed");
    }
  };
  return (
    <Card className={sectionClass}>
      <Head icon={PiSparkle}>{t.pujaTitle}</Head>
      <p className="m-0 mt-2 text-sm text-ink-soft">{t.pujaHint}</p>
      <label htmlFor="pj" className={`${lblClass} mt-3.5 block`}>
        {t.pujaProblem}
      </label>
      <textarea id="pj" value={problem} onChange={(e) => setProblem(e.target.value)} rows={2} maxLength={1000} className={`${area} mt-1.5`} />
      <Button onClick={go} disabled={state === "loading"} size="sm" className="mt-3">
        {state === "loading" ? t.pujaLoading : t.pujaGet}
      </Button>
      <div role="status" className="mt-2 text-sm font-semibold text-danger">
        {state === "failed" && t.pujaFailed}
        {state === "rate" && t.pujaRate}
      </div>
      {result && (
        <div className="mt-3 flex flex-col gap-3 text-[14.5px]">
          {result.summary && <p className="m-0 rounded-[14px] bg-surface-sunken px-3.5 py-3">{result.summary}</p>}
          <div>
            <div className={lblClass}>{t.pujaList}</div>
            {result.pujas.length === 0 ? (
              <p className="m-0 mt-1">{result.no_puja_reason || t.pujaNone}</p>
            ) : (
              <ul className="m-0 mt-1.5 flex list-none flex-col gap-2 p-0">
                {result.pujas.map((p) => (
                  <li key={p.name} className="rounded-2xl border border-line bg-surface-page px-4 py-3">
                    <b className="block">
                      {p.name}
                      {p.price != null && <span className="ml-2 font-medium text-ink-soft">₹{p.price}</span>}
                    </b>
                    {p.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {result.gemstone.stones.length > 0 && (
            <div>
              <div className={lblClass}>{t.gemTitle}</div>
              <ul className="m-0 mt-1.5 flex list-none flex-col gap-2 p-0">
                {result.gemstone.stones.map((s) => (
                  <li key={s.graha} className="rounded-2xl border border-line bg-surface-page px-4 py-3">
                    <b className="block">
                      {s.gem} · {grahaName(s.graha, locale)}
                    </b>
                    {s.for}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {[
            [t.pujaAlt, result.simple_alternatives],
            [t.pujaHelp, result.practical_help],
            [t.pujaMissing, result.missing_information],
          ].map(([label, items]) =>
            (items as string[]).length ? (
              <div key={label as string}>
                <div className={lblClass}>{label as string}</div>
                <ul className="m-0 mt-1 list-disc pl-5">
                  {(items as string[]).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
          {result.acharya_review_required && <Pill tone="amber">{t.pujaReview}</Pill>}
        </div>
      )}
    </Card>
  );
}

/** POST /v1/astrologer/:id/remedies {kind: 'text'}: a written remedy that reaches the customer's account. */
function SendRemedy({ astrologerId, clientId }: { astrologerId: string; clientId: string }) {
  const t = useT(text);
  const locale = useLocale();
  const sent = useJyotish(`remedies|${astrologerId}`, (signal) => listSentRemedies(astrologerId, signal));
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const go = async () => {
    if (!note.trim()) return;
    setState("sending");
    try {
      await sendTextRemedy(astrologerId, clientId, note.trim());
      setNote("");
      setState("done");
      sent.retry();
    } catch {
      setState("failed");
    }
  };
  const before = (sent.data ?? []).filter((r) => r.userId === clientId);
  return (
    <Card className={sectionClass}>
      <Head icon={PiPaperPlaneTilt}>{t.sendTitle}</Head>
      <p className="m-0 mt-2 text-sm text-ink-soft">{t.sendHint}</p>
      <label htmlFor="rm" className="sr-only">
        {t.sendPlaceholder}
      </label>
      <textarea id="rm" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} placeholder={t.sendPlaceholder} className={`${area} mt-3`} />
      <Button onClick={go} disabled={state === "sending" || !note.trim()} size="sm" className="mt-3">
        {state === "sending" ? t.sendSending : t.sendGo}
      </Button>
      <div role="status" className="mt-2 text-sm font-semibold">
        {state === "done" && <span className="text-success">{t.sendDone}</span>}
        {state === "failed" && <span className="text-danger">{t.sendFailed}</span>}
      </div>
      {before.length > 0 && (
        <div className="mt-3">
          <div className={lblClass}>{t.sentBefore}</div>
          <ul className="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0 text-[14.5px]">
            {before.slice(0, 5).map((r, i) => (
              <li key={r.id ?? i} className="rounded-xl bg-surface-sunken px-3 py-2.5">
                <span lang={locale === "en" && /[\u0900-\u097F]/.test(r.note ?? "") ? "hi" : undefined}>{r.note || r.itemName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
