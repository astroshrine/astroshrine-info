"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";

const text = defineMessages({
  hi: {
    invalid: "जन्म विवरण में कुछ गलत है। तिथि, समय और स्थान जाँचकर फिर कोशिश करें।",
    expired: "लॉगिन की अवधि खत्म हो गई। दोबारा लॉगिन करें।",
    notFound: "यह जानकारी नहीं मिली।",
    tooMany: "बहुत सारे अनुरोध एक साथ आए। एक मिनट बाद फिर कोशिश करें।",
    starting: "गणना इंजन अभी शुरू हो रहा है। थोड़ी देर बाद फिर कोशिश करें।",
    noAnswer: "सर्वर से जवाब नहीं आया। फिर कोशिश करें।",
    offline: "इंटरनेट कनेक्शन नहीं मिला। कनेक्शन जाँचकर फिर कोशिश करें।",
    failed: "गणना पूरी नहीं हो सकी। फिर कोशिश करें।",
  },
  en: {
    invalid: "Something in the birth details is not right. Check the date, time and place, then try again.",
    expired: "Your login has expired. Log in again.",
    notFound: "This information was not found.",
    tooMany: "Too many requests came in at once. Try again in a minute.",
    starting: "The calculation engine is starting up. Try again in a little while.",
    noAnswer: "The server did not respond. Try again.",
    offline: "No internet connection. Check your connection and try again.",
    failed: "The calculation could not be completed. Try again.",
  },
});

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

/**
 * The app's jyotishErrorText: what failed and what to do next, in the page's language (pass useLocale()).
 * Without a locale it answers in Hindi, as it did before the site had languages.
 */
export function jyotishErrorText(e: unknown, locale: Locale = "hi"): string {
  const t = text[locale];
  if (e instanceof ApiError) {
    if (e.status === 400) return t.invalid;
    if (e.status === 401) return t.expired;
    if (e.status === 404) return t.notFound;
    if (e.status === 429) return t.tooMany;
    if (e.status === 503) return t.starting;
    if (e.status === 502 || e.status === 504) return t.noAnswer;
  }
  if (e instanceof TypeError) return t.offline;
  return t.failed;
}
