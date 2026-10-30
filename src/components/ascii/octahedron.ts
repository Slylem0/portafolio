export const RAMP = " .:-=+*#%@";

type V3 = [number, number, number];

const VERTS: V3[] = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
];
// Triangles (indices into VERTS): one per octant.
const FACES: [number, number, number][] = [];
for (const x of [0, 1]) for (const y of [2, 3]) for (const z of [4, 5]) FACES.push([x, y, z]);

const LIGHT: V3 = (() => {
  const l: V3 = [-0.5, 0.6, -0.8];
  const n = Math.hypot(...l);
  return [l[0] / n, l[1] / n, l[2] / n];
})();

function rotate([x, y, z]: V3, rx: number, ry: number): V3 {
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
}

/**
 * Orthographic ASCII render of a unit octahedron. The viewer looks along +z
 * from -z; characters are assumed ~2:1 tall, so rows are doubled in y.
 */
export function renderOctahedron(opts: {
  cols: number; rows: number; rx: number; ry: number; scale?: number;
}): string[] {
  const { cols, rows, rx, ry, scale = 1 } = opts;
  const verts = VERTS.map((v) => rotate(v, rx, ry));
  const radius = 0.42 * Math.min(cols, rows * 2) * scale; // in column units

  const tris = FACES.map(([i, j, k]) => {
    const a = verts[i], b = verts[j], c = verts[k];
    const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const w: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n: V3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const len = Math.hypot(...n);
    n = [n[0] / len, n[1] / len, n[2] / len];
    // orient outward (centroid is the outward direction for a centred solid)
    const cen = a[0] + b[0] + c[0] + (a[1] + b[1] + c[1]) + (a[2] + b[2] + c[2]);
    const out = n[0] * (a[0] + b[0] + c[0]) + n[1] * (a[1] + b[1] + c[1]) + n[2] * (a[2] + b[2] + c[2]);
    if (out < 0 || (out === 0 && cen < 0)) n = [-n[0], -n[1], -n[2]];
    const dot = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
    const idx = 1 + Math.floor(Math.min(1, dot) * (RAMP.length - 2));
    return { a, b, c, front: n[2] < 0, ch: RAMP[Math.min(idx, RAMP.length - 1)] };
  });

  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    const py = -((r + 0.5 - rows / 2) * 2) / radius;
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5 - cols / 2) / radius;
      let bestZ = Infinity;
      let ch = " ";
      for (const t of tris) {
        if (!t.front) continue;
        const d = (t.b[1] - t.c[1]) * (t.a[0] - t.c[0]) + (t.c[0] - t.b[0]) * (t.a[1] - t.c[1]);
        if (Math.abs(d) < 1e-9) continue;
        const l1 = ((t.b[1] - t.c[1]) * (px - t.c[0]) + (t.c[0] - t.b[0]) * (py - t.c[1])) / d;
        const l2 = ((t.c[1] - t.a[1]) * (px - t.c[0]) + (t.a[0] - t.c[0]) * (py - t.c[1])) / d;
        const l3 = 1 - l1 - l2;
        if (l1 < 0 || l2 < 0 || l3 < 0) continue;
        const z = l1 * t.a[2] + l2 * t.b[2] + l3 * t.c[2];
        if (z < bestZ) { bestZ = z; ch = t.ch; }
      }
      line += ch;
    }
    lines.push(line);
  }
  return lines;
}
