"use client";

import { useState } from "react";
import { PiGift, PiLeaf, PiPaperPlaneTilt, PiSparkle } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { ApiError } from "@/lib/api";
import { grahaName } from "@/lib/jyotish";
import {
  listSentRemedies,
  sendTextRemedy,
  suggestPuja,
  type ClientSheet,
  type PujaSuggestion,
} from "@/lib/services/astrologerSession";
import { Button, Card, Pill } from "../../_console/ui";
import { useJyotish } from "../../../kundli/_components/useJyotish";
import { text } from "./messages";
import { Head, lblClass, sectionClass } from "./parts";

const area = "w-full resize-y rounded-[14px] border border-line-strong bg-surface-page px-3.5 py-3 text-[15px] leading-[1.55] text-ink";

/** Remedies for this customer: what the kundli supports, an AI puja and gem suggestion, and sending a remedy to them. */
export default function RemediesTab({ sheet, chatId, clientId, astrologerId }: { sheet: ClientSheet; chatId: string; clientId: string; astrologerId: string }) {
  const t = useT(text);
  const locale = useLocale();
  const u = sheet.upay;
  return (
    <div className="flex flex-col gap-6">
      {u ? (
        <>
          <Card className={sectionClass}>
            <Head icon={PiSparkle}>{t.confirmedDoshas}</Head>
            {u.doshas.length === 0 ? (
              <p className="m-0 mt-3 text-[15px] text-ink-soft">{t.noConfirmed}</p>
            ) : (
              <ul className="m-0 mt-3.5 flex list-none flex-col gap-2 p-0">
                {u.doshas.map((d) => (
                  <li key={d.id} className="rounded-2xl border-[1.5px] border-[#F2B98A] bg-warning-soft px-4 py-3.5">
                    <b className="block text-base text-warning">{locale === "hi" ? d.name_hi : d.name_en}</b>
                    <ul className="m-0 mt-1 list-disc pl-5 text-[14.5px]">
                      {(locale === "hi" ? d.conditions_met_hi : d.conditions_met).map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className={sectionClass}>
            <Head icon={PiGift}>{t.gemTitle}</Head>
            {!u.gemstones.available ? (
              <p className="m-0 mt-3 text-[15px] text-ink-soft">{t.gemNeedsTime}</p>
            ) : (
              <>
                <div className={`${lblClass} mt-3.5 !text-success`}>{t.gemSuitable}</div>
                <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
                  {u.gemstones.suitable.map((g) => (
                    <li key={g.graha} className="rounded-2xl border border-line bg-surface-page px-4 py-3">
                      <b className="block text-base">{g.gem}</b>
                      <span className="text-sm text-ink-soft">
                        {grahaName(g.graha, locale)}
                        {g.upratna ? ` · ${t.upratna}: ${g.upratna}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                {u.gemstones.not_advised.length > 0 && (
                  <>
                    <div className={`${lblClass} mt-4 !text-danger`}>{t.gemAvoid}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {u.gemstones.not_advised.map((g) => (
                        <Pill key={g.graha} tone="neutral" className="h-[26px] text-xs">
                          {g.gem}
                        </Pill>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </Card>

          <Card className={sectionClass}>
            <Head icon={PiLeaf}>{t.grahaTitle}</Head>
            <div className="mt-3 flex flex-col gap-2">
              {u.grahas.map((g) => (
                <details key={g.graha} className="rounded-[14px] border border-line bg-surface-page">
                  <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3.5 py-2.5 font-bold">
                    {grahaName(g.graha, locale)}
                    {g.house !== null && <span className="text-[13px] font-medium text-ink-soft">· {t.house_} {g.house}</span>}
                  </summary>
                  <div className="px-3.5 pb-3 text-[14.5px]">
                    {[
                      [t.mantra, g.mantra.text],
                      [t.japa, `${g.mantra.daily}`],
                      [t.daan, `${g.daan.item} (${g.daan.day})`],
                      [t.vrat, `${g.vrat.day}, ${g.vrat.deity}`],
                    ].map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[90px_1fr] gap-2.5 border-t border-line py-2">
                        <b className="text-brand-strong">{k}</b>
                        <span>{v}</span>
                      </div>
                    ))}
                    {g.lal_kitab && (
                      <div className="mt-2 rounded-[14px] border border-[#F2D58A] bg-surface-sunken px-3.5 py-3">
                        <b className="mb-1 block text-brand-strong">{t.lalKitab}</b>
                        {g.lal_kitab.reading[locale]}
                        <ul className="m-0 mt-1 list-disc pl-5">
                          {g.lal_kitab.upay.map((x) => (
                            <li key={x.en}>{x[locale]}</li>
                          ))}
                        </ul>
                        {g.lal_kitab.avoid.length > 0 && (
                          <div className="mt-1">
                            <b>{t.lalAvoid}:</b> {g.lal_kitab.avoid.map((x) => x[locale]).join("; ")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <Card className={sectionClass}>
          <p className="m-0 text-[15px] text-ink-soft">{t.noUpay}</p>
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
