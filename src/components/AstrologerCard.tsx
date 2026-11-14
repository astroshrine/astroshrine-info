import Image from "next/image";
import Link from "next/link";
import { PiStarFill } from "react-icons/pi";
import type { Astrologer, Availability } from "@/lib/endpoints";

const AVAILABILITY: Record<Availability, { label: string; dot: string }> = {
  online: { label: "Online", dot: "bg-online" },
  busy: { label: "Busy", dot: "bg-busy" },
  offline: { label: "Offline", dot: "bg-offline" },
};

/** One astrologer from the public list, linking to their profile page. */
export default function AstrologerCard({ astrologer: a }: { astrologer: Astrologer }) {
  const availability = AVAILABILITY[a.availability];
  const meta = [...a.expertise.slice(0, 2), a.experience ? `${a.experience} yrs` : null].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/astrologers/${encodeURIComponent(a.id)}`}
      className="flex h-full items-center gap-4 rounded-2xl border border-line bg-surface-card p-4 transition motion-safe:hover:-translate-y-0.5 hover:border-line-strong motion-safe:active:scale-98"
    >
      {a.photo ? (
        <Image src={a.photo} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <span aria-hidden className="title-3 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-sunken text-ink">
          {a.name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="title-4 block truncate capitalize text-ink">{a.name}</span>
        {meta && <span className="caption-5 block truncate text-ink-soft">{meta}</span>}
        <span className="caption-4 mt-1 flex items-center gap-2 text-ink-soft">
          {a.rating !== null && (
            <>
              <span className="inline-flex items-center gap-1">
                <PiStarFill className="h-4 w-4 text-brand" aria-hidden />
                <span className="sr-only">Rating</span>
                {a.rating.toFixed(1)}
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          <span>
            {a.chat.hasOffer && (
              <s className="mr-1 text-ink-muted">
                <span className="sr-only">पहले </span>₹{a.chat.rate}
              </s>
            )}
            {a.chat.price === 0 ? "मुफ़्त" : `₹${a.chat.price}/min`}
          </span>
        </span>
      </span>
      <span className="caption-4 inline-flex shrink-0 items-center gap-2 rounded-full bg-surface-sunken px-2 py-1 text-ink-soft">
        <span aria-hidden className={`h-2 w-2 rounded-full ${availability.dot}`} />
        {availability.label}
      </span>
    </Link>
  );
}

/** Loading placeholder shaped like AstrologerCard (B9: skeletons, not spinners). */
export function AstrologerCardSkeleton() {
  return (
    <div aria-hidden className="flex items-center gap-4 rounded-2xl border border-line bg-surface-card p-4">
      <span className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-surface-sunken" />
      <span className="flex flex-1 flex-col gap-2">
        <span className="h-4 w-2/3 animate-pulse rounded-sm bg-surface-sunken" />
        <span className="h-3 w-1/2 animate-pulse rounded-sm bg-surface-sunken" />
        <span className="h-3 w-1/3 animate-pulse rounded-sm bg-surface-sunken" />
      </span>
    </div>
  );
}
