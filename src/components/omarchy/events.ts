export const OMARCHY_OPEN = "omarchy:open";

/** Ask the Omarchy Mode overlay to open (dispatched on `window`). */
export function openOmarchy(): void {
  window.dispatchEvent(new Event(OMARCHY_OPEN));
}

/** Subscribe to open requests; returns an unsubscribe function. */
export function onOmarchyOpen(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(OMARCHY_OPEN, handler);
  return () => window.removeEventListener(OMARCHY_OPEN, handler);
}
