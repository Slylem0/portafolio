// Adapted from the 21st.dev "spiral-animation" component (GSAP canvas warp, white stars on black).
// Changes from the original: SSR-safe (no window access during render), a local seeded PRNG instead
// of overriding Math.random, one star set (the original built it twice), fewer stars on small
// screens, DPR capped at 2, an undistorted full-viewport canvas, resize without re-seeding,
// pause while the tab is hidden, and a single static frame under prefers-reduced-motion.
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export const MOBILE_BREAKPOINT = 768;
const DESKTOP_STARS = 5000;
const MOBILE_STARS = 1800;
const MAX_DPR = 2;
/** Timeline position drawn once when the visitor prefers reduced motion. */
export const STATIC_TIME = 0.6;

/** Star count for a viewport width: the full 5000 on desktop, ~1800 below 768 px. */
export function starCountFor(width: number): number {
  return width < MOBILE_BREAKPOINT ? MOBILE_STARS : DESKTOP_STARS;
}

/** The original's LCG (seed 1234), as a local generator: same sky every time, Math.random untouched. */
export function createSeededRandom(seed = 1234): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

type Vec2 = { x: number; y: number };

const constrain = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const map = (v: number, a1: number, b1: number, a2: number, b2: number) => a2 + (b2 - a2) * ((v - a1) / (b1 - a1));
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

function ease(p: number, g: number): number {
  return p < 0.5 ? 0.5 * Math.pow(2 * p, g) : 1 - 0.5 * Math.pow(2 * (1 - p), g);
}

function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 4.5;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * c4) + 1;
}

const CAMERA_Z = -400;
const CAMERA_TRAVEL = 3400;
const START_DOT_Y_OFFSET = 28;
const VIEW_ZOOM = 100;
const CHANGE_EVENT_TIME = 0.32;
const TRAIL_LENGTH = 80;
const DURATION_S = 15;

function spiralPath(p: number): Vec2 {
  p = ease(constrain(1.2 * p, 0, 1), 1.8);
  const turns = 6;
  const theta = 2 * Math.PI * turns * Math.sqrt(p);
  const r = 170 * Math.sqrt(p);
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) + START_DOT_Y_OFFSET };
}

function rotate(v1: Vec2, v2: Vec2, p: number, orientation: boolean): Vec2 {
  const mx = (v1.x + v2.x) / 2;
  const my = (v1.y + v2.y) / 2;
  const dx = v1.x - mx;
  const dy = v1.y - my;
  const angle = Math.atan2(dy, dx);
  const o = orientation ? -1 : 1;
  const r = Math.sqrt(dx * dx + dy * dy);
  const bounce = Math.sin(p * Math.PI) * 0.05 * (1 - p);
  const a = angle + o * Math.PI * easeOutElastic(p);
  return { x: mx + r * (1 + bounce) * Math.cos(a), y: my + r * (1 + bounce) * Math.sin(a) };
}

class Star {
  private readonly dx: number;
  private readonly dy: number;
  private readonly spiralLocation: number;
  private readonly strokeWeightFactor: number;
  private readonly z: number;
  private readonly angle: number;
  private readonly distance: number;
  private readonly rotationDirection: number;
  private readonly expansionRate: number;
  private readonly finalScale: number;
  private readonly spiralPos: Vec2;

  constructor(random: () => number) {
    this.angle = random() * Math.PI * 2;
    this.distance = 30 * random() + 15;
    this.rotationDirection = random() > 0.5 ? 1 : -1;
    this.expansionRate = 1.2 + random() * 0.8;
    this.finalScale = 0.7 + random() * 0.6;
    this.dx = this.distance * Math.cos(this.angle);
    this.dy = this.distance * Math.sin(this.angle);
    this.spiralLocation = (1 - Math.pow(1 - random(), 3.0)) / 1.3;
    const z = 0.5 * CAMERA_Z + random() * (CAMERA_TRAVEL + CAMERA_Z - 0.5 * CAMERA_Z);
    this.z = lerp(z, CAMERA_TRAVEL / 2, 0.3 * this.spiralLocation);
    this.strokeWeightFactor = Math.pow(random(), 2.0);
    // spiralPath() depends only on spiralLocation: compute it once instead of every frame.
    this.spiralPos = spiralPath(this.spiralLocation);
  }

