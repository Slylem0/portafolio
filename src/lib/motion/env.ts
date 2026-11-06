/** Environment checks every scroll / pointer effect goes through. */

function mq(query: string): boolean {
  try {
    return typeof window !== "undefined" && window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/** JS is running in a browser and the visitor has not asked for reduced motion. */
export function canAnimate(): boolean {
  if (typeof window === "undefined") return false;
  return !mq("(prefers-reduced-motion: reduce)");
}

/** A mouse or trackpad: pointer effects (tilt, magnet, cursor) only run here. */
export function hasFinePointer(): boolean {
  return mq("(hover: hover) and (pointer: fine)");
}

export const DESKTOP_QUERY = "(min-width: 1024px)";

/** Wide enough for pinned and horizontal scroll. */
export function isDesktop(): boolean {
  return mq(DESKTOP_QUERY);
}

/** Omarchy Mode sets overflow hidden on <html>; the intro gate adds `intro-open`. */
export function isPageLocked(html: HTMLElement): boolean {
  return html.style.overflow === "hidden" || html.classList.contains("intro-open");
}
