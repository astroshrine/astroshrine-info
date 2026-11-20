"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PiImage, PiInfo, PiWarningCircle } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { percentOff, rupee } from "@/lib/services/store";

// Small pieces shared by the store's pages.

export const PAGE = "mx-auto w-full max-w-6xl px-4 pb-20 pt-6 md:px-8 md:pt-8";
export const BTN_PRIMARY =
  "button-md inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-brand-ink transition hover:bg-brand-hover active:scale-98 disabled:cursor-not-allowed disabled:opacity-60";
export const BTN_SECONDARY =
  "button-md inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface-card px-5 py-3 text-ink transition hover:bg-surface-sunken active:scale-98 disabled:cursor-not-allowed disabled:opacity-60";
export const CARD = "rounded-3xl border border-line bg-surface-card";
export const FIELD =
  "body-6 w-full rounded-xl border border-line-strong bg-surface-card px-3 py-2.5 text-ink placeholder:text-ink-muted focus:border-brand";

const text = defineMessages({
  hi: {
    retry: "फिर से कोशिश करें",
    loadFailed: "लोड नहीं हो सका",
    loadFailedBody: "सर्वर से जवाब नहीं मिला। इंटरनेट जाँचकर फिर कोशिश करें।",
    off: (n: number) => `${n}% छूट`,
    loading: "लोड हो रहा है",
  },
  en: {
    retry: "Try again",
    loadFailed: "Could not load this",
    loadFailedBody: "The server did not answer. Check your internet connection and try again.",
    off: (n) => `${n}% off`,
    loading: "Loading",
  },
});

/** A catalog or order photo. Hosts are the admin's to choose, so the image is not run through the optimizer. */
export function StoreImage({ src, alt, className = "", sizes }: { src?: string | null; alt: string; className?: string; sizes?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span aria-hidden className={`grid place-items-center bg-surface-sunken text-ink-muted ${className}`}>
        <PiImage className="h-8 w-8" />
      </span>
    );
  }
  return (
    <span className={`relative block overflow-hidden bg-surface-sunken ${className}`}>
      <Image src={src} alt={alt} fill unoptimized sizes={sizes ?? "(min-width: 1024px) 25vw, 50vw"} className="object-cover" onError={() => setFailed(true)} />
    </span>
  );
}

export function Price({ price, mrp, large = false }: { price: number; mrp?: number | null; large?: boolean }) {
  const t = useT(text);
  const off = percentOff(price, mrp);
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={`${large ? "heading-5" : "title-4"} text-ink`}>{rupee(price)}</span>
      {off > 0 && (
        <>
          <s className="caption-3 text-ink-muted">{rupee(Number(mrp))}</s>
          <span className="caption-3 text-success">{t.off(off)}</span>
        </>
      )}
    </span>
  );
}

export function Notice({
  tone = "info",
  title,
  body,
  children,
}: {
  tone?: "info" | "danger" | "warning" | "success";
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  const style = { info: "bg-surface-sunken text-ink", danger: "bg-danger-soft text-danger", warning: "bg-warning-soft text-warning", success: "bg-success-soft text-success" }[tone];
  const Icon = tone === "info" || tone === "success" ? PiInfo : PiWarningCircle;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`rounded-2xl p-4 ${style}`}>
      <p className="title-4 flex items-start gap-2">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <span>{title}</span>
      </p>
      {body && <p className="caption-2 mt-1 text-ink-soft">{body}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export type Load<T> = { status: "loading" } | { status: "ready"; data: T } | { status: "error"; error: unknown };

/** Runs a load once the page is ready (and again on `retry`); aborts when the page leaves. */
export function useLoad<T>(load: (signal: AbortSignal) => Promise<T>, enabled = true, deps: unknown[] = []) {
  const [state, setState] = useState<Load<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    loadRef.current(controller.signal).then(
      (data) => setState({ status: "ready", data }),
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ status: "error", error });
      },
    );
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, attempt, ...deps]);
  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);
  const update = useCallback((data: T) => setState({ status: "ready", data }), []);
  return { state, retry, update };
}

export function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const t = useT(text);
  return (
    <Notice tone="danger" title={t.loadFailed} body={error instanceof ApiError && error.message ? error.message : t.loadFailedBody}>
      <button type="button" onClick={onRetry} className={`${BTN_SECONDARY} !px-3 !py-2`}>
        {t.retry}
      </button>
    </Notice>
  );
}

/** Private pages: sends a signed-out visitor to sign in and back. Returns whether the page may load its data. */
export function useSignedIn(): boolean {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "signedOut") router.replace(`/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
  }, [status, router]);
  return status === "signedIn";
}

export function Skeleton({ className = "" }: { className?: string }) {
  const t = useT(text);
  return <span aria-hidden className={`block animate-pulse rounded-2xl bg-surface-sunken ${className}`} data-label={t.loading} />;
}

/** Tells the store's header (cart count) that the cart changed. */
export const CART_EVENT = "store:cart-changed";
export const notifyCartChanged = () => window.dispatchEvent(new Event(CART_EVENT));

/** The language, for content helpers. */
export const useLang = useLocale;
