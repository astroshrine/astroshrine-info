/** One row per item: a label, a proportional fill bar and the value. Values come off the network, so a bad one shows as 0. */
export default function Bars({ rows, max = 100 }: { rows: { key: string; label: string; value: number }[]; max?: number }) {
  const safe = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const top = Math.max(max, ...rows.map((r) => safe(r.value)));
  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const v = safe(r.value);
        return (
          <li key={r.key} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 sm:grid-cols-[10rem_1fr_3rem]">
            <span className="caption-2 truncate text-ink">{r.label}</span>
            <span
              role="meter"
              aria-label={r.label}
              aria-valuemin={0}
              aria-valuemax={top}
              aria-valuenow={v}
              className="h-2.5 overflow-hidden rounded-full bg-surface-sunken"
            >
              <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, (v / top) * 100))}%` }} />
            </span>
            <span className="caption-2 text-right text-ink-soft">{Number.isInteger(v) ? v : v.toFixed(1)}</span>
          </li>
        );
      })}
    </ul>
  );
}
