export const OMARCHY_OPEN = "omarchy:open";

/**
 * Window-level flag set when an open was requested but nobody handled it yet
 * (the loader island had not hydrated). The loader consumes it on mount.
 * Shared on `window` so an inline pre-hydration script can set it too.
 */
export const PENDING_KEY = "__omarchyPending";

type PendingHost = { [PENDING_KEY]?: boolean };
const host = () => window as unknown as PendingHost;

/** Ask the Omarchy Mode overlay to open (dispatched on `window`). */
export function openOmarchy(): void {
  host()[PENDING_KEY] = true;
  window.dispatchEvent(new Event(OMARCHY_OPEN));
}

/** Subscribe to open requests; returns an unsubscribe function. Handling an open clears the pending flag. */
export function onOmarchyOpen(cb: () => void): () => void {
  const handler = () => {
    host()[PENDING_KEY] = false;
    cb();
  };
  window.addEventListener(OMARCHY_OPEN, handler);
  return () => window.removeEventListener(OMARCHY_OPEN, handler);
}

/** Returns true (once) if an open was requested before anyone was listening. */
export function takePendingOpen(): boolean {
  const pending = host()[PENDING_KEY] === true;
  host()[PENDING_KEY] = false;
  return pending;
}

/** True while the intro gate (ENTER screen) is covering the page; Omarchy Mode must not open then. */
export function isIntroOpen(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("intro-open");
}
