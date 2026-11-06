/** Pure math behind the pointer and text effects (unit-tested, no DOM). */

export type Rect = { left: number; top: number; width: number; height: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * 3D tilt toward the pointer. `rx` tilts the top edge toward the viewer when the pointer is near
 * it, `ry` the right edge; both in degrees within [-max, max]. `gx`/`gy` place the glare in %.
 */
export function tilt(rect: Rect, x: number, y: number, max: number) {
  const px = clamp((x - rect.left) / rect.width, 0, 1);
  const py = clamp((y - rect.top) / rect.height, 0, 1);
  return {
    rx: (0.5 - py) * 2 * max,
    ry: (px - 0.5) * 2 * max,
    gx: px * 100,
    gy: py * 100,
  };
}

/** Offset that drifts an element toward the pointer; zero once the pointer is past `radius`. */
export function magnet(rect: Rect, x: number, y: number, strength: number, radius: number) {
  const dx = x - (rect.left + rect.width / 2);
  const dy = y - (rect.top + rect.height / 2);
  if (Math.hypot(dx, dy) > radius) return { dx: 0, dy: 0 };
  return { dx: dx * strength, dy: dy * strength };
}

export const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>";

/**
 * One frame of a text "decode": characters left of `progress × length` are final, the rest are
 * random glyphs; spaces never change so the words keep their shape.
 */
export function scrambleFrame(target: string, progress: number, rand: () => number, glyphs = SCRAMBLE_GLYPHS): string {
  if (progress >= 1) return target;
  const settled = Math.floor(Math.max(0, progress) * target.length);
  let out = "";
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    if (i < settled || ch === " ") out += ch;
    else {
      let g = glyphs[Math.floor(rand() * glyphs.length) % glyphs.length];
      if (g === ch) g = glyphs[(glyphs.indexOf(g) + 1) % glyphs.length];
      out += g;
    }
  }
  return out;
}
