"use client";

import { use } from "react";
import { browser } from "react-dom";
import { useAuth } from "@/components/AuthProvider";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { SLOW_GRAHAS, day, grahaName, rashiName, saturnName, toBirth, type Transits } from "@/lib/jyotish";
import { fetchTransits } from "@/lib/services/jyotish";
import ProfileHeader from "../_components/ProfileHeader";
import { profileToHash, usePageProfile } from "../_components/profile";
import { Card, CardSkeleton, Disclaimer, ErrorBox, NeedProfile, Notice, SignInPrompt } from "../_components/ui";
import { jyotishErrorText, useJyotish } from "../_components/useJyotish";

const text = defineMessages({
  hi: {
    subject: "गोचर",
    eyebrow: "गोचर, अगले 36 महीने",
    howCounted: "भाव लग्न से और जन्म के चंद्र से, पूरी राशि के हिसाब से गिने गए हैं।",
    timeUnknown: "जन्म समय ज्ञात नहीं, इसलिए भाव लग्न से नहीं, चंद्र से देखें।",
    saturn: "साढ़ेसाती और ढैय्या",
    period: (from: string, to: string) => `${from} से ${to} तक`,
    noSaturn: "इस अवधि में साढ़ेसाती या ढैय्या नहीं है।",
    houses: (fromLagna: number, fromMoon: number) => `लग्न से भाव ${fromLagna}, चंद्र से भाव ${fromMoon}`,
    now: "अभी",
    retrograde: "वक्री",
    direct: "मार्गी",
  },
  en: {
    subject: "transits",
    eyebrow: "Transits, next 36 months",
    howCounted: "Houses are counted from the Ascendant and from the natal Moon, by whole signs.",
    timeUnknown: "The birth time is not known, so read the houses from the Moon, not from the Ascendant.",
    saturn: "Sade Sati and Dhaiya",
    period: (from, to) => `${from} to ${to}`,
    noSaturn: "No Sade Sati or Dhaiya in this period.",
    houses: (fromLagna, fromMoon) => `House ${fromLagna} from the Ascendant, house ${fromMoon} from the Moon`,
    now: "Now",
    retrograde: "Turns retrograde",
    direct: "Turns direct",
  },
});
type Text = (typeof text)["hi"];

/** The app's Gochar screen: the next 36 months of Jupiter, Saturn, Rahu and Ketu, and Sade Sati / Dhaiya. */
export default function GocharView() {
  use(browser("The birth profile comes from this browser's storage or the URL hash."));
  const { status } = useAuth();
  const { profile, fromLink, ready } = usePageProfile();
  const t = useT(text);
  const locale = useLocale();

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
  if (!profile) return <NeedProfile what={t.subject} />;

  return (
    <div className="space-y-6">
      <ProfileHeader eyebrow={t.eyebrow} profile={profile} fromLink={fromLink} />
      <Notice>{t.howCounted}</Notice>
      {profile.timeUnknown && <Notice tone="warning">{t.timeUnknown}</Notice>}

      {status === "loading" || req.loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      ) : status === "signedOut" || (req.error instanceof ApiError && req.error.status === 401) ? (
        <SignInPrompt what={t.subject} />
      ) : req.error ? (
        <ErrorBox message={jyotishErrorText(req.error, locale)} onRetry={req.retry} />
      ) : req.data ? (
        <GocharBody tr={req.data} now={req.at} t={t} />
      ) : null}

      <Disclaimer />
    </div>
  );
}

function GocharBody({ tr, now, t }: { tr: Transits; now: number; t: Text }) {
  const locale = useLocale();
  return (
    <>
      <Card title={t.saturn} description={t.period(day(tr.from), day(tr.to))}>
        {tr.saturn_cycles.length ? (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {tr.saturn_cycles.map((c) => (
              <li key={`${c.kind}${c.start}`} className="rounded-xl bg-surface-sunken p-3">
                <p className="title-3 text-ink">{saturnName(c.kind, locale)}</p>
                <p className="caption-2 mt-1 text-ink-soft">{t.period(day(c.start), day(c.end))}</p>
                {c.phases.length > 1 && (
                  <ul className="mt-2 space-y-1">
                    {c.phases.map((p) => (
                      <li key={p.phase + p.start} className="caption-5 text-ink-muted">
                        {saturnName(p.phase, locale)}: {t.period(day(p.start), day(p.end))}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="body-6 text-ink-soft">{t.noSaturn}</p>
        )}
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        {SLOW_GRAHAS.map((g) => {
          const segs = tr.segments.filter((s) => s.planet === g);
          const stations = tr.stations.filter((s) => s.planet === g);
          return (
            <Card key={g} title={grahaName(g, locale)}>
              <ol className="space-y-2">
                {segs.map((s) => {
                  const current = Date.parse(s.start) <= now && now < Date.parse(s.end);
                  return (
                    <li
                      key={s.start}
                      className={`rounded-xl border p-3 ${current ? "border-brand bg-surface-sunken" : "border-line"}`}
                    >
                      <p className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="body-4 text-ink">{rashiName(s.rashi, locale)}</span>
                        <span className="caption-5 text-ink-muted">{t.period(day(s.start), day(s.end))}</span>
                      </p>
                      <p className="caption-2 mt-1 text-ink-soft">
                        {t.houses(s.house_from_lagna, s.house_from_moon)}
                        {current && <span className="caption-3 ml-2 text-brand-strong">{t.now}</span>}
                      </p>
                    </li>
                  );
                })}
              </ol>
              {stations.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {stations.map((s) => (
                    <li key={s.at} className="caption-2 text-ink-soft">
                      {s.kind === "retrograde" ? t.retrograde : t.direct}: {day(s.at)}
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
