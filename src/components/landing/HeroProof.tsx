"use client";

import { statsOf, useAstrologerDirectory } from "@/lib/useAstrologerDirectory";

/** The hero's proof line: live figures from the public astrologer list. Hidden if the list can't load. */
export default function HeroProof() {
  const { list, failed } = useAstrologerDirectory();
  if (failed) return null;
  if (!list) return <span aria-hidden className="block h-5 w-56 animate-pulse rounded-full bg-surface-sunken" />;

  const s = statsOf(list);
  if (s.total === 0) return null;
  return (
    <p className="caption-1 flex items-center gap-2 text-ink-soft">
      {s.online > 0 && (
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full rounded-full bg-online opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-online" />
        </span>
      )}
      <span>
        {s.total} astrologers{s.online > 0 ? `, अभी ${s.online} online` : ""}
      </span>
    </p>
  );
}
