"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PiArrowLeft, PiArrowClockwise, PiHeart, PiHeartFill, PiSealCheck, PiStarFill, PiTranslate, PiBriefcase } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import AstrologerAvatar from "@/components/consult/AstrologerAvatar";
import AvailabilityBadge from "@/components/consult/AvailabilityBadge";
import { secondaryButton } from "@/components/consult/Dialog";
import { useAstrologerStatus } from "@/components/consult/useAstrologerStatus";
import { fadeUp, stagger } from "@/lib/motion";
import { getAstrologerProfile, getFavouriteIds, listReviews, setFavourite } from "@/lib/services/astrologers";
import type { ProfilePageData } from "@/lib/services/astrologers.server";
import {
  REVIEW_PAGE_SIZE,
  compactCount,
  formatDate,
  mergeReviews,
  withStatus,
  type AstrologerCard,
  type AstrologerProfile,
  type Review,
} from "@/lib/services/astrologerModel";

/** The full profile streaming from the server: null = no such astrologer, undefined = not read there. */
type FullProfile = Promise<ProfilePageData | null | undefined>;
import StartChatPanel from "./StartChatPanel";

const card = "rounded-3xl border border-line bg-surface-card p-6";

export function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="प्रोफ़ाइल लोड हो रही है" className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:px-8 lg:grid-cols-3 lg:gap-8 lg:py-16">
      <div className="h-56 animate-pulse rounded-3xl bg-surface-sunken lg:col-span-2" />
      <div className="h-64 animate-pulse rounded-3xl bg-surface-sunken" />
      <div className="h-40 animate-pulse rounded-3xl bg-surface-sunken lg:col-span-2" />
    </div>
  );
}

/**
 * The profile page in two speeds: `preview` (the directory entry, ready at once) draws the header and the chat
 * panel immediately; about, stats, photos and reviews come from `full`, each behind its own placeholder.
 */
