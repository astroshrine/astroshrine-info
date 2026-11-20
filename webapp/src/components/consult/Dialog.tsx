"use client";

import { useEffect, useId, useRef } from "react";
import { PiX } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";

const text = defineMessages({
  hi: { close: "बंद करें" },
  en: { close: "Close" },
});

/**
 * A modal dialog on the native <dialog> element: focus moves in and is trapped, Escape and a click on the
 * backdrop close it, and focus returns to the control that opened it.
 */
export default function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const t = useT(text);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-full max-w-md rounded-2xl border border-line bg-surface-card p-0 text-ink shadow-xl backdrop:bg-surface-inverse/60 backdrop:backdrop-blur-sm max-sm:max-w-[calc(100%-2rem)]"
    >
      {open && (
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="heading-6 text-ink">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-surface-sunken hover:text-ink active:scale-98"
            >
              <PiX className="h-5 w-5" aria-hidden />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

/** The two button looks used across dialogs and action cards. */
export const primaryButton =
  "button-md inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";
export const secondaryButton =
  "button-md inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";
export const quietButton =
  "button-sm inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-ink-soft transition hover:bg-surface-sunken hover:text-ink active:scale-98 disabled:cursor-not-allowed disabled:opacity-60";
