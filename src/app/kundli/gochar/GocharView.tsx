"use client";

import { use } from "react";
import { browser } from "react-dom";
import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";
import { SATURN_HI, SLOW_GRAHAS, day, grahaHi, rashiHi, toBirth, type Transits } from "@/lib/jyotish";
import { fetchTransits } from "@/lib/services/jyotish";
import ProfileHeader from "../_components/ProfileHeader";
import { profileToHash, usePageProfile } from "../_components/profile";
import { Card, CardSkeleton, Disclaimer, ErrorBox, NeedProfile, Notice, SignInPrompt } from "../_components/ui";
import { jyotishErrorText, useJyotish } from "../_components/useJyotish";

/** The app's Gochar screen: the next 36 months of Jupiter, Saturn, Rahu and Ketu, and Sade Sati / Dhaiya. */
export default function GocharView() {
  use(browser("The birth profile comes from this browser's storage or the URL hash."));
  const { status } = useAuth();
  const { profile, fromLink, ready } = usePageProfile();

  const req = useJyotish(status === "signedIn" && profile ? `gochar|${profileToHash(profile)}` : null, (signal) =>
    fetchTransits(toBirth(profile!), 36, SLOW_GRAHAS, signal),
  );

  if (!profile && !ready) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CardSkeleton rows={4} />
        <CardSkeleton rows={4} />
      </div>
    );
  }
  if (!profile) return <NeedProfile what="गोचर" />;

  return (
    <div className="space-y-6">
      <ProfileHeader eyebrow="गोचर, अगले 36 महीने" profile={profile} fromLink={fromLink} />
      <Notice>भाव लग्न से और जन्म के चंद्र से, पूरी राशि के हिसाब से गिने गए हैं।</Notice>
      {profile.timeUnknown && (
        <Notice tone="warning">जन्म समय ज्ञात नहीं, इसलिए भाव लग्न से नहीं, चंद्र से देखें।</Notice>
      )}

      {status === "loading" || req.loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      ) : status === "signedOut" || (req.error instanceof ApiError && req.error.status === 401) ? (
        <SignInPrompt what="गोचर" />
      ) : req.error ? (
        <ErrorBox message={jyotishErrorText(req.error)} onRetry={req.retry} />
      ) : req.data ? (
        <GocharBody tr={req.data} now={req.at} />
      ) : null}

      <Disclaimer />
    </div>
  );
}

function GocharBody({ tr, now }: { tr: Transits; now: number }) {
  return (
    <>
      <Card title="साढ़ेसाती और ढैय्या" description={`${day(tr.from)} से ${day(tr.to)} तक`}>
        {tr.saturn_cycles.length ? (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {tr.saturn_cycles.map((c) => (
              <li key={`${c.kind}${c.start}`} className="rounded-lg bg-surface-sunken p-3">
                <p className="title-3 text-ink">{SATURN_HI[c.kind] ?? c.kind}</p>
                <p className="caption-2 mt-1 text-ink-soft">
                  {day(c.start)} से {day(c.end)} तक
                </p>
                {c.phases.length > 1 && (
                  <ul className="mt-2 space-y-1">
                    {c.phases.map((p) => (
                      <li key={p.phase + p.start} className="caption-5 text-ink-muted">
                        {SATURN_HI[p.phase] ?? p.phase}: {day(p.start)} से {day(p.end)} तक
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="body-6 text-ink-soft">इस अवधि में साढ़ेसाती या ढैय्या नहीं है।</p>
        )}
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        {SLOW_GRAHAS.map((g) => {
          const segs = tr.segments.filter((s) => s.planet === g);
          const stations = tr.stations.filter((s) => s.planet === g);
          return (
            <Card key={g} title={grahaHi(g)}>
              <ol className="space-y-2">
                {segs.map((s) => {
                  const current = Date.parse(s.start) <= now && now < Date.parse(s.end);
                  return (
                    <li
                      key={s.start}
                      className={`rounded-lg border p-3 ${current ? "border-brand bg-surface-sunken" : "border-line"}`}
                    >
                      <p className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="body-4 text-ink">{rashiHi(s.rashi)}</span>
                        <span className="caption-5 text-ink-muted">
                          {day(s.start)} से {day(s.end)} तक
                        </span>
                      </p>
                      <p className="caption-2 mt-1 text-ink-soft">
                        लग्न से भाव {s.house_from_lagna}, चंद्र से भाव {s.house_from_moon}
                        {current && <span className="caption-3 ml-2 text-brand-strong">अभी</span>}
                      </p>
                    </li>
                  );
                })}
              </ol>
              {stations.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {stations.map((s) => (
                    <li key={s.at} className="caption-2 text-ink-soft">
                      {s.kind === "retrograde" ? "वक्री" : "मार्गी"}: {day(s.at)}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
