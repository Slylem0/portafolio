import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";
import { canAnimate, isPageLocked } from "./env";

let lenis: Lenis | null = null;

/** The smooth-scroll instance, or null when it is not running (reduced motion, server). */
export function getLenis(): Lenis | null {
  return lenis;
}

/** Scrolls to a y position, smoothly when Lenis runs. */
export function scrollToY(y: number): void {
  if (lenis) lenis.scrollTo(y, { duration: 0.8 });
  else window.scrollTo({ top: y, behavior: "auto" });
}

/**
 * Starts one Lenis instance for the page (idempotent). Lenis drives ScrollTrigger, stops while
 * Omarchy Mode or the intro gate locks the page, and pins recompute when the language changes.
 */
export function initSmoothScroll(): void {
  if (typeof window === "undefined") return;
  if (!(window as { __scrollFxLang?: boolean }).__scrollFxLang) {
    (window as { __scrollFxLang?: boolean }).__scrollFxLang = true;
    window.addEventListener("lang-change", () => requestAnimationFrame(() => ScrollTrigger.refresh()));
    document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => undefined);
  }
  if (lenis || !canAnimate()) return;

  const l = new Lenis({ anchors: true, lerp: 0.1 });
  lenis = l;
  l.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => l.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // A refresh moves the native scroll (pin spacers, restored position): Lenis must adopt it,
  // and a deep link (#sessions) keeps its target until the visitor scrolls on their own.
  let touched = false;
  const touch = () => (touched = true);
  for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"]) {
    window.addEventListener(ev, touch, { once: true, passive: true });
  }
  ScrollTrigger.addEventListener("refresh", () => {
    const target = !touched && location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
    if (target) l.scrollTo(target, { immediate: true, force: true });
    else l.scrollTo(window.scrollY, { immediate: true, force: true });
  });

  const html = document.documentElement;
  const sync = () => (isPageLocked(html) ? l.stop() : l.start());
  new MutationObserver(sync).observe(html, { attributes: true, attributeFilter: ["style", "class"] });
  sync();
}
