import Image from "next/image";

/** The AstroShrine sun logo (public/logo.png, from astroshrine.in). Decorative next to the "AstroShrine" name. */
export default function BrandMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      priority
      className={`shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
