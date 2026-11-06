import { afterEach, describe, expect, it } from "vitest";
import { canAnimate, isPageLocked } from "@/lib/motion/env";

const html = (overflow: string, classes: string[] = []) =>
  ({ style: { overflow }, classList: { contains: (c: string) => classes.includes(c) } }) as unknown as HTMLElement;

describe("isPageLocked", () => {
  it("is locked while Omarchy sets overflow hidden", () => {
    expect(isPageLocked(html("hidden"))).toBe(true);
  });
  it("is locked while the intro gate is open", () => {
    expect(isPageLocked(html("", ["intro-open"]))).toBe(true);
  });
  it("is free otherwise", () => {
    expect(isPageLocked(html("", ["intro-skip"]))).toBe(false);
  });
});

describe("canAnimate", () => {
  const g = globalThis as { window?: unknown };
  afterEach(() => {
    delete g.window;
  });
  it("is false on the server", () => {
    delete g.window;
    expect(canAnimate()).toBe(false);
  });
  it("is false with reduced motion", () => {
    g.window = { matchMedia: (q: string) => ({ matches: q.includes("reduce") }) };
    expect(canAnimate()).toBe(false);
  });
  it("is true when motion is allowed", () => {
    g.window = { matchMedia: () => ({ matches: false }) };
    expect(canAnimate()).toBe(true);
  });
});
