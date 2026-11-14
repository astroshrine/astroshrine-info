"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PiArrowRight, PiMapPin, PiPhone, PiPlanet, PiSignIn, PiSignOut, PiUserCircle, PiWallet } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import type { BackendUser } from "@/lib/endpoints";
import { fadeUp, stagger } from "@/lib/motion";

const rupees = (n: number) => `₹ ${Math.floor(n).toLocaleString("en-IN")}`;
const card = "rounded-3xl border border-line bg-surface-card p-6";
const secondaryButton =
  "button-sm inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken motion-safe:active:scale-98";

/** The account's saved birth details (users.profile), formatted in the birth place's time zone. */
function birthOf(user: BackendUser | null) {
  const p = user?.profile;
  const ms = Number(p?.dateTimeOfBirth);
  const place = p?.placeOfBirth;
  if (!(ms > 0) || !place?.displayValue) return null;
  const zone = place.timezone || place.geolocation?.timezone || place.geoLocation?.timezone || "Asia/Kolkata";
  const format = (timeZone: string) =>
    new Date(ms).toLocaleString("hi-IN", {
      timeZone,
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  let when: string;
  try {
    when = format(zone);
  } catch {
    when = format("Asia/Kolkata");
  }
  return { when, place: place.displayValue };
}

export default function ProfileView() {
  const { status, session, user, balance, signOut } = useAuth();

  if (status === "loading") {
    return (
      <div aria-busy="true" className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-8 md:px-8 lg:grid-cols-5 lg:py-16">
        <div className="h-48 animate-pulse rounded-3xl bg-surface-sunken lg:col-span-2" />
        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="h-32 animate-pulse rounded-3xl bg-surface-sunken" />
          <div className="h-32 animate-pulse rounded-3xl bg-surface-sunken" />
        </div>
      </div>
    );
  }

  if (status === "signedOut") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 lg:py-16">
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="show"
          aria-labelledby="profile-title"
          className={`${card} flex flex-col items-start gap-4 md:p-12`}
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-sunken text-brand-strong">
            <PiUserCircle className="h-6 w-6" aria-hidden />
          </span>
          <h1 id="profile-title" className="heading-5 text-ink">
            प्रोफ़ाइल देखने के लिए लॉगिन करें
          </h1>
          <p className="body-6 max-w-[680px] text-ink-soft">
            AstroShrine ऐप वाले मोबाइल नंबर से लॉगिन करें। आपका नाम, wallet balance और सेव की हुई जन्म जानकारी यहां दिखेगी।
          </p>
          <Link
            href="/login?next=/profile"
            className="button-md inline-flex items-center gap-2 rounded-full bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98"
          >
            <PiSignIn className="h-5 w-5" aria-hidden />
            लॉगिन करें
          </Link>
        </motion.section>
      </div>
    );
  }

  const phone = user?.profile?.phoneNumber || (session?.user.phone ? `+${session.user.phone}` : null);
  const name = user?.name?.trim() || "AstroShrine user";
  const birth = birthOf(user);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-8 md:px-8 lg:grid-cols-5 lg:py-16"
    >
      <motion.section
        variants={fadeUp}
        aria-labelledby="profile-title"
        className="on-inverse flex flex-col gap-6 rounded-3xl bg-surface-inverse p-6 text-ink-inverse md:p-8 lg:col-span-2"
      >
        <span aria-hidden className="heading-5 grid h-16 w-16 place-items-center rounded-full bg-brand text-brand-ink">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 id="profile-title" className="heading-5 break-words">
            {name}
          </h1>
          {phone && (
            <p className="caption-2 mt-2 flex items-center gap-2 text-ink-inverse-soft">
              <PiPhone className="h-4 w-4" aria-hidden />
              {phone}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="button-sm mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-surface-inverse-raised px-3 py-2 text-ink-inverse transition hover:bg-line-inverse motion-safe:active:scale-98"
        >
          <PiSignOut className="h-4 w-4" aria-hidden />
          लॉगआउट
        </button>
      </motion.section>

      <div className="flex flex-col gap-4 lg:col-span-3">
        <motion.section variants={fadeUp} aria-labelledby="wallet-title" className={`${card} flex flex-wrap items-center justify-between gap-4`}>
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-sunken text-brand-strong">
              <PiWallet className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 id="wallet-title" className="caption-2 text-ink-soft">
                Wallet balance
              </h2>
              <p className="heading-5 text-ink" aria-live="polite">
                {balance ? (
                  rupees(balance.points_balance)
                ) : (
                  <span aria-hidden className="inline-block h-8 w-24 animate-pulse rounded-lg bg-surface-sunken align-middle" />
                )}
              </p>
              <p className="caption-5 text-ink-muted">ऐप और वेबसाइट पर एक ही wallet</p>
            </div>
          </div>
          <Link href="/wallet" className={secondaryButton}>
            Wallet देखें
            <PiArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </motion.section>

        <motion.section variants={fadeUp} aria-labelledby="birth-title" className={`${card} flex flex-wrap items-center justify-between gap-4`}>
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-sunken text-brand-strong">
              <PiPlanet className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id="birth-title" className="caption-2 text-ink-soft">
                जन्म जानकारी
              </h2>
              {birth ? (
                <>
                  <p className="title-3 text-ink">{birth.when}</p>
                  <p className="caption-5 mt-1 flex items-center gap-1 text-ink-muted">
                    <PiMapPin className="h-4 w-4 shrink-0" aria-hidden />
                    {birth.place}
                  </p>
                </>
              ) : (
                <p className="body-6 text-ink">अभी सेव नहीं है। कुंडली बनाते समय “यह मेरी अपनी कुंडली है” चुनें।</p>
              )}
            </div>
          </div>
          <Link href="/kundli" className={secondaryButton}>
            {birth ? "कुंडली देखें" : "कुंडली बनाएं"}
            <PiArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </motion.section>
      </div>
    </motion.div>
  );
}
