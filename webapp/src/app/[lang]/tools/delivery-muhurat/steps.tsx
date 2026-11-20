"use client";

import { useState } from "react";
import { PiMapPin, PiMagnifyingGlass, PiPlus, PiTrash } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { useT } from "@/i18n/LocaleProvider";
import { geocodePlace } from "@/lib/endpoints";
import { epochToWall } from "@/lib/jyotish";
import { fill, todayYmd } from "@/lib/services/toolsBCommon";
import type { ApprovedWindow, DeliveryType, FixedReason, Hospital, Parent, Place, PregnancyStatus, RequestDraft } from "@/lib/services/toolsBDelivery";
import PlaceSearch from "../../kundli/_components/PlaceSearch";
import { Card, btnSecondary, btnSmall } from "../../kundli/_components/ui";
import { Check, Choice, Field } from "./fields";
import { localMinutes } from "./logic";
import { dmText } from "./messages";

const DELIVERY_TYPES: DeliveryType[] = ["normal", "planned_c_section", "elective_c_section"];
const FIXED_REASONS: FixedReason[] = ["doctor_fixed", "emergency", "only_one_possible"];
const PREGNANCY: PregnancyStatus[] = ["first", "second_plus", "other"];

export function ParentStep({ value, onChange }: { value?: Parent; onChange: (p: Parent) => void }) {
  const t = useT(dmText);
  const { user } = useAuth();
  const p: Parent = value ?? { name: "", dob: "", tob: "", birthplace: null, country: "India" };
  const set = (patch: Partial<Parent>) => onChange({ ...p, ...patch });

  // The account's own birth details (shared with the app): one press fills the empty form.
  const prof = user?.profile;
  const pp = prof?.placeOfBirth;
  const lat = pp?.geolocation?.lat ?? pp?.geoLocation?.lat;
  const lon = pp?.geolocation?.lng ?? pp?.geoLocation?.long;
  const tz = pp?.geolocation?.timezone ?? pp?.geoLocation?.timezone ?? pp?.timezone ?? "Asia/Kolkata";
  const saved = prof?.dateTimeOfBirth && lat != null && lon != null ? { ms: prof.dateTimeOfBirth, lat, lon, tz, name: pp?.displayValue ?? "" } : null;

  return (
    <div className="space-y-4">
      <h2 className="heading-6 text-ink">{t.motherTitle}</h2>
      {saved && (
        <button
          type="button"
          className={btnSmall}
          onClick={() => {
            const w = epochToWall(saved.ms, saved.tz);
            set({ name: user?.name?.trim() || p.name, dob: w.date, tob: w.time, birthplace: { name: saved.name, lat: saved.lat, lng: saved.lon, tz: saved.tz } });
          }}
        >
          {t.useSaved}
        </button>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.name} value={p.name} maxLength={80} onChange={(e) => set({ name: e.target.value })} />
        <Field label={t.country} value={p.country} maxLength={60} onChange={(e) => set({ country: e.target.value })} />
        <Field label={t.dob} type="date" value={p.dob} min="1940-01-01" max={todayYmd()} onChange={(e) => set({ dob: e.target.value })} />
        <Field label={t.tob} type="time" value={p.tob ?? ""} onChange={(e) => set({ tob: e.target.value })} />
      </div>
      <PlaceSearch
        id="dm-birthplace"
        label={t.birthplace}
        value={p.birthplace ? { name: p.birthplace.name, lat: p.birthplace.lat, lon: p.birthplace.lng, tz: p.birthplace.tz } : null}
        onPick={(b) => set({ birthplace: b ? { name: b.name, lat: b.lat, lng: b.lon, tz: b.tz } : null })}
      />
      <Field label={t.currentCity} value={p.currentCity ?? ""} maxLength={80} onChange={(e) => set({ currentCity: e.target.value })} />
      <Choice
        label={t.pregnancyStatus}
        value={p.pregnancyStatus}
        options={PREGNANCY.map((k) => ({ value: k, label: t.pregnancy[k] }))}
        onChange={(pregnancyStatus) => set({ pregnancyStatus })}
      />
      {p.pregnancyStatus === "second_plus" && (
        <Field label={t.lastDeliveryDate} type="date" value={p.lastDeliveryDate ?? ""} max={todayYmd()} onChange={(e) => set({ lastDeliveryDate: e.target.value })} />
      )}
    </div>
  );
}

const splitLocal = (local = "") => {
  const [date = "", time = ""] = local.split("T");
  return { date, time: time.slice(0, 5) };
};

export function MedicalStep({ draft, onChange, maxWindowDays }: { draft: RequestDraft; onChange: (patch: Partial<RequestDraft>) => void; maxWindowDays: number }) {
  const t = useT(dmText);
  const windows = draft.windows ?? [];
  const fixed = draft.singleFixedTime ?? null;
  const setWindow = (i: number, w: ApprovedWindow) => onChange({ windows: windows.map((x, j) => (j === i ? w : x)) });
  const totalH = windows.reduce((sum, w) => {
    const ok = /T\d/.test(w.startLocal) && /T\d/.test(w.endLocal);
    return ok ? sum + Math.max(0, localMinutes(w.endLocal) - localMinutes(w.startLocal)) / 60 : sum;
  }, 0);
  const fx = splitLocal(fixed?.local);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="heading-6 text-ink">{t.medicalTitle}</h2>
        <p className="body-6 mt-1 text-ink-soft">{t.medicalIntro}</p>
      </div>
      <Choice
        label={t.deliveryType}
        value={draft.delivery?.type}
        options={DELIVERY_TYPES.map((k) => ({ value: k, label: t.delivery[k] }))}
        onChange={(type) => onChange({ delivery: { ...draft.delivery, type } })}
      />
      <Field
        label={t.expectedDate}
        type="date"
        value={draft.delivery?.expectedDate ?? ""}
        onChange={(e) => onChange({ delivery: { type: draft.delivery?.type ?? "normal", ...draft.delivery, expectedDate: e.target.value } })}
      />

      <div className="space-y-3 rounded-2xl border border-line p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={!!fixed}
            onChange={(e) => onChange({ singleFixedTime: e.target.checked ? { local: "", reason: "doctor_fixed" } : null })}
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
          />
          <span className="title-4 text-ink">{t.singleFixed}</span>
        </label>
        {fixed && (
          <>
            <p className="caption-2 text-ink-soft">{t.singleFixedHint}</p>
            <Choice
              label={t.singleFixed}
              value={fixed.reason}
              options={FIXED_REASONS.map((k) => ({ value: k, label: t.fixedReason[k] }))}
              onChange={(reason) => onChange({ singleFixedTime: { ...fixed, reason } })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.fixedDate} type="date" value={fx.date} min={todayYmd()} onChange={(e) => onChange({ singleFixedTime: { ...fixed, local: `${e.target.value}T${fx.time}` } })} />
              <Field label={t.fixedTime} type="time" value={fx.time} onChange={(e) => onChange({ singleFixedTime: { ...fixed, local: `${fx.date}T${e.target.value}` } })} />
            </div>
          </>
        )}
      </div>

      {!fixed && (
        <div className="space-y-3">
          <div>
            <h3 className="title-3 text-ink">{t.windows}</h3>
            <p className="caption-2 text-ink-soft">{t.windowsHint}</p>
          </div>
          {windows.map((w, i) => {
            const a = splitLocal(w.startLocal);
            const b = splitLocal(w.endLocal);
            return (
              <div key={i} className="space-y-3 rounded-2xl border border-line p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="caption-4 text-brand-strong">{fill(t.windowN, { n: i + 1 })}</p>
                  <button type="button" className={btnSmall} onClick={() => onChange({ windows: windows.filter((_, j) => j !== i) })}>
                    <PiTrash className="h-4 w-4" aria-hidden /> {t.remove}
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label={t.windowDate} type="date" value={a.date} min={todayYmd()} onChange={(e) => setWindow(i, { startLocal: `${e.target.value}T${a.time}`, endLocal: `${e.target.value}T${b.time}` })} />
                  <Field label={t.from} type="time" value={a.time} onChange={(e) => setWindow(i, { ...w, startLocal: `${a.date}T${e.target.value}` })} />
                  <Field label={t.to} type="time" value={b.time} onChange={(e) => setWindow(i, { ...w, endLocal: `${a.date}T${e.target.value}` })} />
                </div>
              </div>
            );
          })}
          {windows.length < 10 && (
            <button type="button" className={btnSecondary} onClick={() => onChange({ windows: [...windows, { startLocal: "", endLocal: "" }] })}>
              <PiPlus className="h-4 w-4" aria-hidden /> {t.addWindow}
            </button>
          )}
          <p className="caption-2 text-ink-soft">{fill(t.windowTotal, { hours: Math.round(totalH * 10) / 10, days: maxWindowDays })}</p>
        </div>
      )}

      <Check label={fixed ? t.doctorConfirmFixed : t.doctorConfirm} checked={draft.doctorConfirmed === true} onChange={(doctorConfirmed) => onChange({ doctorConfirmed })} />
    </div>
  );
}

