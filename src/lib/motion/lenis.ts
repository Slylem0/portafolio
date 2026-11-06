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

  // Anchors land where the fixed navbar does not cover them (the page's scroll-padding-top).
  const navOffset = () => -(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
  const l = new Lenis({
    anchors: { offset: navOffset() },
    lerp: 0.1,
    // Omarchy Mode's windows scroll natively (Lenis is stopped there and would swallow the wheel).
    prevent: (node) => node.closest?.(".om-root") !== null,
  });
  lenis = l;
  l.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => l.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // A refresh moves the native scroll (pin spacers, restored position): Lenis must adopt it,
  // and a deep link (#sessions) keeps its target until the visitor scrolls on their own.
  // `anchor` is the section the page is heading to (URL hash on load, or an in-page link click)
  // until the visitor scrolls by hand; a refresh re-aims at it because pins move its position.
  const byHash = (hash: string) => (hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null);
  let anchor: HTMLElement | null = byHash(location.hash);
  const release = () => (anchor = null);
  for (const ev of ["wheel", "touchstart", "keydown"]) window.addEventListener(ev, release, { passive: true });
  document.addEventListener(
    "click",
    (e) => {
      const a = (e.target as Element | null)?.closest?.("a[href^='#']");
      if (a) anchor = byHash(a.getAttribute("href") ?? "");
    },
    true,
  );
  ScrollTrigger.addEventListener("refresh", () => {
    if (anchor) l.scrollTo(anchor, { offset: navOffset(), immediate: !l.isScrolling, force: true });
    // Adopt the native position, but never cut short a smooth scroll already under way.
    else if (!l.isScrolling) l.scrollTo(window.scrollY, { immediate: true, force: true });
  });

  const html = document.documentElement;
  const sync = () => (isPageLocked(html) ? l.stop() : l.start());
  new MutationObserver(sync).observe(html, { attributes: true, attributeFilter: ["style", "class"] });
  sync();
}
