import { useEffect, useRef, useState } from "react";
import { canAnimate } from "@/lib/motion/env";

/** Hairline under the navbar that fills with page progress, plus a `SYNC nn%` readout (desktop). */
export default function ScrollProgress() {
  const bar = useRef<HTMLSpanElement>(null);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      setPct(Math.round(p * 100));
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -bottom-px">
      <span
        ref={bar}
        data-testid="scroll-progress"
        className="block h-px origin-left bg-bone"
        style={{ transform: "scaleX(0)", transition: canAnimate() ? "transform 0.1s linear" : undefined }}
      />
      <span className="absolute top-2 right-4 hidden font-mono text-[10px] tracking-[0.3em] text-bone/70 lg:block lg:right-8">
        SYNC {String(pct).padStart(2, "0")}%
      </span>
    </div>
  );
}
