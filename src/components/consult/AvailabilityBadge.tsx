import type { Availability } from "@/lib/endpoints";
import { AVAILABILITY_LABEL } from "@/lib/services/astrologerModel";

const STYLE: Record<Availability, { dot: string; text: string; bg: string }> = {
  online: { dot: "bg-online", text: "text-success", bg: "bg-success-soft" },
  busy: { dot: "bg-busy", text: "text-warning", bg: "bg-warning-soft" },
  offline: { dot: "bg-offline", text: "text-neutral", bg: "bg-neutral-soft" },
};

/** Online / Busy / Offline as a small pill: a colored dot that is always paired with the word. */
export default function AvailabilityBadge({ availability, label }: { availability: Availability; label?: string }) {
  const s = STYLE[availability];
  return (
    <span className={`caption-4 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 ${s.bg} ${s.text}`}>
      <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
      {label ?? AVAILABILITY_LABEL[availability]}
    </span>
  );
}
