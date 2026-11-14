"use client";

import { useId, useRef, useState } from "react";
import { PiImage, PiPaperPlaneRight } from "react-icons/pi";
import { MAX_IMAGE_BYTES, MAX_TEXT } from "@/lib/services/chat";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Text (Enter sends, Shift+Enter adds a line) and photos, with the backend's limits checked before sending:
 * 1024 characters a message, photos up to 8 MB.
 */
export default function Composer({
  disabled,
  placeholder,
  onSendText,
  onSendImage,
  onTyping,
}: {
  disabled: boolean;
  placeholder: string;
  onSendText: (text: string) => void;
  onSendImage: (file: File) => void;
  onTyping: (typing: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();

  const send = () => {
    const value = text.trim();
    if (!value || disabled) return;
    onSendText(value);
    setText("");
    setError(null);
    onTyping(false);
  };

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return setError("सिर्फ़ JPG, PNG या WebP तस्वीर भेजी जा सकती है।");
    if (file.size > MAX_IMAGE_BYTES) return setError("तस्वीर 8 MB से बड़ी है। छोटी तस्वीर चुनें।");
    setError(null);
    onSendImage(file);
  };

  const near = text.length > MAX_TEXT - 100;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="flex flex-col gap-2 border-t border-line bg-surface-card px-3 py-3 md:px-6"
    >
      {error && (
        <p id={errorId} role="alert" className="caption-2 text-danger">
          {error}
        </p>
      )}
      <div className="flex items-end gap-2">
        <input
          ref={fileInput}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          className="hidden"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            pickImage(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={disabled}
          aria-label="तस्वीर भेजें"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-surface-sunken hover:text-ink active:scale-98 disabled:opacity-50"
        >
          <PiImage className="h-5 w-5" aria-hidden />
        </button>
        <label htmlFor={inputId} className="sr-only">
          संदेश
        </label>
        <textarea
          id={inputId}
          value={text}
          disabled={disabled}
          rows={1}
          maxLength={MAX_TEXT}
          placeholder={placeholder}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => {
            setText(e.target.value);
            onTyping(e.target.value.length > 0);
          }}
          onBlur={() => onTyping(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          className="body-6 max-h-40 min-h-10 min-w-0 flex-1 resize-none rounded-2xl border border-line-strong bg-surface-page px-3 py-2 text-ink [field-sizing:content] placeholder:text-ink-muted disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          aria-label="भेजें"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-brand-ink transition hover:bg-brand-hover active:scale-98 disabled:opacity-50"
        >
          <PiPaperPlaneRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
      {near && (
        <p className="caption-5 self-end text-ink-muted" aria-live="polite">
          {text.length}/{MAX_TEXT}
        </p>
      )}
    </form>
  );
}
