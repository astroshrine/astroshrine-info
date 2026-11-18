import type { ReactNode } from "react";

/** Stroke icons from the design, drawn on a 24px grid. */
const PATHS = {
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  phoneOff: "M10.7 13.3a16 16 0 0 0 3.3 2.5l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-3.4-2.9M5.3 14.7A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8M22 2 2 22",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12zM8.5 12h.01M12 12h.01M15.5 12h.01",
  power: "M12 3v8M6.4 6.6a8 8 0 1 0 11.2 0",
  people: "M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.6 3.5 5.2",
  clock: "M12 7v5l3 2",
  info: "M12 11v5M12 8h.01",
  check: "M20 6 9 17l-5-5",
  trend: "M3 17l6-6 4 4 8-8M14 7h7v7",
  star: "M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z",
  calendar: "M16 3v4M8 3v4M3 10h18",
  pin: "M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z",
  mic: "M5 11a7 7 0 0 0 14 0M12 18v3",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  sun: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  kundli: "M3 3l18 18M21 3 3 21M12 3l9 9-9 9-9-9z",
} as const;

export type IconName = keyof typeof PATHS;

/** Shapes that need more than a path. */
const EXTRA: Partial<Record<IconName, ReactNode>> = {
  power: null,
  people: <circle cx="9" cy="8" r="3.5" />,
  clock: <circle cx="12" cy="12" r="9" />,
  info: <circle cx="12" cy="12" r="9" />,
  calendar: <rect x="3" y="5" width="18" height="16" rx="2" />,
  pin: <circle cx="12" cy="10" r="2.5" />,
  mic: <rect x="9" y="3" width="6" height="11" rx="3" />,
  sun: <circle cx="12" cy="12" r="4" />,
  kundli: <rect x="3" y="3" width="18" height="18" rx="1.5" />,
};

export default function Icon({ name, size = 20, color = "currentColor", stroke = 2.2 }: { name: IconName; size?: number; color?: string; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-none"
    >
      {EXTRA[name]}
      <path d={PATHS[name]} />
    </svg>
  );
}
