import { describe, it, expect } from "vitest";
import { RAMP, renderOctahedron } from "@/components/ascii/octahedron";

describe("renderOctahedron", () => {
  it("output has rows×cols", () => {
    const out = renderOctahedron({ cols: 80, rows: 40, rx: 0.3, ry: 0.3 });
    expect(out).toHaveLength(40);
    for (const line of out) expect(line).toHaveLength(80);
  });
  it("only ramp characters", () => {
    const out = renderOctahedron({ cols: 80, rows: 40, rx: 0.7, ry: 1.1 });
    for (const ch of out.join("")) expect(RAMP).toContain(ch);
  });
  it("centre cell is non-blank and corners are blank", () => {
    const out = renderOctahedron({ cols: 80, rows: 40, rx: 0.3, ry: 0.3 });
    expect(out[20][40]).not.toBe(" ");
    for (const [r, c] of [[0, 0], [0, 79], [39, 0], [39, 79]]) expect(out[r][c]).toBe(" ");
  });
  it("different rotation changes the frame", () => {
    const a = renderOctahedron({ cols: 80, rows: 40, rx: 0.3, ry: 0.3 }).join("\n");
    const b = renderOctahedron({ cols: 80, rows: 40, rx: 0.3, ry: 0.9 }).join("\n");
    expect(a).not.toBe(b);
  });
});
