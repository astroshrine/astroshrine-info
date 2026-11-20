"use client";

import { useState } from "react";
import { PiArrowClockwise, PiCaretDown, PiCaretRight, PiCheckCircle, PiMagnifyingGlass, PiSiren } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { INTL_LOCALE } from "@/i18n/config";
import type { BirthPlace } from "@/lib/jyotish";
import { deviceTimeZone, fill, localIso, toolErrorKind, toolErrorText } from "@/lib/services/toolsBCommon";
import {
  CATEGORIES,
  CEIR_URL,
  PRECISIONS,
  askKhoyaPaya,
  needsPoliceCard,
  type Category,
  type KhoyaPayaReading,
  type KhoyaPayaRequest,
  type Precision,
} from "@/lib/services/toolsBKhoya";
import PlaceSearch from "../../kundli/_components/PlaceSearch";
import { Card, ErrorBox, Notice, btnPrimary, btnSecondary, btnSmall, inputCls, labelCls } from "../../kundli/_components/ui";
import SavedList from "../_b/SavedList";
import { Gate, ToolPage } from "../_b/shell";
import { text } from "./messages";

type Text = (typeof text)["hi"];

export default function KhoyaView() {
  const t = useT(text);
  return (
    <ToolPage eyebrow={t.eyebrow} title={t.title} intro={t.intro}>
      <Gate what={t.what} astrologerOnly>
        <KhoyaTool />
      </Gate>
    </ToolPage>
  );
}

type Shown = { reading: KhoyaPayaReading; category: Category; theft: boolean };

function KhoyaTool() {
  const t = useT(text);
  const locale = useLocale();
  const [item, setItem] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [precision, setPrecision] = useState<Precision>("unknown");
  const [lostAt, setLostAt] = useState("");
  const [lastSeen, setLastSeen] = useState("");
  const [theft, setTheft] = useState(false);
  const [place, setPlace] = useState<BirthPlace | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const [now] = useState(() => localIso(new Date()));

  async function ask() {
    if (busy) return;
    if (!item.trim() || !place) return setFormError(t.needItem);
    if (precision !== "unknown" && !lostAt) return setFormError(t.needTime);
    setFormError("");
    setError(null);
    setBusy(true);
    const body: KhoyaPayaRequest = {
      user_input: {
        item: item.trim(),
        category,
        lost_at: precision === "unknown" ? null : lostAt,
        lost_at_precision: precision,
        last_seen_place: lastSeen.trim() || null,
        theft_suspected: theft,
        language: locale,
      },
      place: { city: place.name, lat: place.lat, lon: place.lon, tz: deviceTimeZone() },
    };
    try {
      const reading = await askKhoyaPaya(body);
      setShown({ reading, category, theft });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(toolErrorKind(e) === "rateLimited" ? t.error.rateLimited : toolErrorText(e, locale));
    } finally {
      setBusy(false);
    }
  }

  if (shown) {
    return (
      <div className="space-y-6">
        <ReadingView shown={shown} t={t} />
        <button type="button" className={btnSecondary} onClick={() => setShown(null)}>
          <PiArrowClockwise className="h-5 w-5" aria-hidden /> {t.askAgain}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void ask();
            }}
          >
            <div>
              <label htmlFor="kp-item" className={labelCls}>
                {t.item}
              </label>
              <input id="kp-item" className={inputCls} maxLength={120} value={item} onChange={(e) => setItem(e.target.value)} placeholder={t.itemPlaceholder} />
            </div>

            <fieldset>
              <legend className={labelCls}>{t.categoryLabel}</legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                    {t.category[c]}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={labelCls}>{t.lostWhen}</legend>
              <div className="flex flex-wrap gap-2">
                {PRECISIONS.map((p) => (
                  <Chip key={p} active={precision === p} onClick={() => setPrecision(p)}>
                    {t.precision[p]}
                  </Chip>
                ))}
              </div>
              {precision !== "unknown" && (
                <div className="mt-3">
                  <label htmlFor="kp-lost-at" className="caption-1 mb-1 block text-ink-soft">
                    {t.lostAtLabel}
                  </label>
                  <input id="kp-lost-at" type="datetime-local" className={`${inputCls} sm:max-w-xs`} max={now} value={lostAt} onChange={(e) => setLostAt(e.target.value)} />
                </div>
              )}
            </fieldset>

            <div>
              <label htmlFor="kp-seen" className={labelCls}>
                {t.lastSeen}
              </label>
              <input id="kp-seen" className={inputCls} maxLength={160} value={lastSeen} onChange={(e) => setLastSeen(e.target.value)} placeholder={t.lastSeenPlaceholder} />
            </div>

            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-5 w-5 accent-brand" checked={theft} onChange={(e) => setTheft(e.target.checked)} />
              <span className="title-4 text-ink">{t.theft}</span>
            </label>

            <PlaceSearch id="kp-place" label={t.place} value={place} onPick={setPlace} />

            {formError && (
              <p role="alert" className="body-6 text-danger">
                {formError}
              </p>
            )}
            {error && <ErrorBox message={error} />}
            <button type="submit" disabled={busy} className={btnPrimary}>
              <PiMagnifyingGlass className="h-5 w-5" aria-hidden /> {busy ? t.asking : t.ask}
            </button>
          </form>
        </Card>
        {needsPoliceCard(category, theft) && <PoliceCard t={t} />}
        <p className="caption-5 text-ink-muted">{t.disclaimer}</p>
      </div>
      <aside className="lg:col-span-2">
        <SavedList<KhoyaPayaReading, KhoyaPayaRequest>
          tool="khoya_paya"
          onOpen={(s) =>
            setShown({ reading: s.result, category: s.input?.user_input?.category ?? "other", theft: !!s.input?.user_input?.theft_suspected })
          }
        />
      </aside>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`button-sm rounded-full border px-3 py-2 transition active:scale-98 ${
        active ? "on-inverse border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"
      }`}
    >
      {children}
    </button>
  );
}

