"use client";

import { PiPhone } from "react-icons/pi";
import { useLocale } from "@/i18n/LocaleProvider";
import { Card, btnPrimary } from "../../kundli/_components/ui";
import { HELPLINES, SAFETY_TEXT, pick } from "../mansik/data";

/** Shown instead of a report when an answer showed distress: no chart, no remedies, nothing is sent to the server. */
export default function SafetySupport() {
  const hi = useLocale() === "hi";
  return (
    <Card title={pick(SAFETY_TEXT.title, hi)}>
      <p role="alert" className="body-4 rounded-2xl bg-warning-soft p-3 text-warning">
        {pick(SAFETY_TEXT.body, hi)}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {HELPLINES.map((h) => (
          <a key={h.tel} href={`tel:${h.tel}`} className={btnPrimary}>
            <PiPhone className="h-5 w-5" aria-hidden /> {pick(h.label, hi)}
          </a>
        ))}
      </div>
      <p className="body-6 mt-4 text-ink-soft">{pick(SAFETY_TEXT.emergency, hi)}</p>
    </Card>
  );
}
