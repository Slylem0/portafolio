import { useEffect, useState } from "react";
import { canAnimate } from "@/lib/motion/env";
import { scrambleFrame } from "./math";

/**
 * Text that decodes from random glyphs into `text` once on mount. The final text is always in the
 * DOM for assistive tech (visually hidden); the animated copy is aria-hidden.
 */
export default function ScrambleText({ text, durationMs = 900, delayMs = 0, className }: { text: string; durationMs?: number; delayMs?: number; className?: string }) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (!canAnimate()) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now + delayMs;
      const p = (now - start) / durationMs;
      setShown(p < 0 ? scrambleFrame(text, 0, Math.random) : scrambleFrame(text, p, Math.random));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, durationMs, delayMs]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" data-scramble>
        {shown}
      </span>
    </span>
  );
}
