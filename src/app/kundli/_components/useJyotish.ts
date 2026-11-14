"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

/** `at`: when the answer arrived (ms), the "now" for marking running periods without reading the clock in render. */
export type Request<T> = { loading: boolean; data?: T; error?: unknown; at: number; retry: () => void };

/**
 * Runs `run` whenever `key` changes (null = nothing to ask yet). Results are kept per key, so no state is set
 * synchronously inside the effect (react-hooks/set-state-in-effect): loading is "no answer for this key yet".
 */
export function useJyotish<T>(key: string | null, run: (signal: AbortSignal) => Promise<T>): Request<T> {
  const [attempt, setAttempt] = useState(0);
  const [done, setDone] = useState<{ key: string; data?: T; error?: unknown; at: number } | null>(null);
  const full = key === null ? null : `${key}#${attempt}`;

  useEffect(() => {
    if (full === null) return;
    const controller = new AbortController();
    run(controller.signal).then(
      (data) => setDone({ key: full, data, at: Date.now() }),
      (error) => {
        if (!controller.signal.aborted) setDone({ key: full, error, at: Date.now() });
      },
    );
    return () => controller.abort();
    // `run` is recreated on every render; `full` is what decides whether to ask again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  const current = done && done.key === full ? done : null;
  return {
    loading: full !== null && !current,
    data: current?.data,
    error: current?.error,
    at: current?.at ?? 0,
    retry: () => setAttempt((a) => a + 1),
  };
}

/** The app's jyotishErrorText, in Hindi: what failed and what to do next. */
export function jyotishErrorText(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 400) return "जन्म विवरण में कुछ गलत है। तिथि, समय और स्थान जाँचकर फिर कोशिश करें।";
    if (e.status === 401) return "लॉगिन की अवधि खत्म हो गई। दोबारा लॉगिन करें।";
    if (e.status === 404) return "यह जानकारी नहीं मिली।";
    if (e.status === 429) return "बहुत सारे अनुरोध एक साथ आए। एक मिनट बाद फिर कोशिश करें।";
    if (e.status === 503) return "गणना इंजन अभी शुरू हो रहा है। थोड़ी देर बाद फिर कोशिश करें।";
    if (e.status === 502 || e.status === 504) return "सर्वर से जवाब नहीं आया। फिर कोशिश करें।";
  }
  if (e instanceof TypeError) return "इंटरनेट कनेक्शन नहीं मिला। कनेक्शन जाँचकर फिर कोशिश करें।";
  return "गणना पूरी नहीं हो सकी। फिर कोशिश करें।";
}
