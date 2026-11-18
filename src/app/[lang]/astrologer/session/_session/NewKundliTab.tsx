"use client";

import { useState, type FormEvent } from "react";
import { PiCheckCircle, PiFilePlus, PiSparkle } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { ApiError } from "@/lib/api";
import { generateChart, geocodePlace } from "@/lib/endpoints";
import { GRAHAS, grahaAbbr, lordName, nakshatraName, rashiName, type Chart } from "@/lib/jyotish";
import { Button, Card } from "../../_console/ui";
import DesignChart, { type ChartCell } from "./DesignChart";
import { dt } from "./design";
import { GRAHA_COLOR } from "./kundliData";
import { Head } from "./parts";

const field = "h-[50px] w-full rounded-[14px] border border-line-strong bg-surface-page px-3.5 text-base text-ink";
const lbl = "text-sm font-semibold";

/** A kundli from typed birth details (POST /v1/jyotish/chart): for a person who is not the customer, or a check of another date. */
export default function NewKundliTab() {
  const t = useT(dt);
  const locale = useLocale();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("female");
  const [dob, setDob] = useState("");
  const [tob, setTob] = useState("");
  const [place, setPlace] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "need" | "place" | "failed">("idle");
  const [made, setMade] = useState<{ name: string; chart: Chart } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!dob || !tob || place.trim().length < 2) return setState("need");
    setState("busy");
    try {
      const geo = await geocodePlace(place.trim());
      const chart = await generateChart({ date: dob, time: tob, tz: geo.timezone, lat: geo.latitude, lon: geo.longitude });
      setMade({ name: name.trim(), chart });
      setState("idle");
    } catch (error) {
      setState(error instanceof ApiError && error.status === 404 ? "place" : "failed");
    }
  };

  const chart = made?.chart;
  const cells: ChartCell[] = chart
    ? Array.from({ length: 12 }, (_, i) => {
        const sign = ((chart.lagna.rashi - 1 + i) % 12) + 1;
        return {
          sign,
          items: [
            ...(sign === chart.lagna.rashi ? [{ ab: t.ascAb, deg: `${Math.floor(chart.lagna.deg_in_rashi)}°`, style: { color: "var(--color-brand-strong)" } }] : []),
            ...GRAHAS.filter((g) => chart.planets[g].rashi === sign).map((g) => ({
              ab: grahaAbbr(g, locale) + (chart.planets[g].retro && g !== "Rahu" && g !== "Ketu" ? ` (${t.retroMark})` : ""),
              deg: `${Math.floor(chart.planets[g].deg_in_rashi)}°`,
            })),
          ],
        };
      })
    : [];
  const message = state === "need" ? t.nkNeed : state === "place" ? t.nkPlace : state === "failed" ? t.nkFailed : "";

  return (
    <div className="flex flex-col gap-6">
      <Card className="px-6 py-[22px]">
        <Head icon={PiFilePlus} id="nkt">
          {t.nkTitle}
        </Head>
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="nkn" className={lbl}>
              {t.nkName}
            </label>
            <input id="nkn" type="text" value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="nkg" className={lbl}>
              {t.nkGender}
            </label>
            <select id="nkg" value={gender} onChange={(e) => setGender(e.target.value)} className={field}>
              <option value="female">{t.female}</option>
              <option value="male">{t.male}</option>
              <option value="other">{t.other}</option>
            </select>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="nkd" className={lbl}>
              {t.nkDob}
            </label>
            <input id="nkd" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={field} />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="nkti" className={lbl}>
              {t.nkTob}
            </label>
            <input id="nkti" type="time" value={tob} onChange={(e) => setTob(e.target.value)} className={field} />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="nkp" className={lbl}>
              {t.nkPob}
            </label>
            <input id="nkp" type="text" value={place} onChange={(e) => setPlace(e.target.value)} placeholder={t.nkPobPh} className={field} />
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={state === "busy"}>
              <PiSparkle className="h-[18px] w-[18px]" aria-hidden />
              {state === "busy" ? t.nkBusy : t.nkBtn}
            </Button>
            {made && state === "idle" && (
              <span role="status" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-success-soft px-3 text-[13px] font-bold text-success">
                <PiCheckCircle className="h-3.5 w-3.5" aria-hidden />
                {t.nkDone}
              </span>
            )}
            {message && (
              <span role="alert" className="text-sm font-bold text-danger">
                {message}
              </span>
            )}
          </div>
        </form>
      </Card>
      {made && chart && (
        <Card className="px-6 py-[22px]">
          <h2 className="font-display text-[22px] font-bold leading-tight">{t.nkResult(made.name)}</h2>
          <div className="mt-3.5">
            <DesignChart cells={cells} label={t.nkResult(made.name)} max={500} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {[
              [t.tLagna, rashiName(chart.lagna.rashi, locale)],
              [t.tMoon, rashiName(chart.planets.Moon.rashi, locale)],
              [t.tNak, nakshatraName(chart.planets.Moon.nakshatra, locale)],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0 rounded-[14px] border border-line bg-surface-page px-3 py-2.5">
                <div className="text-xs font-semibold text-ink-soft">{k}</div>
                <div className="text-[15px] font-bold">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col">
            {GRAHAS.map((g) => (
              <div key={g} className="grid grid-cols-[1.2fr_1fr_.9fr_.5fr] items-center gap-2 border-t border-line py-[9px] text-[15px]">
                <span className="flex items-center gap-2 font-bold">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: GRAHA_COLOR[g] }} />
                  {lordName(g, locale)}
                </span>
                <span className="tabular-nums">{chart.planets[g].dms}</span>
                <span>{rashiName(chart.planets[g].rashi, locale)}</span>
                <span className="font-bold">{chart.planets[g].house}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
