"use client";

import { PiCheckCircle, PiXCircle } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import type { CheckResult } from "@/lib/services/toolsBBlindKundli";
import { Card, Notice } from "../../kundli/_components/ui";
import { bkText } from "./text";

/** The server's astronomical checks (details come from the backend in English). */
export default function Checks({ result }: { result: CheckResult }) {
  const t = useT(bkText);
  return (
    <Card title={t.checksTitle}>
      <ul className="space-y-2">
        {result.checks.map((c) => (
          <li key={c.name} className={`body-6 flex items-start gap-2 ${c.ok ? "text-ink" : "text-danger"}`}>
            {c.ok ? <PiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden /> : <PiXCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
            <span className="min-w-0 break-words">{c.detail}</span>
          </li>
        ))}
      </ul>
      {result.birth_windows.length > 0 && (
        <p className="body-6 mt-3 text-ink-soft">
          {t.windows} {result.birth_windows.map((w) => (w.from === w.to ? w.from : `${w.from} → ${w.to}`)).join(", ")}
        </p>
      )}
      <div className="mt-3">
        <Notice>{t.rashiOnly}</Notice>
      </div>
    </Card>
  );
}

/** A row of toggle buttons: one is active. */
export function Chips<T extends string | number>({ items, value, onPick, label }: { items: { v: T; label: string }[]; value: T | null; onPick: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((i) => (
        <button
          key={String(i.v)}
          type="button"
          aria-pressed={value === i.v}
          onClick={() => onPick(i.v)}
          className={`button-sm min-w-9 rounded-lg border px-3 py-1.5 transition active:scale-98 ${
            value === i.v ? "on-inverse border-transparent bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"
          }`}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}
