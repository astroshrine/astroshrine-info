import type { CSSProperties } from "react";

/** One thing written in a house: "Su 28°", "Ju (R)", or a bindu count. */
export type ChartItem = { ab: string; deg?: string; style?: CSSProperties };
export type ChartCell = { sign: number; items: ChartItem[] };

/** Where the sign number and the planets sit in each of the 12 houses of the North Indian chart, in percent of the square. */
const SIGN_AT: [number, number][] = [[50, 42], [25, 20], [20, 25], [42, 50], [20, 75], [25, 80], [50, 58], [75, 80], [80, 75], [58, 50], [80, 25], [75, 20]];
const ITEMS_AT: [number, number][] = [[50, 20], [25, 9], [9, 25], [23, 50], [9, 75], [25, 91], [50, 80], [75, 91], [91, 75], [77, 50], [91, 25], [75, 9]];

/** The North Indian chart of the console's design: a square with the first house in gold, sign numbers and planets written over it. */
export default function DesignChart({ cells, label, max = 470 }: { cells: ChartCell[]; label: string; max?: number }) {
  return (
    <div role="img" aria-label={label} className="relative mx-auto aspect-square w-full" style={{ maxWidth: max }}>
      <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 h-full w-full">
        <rect x=".6" y=".6" width="98.8" height="98.8" rx="1.6" fill="var(--color-surface-card)" stroke="var(--color-brand)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <polygon points="50,.6 75,25 50,50 25,25" fill="var(--color-surface-sunken)" />
        <path d="M.6 .6 L99.4 99.4 M99.4 .6 L.6 99.4 M50 .6 L99.4 50 L50 99.4 L.6 50 Z" fill="none" stroke="var(--color-brand)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
      </svg>
      {cells.map((c, i) => (
        <span key={i}>
          <span
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 text-sm font-extrabold text-ink opacity-85"
            style={{ left: `${SIGN_AT[i][0]}%`, top: `${SIGN_AT[i][1]}%` }}
          >
            {c.sign}
          </span>
          <div
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center text-[clamp(13px,2.4vw,17px)] leading-tight text-ink"
            style={{ left: `${ITEMS_AT[i][0]}%`, top: `${ITEMS_AT[i][1]}%` }}
          >
            {c.items.map((q, j) => (
              <span key={j} className="block whitespace-nowrap font-extrabold" style={q.style}>
                {q.ab}
                {q.deg ? <small className="ml-0.5 text-[.72em] font-bold">{q.deg}</small> : null}
              </span>
            ))}
          </div>
        </span>
      ))}
    </div>
  );
}
