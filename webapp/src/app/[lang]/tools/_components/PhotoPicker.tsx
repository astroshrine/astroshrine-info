"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { PiImage, PiTrash, PiUploadSimple } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from "./forms";
import { labelCls } from "../../kundli/_components/ui";

const text = defineMessages({
  hi: {
    choose: "फ़ोटो चुनें",
    change: "दूसरी फ़ोटो",
    remove: "हटाएँ",
    type: "केवल JPG या PNG फ़ोटो चुनें।",
    size: "फ़ोटो 8 MB से छोटी होनी चाहिए।",
    hint: "JPG या PNG, 8 MB तक",
    preview: "चुनी हुई फ़ोटो",
  },
  en: {
    choose: "Choose a photo",
    change: "Choose another",
    remove: "Remove",
    type: "Choose a JPG or PNG photo.",
    size: "The photo must be smaller than 8 MB.",
    hint: "JPG or PNG, up to 8 MB",
    preview: "The chosen photo",
  },
});

/**
 * A browser file input for one photo, with the type and size checks done before anything is uploaded. Phones
 * offer the camera as well as the gallery. The preview never leaves the browser.
 */
export default function PhotoPicker({
  label,
  file,
  onChange,
  required,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  required?: boolean;
}) {
  const t = useT(text);
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  function pick(f: File | undefined) {
    if (!f) return;
    if (!PHOTO_TYPES.includes(f.type)) return setProblem(t.type);
    if (f.size > PHOTO_MAX_BYTES) return setProblem(t.size);
    setProblem(null);
    onChange(f);
  }

  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required && <span aria-hidden className="text-danger"> *</span>}
      </label>
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-line-strong bg-surface-card p-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local blob preview, not a remote image
          <img src={url} alt={t.preview} className="h-24 w-24 rounded-lg bg-surface-sunken object-contain" />
        ) : (
          <span className="grid h-24 w-24 place-items-center rounded-lg bg-surface-sunken text-ink-muted">
            <PiImage className="h-8 w-8" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <input
            ref={input}
            id={id}
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => input.current?.click()} className="button-sm inline-flex items-center gap-2 rounded-xl border border-ink px-3 py-2 text-ink transition hover:bg-surface-sunken active:scale-98">
              <PiUploadSimple className="h-4 w-4" aria-hidden /> {file ? t.change : t.choose}
            </button>
            {file && (
              <button type="button" onClick={() => onChange(null)} className="button-sm inline-flex items-center gap-2 rounded-xl px-3 py-2 text-ink-soft transition hover:text-danger">
                <PiTrash className="h-4 w-4" aria-hidden /> {t.remove}
              </button>
            )}
          </div>
          <p className="caption-3 mt-2 text-ink-muted">{file ? file.name : t.hint}</p>
          {problem && <p role="alert" className="caption-2 mt-1 text-danger">{problem}</p>}
        </div>
      </div>
    </div>
  );
}
