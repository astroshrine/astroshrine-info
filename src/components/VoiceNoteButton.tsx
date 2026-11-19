"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PiMicrophone, PiPaperPlaneRight, PiTrash } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { MAX_VOICE_SECONDS } from "@/lib/services/chat";

/** Formats the browser may record in, best first. AAC in MP4 plays everywhere (the app's own notes are .m4a);
 *  Chrome and Firefox fall back to Opus in WebM / Ogg. */
const FORMATS = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
/** Speech does not need more; it keeps a 3 minute note well under the size the server checks for contact details. */
const BITS_PER_SECOND = 32_000;
/** A tap that let go at once is not a voice note. */
const MIN_MS = 1000;

const EXTENSIONS: Record<string, string> = { "audio/mp4": "m4a", "audio/webm": "webm", "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/wav": "wav" };

const text = defineMessages({
  hi: {
    record: "वॉइस नोट रिकॉर्ड करें",
    recording: "रिकॉर्ड हो रहा है",
    cancel: "वॉइस नोट रद्द करें",
    send: "वॉइस नोट भेजें",
    blocked: "माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र में इस साइट के लिए माइक चालू करें।",
    noMic: "माइक्रोफ़ोन शुरू नहीं हो सका। जांचें कि माइक लगा है।",
    tooShort: "वॉइस नोट बहुत छोटा था। फिर से रिकॉर्ड करें।",
  },
  en: {
    record: "Record a voice note",
    recording: "Recording",
    cancel: "Discard the voice note",
    send: "Send the voice note",
    blocked: "Microphone permission was not given. Allow the microphone for this site in your browser.",
    noMic: "The microphone could not be started. Check that one is connected.",
    tooShort: "The voice note was too short. Record it again.",
  },
});

/** MediaRecorder and a microphone API: false on the server and in browsers without them (the button is then hidden). */
const canRecord = () => typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
const noSubscription = () => () => {};

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function pickFormat(): string {
  for (const f of FORMATS) if (MediaRecorder.isTypeSupported(f)) return f;
  return ""; // the browser's own default
}

/**
 * A microphone button for a chat composer. Tap to record; while recording it shows the time, a bin to discard and
 * a send button. A note stops and sends itself at MAX_VOICE_SECONDS. Hidden on browsers without MediaRecorder.
 */
export default function VoiceNoteButton({
  disabled,
  onRecorded,
  onActiveChange,
  onError,
  buttonClassName,
}: {
  disabled: boolean;
  onRecorded: (file: File) => void;
  /** True while the microphone is open, so the composer can make room for the recording bar. */
  onActiveChange?: (active: boolean) => void;
  onError: (message: string | null) => void;
  buttonClassName: string;
}) {
  const t = useT(text);
  const supported = useSyncExternalStore(noSubscription, canRecord, () => false);
  const [phase, setPhase] = useState<"idle" | "starting" | "recording">("idle");
  const [seconds, setSeconds] = useState(0);
  const rec = useRef<{ recorder: MediaRecorder; stream: MediaStream; timer: ReturnType<typeof setInterval>; discard: boolean } | null>(null);
  const latest = useRef({ onRecorded, onError, t });
  useEffect(() => {
    latest.current = { onRecorded, onError, t };
  });

  useEffect(() => {
    onActiveChange?.(phase !== "idle");
  }, [phase, onActiveChange]);

  const stop = (discard: boolean) => {
    const r = rec.current;
    if (!r) return;
    r.discard = discard;
    clearInterval(r.timer);
    if (r.recorder.state !== "inactive") r.recorder.stop();
  };

  // The chat closed or the page went away mid-recording: drop the note and free the microphone.
  useEffect(() => {
    if (disabled) stop(true);
  }, [disabled]);
  useEffect(() => () => stop(true), []);

  const start = async () => {
    if (phase !== "idle" || disabled) return;
    onError(null);
    setPhase("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      setPhase("idle");
      const name = (e as DOMException)?.name;
      onError(name === "NotAllowedError" || name === "SecurityError" ? t.blocked : t.noMic);
      return;
    }
    const format = pickFormat();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { ...(format && { mimeType: format }), audioBitsPerSecond: BITS_PER_SECOND });
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setPhase("idle");
      onError(t.noMic);
      return;
    }
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const r = rec.current;
      rec.current = null;
      stream.getTracks().forEach((track) => track.stop());
      setPhase("idle");
      setSeconds(0);
      if (!r || r.discard) return;
      const { onRecorded, onError, t } = latest.current;
      if (Date.now() - startedAt < MIN_MS || !chunks.length) return onError(t.tooShort);
      // The server keeps the type it is given (and picks the file's extension from it): no codecs parameter.
      const type = (recorder.mimeType || format || "audio/webm").split(";")[0];
      onRecorded(new File(chunks, `voice-${startedAt}.${EXTENSIONS[type] ?? "webm"}`, { type }));
    };
    const timer = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(Math.min(s, MAX_VOICE_SECONDS));
      if (s >= MAX_VOICE_SECONDS) stop(false);
    }, 250);
    rec.current = { recorder, stream, timer, discard: false };
    recorder.start(1000);
    setPhase("recording");
  };

  if (!supported) return null;

  if (phase === "idle")
    return (
      <button type="button" onClick={() => void start()} disabled={disabled} aria-label={t.record} title={t.record} className={buttonClassName}>
        <PiMicrophone className="h-5 w-5" aria-hidden />
      </button>
    );

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line-strong bg-surface-card px-2 py-1">
      <button
        type="button"
        onClick={() => stop(true)}
        aria-label={t.cancel}
        title={t.cancel}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-surface-sunken hover:text-danger"
      >
        <PiTrash className="h-5 w-5" aria-hidden />
      </button>
      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-danger motion-safe:animate-pulse" />
      <span role="status" className="body-6 min-w-0 flex-1 truncate text-ink">
        {t.recording} · <span className="tabular-nums">{clock(seconds)}</span>
        <span className="text-ink-muted"> / {clock(MAX_VOICE_SECONDS)}</span>
      </span>
      <button
        type="button"
        onClick={() => stop(false)}
        disabled={phase !== "recording"}
        aria-label={t.send}
        title={t.send}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-brand-ink transition hover:bg-brand-hover active:scale-98 disabled:opacity-50"
      >
        <PiPaperPlaneRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
