import { describe, it, expect, beforeAll, vi } from "vitest";
import { openOmarchy, onOmarchyOpen, OMARCHY_OPEN, takePendingOpen } from "@/components/omarchy/events";

beforeAll(() => {
  if (typeof (globalThis as any).window === "undefined") (globalThis as any).window = new EventTarget();
});

describe("omarchy events", () => {
  it("openOmarchy dispatches omarchy:open on window", () => {
    const spy = vi.fn();
    window.addEventListener(OMARCHY_OPEN, spy);
    openOmarchy();
    expect(OMARCHY_OPEN).toBe("omarchy:open");
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener(OMARCHY_OPEN, spy);
  });
  it("onOmarchyOpen subscribes and unsubscribes", () => {
    const cb = vi.fn();
    const off = onOmarchyOpen(cb);
    openOmarchy();
    off();
    openOmarchy();
    expect(cb).toHaveBeenCalledTimes(1);
  });
  it("openOmarchy leaves a pending flag that is consumed once", () => {
    takePendingOpen();
    expect(takePendingOpen()).toBe(false);
    openOmarchy();
    expect(takePendingOpen()).toBe(true);
    expect(takePendingOpen()).toBe(false);
  });
  it("a subscriber that handles the open clears the pending flag", () => {
    takePendingOpen();
    const off = onOmarchyOpen(() => {});
    openOmarchy();
    off();
    expect(takePendingOpen()).toBe(false);
  });
});
