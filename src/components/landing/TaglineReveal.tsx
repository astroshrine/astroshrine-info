"use client";

import { useEffect, useRef } from "react";

/**
 * B11 tagline reveal: large type whose words go from a muted tone (30% opacity) to full color one at a time,
 * in reading order, as the section scrolls past a trigger line. One scroll listener, throttled through
 * requestAnimationFrame. With prefers-reduced-motion the text is at full color from the start (CSS below).
 */
export default function TaglineReveal({ lines, className = "" }: { lines: string[]; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const block = ref.current;
    if (!block) return;
    const words = Array.from(block.querySelectorAll<HTMLElement>("[data-word]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      words.forEach((w) => (w.dataset.on = "true"));
      return;
    }

    let frame = 0;
    let lit = 0;
    const update = () => {
      frame = 0;
      const rect = block.getBoundingClientRect();
      const vh = window.innerHeight;
      // Starts when the block's top reaches 85% of the viewport, done when its bottom reaches 45%.
      const start = vh * 0.85;
      const travel = rect.height + vh * 0.4;
      const progress = Math.min(Math.max((start - rect.top) / travel, 0), 1);
      const target = Math.round(progress * words.length);
      // Words stay lit once lit: the reveal plays once, not again on the way back up.
      for (; lit < target; lit++) words[lit].dataset.on = "true";
      if (lit >= words.length) stop();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const stop = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      stop();
    };
  }, []);

  return (
    <p ref={ref} className={className}>
      {lines.map((line, l) => (
        <span key={l} className="block">
          {line.split(" ").map((word, w) => (
            <span key={w}>
              <span
                data-word
                className="opacity-30 transition-opacity duration-500 ease-base data-[on=true]:opacity-100 motion-reduce:opacity-100"
              >
                {word}
              </span>{" "}
            </span>
          ))}
        </span>
      ))}
    </p>
  );
}
