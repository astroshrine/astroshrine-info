import Image from "next/image";
import type { Availability } from "@/lib/endpoints";

const SUPABASE_PUBLIC = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/`
  : null;

const DOT: Record<Availability, string> = { online: "bg-online", busy: "bg-busy", offline: "bg-offline" };

/**
 * An astrologer's photo (or their initial), with an availability dot. Photos in the shared Supabase storage go
 * through Next's image optimizer; any other host is shown as is, so an unexpected URL can never break the page.
 */
export default function AstrologerAvatar({
  name,
  photo,
  size = 64,
  availability,
  priority = false,
}: {
  name: string;
  photo: string | null;
  size?: number;
  /** Draws the dot; the label next to it says the same in words. */
  availability?: Availability;
  priority?: boolean;
}) {
  const optimizable = !!photo && !!SUPABASE_PUBLIC && photo.startsWith(SUPABASE_PUBLIC);
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {photo ? (
        <Image
          src={photo}
          alt=""
          width={size}
          height={size}
          sizes={`${size}px`}
          unoptimized={!optimizable}
          priority={priority}
          className="h-full w-full rounded-full bg-surface-sunken object-cover"
        />
      ) : (
        <span aria-hidden className="title-2 grid h-full w-full place-items-center rounded-full bg-surface-sunken text-brand-strong">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      {availability && availability !== "offline" && (
        <span aria-hidden className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-surface-card ${DOT[availability]}`} />
      )}
    </span>
  );
}