export default function AstrologerProfileView({ id, preview, full }: { id: string; preview: AstrologerCard | null; full: FullProfile }) {
  const { status: authStatus } = useAuth();
  const signedIn = authStatus === "signedIn";

  const [fresh, setFresh] = useState<AstrologerProfile | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [favourite, setFav] = useState<boolean | null>(null);
  const [favBusy, setFavBusy] = useState(false);

  // Fresh read from the browser: counts the profile view (as the app's profile screen does) and refreshes the
  // counters. It never holds the page up: the header is already drawn from the directory entry.
  useEffect(() => {
    const controller = new AbortController();
    getAstrologerProfile(id, { view: retry === 0, signal: controller.signal }).then(
      (profile) => {
        setFresh(profile);
        setLoadFailed(false);
      },
      () => {
        if (!controller.signal.aborted) setLoadFailed(true);
      },
    );
    return () => controller.abort();
  }, [id, retry]);

  // The rating comes only from the directory, so the preview's is kept over the profile record's.
  const header = useMemo<AstrologerCard | null>(
    () => (fresh ? { ...fresh, rating: preview?.rating ?? fresh.rating, reviews: preview?.reviews ?? fresh.reviews } : preview),
    [fresh, preview],
  );

  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    getFavouriteIds(controller.signal).then(
      (ids) => setFav(ids.has(id)),
      () => undefined,
    );
    return () => controller.abort();
  }, [signedIn, id]);

  const liveStatus = useAstrologerStatus(id, signedIn);
  const astrologer = useMemo(() => (header ? withStatus(header, liveStatus) : null), [header, liveStatus]);

  if (!astrologer) {
    return loadFailed ? (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 lg:py-16">
        <div role="alert" className={`${card} flex flex-col items-start gap-3`}>
          <p className="body-5 text-ink">यह प्रोफ़ाइल अभी लोड नहीं हो सकी।</p>
          <p className="caption-2 text-ink-soft">इंटरनेट कनेक्शन देखें और फिर से कोशिश करें।</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setRetry((n) => n + 1)} className={secondaryButton}>
              <PiArrowClockwise className="h-4 w-4" aria-hidden />
              फिर से कोशिश करें
            </button>
            <Link href="/astrologers" className={secondaryButton}>
              सभी ज्योतिषी
            </Link>
          </div>
        </div>
      </div>
    ) : (
      <ProfileSkeleton />
    );
  }

  const a = astrologer;
  const toggleFavourite = async () => {
    if (favourite === null || favBusy) return;
    const next = !favourite;
    setFav(next);
    setFavBusy(true);
    try {
      await setFavourite(a.id, next);
    } catch {
      setFav(!next);
    } finally {
      setFavBusy(false);
    }
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-6 px-4 py-8 md:px-8 lg:grid-cols-3 lg:gap-8 lg:py-16"
    >
      <motion.nav variants={fadeUp} aria-label="Breadcrumb" className="lg:col-span-3">
        <Link href="/astrologers" className="button-sm inline-flex items-center gap-2 rounded-full px-2 py-1 text-ink-soft transition hover:bg-surface-sunken hover:text-ink">
          <PiArrowLeft className="h-4 w-4" aria-hidden />
          सभी ज्योतिषी
        </Link>
      </motion.nav>

      <motion.section variants={fadeUp} aria-labelledby="astrologer-name" className={`${card} flex flex-col gap-6 lg:col-span-2`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <AstrologerAvatar name={a.name} photo={a.photo} size={96} availability={a.availability} priority />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1 id="astrologer-name" className="heading-5 flex items-center gap-2 capitalize text-ink">
                {a.name}
                <PiSealCheck className="h-5 w-5 shrink-0 text-brand-strong" aria-label="Verified" />
              </h1>
              {favourite !== null && (
                <button
                  type="button"
                  onClick={() => void toggleFavourite()}
                  aria-pressed={favourite}
                  disabled={favBusy}
                  className={`${secondaryButton} button-sm`}
                >
                  {favourite ? <PiHeartFill className="h-4 w-4 text-danger" aria-hidden /> : <PiHeart className="h-4 w-4" aria-hidden />}
                  {favourite ? "पसंदीदा में" : "पसंदीदा"}
                </button>
              )}
            </div>
            <AvailabilityBadge availability={a.availability} />
            {a.expertise.length > 0 && <p className="body-6 text-ink-soft">{a.expertise.slice(0, 4).join(", ")}</p>}
            <p className="caption-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-soft">
              {a.rating !== null && (
                <span className="inline-flex items-center gap-1">
                  <PiStarFill className="h-4 w-4 text-brand" aria-hidden />
                  {a.rating.toFixed(1)}
                  <span className="sr-only">में से 5 रेटिंग</span>
                  {a.reviews > 0 && <span className="text-ink-muted">({compactCount(a.reviews)} रिव्यू)</span>}
                </span>
              )}
              {a.experience > 0 && (
                <span className="inline-flex items-center gap-1">
                  <PiBriefcase className="h-4 w-4" aria-hidden />
                  {a.experience} साल अनुभव
                </span>
              )}
              {a.languages.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <PiTranslate className="h-4 w-4" aria-hidden />
                  {a.languages.join(", ")}
                </span>
              )}
            </p>
          </div>
        </div>
        <Suspense fallback={<StatsSkeleton />}>
          <ProfileStats full={full} fresh={fresh} />
        </Suspense>
      </motion.section>

      {/* The chat action: right column on desktop (sticky), straight after the header on phones. */}
      <motion.aside variants={fadeUp} className="lg:sticky lg:top-24 lg:col-start-3 lg:row-span-4 lg:row-start-2">
        <StartChatPanel astrologer={a} />
      </motion.aside>

      <div className="flex flex-col gap-6 lg:col-span-2">
        <Suspense fallback={<SectionSkeleton title="परिचय" />}>
          <ProfileAbout full={full} fresh={fresh} />
        </Suspense>

        {a.expertise.length > 0 && (
          <motion.section variants={fadeUp} aria-labelledby="expertise-title" className={`${card} flex flex-col gap-4`}>
            <h2 id="expertise-title" className="heading-6 text-ink">
              विशेषज्ञता
            </h2>
            <ul className="flex flex-wrap gap-2">
              {a.expertise.map((e) => (
                <li key={e} className="caption-4 rounded-full border border-line-strong px-3 py-1 text-ink-soft">
                  {e}
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* Photos are optional: no placeholder, they simply appear if the astrologer has any. */}
        <Suspense fallback={null}>
          <ProfilePhotos full={full} fresh={fresh} name={a.name} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="रिव्यू" />}>
          <ProfileReviews astrologerId={a.id} full={full} />
        </Suspense>
      </div>
    </motion.div>
  );
}

// ─── Streamed sections: each waits only for the full profile, never the page ───────────────

/** The full profile once it has streamed in; the browser's own read wins when it is already here. */
function useFullProfile(full: FullProfile, fresh: AstrologerProfile | null): ProfilePageData["profile"] | null {
  const data = use(full);
  return fresh ?? data?.profile ?? null;
}

function ProfileStats({ full, fresh }: { full: FullProfile; fresh: AstrologerProfile | null }) {
  const p = useFullProfile(full, fresh);
  if (!p) return null;
  const stats = [
    { value: compactCount(p.stats.orders), label: "consultations" },
    { value: compactCount(p.stats.chats), label: "लोगों से चैट" },
    { value: compactCount(p.stats.followers), label: "फ़ॉलोअर्स" },
  ];
  return (
    <dl className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl bg-surface-sunken p-3 text-center">
          <dt className="caption-5 order-2 text-ink-soft">{s.label}</dt>
          <dd className="title-2 order-1 text-ink">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ProfileAbout({ full, fresh }: { full: FullProfile; fresh: AstrologerProfile | null }) {
  const p = useFullProfile(full, fresh);
  return p?.aboutMe ? <About text={p.aboutMe} /> : null;
}

function ProfilePhotos({ full, fresh, name }: { full: FullProfile; fresh: AstrologerProfile | null; name: string }) {
  const p = useFullProfile(full, fresh);
  if (!p || p.media.length === 0) return null;
  return (
    <motion.section variants={fadeUp} aria-labelledby="photos-title" className={`${card} flex flex-col gap-4`}>
      <h2 id="photos-title" className="heading-6 text-ink">
        तस्वीरें
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {p.media.slice(0, 9).map((src, i) => (
          <li key={src}>
            <a href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl transition hover:opacity-90">
              {/* eslint-disable-next-line @next/next/no-img-element -- media is on the backend's storage host, outside next/image's allowed hosts */}
              <img src={src} alt={`${name} की तस्वीर ${i + 1}`} loading="lazy" className="aspect-square w-full object-cover" />
            </a>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

/** First page of reviews from the server; null (not read there) makes Reviews load them in the browser. */
function ProfileReviews({ astrologerId, full }: { astrologerId: string; full: FullProfile }) {
  const data = use(full);
  return <Reviews astrologerId={astrologerId} initial={data ? data.reviews : null} />;
}

function StatsSkeleton() {
  return (
    <div aria-hidden className="grid grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-sunken" />
      ))}
    </div>
  );
}

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section aria-busy="true" className={`${card} flex flex-col gap-4`}>
      <h2 className="heading-6 text-ink">{title}</h2>
      <div className="h-4 w-3/4 animate-pulse rounded-full bg-surface-sunken" />
      <div className="h-4 w-1/2 animate-pulse rounded-full bg-surface-sunken" />
    </section>
  );
}

function About({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 320;
  return (
    <motion.section variants={fadeUp} aria-labelledby="about-title" className={`${card} flex flex-col gap-3`}>
      <h2 id="about-title" className="heading-6 text-ink">
        परिचय
      </h2>
      <p className={`body-3 whitespace-pre-line text-ink-soft ${long && !expanded ? "line-clamp-5" : ""}`}>{text}</p>
      {long && (
        <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="button-sm w-fit rounded-full px-2 py-1 text-brand-strong transition hover:bg-surface-sunken">
          {expanded ? "कम दिखाएं" : "और पढ़ें"}
        </button>
      )}
    </motion.section>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`5 में से ${rating} स्टार`}>
      {Array.from({ length: 5 }, (_, i) => (
        <PiStarFill key={i} aria-hidden className={`h-4 w-4 ${i < rating ? "text-brand" : "text-line-strong"}`} />
      ))}
    </span>
  );
}

function Reviews({ astrologerId, initial }: { astrologerId: string; initial: Review[] | null }) {
  const [reviews, setReviews] = useState<Review[]>(initial ?? []);
  const [loading, setLoading] = useState(initial === null);
  const [failed, setFailed] = useState(false);
  const [more, setMore] = useState((initial?.length ?? 0) >= REVIEW_PAGE_SIZE);

  // Not rendered on the server (backend hiccup): load here.
  useEffect(() => {
    if (initial !== null) return;
    const controller = new AbortController();
    listReviews(astrologerId, undefined, controller.signal).then(
      (page) => {
        setReviews(page);
        setMore(page.length >= REVIEW_PAGE_SIZE);
        setLoading(false);
      },
      () => {
        if (controller.signal.aborted) return;
        setFailed(true);
        setLoading(false);
      },
    );
    return () => controller.abort();
  }, [astrologerId, initial]);

  const loadMore = async () => {
    const last = reviews[reviews.length - 1];
    if (!last || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const page = await listReviews(astrologerId, last.key);
      setReviews((prev) => mergeReviews(prev, page));
      setMore(page.length >= REVIEW_PAGE_SIZE);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section variants={fadeUp} aria-labelledby="reviews-title" className={`${card} flex flex-col gap-4`}>
      <h2 id="reviews-title" className="heading-6 text-ink">
        रिव्यू
      </h2>
      {reviews.length === 0 && loading ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-sunken" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="body-6 text-ink-soft">{failed ? "रिव्यू अभी लोड नहीं हो सके।" : "अभी कोई रिव्यू नहीं है। चैट के बाद रेटिंग देने वाले आप पहले हो सकते हैं।"}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {reviews.map((r) => (
            <li key={r.key} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="title-4 text-ink">{r.reviewer}</span>
                <span className="caption-5 text-ink-muted">{formatDate(r.ts)}</span>
              </div>
              <Stars rating={r.rating} />
              {r.comment && <p className="body-6 whitespace-pre-line text-ink-soft">{r.comment}</p>}
              {r.reply && (
                <p className="caption-2 rounded-2xl bg-surface-sunken px-3 py-2 text-ink-soft">
                  <span className="caption-3 text-ink">ज्योतिषी का जवाब: </span>
                  {r.reply}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {failed && reviews.length > 0 && (
        <p role="alert" className="caption-2 text-danger">
          और रिव्यू लोड नहीं हो सके।
        </p>
      )}
      {more && (
        <button type="button" onClick={() => void loadMore()} disabled={loading} className={`${secondaryButton} w-fit`}>
          {loading ? "लोड हो रहे हैं…" : "और रिव्यू"}
        </button>
      )}
    </motion.section>
  );
}
