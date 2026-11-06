import { useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { canAnimate } from "./env";

export type ScrollFxContext<T> = { el: T; mm: gsap.MatchMedia };

let refreshTimer: ReturnType<typeof setTimeout> | undefined;
/** Islands hydrate at different times: one refresh after the last of them sets up. */
function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 100);
}

/**
 * Runs `setup` inside a gsap context scoped to `ref` when motion is allowed, and reverts every
 * tween, trigger and media query it made on unmount. Without motion the markup stays static.
 */
export function useScrollFx<T extends Element>(
  ref: RefObject<T | null>,
  setup: (ctx: ScrollFxContext<T>) => void,
  deps: unknown[] = [],
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !canAnimate()) return;
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => setup({ el, mm }), el);
    scheduleRefresh();
    return () => {
      mm.revert();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
