"use client";

import { useId, type ReactNode } from "react";
import { inputCls, labelCls } from "../../kundli/_components/ui";

/** A labelled input, or any control passed as `children(id)`. */
export function Field({
  label,
  hint,
  children,
  ...input
}: { label: string; hint?: string; children?: (id: string) => ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children ? children(id) : <input id={id} className={inputCls} {...input} />}
      {hint && <p className="caption-3 mt-1 text-ink-muted">{hint}</p>}
    </div>
  );
}

/** One choice out of a few, as pill buttons (a radio group). */
export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T | undefined; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <fieldset>
      <legend id={id} className={labelCls}>
        {label}
      </legend>
      <div role="radiogroup" aria-labelledby={id} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={`body-6 rounded-full border px-3 py-1.5 transition active:scale-98 ${
                on ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** A tick box with a sentence beside it. */
export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface-sunken p-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-brand)]" />
      <span className="body-6 min-w-0 text-ink">{label}</span>
    </label>
  );
}

/** Pill tabs (a tablist) for switching a result panel. */
export function Pills<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; lang?: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-2 overflow-x-auto pb-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            lang={o.lang}
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={`button-sm shrink-0 rounded-full border px-3 py-1.5 transition active:scale-98 ${
              on ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
