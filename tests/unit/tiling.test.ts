import { describe, it, expect } from "vitest";
import { dwindle, type Rect } from "@/components/omarchy/tiling";

const area: Rect = { x: 0, y: 0, w: 320, h: 480 };
const gap = 8;
const eps = 1e-6;

describe("dwindle", () => {
  it("count 0 returns []", () => {
    expect(dwindle(0, area, gap)).toEqual([]);
  });
  it("1 window fills area minus gap", () => {
    expect(dwindle(1, area, gap)).toEqual([{ x: 8, y: 8, w: 304, h: 464 }]);
  });
  it("n windows (1..6) never overlap and stay inside area", () => {
    for (let n = 1; n <= 6; n++) {
      const rs = dwindle(n, area, gap);
      expect(rs).toHaveLength(n);
      for (const r of rs) {
        expect(r.w).toBeGreaterThan(0);
        expect(r.h).toBeGreaterThan(0);
        expect(r.x).toBeGreaterThanOrEqual(area.x + gap - eps);
        expect(r.y).toBeGreaterThanOrEqual(area.y + gap - eps);
        expect(r.x + r.w).toBeLessThanOrEqual(area.x + area.w - gap + eps);
        expect(r.y + r.h).toBeLessThanOrEqual(area.y + area.h - gap + eps);
      }
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
          const a = rs[i], b = rs[j];
          const overlap =
            a.x < b.x + b.w - eps && b.x < a.x + a.w - eps &&
            a.y < b.y + b.h - eps && b.y < a.y + a.h - eps;
          expect(overlap).toBe(false);
        }
    }
  });
  it("total area ≈ area minus gaps", () => {
    const inner = (area.w - 2 * gap) * (area.h - 2 * gap);
    for (let n = 1; n <= 6; n++) {
      const total = dwindle(n, area, gap).reduce((s, r) => s + r.w * r.h, 0);
      const expected = inner - (n - 1) * gap * 300; // seams are roughly <= 300px long
      expect(total).toBeLessThanOrEqual(inner + eps);
      expect(total).toBeGreaterThan(expected * 0.5);
    }
    // with no gap the tiles cover the area exactly
    const full = dwindle(5, area, 0).reduce((s, r) => s + r.w * r.h, 0);
    expect(Math.abs(full - area.w * area.h) / (area.w * area.h)).toBeLessThan(0.02);
  });
  it("second window splits along longer side", () => {
    const [a, b] = dwindle(2, { x: 0, y: 0, w: 800, h: 400 }, 10);
    expect(a.y).toBe(b.y);
    expect(a.h).toBe(b.h);
    expect(b.x).toBeGreaterThan(a.x + a.w);
    const [c, d] = dwindle(2, { x: 0, y: 0, w: 400, h: 800 }, 10);
    expect(c.x).toBe(d.x);
    expect(d.y).toBeGreaterThan(c.y + c.h);
  });
});