  render(p: number, scene: Scene) {
    const q = p - this.spiralLocation;
    if (q <= 0) return;
    const sp = this.spiralPos;
    const d = constrain(4 * q, 0, 1);
    const linear = d;
    const elastic = easeOutElastic(d);
    const power = d * d;
    let easing: number;
    if (d < 0.3) easing = lerp(linear, power, d / 0.3);
    else if (d < 0.7) easing = lerp(power, elastic, (d - 0.3) / 0.4);
    else easing = elastic;

    let sx: number;
    let sy: number;
    if (d < 0.3) {
      sx = lerp(sp.x, sp.x + this.dx * 0.3, easing / 0.3);
      sy = lerp(sp.y, sp.y + this.dy * 0.3, easing / 0.3);
    } else if (d < 0.7) {
      const mid = (d - 0.3) / 0.4;
      const curve = Math.sin(mid * Math.PI) * this.rotationDirection * 1.5;
      const bx = sp.x + this.dx * 0.3;
      const by = sp.y + this.dy * 0.3;
      const tx = sp.x + this.dx * 0.7;
      const ty = sp.y + this.dy * 0.7;
      sx = lerp(bx, tx, mid) + -this.dy * 0.4 * curve * mid;
      sy = lerp(by, ty, mid) + this.dx * 0.4 * curve * mid;
    } else {
      const fin = (d - 0.7) / 0.3;
      const bx = sp.x + this.dx * 0.7;
      const by = sp.y + this.dy * 0.7;
      const dist = this.distance * this.expansionRate * 1.5;
      const a = this.angle + 1.2 * this.rotationDirection * fin * Math.PI;
      sx = lerp(bx, sp.x + dist * Math.cos(a), fin);
      sy = lerp(by, sp.y + dist * Math.sin(a), fin);
    }

    const vx = ((this.z - CAMERA_Z) * sx) / VIEW_ZOOM;
    const vy = ((this.z - CAMERA_Z) * sy) / VIEW_ZOOM;
    let size = 1.0;
    if (d < 0.6) size = 1.0 + d * 0.2;
    else {
      const t = (d - 0.6) / 0.4;
      size = 1.2 * (1.0 - t) + this.finalScale * t;
    }
    scene.dot(vx, vy, this.z, 8.5 * this.strokeWeightFactor * size);
  }
}

/** Draws one frame of the spiral for a timeline position in [0, 1]. */
class Scene {
  time = 0;
  width = 0;
  height = 0;
  private stars: Star[] = [];
  private cameraZ = CAMERA_Z;

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  setStarCount(n: number) {
    if (n === this.stars.length) return;
    const random = createSeededRandom();
    this.stars = Array.from({ length: n }, () => new Star(random));
  }

  /** Projects a 3D point and draws it (the original's showProjectedDot). */
  dot(x: number, y: number, z: number, sizeFactor: number) {
    if (z <= this.cameraZ) return;
    const depth = z - this.cameraZ;
    const ctx = this.ctx;
    ctx.lineWidth = (400 * sizeFactor) / depth;
    ctx.beginPath();
    ctx.arc((VIEW_ZOOM * x) / depth, (VIEW_ZOOM * y) / depth, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  render() {
    const ctx = this.ctx;
    const t1 = constrain(map(this.time, 0, CHANGE_EVENT_TIME + 0.25, 0, 1), 0, 1);
    const t2 = constrain(map(this.time, CHANGE_EVENT_TIME, 1, 0, 1), 0, 1);
    this.cameraZ = CAMERA_Z + ease(Math.pow(t2, 1.2), 1.8) * CAMERA_TRAVEL;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.rotate(-Math.PI * ease(t2, 2.7));
    ctx.fillStyle = "white";
    this.drawTrail(t1);
    for (const star of this.stars) star.render(t1, this);
    if (this.time > CHANGE_EVENT_TIME) {
      const dy = (CAMERA_Z * START_DOT_Y_OFFSET) / VIEW_ZOOM;
      this.dot(0, dy, CAMERA_TRAVEL, 2.5);
    }
    ctx.restore();
  }

  private drawTrail(t1: number) {
    const ctx = this.ctx;
    const wobble = Math.sin(this.time * Math.PI * 2) * 0.5 + 0.5;
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const f = map(i, 0, TRAIL_LENGTH, 1.1, 0.1);
      const sw = (1.3 * (1 - t1) + 3.0 * Math.sin(Math.PI * t1)) * f;
      const pos = spiralPath(t1 - 0.00015 * i);
      const r = rotate(pos, { x: pos.x + 5, y: pos.y + 5 }, wobble, i % 2 === 0);
      ctx.beginPath();
      ctx.arc(r.x, r.y, sw / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

type Props = { className?: string };

/**
 * Full-viewport spiral warp. Client-only by construction: everything touching `window`
 * happens in the effect, so it renders an empty canvas on the server.
 */
export function SpiralAnimation({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new Scene(ctx);

    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.width = w;
      scene.height = h;
      scene.setStarCount(starCountFor(w)); // no-op unless the 768 px tier changes
      scene.render();
    };

    let timeline: gsap.core.Timeline | null = null;
    if (reduced) {
      scene.time = STATIC_TIME;
      canvas.dataset.mode = "static";
    } else {
      timeline = gsap.timeline({ repeat: -1 });
      timeline.to(scene, { time: 1, duration: DURATION_S, ease: "none", onUpdate: () => scene.render() });
      canvas.dataset.mode = "animated";
    }
    fit();

    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fit);
    };
    const onVisibility = () => {
      if (!timeline) return;
      if (document.hidden) timeline.pause();
      else timeline.play();
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      timeline?.kill();
    };
  }, []);

  return <canvas ref={canvasRef} data-testid="intro-canvas" aria-hidden="true" className={className} />;
}
