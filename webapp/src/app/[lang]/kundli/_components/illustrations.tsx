// Decorative pictures for the page hero banners (aria-hidden by PageHero): no text, so they need no translation.
// Drawn in the design's palette: cream cards, orange line work, gold planets.

const ORANGE = "#FF6A00";
const GOLD = "#FFAE00";
const LINE = "#F6E0B5";

function Rings({ size = 300 }: { size?: number }) {
  return (
    <svg viewBox="0 0 300 300" width={size} height={size} className="absolute -z-0" fill="none">
      <circle cx="150" cy="150" r="146" stroke={ORANGE} strokeOpacity=".16" />
      <circle cx="150" cy="150" r="104" stroke={ORANGE} strokeOpacity=".12" strokeDasharray="3 6" />
    </svg>
  );
}

const card =
  "relative rounded-3xl border border-[#F4E2C3] bg-[#FFFDF8] shadow-[0_18px_40px_rgba(138,90,0,.14)]";

/** The north-Indian chart frame: square, both diagonals, and the inner diamond. */
function ChartFrame({ size, filled = [] as number[] }: { size: number; filled?: number[] }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke={ORANGE} strokeWidth="1.2" strokeLinejoin="round">
      {filled.includes(1) && <path d="M50 0 L25 25 L50 50 L75 25Z" fill="#FFE9B8" stroke="none" />}
      {filled.includes(2) && <path d="M0 0 L50 0 L25 25Z" fill="#FFF1D2" stroke="none" />}
      <rect x="1" y="1" width="98" height="98" rx="2" />
      <path d="M1 1 L99 99 M99 1 L1 99 M50 1 L99 50 L50 99 L1 50Z" />
      <circle cx="30" cy="30" r="2.6" fill={GOLD} stroke="none" />
      <circle cx="70" cy="62" r="2.6" fill={GOLD} stroke="none" />
      <circle cx="50" cy="80" r="2.6" fill={ORANGE} stroke="none" />
    </svg>
  );
}

function Chip({ className, children }: { className: string; children?: React.ReactNode }) {
  return <span className={`absolute rounded-2xl ${className}`}>{children}</span>;
}

