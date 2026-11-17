import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";
import Link from "@/i18n/Link";

/** Shared pieces of the astrologer console, in the cream, navy and gold style of the design. */

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

/** A white card with the console's soft gold border. */
export function Card({
  children,
  className,
  as: Tag = "section",
  ...rest
}: { children: ReactNode; className?: string; as?: "section" | "div" | "article" | "aside" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cx("rounded-[22px] border border-line bg-surface-card", className)} {...rest}>
      {children}
    </Tag>
  );
}

const BUTTON_VARIANTS = {
  navy: "bg-surface-inverse text-ink-inverse hover:bg-surface-inverse-raised",
  gold: "bg-brand text-brand-ink hover:bg-brand-hover",
  line: "border-[1.5px] border-ink bg-transparent text-ink hover:bg-surface-sunken",
  red: "border-[1.5px] border-danger bg-transparent text-danger hover:bg-danger-soft",
  ghost: "bg-transparent text-ink hover:bg-surface-sunken",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

type ButtonOwnProps = { variant?: ButtonVariant; size?: "md" | "sm" | "lg"; className?: string; children: ReactNode };

const SIZES = { sm: "h-[42px] px-4 text-sm", md: "h-[50px] px-6 text-[15px]", lg: "h-14 px-7 text-[17px]" } as const;

/** A button, or a link when it has an href (a path without a language, or an external URL). */
export function Button(
  props: ButtonOwnProps &
    (({ href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">) | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">)),
) {
  const { variant = "navy", size = "md", className, children, href, ...rest } = props as ButtonOwnProps & { href?: string } & Record<string, unknown>;
  const cls = cx(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] font-bold transition motion-safe:active:scale-[0.97] disabled:opacity-60 cursor-pointer",
    SIZES[size],
    BUTTON_VARIANTS[variant],
    className,
  );
  if (href !== undefined) {
    if (/^https?:/.test(href)) {
      return (
        <a href={href} className={cls} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}

/** The gold-highlighted words inside a page title. */
export function Accent({ children }: { children: ReactNode }) {
  return <em className="not-italic text-brand-strong">{children}</em>;
}

/** Eyebrow with gold rules, big title and a lead line. Put <Accent> around the highlighted words in the title. */
export function PageTitle({ eyebrow, title, sub, className }: { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="flex items-center gap-3.5 font-display text-base font-medium tracking-[0.02em] text-brand-strong before:h-px before:w-9 before:bg-brand after:h-px after:w-9 after:bg-brand">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2.5 font-display text-[34px] font-bold leading-[1.1] tracking-[-0.01em] text-balance sm:text-[46px]">{title}</h1>
      {sub && <p className="mt-2.5 max-w-[680px] text-[17px] text-ink-soft">{sub}</p>}
    </div>
  );
}

/** The dotted gold divider. */
export function Ornament() {
  return (
    <div
      aria-hidden
      className="h-3.5"
      style={{
        background:
          "radial-gradient(circle at 7px 7px, var(--color-brand) 2.2px, transparent 2.6px) 0 0 / 28px 14px repeat-x, linear-gradient(var(--color-line), var(--color-line)) 0 50% / 100% 1px no-repeat",
      }}
    />
  );
}

/** A navy circle with a gold icon and a pale gold halo. */
export function IconBadge({ icon: Icon, size = 48, className }: { icon: ComponentType<{ className?: string }>; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full bg-surface-inverse text-brand shadow-[0_0_0_4px_var(--color-surface-sunken)]", className)}
    >
      <Icon className="h-[46%] w-[46%]" />
    </span>
  );
}

const PILL_TONES = {
  gold: "bg-surface-sunken text-brand-strong",
  green: "bg-success-soft text-success",
  red: "bg-danger-soft text-danger",
  amber: "bg-warning-soft text-warning",
  navy: "bg-surface-inverse text-brand",
  neutral: "bg-neutral-soft text-ink-soft",
} as const;

/** A small rounded status label. */
export function Pill({ tone = "gold", children, className }: { tone?: keyof typeof PILL_TONES; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex h-[30px] items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-bold", PILL_TONES[tone], className)}>
      {children}
    </span>
  );
}

/** A figure with a label: earnings, call counts, ratings. */
export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: "default" | "inverse";
  className?: string;
}) {
  const inverse = tone === "inverse";
  return (
    <div
      className={cx(
        "flex min-w-0 flex-1 basis-[200px] items-center gap-4 rounded-[22px] border p-5",
        inverse ? "border-line-inverse bg-surface-inverse text-ink-inverse" : "border-line bg-surface-card",
        className,
      )}
    >
      {icon && <IconBadge icon={icon} size={52} />}
      <div className="min-w-0">
        <div className={cx("text-[13px] font-semibold", inverse ? "text-ink-inverse-soft" : "text-ink-soft")}>{label}</div>
        <div className="font-display text-[28px] font-bold leading-tight">{value}</div>
        {hint && <div className={cx("text-[13px]", inverse ? "text-ink-inverse-soft" : "text-ink-soft")}>{hint}</div>}
      </div>
    </div>
  );
}

/** Class names for form controls, as in the design. */
export const fieldClass =
  "h-[52px] w-full rounded-[14px] border border-line-strong bg-surface-page px-3.5 text-base text-ink placeholder:text-ink-muted/70";
export const labelClass = "text-sm font-semibold text-ink";

/** The page container: 1200px column with the console's padding. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-7 px-5 pb-14 pt-8 sm:px-10 sm:pt-10", className)}>{children}</div>;
}
