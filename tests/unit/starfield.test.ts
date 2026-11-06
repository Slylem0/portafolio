import { describe, expect, it } from "vitest";
import {
  approach,
  burstEnvelope,
  crossSegments,
  nearest,
  pointerBoost,
  spawnShootingStar,
  warpLength,
  mulberry32,
  generateStars,
  parallaxY,
  revealAt,
  starCount,
  twinkle,
} from "@/components/fx/starfield";

describe("generateStars", () => {
  it("is deterministic for a seed", () => {
    expect(generateStars(7, 50)).toEqual(generateStars(7, 50));
  });
  it("keeps every star inside the viewport and the page", () => {
    for (const s of generateStars(3, 400)) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThan(1);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThan(1);
      expect(s.appear).toBeGreaterThanOrEqual(0);
      expect(s.appear).toBeLessThanOrEqual(0.9);
    }
  });
  it("shows a real sky from the start and fills up to all of it", () => {
    const stars = generateStars(1, 400);
    const atTop = stars.filter((s) => revealAt(s.appear, 0) > 0).length;
    const atEnd = stars.filter((s) => revealAt(s.appear, 1) > 0).length;
    expect(atTop).toBeGreaterThan(stars.length * 0.25);
    expect(atTop).toBeLessThan(stars.length * 0.5);
    expect(atEnd).toBe(stars.length);
    expect(stars.some((s) => s.cross && s.appear === 0)).toBe(true);
    expect(stars.some((s) => s.cross && s.appear > 0)).toBe(true);
  });
});

describe("revealAt", () => {
  it("is hidden before, fading during, full after", () => {
    expect(revealAt(0.5, 0.4)).toBe(0);
    expect(revealAt(0.5, 0.54)).toBeGreaterThan(0);
    expect(revealAt(0.5, 0.54)).toBeLessThan(1);
    expect(revealAt(0.5, 0.7)).toBe(1);
    expect(revealAt(0, 0)).toBe(1);
  });
});

describe("twinkle / parallax / cross / count", () => {
  it("twinkle stays within 0.75–1", () => {
    for (let t = 0; t < 20; t += 0.37) {
      const v = twinkle(1, 1.3, t);
      expect(v).toBeGreaterThanOrEqual(0.75);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
  it("parallax wraps inside the viewport and far stars move less", () => {
    const y = parallaxY(0.1, 1, 5000, 800);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThan(800);
    const far = 400 - parallaxY(0.5, 0, 100, 800);
    const near = 400 - parallaxY(0.5, 1, 100, 800);
    expect(near).toBeGreaterThan(far);
  });
  it("cross has a longer vertical beam than its crossbar, set above center", () => {
    const [[, y1, , y2], [x1, by, x2]] = crossSegments(0, 0, 10);
    expect(y2 - y1).toBeGreaterThan(x2 - x1);
    expect(by).toBeLessThan(0);
  });
  it("star count is bounded", () => {
    expect(starCount(390, 844)).toBe(90);
    expect(starCount(1920, 1080)).toBeGreaterThan(200);
    expect(starCount(5000, 3000)).toBe(260);
  });
});

describe("reactive layer", () => {
  it("approach eases toward the target independent of frame rate", () => {
    const one = approach(0, 100, 8, 1 / 30);
    const two = approach(approach(0, 100, 8, 1 / 60), 100, 8, 1 / 60);
    expect(one).toBeCloseTo(two, 6);
    expect(approach(0, 100, 8, 10)).toBeCloseTo(100);
  });
  it("pointer boost is 1 on the pointer and 0 past the radius", () => {
    expect(pointerBoost(0, 0, 100)).toBe(1);
    expect(pointerBoost(60, 80, 100)).toBe(0);
    expect(pointerBoost(30, 0, 100)).toBeGreaterThan(pointerBoost(60, 0, 100));
  });
  it("warp ignores calm scrolling, stretches near stars more and caps", () => {
    expect(warpLength(300, 1)).toBe(0);
    expect(warpLength(-3000, 1)).toBeGreaterThan(warpLength(3000, 0));
    expect(warpLength(1e6, 1)).toBe(70);
  });
  it("burst flashes in, reaches full size fast and dies out", () => {
    expect(burstEnvelope(0, 2).alpha).toBe(0);
    expect(burstEnvelope(0.3, 2).scale).toBe(1);
    expect(burstEnvelope(0.3, 2).alpha).toBeGreaterThan(0.8);
    expect(burstEnvelope(1.5, 2).alpha).toBeLessThan(burstEnvelope(0.5, 2).alpha);
    expect(burstEnvelope(2, 2).alpha).toBe(0);
  });
  it("nearest returns closest indices within the radius, closest first", () => {
    const pts: [number, number][] = [[0, 0], [10, 0], [50, 0], [500, 0]];
    expect(nearest(pts, 9, 0, 2, 100)).toEqual([1, 0]);
    expect(nearest(pts, 9, 0, 5, 100)).toEqual([1, 0, 2]);
  });
  it("shooting stars start in the upper area and fall downward", () => {
    const rnd = mulberry32(9);
    for (let i = 0; i < 50; i++) {
      const s = spawnShootingStar(rnd, 1000, 800, 0);
      expect(s.y).toBeLessThanOrEqual(280);
      expect(s.vy).toBeGreaterThan(0);
      expect(s.life).toBeGreaterThan(0.8);
    }
  });
});