/** My kundlis: a stack of saved kundli cards. */
export function ListArt() {
  return (
    <div className="relative grid h-[280px] w-[320px] place-items-center">
      <Rings />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${card} absolute flex h-[76px] w-[250px] items-center gap-3 px-4`}
          style={{ top: 34 + i * 82, left: 20 + (i % 2) * 34, opacity: 1 - i * 0.12 }}
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#14213D] text-[#FFAE00]">
            <ChartFrame size={22} />
          </span>
          <span className="flex flex-1 flex-col gap-1.5">
            <i className="h-2.5 w-24 rounded-full bg-[#14213D]/80" />
            <i className="h-2 w-32 rounded-full bg-[#14213D]/15" />
          </span>
          <i className="h-2.5 w-2.5 rounded-full" style={{ background: i === 0 ? "#2E9B4E" : GOLD }} />
        </div>
      ))}
    </div>
  );
}

/** Kundli: the birth chart card with a lagna chip and a nakshatra chip. */
export function ChartArt() {
  return (
    <div className="relative grid h-[300px] w-[340px] place-items-center">
      <Rings size={320} />
      <div className={`${card} p-4`}>
        <ChartFrame size={170} filled={[1, 2]} />
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#F6E6C8] bg-white p-2">
          <i className="grid h-6 w-6 place-items-center rounded-md bg-[#14213D] text-[10px] font-bold text-[#FFAE00]">3</i>
          <span className="flex flex-col gap-1">
            <i className="h-2 w-20 rounded-full bg-[#14213D]/70" />
            <i className="h-1.5 w-28 rounded-full bg-[#14213D]/15" />
          </span>
        </div>
      </div>
      <Chip className="top-8 -left-2 h-[58px] w-[84px] bg-[#14213D] p-3 shadow-[0_10px_24px_rgba(20,33,61,.25)]">
        <i className="block h-1.5 w-8 rounded-full bg-white/40" />
        <i className="mt-2 block h-2.5 w-14 rounded-full bg-white" />
      </Chip>
      <Chip className="right-0 bottom-10 h-[44px] w-[88px] bg-[#FFAE00]/25 p-3 backdrop-blur">
        <i className="block h-2 w-14 rounded-full bg-[#8A5A00]/50" />
      </Chip>
    </div>
  );
}

/** Transits: planets travelling around the zodiac ring. */
export function GocharArt() {
  const planets: [number, number, string, number][] = [
    [150, 14, GOLD, 9],
    [262, 150, ORANGE, 7],
    [60, 244, "#14213D", 8],
    [38, 96, GOLD, 6],
  ];
  return (
    <div className="relative h-[300px] w-[300px]">
      <svg viewBox="0 0 300 300" width="300" height="300" fill="none">
        <circle cx="150" cy="150" r="136" stroke={ORANGE} strokeOpacity=".22" />
        <circle cx="150" cy="150" r="98" stroke={ORANGE} strokeOpacity=".2" strokeDasharray="3 6" />
        <circle cx="150" cy="150" r="58" stroke={ORANGE} strokeOpacity=".28" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          return <line key={i} x1={150 + 136 * Math.cos(a)} y1={150 + 136 * Math.sin(a)} x2={150 + 122 * Math.cos(a)} y2={150 + 122 * Math.sin(a)} stroke={ORANGE} strokeOpacity=".35" />;
        })}
        <circle cx="150" cy="150" r="30" fill="#14213D" />
        <circle cx="150" cy="150" r="10" fill={GOLD} />
        {planets.map(([x, y, c, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={c} stroke="#FFFDF8" strokeWidth="3" />
        ))}
      </svg>
    </div>
  );
}

/** Panchang: a calendar card with the moon's phases. */
export function PanchangArt() {
  return (
    <div className="relative grid h-[290px] w-[320px] place-items-center">
      <Rings size={310} />
      <div className={`${card} w-[230px] overflow-hidden`}>
        <div className="flex h-12 items-center justify-between bg-[#14213D] px-4">
          <i className="h-2.5 w-20 rounded-full bg-white/80" />
          <i className="h-3 w-3 rounded-full bg-[#FFAE00]" />
        </div>
        <div className="grid grid-cols-7 gap-1.5 p-3">
          {Array.from({ length: 28 }).map((_, i) => (
            <i key={i} className={`h-5 rounded-md ${i === 12 ? "bg-[#FFAE00]" : i % 7 === 0 ? "bg-[#FFE9B8]" : "bg-[#14213D]/8"}`} />
          ))}
        </div>
      </div>
      <div className="absolute top-6 right-2 flex gap-1.5 rounded-full border border-[#F4E2C3] bg-white p-2 shadow-[0_10px_24px_rgba(138,90,0,.14)]">
        {[0, 1, 2, 3].map((i) => (
          <svg key={i} viewBox="0 0 20 20" width="20" height="20">
            <circle cx="10" cy="10" r="9" fill="#14213D" />
            <path d={["", "M10 1a9 9 0 0 1 0 18a5 9 0 0 0 0-18", "M10 1a9 9 0 0 1 0 18z", "M10 1a9 9 0 1 1 0 18a9 9 0 0 0 0-18"][i]} fill="#FFE9B8" />
            {i === 3 && <circle cx="10" cy="10" r="9" fill="#FFE9B8" />}
          </svg>
        ))}
      </div>
    </div>
  );
}

/** KP Prashna: a 1 to 249 number dial with a pointer. */
export function KpArt() {
  return (
    <div className="relative grid h-[290px] w-[300px] place-items-center">
      <svg viewBox="0 0 300 300" width="290" height="290" fill="none">
        <circle cx="150" cy="150" r="130" fill="#FFFDF8" stroke="#F4E2C3" strokeWidth="2" />
        <circle cx="150" cy="150" r="130" stroke={ORANGE} strokeOpacity=".3" strokeDasharray="2 7" strokeWidth="6" />
        <circle cx="150" cy="150" r="92" stroke={ORANGE} strokeOpacity=".25" />
        <path d="M150 62 L166 150 L150 238 L134 150Z" fill={GOLD} fillOpacity=".25" stroke={ORANGE} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M150 62 L160 150 L140 150Z" fill={ORANGE} />
        <circle cx="150" cy="150" r="12" fill="#14213D" />
        <circle cx="150" cy="150" r="4" fill={GOLD} />
      </svg>
      <Chip className="right-0 bottom-8 h-[46px] w-[92px] bg-[#14213D] p-3 shadow-[0_10px_24px_rgba(20,33,61,.25)]">
        <i className="block h-3 w-14 rounded-full bg-[#FFAE00]" />
      </Chip>
    </div>
  );
}

/** Kundli matching: two charts joined by a heart. */
export function MilanArt() {
  return (
    <div className="relative grid h-[260px] w-[340px] place-items-center">
      <Rings size={300} />
      <div className={`${card} absolute left-2 top-14 p-3`}>
        <ChartFrame size={104} filled={[1]} />
      </div>
      <div className={`${card} absolute right-2 top-24 p-3`}>
        <ChartFrame size={104} filled={[2]} />
      </div>
      <span className="absolute top-[88px] left-1/2 z-10 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full bg-[#FFAE00] shadow-[0_8px_20px_rgba(255,106,0,.3)]">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#14213D">
          <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.800-8 11-8 11z" />
        </svg>
      </span>
    </div>
  );
}

/** My detailed kundli: a report sheet with charts and bars. */
export function SheetArt() {
  return (
    <div className="relative grid h-[300px] w-[320px] place-items-center">
      <Rings size={310} />
      <div className={`${card} flex w-[220px] flex-col gap-3 p-4`}>
        <div className="flex items-center gap-3">
          <ChartFrame size={64} filled={[1]} />
          <span className="flex flex-1 flex-col gap-1.5">
            <i className="h-2.5 w-full rounded-full bg-[#14213D]/80" />
            <i className="h-2 w-2/3 rounded-full bg-[#14213D]/15" />
          </span>
        </div>
        <div className="flex h-16 items-end gap-1.5 rounded-xl border border-[#F6E6C8] bg-white p-2">
          {[40, 70, 52, 90, 62, 78, 46].map((h, i) => (
            <i key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 3 ? GOLD : LINE }} />
          ))}
        </div>
        {[100, 85, 60].map((w) => (
          <i key={w} className="h-2 rounded-full bg-[#14213D]/12" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
