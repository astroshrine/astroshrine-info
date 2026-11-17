import { PiSparkle } from "react-icons/pi";

const STARS = ["0%", "18%", "36%", "54%", "72%", "90%"];

/** The gold dotted rails with sparkles that frame the sign in and join pages on wide screens. */
export default function Rails() {
  const rail = (side: "left" | "right") => (
    <div
      className={`absolute bottom-7 top-7 w-[100px] ${side === "left" ? "left-[calc(50%-690px)]" : "right-[calc(50%-690px)]"}`}
    >
      <span className={`absolute inset-y-0 w-px bg-line ${side === "left" ? "left-[50px]" : "left-[50px]"}`} />
      <span
        className={`absolute inset-y-0 w-0 border-l-2 border-dashed border-brand/60 ${side === "left" ? "left-[22px]" : "left-[76px]"}`}
      />
      {STARS.map((top, i) => (
        <span key={top} className="absolute left-[37px] -translate-y-1/2" style={{ top: `${5 + parseFloat(top) * 0.9}%` }}>
          {i % 2 === 0 ? (
            <PiSparkle className="h-[26px] w-[26px] text-brand motion-safe:animate-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
          ) : (
            <span className="block h-[18px] w-[18px] rounded-full bg-surface-inverse shadow-[0_0_0_4px_var(--color-surface-sunken)]" />
          )}
        </span>
      ))}
    </div>
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden min-[1380px]:block">
      {rail("left")}
      {rail("right")}
    </div>
  );
}
