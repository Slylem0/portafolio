import { describe, it, expect } from "vitest";
import { createSeededRandom, starCountFor, MOBILE_BREAKPOINT } from "@/components/ui/spiral-animation";

describe("spiral seeded PRNG", () => {
  it("is deterministic for the same seed", () => {
    const a = createSeededRandom();
    const b = createSeededRandom();
    const xs = Array.from({ length: 50 }, a);
    expect(Array.from({ length: 50 }, b)).toEqual(xs);
  });
  it("follows the original LCG (seed 1234, (s*9301+49297)%233280)", () => {
    const r = createSeededRandom(1234);
    const s1 = (1234 * 9301 + 49297) % 233280;
    const s2 = (s1 * 9301 + 49297) % 233280;
    expect(r()).toBe(s1 / 233280);
    expect(r()).toBe(s2 / 233280);
  });
  it("stays in [0, 1)", () => {
    const r = createSeededRandom(7);
    for (let i = 0; i < 1000; i++) {
      const x = r();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
  it("does not touch Math.random", () => {
    const original = Math.random;
    createSeededRandom()();
    expect(Math.random).toBe(original);
  });
});

describe("spiral star count", () => {
  it("uses 5000 stars on desktop widths", () => {
    expect(starCountFor(1280)).toBe(5000);
    expect(starCountFor(MOBILE_BREAKPOINT)).toBe(5000);
  });
  it("uses ~1800 stars below 768 px", () => {
    expect(MOBILE_BREAKPOINT).toBe(768);
    expect(starCountFor(767)).toBe(1800);
    expect(starCountFor(390)).toBe(1800);
  });
});
