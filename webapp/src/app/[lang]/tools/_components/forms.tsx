"use client";

import { useId, type ReactNode } from "react";
import { inputCls, labelCls } from "../../kundli/_components/ui";

/** A labelled input. Pass `children` to replace the input (a select, a date field …). */
export function Field({
  label,
  hint,
  children,
  ...input
}: { label: string; hint?: string; children?: (id: string) => ReactNode } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "children">) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children ? children(id) : <input id={id} className={inputCls} {...input} />}
      {hint && <p className="caption-3 mt-1 text-ink-muted">{hint}</p>}
    </div>
  );
}

/** One choice out of a few, as pill buttons (radio group). */
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  hint?: string;
}) {
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
      {hint && <p className="caption-3 mt-1 text-ink-muted">{hint}</p>}
    </fieldset>
  );
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Whole years between a YYYY-MM-DD date and today; null for an invalid date. */
export function ageOn(dob: string, now = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  const mo = now.getMonth() + 1;
  return now.getFullYear() - +m[1] - (mo < +m[2] || (mo === +m[2] && now.getDate() < +m[3]) ? 1 : 0);
}

/** Accepted photo types and the largest file the tools take (the backend's upload limit is 10 MB). */
export const PHOTO_TYPES = ["image/jpeg", "image/png"];
export const PHOTO_MAX_BYTES = 8 * 1024 * 1024;
