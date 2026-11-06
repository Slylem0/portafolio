import { describe, expect, it } from "vitest";
import { magnet, tilt } from "@/components/fx/math";

const rect = { left: 0, top: 0, width: 200, height: 100 };

describe("tilt", () => {
  it("is flat at the center with glare in the middle", () => {
    const r = tilt(rect, 100, 50, 8);
    expect(r.rx).toBeCloseTo(0);
    expect(r.ry).toBeCloseTo(0);
    expect(r).toMatchObject({ gx: 50, gy: 50 });
  });
  it("leans fully toward the top-left corner", () => {
    expect(tilt(rect, 0, 0, 8)).toEqual({ rx: 8, ry: -8, gx: 0, gy: 0 });
  });
  it("clamps outside the card", () => {
    expect(tilt(rect, 400, 300, 8)).toEqual({ rx: -8, ry: 8, gx: 100, gy: 100 });
  });
});

describe("magnet", () => {
  it("does not move at the center", () => {
    const r = magnet(rect, 100, 50, 0.3, 120);
    expect(r.dx).toBeCloseTo(0);
    expect(r.dy).toBeCloseTo(0);
  });
  it("pulls toward the pointer by strength", () => {
    expect(magnet(rect, 150, 50, 0.3, 120)).toEqual({ dx: 15, dy: 0 });
  });
  it("lets go outside the radius", () => {
    expect(magnet(rect, 300, 50, 0.3, 120)).toEqual({ dx: 0, dy: 0 });
  });
});
