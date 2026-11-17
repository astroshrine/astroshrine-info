import type { ComponentType, ReactNode } from "react";
import { IconBadge } from "../../_console/ui";

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

/** A badge icon with a section heading. */
export function Head({ icon, id, children, small = false }: { icon: ComponentType<{ className?: string }>; id?: string; children: ReactNode; small?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <IconBadge icon={icon} size={42} />
      <h2 id={id} className={cx("font-display font-bold leading-tight", small ? "text-[21px]" : "text-[22px]")}>
        {children}
      </h2>
    </div>
  );
}

/** The planet dot used in tables. */
export function Dot({ color, size = 10 }: { color: string; size?: number }) {
  return <span className="shrink-0 rounded-full" style={{ width: size, height: size, background: color }} />;
}

export const sectionClass = "px-6 py-[22px]";
export const lblClass = "text-[13px] font-semibold text-ink-soft";
