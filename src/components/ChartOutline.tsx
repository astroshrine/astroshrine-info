// A decorative North Indian (diamond) kundli chart with no planets: twelve houses and their sign numbers,
// house 1 (lagna) at the top. Illustration only; real charts are drawn on /kundli.

const VB = 400;
const P = 10;
const MID = VB / 2;

const HOUSE_CENTER: [number, number][] = [
  [200, 115], [115, 52], [52, 115], [115, 200], [52, 285], [115, 348],
  [200, 285], [285, 348], [348, 285], [285, 200], [348, 115], [285, 52],
];

/** The same geometry, for the animated hero chart on the landing page. */
export const CHART = {
  VB,
  P,
  MID,
  HOUSE_CENTER,
  /** House 1 (lagna), the top diamond. */
  LAGNA_POINTS: `${MID},${P} 295,105 ${MID},${MID} 105,105`,
  /** The inner diamond joining the mid points of the frame. */
  DIAMOND_POINTS: `${MID},${P} ${VB - P},${MID} ${MID},${VB - P} ${P},${MID}`,
} as const;

export default function ChartOutline({ lagna = 1, className = "" }: { lagna?: number; className?: string }) {
  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} aria-hidden className={`h-auto w-full ${className}`}>
      <rect x={P} y={P} width={VB - 2 * P} height={VB - 2 * P} rx={8} className="fill-surface-sunken" />
      {/* House 1, the lagna */}
      <polygon points={`${MID},${P} 295,105 ${MID},${MID} 105,105`} className="fill-brand-soft" />
      <g className="stroke-brand-strong" strokeWidth={1.5} fill="none" strokeLinejoin="round">
        <rect x={P} y={P} width={VB - 2 * P} height={VB - 2 * P} rx={8} />
        <line x1={P} y1={P} x2={VB - P} y2={VB - P} />
        <line x1={VB - P} y1={P} x2={P} y2={VB - P} />
        <polygon points={`${MID},${P} ${VB - P},${MID} ${MID},${VB - P} ${P},${MID}`} />
      </g>
      {HOUSE_CENTER.map(([x, y], i) => (
        <text key={i} x={x} y={y + 6} textAnchor="middle" fontSize={20} fontWeight={600} className="fill-ink-muted">
          {((lagna - 1 + i) % 12) + 1}
        </text>
      ))}
    </svg>
  );
}
