import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal state for progressive enhancement.
 * - "static": server render, no JS, no IntersectionObserver or reduced motion. Content is fully shown.
 * - "armed": JS is running and motion is allowed; waiting for the element to enter the viewport.
 * - "revealed": the element entered the viewport (fires once).
 */
export type RevealState = "static" | "armed" | "revealed";

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function useReveal<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [state, setState] = useState<RevealState>("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || prefersReducedMotion()) return;
    setState("armed");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("revealed");
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, state] as const;
}
