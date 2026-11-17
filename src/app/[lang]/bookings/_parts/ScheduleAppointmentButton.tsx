"use client";

import { PiCalendarPlus } from "react-icons/pi";
import { secondaryButton } from "@/components/consult/Dialog";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";

const text = defineMessages({
  hi: { label: "अपॉइंटमेंट शेड्यूल करें", hint: "ज्योतिषी के खाली समय में कॉल या चैट बुक करें" },
  en: { label: "Schedule an appointment", hint: "Book a call or chat in their free times" },
});

/** Entry from an astrologer's profile to the slot booking page (/bookings/new/<id>). Signed-out visitors are sent to log in there. */
export default function ScheduleAppointmentButton({ astrologerId }: { astrologerId: string }) {
  const t = useT(text);
  return (
    <div className="mt-3 flex flex-col gap-1">
      <Link href={`/bookings/new/${encodeURIComponent(astrologerId)}`} className={`${secondaryButton} w-full`}>
        <PiCalendarPlus className="h-5 w-5" aria-hidden />
        {t.label}
      </Link>
      <p className="caption-2 text-center text-ink-soft">{t.hint}</p>
    </div>
  );
}