function PoliceCard({ t }: { t: Text }) {
  return (
    <section className="rounded-2xl border border-danger bg-surface-card p-5">
      <h2 className="heading-6 flex items-center gap-2 text-danger">
        <PiSiren className="h-5 w-5" aria-hidden /> {t.policeTitle}
      </h2>
      <p className="body-6 mt-2 text-ink-soft">{t.policeBody}</p>
      <a href={CEIR_URL} target="_blank" rel="noopener noreferrer" className={`${btnSmall} mt-3`}>
        {t.ceir}
      </a>
    </section>
  );
}

const VERDICT_TONE = { likely_found: "bg-success-soft text-success", delayed: "bg-warning-soft text-warning", partial: "bg-warning-soft text-warning", unlikely: "bg-danger-soft text-danger" } as const;

function ReadingView({ shown, t }: { shown: Shown; t: Text }) {
  const locale = useLocale();
  const r = shown.reading;
  const [open, setOpen] = useState(false);
  const asked = new Date(r.asked_at).toLocaleString(INTL_LOCALE[locale], { dateStyle: "medium", timeStyle: "short" });
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`title-3 rounded-full px-3 py-1 ${VERDICT_TONE[r.verdict]}`}>{t.verdict[r.verdict]}</span>
            <span className="caption-1 text-ink-soft">{t.confidence[r.confidence]}</span>
            {r.savedId && (
              <span className="caption-2 inline-flex items-center gap-1 text-ink-soft">
                <PiCheckCircle className="h-4 w-4 text-success" aria-hidden /> {t.saved}
              </span>
            )}
          </div>
          <p className="body-4 mt-4 text-ink">{r.summary}</p>
          <p className="caption-2 mt-2 text-ink-soft">{fill(t.askedAt, { time: asked })}</p>
        </Card>

        <Card title={t.whereToLook}>
          <div className="flex items-center gap-4">
            <Compass direction={r.location.direction} label={t.direction[r.location.direction]} t={t} />
            <div className="min-w-0">
              <p className="title-2 text-ink">
                {t.distance[r.location.distance]} · {t.direction[r.location.direction]}
              </p>
              <p className="body-5 mt-1 text-ink-soft">{r.location.place_type}</p>
            </div>
          </div>
          <p className="body-6 mt-3 text-ink-soft">{r.location.reasoning}</p>
        </Card>

        {r.timing && (
          <Card title={t.timing}>
            <p className="title-2 text-ink">{r.timing.range}</p>
            <p className="body-6 mt-1 text-ink-soft">{r.timing.reasoning}</p>
          </Card>
        )}

        {r.theft_analysis && (
          <Card title={t.theftTitle}>
            <p className="body-5 text-ink">{r.theft_analysis.general_indication}</p>
            <p className="body-5 mt-2 text-ink">{r.theft_analysis.action_advice}</p>
          </Card>
        )}
      </div>

      <div className="space-y-6 lg:col-span-2">
        <Card title={t.searchTips}>
          <ul className="list-disc space-y-2 pl-5">
            {r.search_tips.map((tip, i) => (
              <li key={i} className="body-5 text-ink">
                {tip}
              </li>
            ))}
          </ul>
        </Card>

        {r.optional_prayer && (
          <Card title={t.prayer}>
            <p className="body-5 text-ink">{r.optional_prayer}</p>
          </Card>
        )}

        <Card>
          <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="heading-6 flex w-full items-center gap-2 text-left text-ink">
            {open ? <PiCaretDown className="h-5 w-5" aria-hidden /> : <PiCaretRight className="h-5 w-5" aria-hidden />} {t.howJudged}
          </button>
          {open && (
            <div className="mt-3 space-y-2">
              {r.rules_applied.map((x, i) => (
                <p key={i} className="body-6 text-ink-soft">
                  {x.rule}: {x.finding} ({t.supports[x.supports]})
                </p>
              ))}
              {r.lochan_result && (
                <p className="body-6 text-ink-soft">
                  {t.lochan}: {r.lochan_result.meaning}
                </p>
              )}
              {r.limitations.length > 0 && <p className="title-4 pt-2 text-ink">{t.limitations}</p>}
              {r.limitations.map((x, i) => (
                <p key={i} className="body-6 text-ink-soft">
                  • {x}
                </p>
              ))}
            </div>
          )}
        </Card>

        {needsPoliceCard(shown.category, shown.theft) && <PoliceCard t={t} />}
        {r.disclaimer && <Notice>{r.disclaimer}</Notice>}
      </div>
    </div>
  );
}

/** North at the top; the indicated side is filled. */
function Compass({ direction, label, t }: { direction: string; label: string; t: Text }) {
  const mark = (d: "north" | "east" | "south" | "west", pos: string) => (
    <span
      key={d}
      aria-hidden
      className={`caption-1 absolute grid h-6 w-6 place-items-center rounded-full ${pos} ${direction === d ? "bg-surface-inverse text-ink-inverse on-inverse" : "text-ink-soft"}`}
    >
      {t.direction[d].slice(0, 1)}
    </span>
  );
  return (
    <div role="img" aria-label={label} className="relative h-20 w-20 shrink-0 rounded-full border border-line-strong bg-surface-sunken">
      {mark("north", "left-1/2 top-1 -translate-x-1/2")}
      {mark("east", "right-1 top-1/2 -translate-y-1/2")}
      {mark("south", "bottom-1 left-1/2 -translate-x-1/2")}
      {mark("west", "left-1 top-1/2 -translate-y-1/2")}
    </div>
  );
}
