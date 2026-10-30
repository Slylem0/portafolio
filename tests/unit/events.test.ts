import { describe, it, expect, beforeAll, vi } from "vitest";
import { openOmarchy, onOmarchyOpen, OMARCHY_OPEN } from "@/components/omarchy/events";

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
});