/** Name and place -> the backend geocoder; a hospital the geocoder does not know lands on its city, to be checked. */
export function HospitalStep({ value, onChange }: { value?: Hospital; onChange: (h: Hospital) => void }) {
  const t = useT(dmText);
  const h: Hospital = value ?? { name: "", city: "", country: "India", lat: NaN, lng: NaN, tz: "", confirmed: false };
  const set = (patch: Partial<Hospital>) => onChange({ ...h, ...patch });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<"" | "notFound" | "cityOnly">("");
  const [advanced, setAdvanced] = useState(false);
  const located = Number.isFinite(h.lat) && Number.isFinite(h.lng);

  const geocode = async (q: string): Promise<Place | null> => {
    if (!q.trim()) return null;
    try {
      const r = await geocodePlace(q.trim());
      return Number.isFinite(r.latitude) && Number.isFinite(r.longitude) ? { name: r.formattedAddress || q.trim(), lat: r.latitude, lng: r.longitude, tz: r.timezone } : null;
    } catch {
      return null;
    }
  };

  async function locate() {
    if (busy) return;
    setBusy(true);
    setNote("");
    const exact = await geocode([h.name, h.city, h.country].filter((x) => x.trim()).join(", "));
    const p = exact ?? (h.city.trim() ? await geocode([h.city, h.country].filter((x) => x.trim()).join(", ")) : null);
    setBusy(false);
    if (!p) return setNote("notFound");
    if (!exact) setNote("cityOnly");
    set({ lat: p.lat, lng: p.lng, tz: p.tz, address: p.name, confirmed: false });
  }

  return (
    <div className="space-y-4">
      <h2 className="heading-6 text-ink">{t.hospitalTitle}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t.hospitalName} value={h.name} maxLength={120} onChange={(e) => set({ name: e.target.value })} />
        <Field label={t.city} value={h.city} maxLength={80} onChange={(e) => set({ city: e.target.value })} />
        <Field label={t.country} value={h.country} maxLength={60} onChange={(e) => set({ country: e.target.value })} />
      </div>
      <button type="button" className={btnSecondary} onClick={() => void locate()} disabled={busy || !(h.name.trim() || h.city.trim())}>
        <PiMagnifyingGlass className="h-4 w-4" aria-hidden /> {t.findLocation}
      </button>
      <div aria-live="polite">
        {note && <p role="alert" className="caption-2 text-danger">{note === "notFound" ? t.placeNotFound : t.cityOnly}</p>}
      </div>
      {(located || advanced) && (
        <Card>
          {advanced ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t.address} value={h.address ?? ""} onChange={(e) => set({ address: e.target.value, confirmed: false })} />
              <Field label={t.tz} value={h.tz} autoCapitalize="none" placeholder="Asia/Kolkata" onChange={(e) => set({ tz: e.target.value.trim(), confirmed: false })} />
              <Field label={t.lat} inputMode="decimal" defaultValue={Number.isFinite(h.lat) ? String(h.lat) : ""} onChange={(e) => set({ lat: e.target.value.trim() ? Number(e.target.value) : NaN, confirmed: false })} />
              <Field label={t.lng} inputMode="decimal" defaultValue={Number.isFinite(h.lng) ? String(h.lng) : ""} onChange={(e) => set({ lng: e.target.value.trim() ? Number(e.target.value) : NaN, confirmed: false })} />
            </div>
          ) : (
            <dl className="divide-y divide-line">
              {(
                [
                  [t.address, h.address || "-"],
                  [t.lat, h.lat.toFixed(5)],
                  [t.lng, h.lng.toFixed(5)],
                  [t.tz, h.tz || "-"],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex flex-wrap justify-between gap-2 py-2">
                  <dt className="caption-1 text-ink-soft">{k}</dt>
                  <dd className="body-5 min-w-0 break-words text-right text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {located && (
            <a
              className={`${btnSmall} mt-3`}
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.google.com/maps?q=${h.lat},${h.lng}`}
            >
              <PiMapPin className="h-4 w-4" aria-hidden /> {t.openMaps}
            </a>
          )}
        </Card>
      )}
      <label className="flex cursor-pointer items-center gap-3">
        <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand)]" />
        <span className="body-6 text-ink">{t.advanced}</span>
      </label>
      <Check label={t.locationConfirm} checked={h.confirmed} onChange={(confirmed) => set({ confirmed })} />
    </div>
  );
}
