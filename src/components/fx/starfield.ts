/** Pure math behind the scroll starfield (unit-tested, no DOM). */

export type Star = {
  /** Position as a fraction of the viewport (0–1). */
  x: number;
  y: number;
  /** Radius in CSS px (dots) or arm length (crosses). */
  size: number;
  /** Peak opacity, 0–1. */
  alpha: number;
  /** Page progress (0–1) at which the star starts to fade in. */
  appear: number;
  /** Parallax depth: 0 = far (barely moves), 1 = near. */
  depth: number;
  /** Twinkle phase and speed. */
  phase: number;
  speed: number;
  /** Eva-style cross instead of a dot. */
  cross: boolean;
};

/** Small deterministic PRNG so the sky is the same on every visit. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Hermite ease between `a` and `b`. */
export function smoothstep(a: number, b: number, v: number): number {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Fade window for each star once the page passes its `appear` point. */
export const FADE = 0.08;

/**
 * A sky that fills up as you scroll: about a third of it from the start, the rest later
 * (appear points skew toward the top half so the page feels alive early).
 */
export function generateStars(seed: number, count: number): Star[] {
  const rnd = mulberry32(seed);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const cross = rnd() < 0.07;
    const early = rnd() < 0.35;
    // A third of the sky (a few crosses too) is up from the first frame; the rest fills in.
    const appear = early ? 0 : cross ? 0.08 + rnd() * 0.7 : Math.pow(rnd(), 1.1) * 0.85;
    const depth = rnd();
    stars.push({
      x: rnd(),
      y: rnd(),
      size: cross ? 3 + rnd() * 6 : 0.5 + depth * 1.0,
      alpha: cross ? 0.4 + rnd() * 0.3 : 0.35 + rnd() * 0.5,
      appear,
      depth,
      phase: rnd() * Math.PI * 2,
      speed: 0.6 + rnd() * 1.6,
      cross,
    });
  }
  return stars;
}

/** How visible a star is at page progress `p` (0 before `appear`, full after the fade). */
export function revealAt(appear: number, p: number): number {
  return appear <= 0 ? 1 : smoothstep(appear, appear + FADE, p);
}

/** 0.75–1 multiplier that makes a star breathe over time (seconds). */
export function twinkle(phase: number, speed: number, t: number): number {
  return 0.875 + 0.125 * Math.sin(phase + t * speed);
}

/** Viewport y (px) after parallax: far stars drift slowly, near ones faster; wraps around. */
export function parallaxY(y: number, depth: number, scroll: number, height: number): number {
  const shift = scroll * (0.02 + depth * 0.1);
  const v = (y * height - shift) % height;
  return v < 0 ? v + height : v;
}

/**
 * Evangelion cross of light, as in the Angel detonations: a tall pillar whose wide crossbar sits
 * high, with every arm tapering into light. Lengths are fractions of the total height, measured
 * from the intersection, which is the anchor point.
 */
export const EVA_CROSS = { up: 0.22, down: 0.78, bar: 0.3, core: 0.035 } as const;

/** Arm lengths (px) of an Eva cross `height` px tall, measured from the intersection. */
export function evaCross(height: number) {
  return {
    up: height * EVA_CROSS.up,
    down: height * EVA_CROSS.down,
    bar: height * EVA_CROSS.bar,
    core: Math.max(1, height * EVA_CROSS.core),
  };
}

/** Star count for a viewport: denser on big screens, capped so phones stay light. */
export function starCount(width: number, height: number): number {
  return Math.round(Math.min(260, Math.max(90, (width * height) / 6500)));
}

/* ---------- Reactive layer: pointer, scroll velocity, bursts, shooting stars ---------- */

/** Frame-rate independent ease toward `target` (rate per second). */
export function approach(current: number, target: number, rate: number, dt: number): number {
  return target + (current - target) * Math.exp(-rate * dt);
}

/** 0–1 falloff for a star at (dx, dy) from the pointer: 1 on it, 0 past `radius`. */
export function pointerBoost(dx: number, dy: number, radius: number): number {
  const d = Math.hypot(dx, dy);
  if (d >= radius) return 0;
  const t = 1 - d / radius;
  return t * t;
}

/**
 * Hyperspace streak length (px) for a star of `depth` at scroll velocity `v` (px/s).
 * Near stars stretch more; tiny velocities do nothing so reading stays calm.
 */
export function warpLength(v: number, depth: number): number {
  const speed = Math.abs(v);
  if (speed < 400) return 0;
  return Math.min(70, (speed - 400) * 0.02 * (0.3 + depth * 0.7));
}

/**
 * Eva cross detonation over its life: the beam shoots up fast (scale 0→1 in ~0.25s) and the
 * light dies out slowly. `age` and `life` in seconds; alpha 0 once it is over.
 */
export function burstEnvelope(age: number, life: number): { scale: number; alpha: number } {
  if (age < 0 || age >= life) return { scale: age < 0 ? 0 : 1, alpha: 0 };
  const scale = 1 - Math.pow(1 - Math.min(1, age / 0.25), 3);
  const flash = age < 0.08 ? age / 0.08 : 1;
  const fade = 1 - smoothstep(0.15, life, age);
  return { scale, alpha: flash * fade };
}

/** Indices of the `n` stars closest to (px, py) within `radius` (positions in px). */
export function nearest(points: [number, number][], px: number, py: number, n: number, radius: number): number[] {
  const hits: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    const d = Math.hypot(points[i][0] - px, points[i][1] - py);
    if (d < radius) hits.push([d, i]);
  }
  return hits
    .sort((a, b) => a[0] - b[0])
    .slice(0, n)
    .map((h) => h[1]);
}

export type ShootingStar = { x: number; y: number; vx: number; vy: number; born: number; life: number };

/** A shooting star entering from the top area, crossing diagonally. `rnd` returns 0–1. */
export function spawnShootingStar(rnd: () => number, w: number, h: number, now: number): ShootingStar {
  const leftToRight = rnd() < 0.5;
  const speed = 700 + rnd() * 500;
  const angle = (0.12 + rnd() * 0.22) * Math.PI;
  return {
    x: leftToRight ? rnd() * w * 0.5 : w * 0.5 + rnd() * w * 0.5,
    y: rnd() * h * 0.35,
    vx: Math.cos(angle) * speed * (leftToRight ? 1 : -1),
    vy: Math.sin(angle) * speed,
    born: now,
    life: 0.9 + rnd() * 0.5,
  };
}
