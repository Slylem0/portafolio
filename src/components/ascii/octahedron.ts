export const RAMP = " .:-=+*#%@";

type V3 = [number, number, number];

const VERTS: V3[] = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
];
// Triangles (indices into VERTS): one per octant.
const FACES: [number, number, number][] = [];
for (const x of [0, 1]) for (const y of [2, 3]) for (const z of [4, 5]) FACES.push([x, y, z]);

// Point light in view space (upper-left, in front of the solid). Being a point
// light rather than a directional one, the shading varies across each face.
const LIGHT_POS: V3 = [-1.8, 1.9, -2.4];
const AMBIENT = 0.1;
const DIFFUSE = 0.8;
const SPECULAR = 0.55;
const SHININESS = 18;
const EDGE_CELLS = 0.8; // silhouette/crease width, in columns
const EDGE_BOOST = 0.75;

// 4×4 ordered (Bayer) dither thresholds in [0, 1).
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => v / 16));

const LEVELS = RAMP.length - 1; // non-space characters: indices 1..LEVELS

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
    const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    // Length of each barycentric gradient (per unit of px/py): turns a barycentric
    // coordinate into a screen distance to the opposite edge.
    const g1 = Math.hypot(b[1] - c[1], c[0] - b[0]) / Math.abs(d || 1);
    const g2 = Math.hypot(c[1] - a[1], a[0] - c[0]) / Math.abs(d || 1);
    const g3 = Math.hypot(a[1] - b[1], b[0] - a[0]) / Math.abs(d || 1);
    return { a, b, c, n, d, g1, g2, g3, front: n[2] < 0 };
  });

  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    const py = -((r + 0.5 - rows / 2) * 2) / radius;
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5 - cols / 2) / radius;
      let bestZ = Infinity;
      let hit: (typeof tris)[number] | null = null;
      let edge = Infinity;
      for (const t of tris) {
        if (!t.front) continue;
        const d = t.d;
        if (Math.abs(d) < 1e-9) continue;
        const l1 = ((t.b[1] - t.c[1]) * (px - t.c[0]) + (t.c[0] - t.b[0]) * (py - t.c[1])) / d;
        const l2 = ((t.c[1] - t.a[1]) * (px - t.c[0]) + (t.a[0] - t.c[0]) * (py - t.c[1])) / d;
        const l3 = 1 - l1 - l2;
        if (l1 < 0 || l2 < 0 || l3 < 0) continue;
        const z = l1 * t.a[2] + l2 * t.b[2] + l3 * t.c[2];
        if (z < bestZ) {
          bestZ = z;
          hit = t;
          // distance (in columns) to the nearest edge of this face
          edge = Math.min(l1 / t.g1, l2 / t.g2, l3 / t.g3) * radius;
        }
      }
      if (!hit) { line += " "; continue; }

      // Per-cell lighting at the hit point: ambient + Lambert + Blinn specular.
      const n = hit.n;
      let lx = LIGHT_POS[0] - px, ly = LIGHT_POS[1] - py, lz = LIGHT_POS[2] - bestZ;
      const ll = Math.hypot(lx, ly, lz);
      lx /= ll; ly /= ll; lz /= ll;
      const lambert = Math.max(0, n[0] * lx + n[1] * ly + n[2] * lz);
      // view direction is -z (towards the viewer)
      let hx = lx, hy = ly, hz = lz - 1;
      const hl = Math.hypot(hx, hy, hz) || 1;
      hx /= hl; hy /= hl; hz /= hl;
      const spec = Math.pow(Math.max(0, n[0] * hx + n[1] * hy + n[2] * hz), SHININESS);
      let intensity = AMBIENT + DIFFUSE * lambert + SPECULAR * spec;
      if (edge < EDGE_CELLS) intensity = Math.max(intensity, EDGE_BOOST);

      // Ordered dither between adjacent ramp levels.
      const v = Math.min(1, intensity) * (LEVELS - 1) + BAYER[r & 3][c & 3];
      const idx = 1 + Math.min(LEVELS - 1, Math.max(0, Math.floor(v)));
      line += RAMP[idx];
    }
    lines.push(line);
  }
  return lines;
}
