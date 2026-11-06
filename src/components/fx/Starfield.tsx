import { useEffect, useRef } from "react";
import { canAnimate, hasFinePointer, isPageLocked } from "@/lib/motion/env";
import {
  approach,
  burstEnvelope,
  clamp01,
  evaCross,
  generateStars,
  mulberry32,
  nearest,
  parallaxY,
  pointerBoost,
  revealAt,
  smoothstep,
  spawnShootingStar,
  starCount,
  twinkle,
  warpLength,
  type ShootingStar,
  type Star,
} from "./starfield";

const SEED = 2015;
const BONE = "245,245,245";
/** Still sky shown with reduced motion: about two thirds of the stars, nothing moves. */
const STATIC_PROGRESS = 0.5;
/** Pointer reach (px) for the glow and the NERV target lines. */
const REACH = 170;
/** Things you can click: they never set off a burst. */
const INTERACTIVE =
  "a,button,input,textarea,select,label,summary,[role=button],[role=tab],[role=meter],[tabindex],#intro,astro-island[component-url*=Omarchy]";

type Constellation = { pts: [number, number][]; from: number };
type Burst = { x: number; y: number; born: number; life: number; size: number; power: number };

/** Three loose constellations (viewport fractions); the first is traced almost from the top. */
function makeConstellations(): Constellation[] {
  const rnd = mulberry32(SEED + 1);
  const anchors: [number, number][] = [
    [0.12, 0.3],
    [0.78, 0.22],
    [0.62, 0.68],
  ];
  return anchors.map(([ax, ay], i) => {
    const pts: [number, number][] = [];
    let x = ax;
    let y = ay;
    for (let k = 0; k < 5; k++) {
      pts.push([x, y]);
      x = clamp01(x + (rnd() - 0.3) * 0.09);
      y = clamp01(y + (rnd() - 0.5) * 0.12);
    }
    return { pts, from: 0.04 + i * 0.16 };
  });
}

type Sprite = { img: HTMLCanvasElement; ax: number; ay: number; height: number };

/**
 * Pre-rendered Eva cross of light (drawn once, then stamped with drawImage). Like the Angel
 * detonations: each arm is a column of almost constant width whose edges glow off softly and
 * which only fades out near its tip, with a small hot flare where the beams meet.
 */
function makeEvaSprite(height: number): Sprite | null {
  const { up, down, bar, core } = evaCross(height);
  const half = core * 3.2; // soft half-width of a beam, glow included
  const img = document.createElement("canvas");
  img.width = Math.ceil(bar * 2 + half * 2);
  img.height = Math.ceil(up + down + half * 2);
  const g = img.getContext("2d");
  if (!g) return null;
  const ax = img.width / 2;
  const ay = half + up;

  /** One beam on its own canvas: soft across its width, fading along its length, then added. */
  const beam = (len: number, vertical: boolean, fadeFrom: number) => {
    const L = Math.max(1, Math.ceil(len));
    const W = Math.max(2, Math.ceil(half * 2));
    const c = document.createElement("canvas");
    c.width = L;
    c.height = W;
    const b = c.getContext("2d");
    if (!b) return null;
    const across = b.createLinearGradient(0, 0, 0, W);
    across.addColorStop(0, `rgba(${BONE},0)`);
    across.addColorStop(0.3, `rgba(${BONE},0.12)`);
    across.addColorStop(0.42, `rgba(${BONE},0.5)`);
    across.addColorStop(0.5, `rgba(${BONE},1)`);
    across.addColorStop(0.58, `rgba(${BONE},0.5)`);
    across.addColorStop(0.7, `rgba(${BONE},0.12)`);
    across.addColorStop(1, `rgba(${BONE},0)`);
    b.fillStyle = across;
    b.fillRect(0, 0, L, W);
    // Lengthwise: full strength from the intersection, fading out toward the tip.
    b.globalCompositeOperation = "destination-in";
    const along = b.createLinearGradient(0, 0, L, 0);
    along.addColorStop(0, "rgba(0,0,0,1)");
    along.addColorStop(fadeFrom, "rgba(0,0,0,0.85)");
    along.addColorStop(1, "rgba(0,0,0,0)");
    b.fillStyle = along;
    b.fillRect(0, 0, L, W);
    return { c, W, vertical };
  };

  g.globalCompositeOperation = "lighter";
  const put = (len: number, dir: "up" | "down" | "left" | "right", fadeFrom: number) => {
    const bm = beam(len, dir === "up" || dir === "down", fadeFrom);
    if (!bm) return;
    g.save();
    g.translate(ax, ay);
    g.rotate({ right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir]);
    g.drawImage(bm.c, 0, -bm.W / 2);
    g.restore();
  };
  put(up, "up", 0.45);
  put(down, "down", 0.55);
  put(bar, "left", 0.5);
  put(bar, "right", 0.5);

  // Small hot flare where the beams meet.
  const r = half * 2;
  const flare = g.createRadialGradient(ax, ay, 0, ax, ay, r);
  flare.addColorStop(0, `rgba(${BONE},0.7)`);
  flare.addColorStop(0.3, `rgba(${BONE},0.15)`);
  flare.addColorStop(1, `rgba(${BONE},0)`);
  g.fillStyle = flare;
  g.fillRect(ax - r, ay - r, r * 2, r * 2);
  return { img, ax, ay, height };
}

/**
 * Fixed sky behind the page. A third of it is there from the first frame and the rest fills in
 * with the scroll: dots, Evangelion crosses of light, constellations and, at the very end, a tall cross of
 * light. It reacts to the visitor: stars drift against the pointer (or the phone's tilt) and brighten near it, NERV
 * target lines lock onto the closest ones, fast scrolling stretches them into hyperspace
 * streaks, clicking empty space detonates an Eva cross, every section that enters the screen
 * sets one off at the edge, and the odd shooting star crosses the sky.
 */
export default function Starfield() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const html = document.documentElement;
    const animate = canAnimate();
    const fine = animate && hasFinePointer();
    const rnd = mulberry32(Date.now() & 0xffff);
    const constellations = makeConstellations();
    // A small sprite for the sky's crosses and a big one for detonations and the finale.
    const small = makeEvaSprite(72);
    const big = makeEvaSprite(560);

    let stars: Star[] = [];
    let w = 0;
    let h = 0;
    // Pointer (px), whether it is on the page, and its smoothed parallax offset (-1..1).
    let px = 0;
    let py = 0;
    let onPage = false;
    let hot = false;
    let offX = 0;
    let offY = 0;
    // Phone tilt (-1..1), used as the parallax target where there is no mouse.
    let tiltX = 0;
    let tiltY = 0;
    // Scroll velocity (px/s), smoothed.
    let vel = 0;
    let lastY = scrollY;
    let lastT = performance.now() / 1000;
    let lastDraw = 0;
    let activeUntil = 0;
    let raf = 0;
    const bursts: Burst[] = [];
    const shooters: ShootingStar[] = [];
    let nextShooter = lastT + 4 + rnd() * 4;
    // Screen positions of the stars drawn this frame (for the target lines).
    let drawn: [number, number][] = [];

    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = innerWidth;
      h = innerHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = generateStars(SEED, starCount(w, h));
    };

    const progress = () => {
      const max = html.scrollHeight - innerHeight;
      return max > 0 ? clamp01(scrollY / max) : 0;
    };

    const line = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    };

    /**
     * Stamp an Eva cross `height` px tall anchored at its intersection (x, y). `widen` (0–1)
     * scales the crossbar on its own, so a detonation can shoot up before it spreads.
     */
    const drawCross = (x: number, y: number, height: number, alpha: number, widen = 1) => {
      const sp = height > 120 ? big : small;
      if (!sp || alpha <= 0 || height <= 0) return;
      const k = height / sp.height;
      const kx = k * widen;
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.drawImage(sp.img, x - sp.ax * kx, y - sp.ay * k, sp.img.width * kx, sp.img.height * k);
    };

    /** A detonation: the pillar of light shoots up, the crossbar spreads, a shock ring expands. */
    const drawBurst = (b: Burst, t: number) => {
      const age = t - b.born;
      const { scale, alpha } = burstEnvelope(age, b.life);
      if (alpha <= 0) return;
      const a = alpha * b.power;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      drawCross(b.x, b.y, b.size * scale, a, Math.max(0.15, scale * scale));
      ctx.globalAlpha = 0.25 * a;
      ctx.strokeStyle = `rgb(${BONE})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 12 + age * b.size * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    const draw = (t: number) => {
      const p = animate ? progress() : STATIC_PROGRESS;
      const scroll = animate ? scrollY : 0;
      ctx.clearRect(0, 0, w, h);
      const pointer = fine && onPage;
      drawn = [];

      // Stars and crosses.
      ctx.fillStyle = `rgb(${BONE})`;
      ctx.strokeStyle = `rgb(${BONE})`;
      for (const s of stars) {
        const r = revealAt(s.appear, p);
        if (r <= 0) continue;
        const pull = 6 + s.depth * 22;
        const x = s.x * w - offX * pull;
        const y = parallaxY(s.y, s.depth, scroll, h) - offY * pull;
        const boost = pointer ? pointerBoost(x - px, y - py, REACH) : 0;
        const a = Math.min(1, s.alpha * r * (animate ? twinkle(s.phase, s.speed, t) : 1) * (1 + boost * 1.6));
        const streak = warpLength(vel, s.depth) * r;
        if (r > 0.6) drawn.push([x, y]);
        if (s.cross) {
          ctx.globalCompositeOperation = "lighter";
          drawCross(x, y, s.size * 4.5 * (0.6 + 0.4 * r) * (1 + boost * 0.7), a);
          ctx.globalCompositeOperation = "source-over";
        } else if (streak > 1) {
          // Hyperspace: the star leaves a trail opposite to its motion.
          ctx.globalAlpha = a * 0.8;
          ctx.lineWidth = Math.max(0.6, s.size * 1.2);
          ctx.beginPath();
          line(x, y, x, y + Math.sign(vel) * streak);
          ctx.stroke();
        } else {
          const d = s.size * 2 * (1 + boost);
          ctx.globalAlpha = a;
          ctx.fillRect(x - d / 2, y - d / 2, d, d);
        }
      }

      // Constellations: lines draw themselves segment by segment.
      ctx.lineWidth = 0.75;
      for (const c of constellations) {
        const k = clamp01((p - c.from) / 0.18) * (c.pts.length - 1);
        if (k <= 0) continue;
        const shift = scroll * 0.02;
        const pt = (i: number) =>
          [c.pts[i][0] * w - offX * 10, c.pts[i][1] * h - shift - offY * 10] as const;
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = "#a3a3a3";
        ctx.beginPath();
        const [sx, sy] = pt(0);
        ctx.moveTo(sx, sy);
        for (let i = 1; i <= Math.ceil(k); i++) {
          const [ax, ay] = pt(i - 1);
          const [bx, by] = pt(i);
          const f = Math.min(1, k - (i - 1));
          ctx.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f);
        }
        ctx.stroke();
        ctx.globalAlpha = 0.55;
        for (let i = 0; i <= Math.floor(k); i++) {
          const [x, y] = pt(i);
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }

      // NERV target lock: thin lines from the pointer to the closest stars, brackets on the first.
      if (pointer) {
        const near = nearest(drawn, px, py, 3, REACH);
        ctx.strokeStyle = `rgb(${BONE})`;
        ctx.lineWidth = 0.75;
        near.forEach((i, rank) => {
          const [x, y] = drawn[i];
          const fall = 1 - Math.hypot(x - px, y - py) / REACH;
          ctx.globalAlpha = (hot ? 0.45 : 0.22) * fall * (1 - rank * 0.25);
          ctx.setLineDash(rank === 0 ? [] : [2, 3]);
          ctx.beginPath();
          line(px, py, x, y);
          ctx.stroke();
          if (rank === 0) {
            const s = 7;
            const k = 3;
            ctx.globalAlpha = (hot ? 0.8 : 0.5) * fall;
            ctx.beginPath();
            line(x - s, y - s, x - s + k, y - s);
            line(x - s, y - s, x - s, y - s + k);
            line(x + s, y - s, x + s - k, y - s);
            line(x + s, y - s, x + s, y - s + k);
            line(x - s, y + s, x - s + k, y + s);
            line(x - s, y + s, x - s, y + s - k);
            line(x + s, y + s, x + s - k, y + s);
            line(x + s, y + s, x + s, y + s - k);
            ctx.stroke();
          }
        });
        ctx.setLineDash([]);
      }

      // Shooting stars.
      for (const s of shooters) {
        const age = t - s.born;
        const life = clamp01(age / s.life);
        const hx = s.x + s.vx * age;
        const hy = s.y + s.vy * age;
        const len = 140 * (1 - life * 0.5);
        const n = Math.hypot(s.vx, s.vy);
        const tx = hx - (s.vx / n) * len;
        const ty = hy - (s.vy / n) * len;
        const fade = Math.sin(Math.PI * life);
        const g = ctx.createLinearGradient(tx, ty, hx, hy);
        g.addColorStop(0, `rgba(${BONE},0)`);
        g.addColorStop(1, `rgba(${BONE},${0.75 * fade})`);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        line(tx, ty, hx, hy);
        ctx.stroke();
        ctx.fillStyle = `rgba(${BONE},${0.9 * fade})`;
        ctx.fillRect(hx - 1, hy - 1, 2, 2);
      }

      // The cross of light rising over the horizon at the end of the page.
      const rise = animate ? smoothstep(0.78, 1, p) : 0;
      if (rise > 0) {
        const H = h * 1.05 * rise;
        const breathe = 0.85 + 0.15 * Math.sin(t * 1.3);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        drawCross(w * 0.5 - offX * 8, h + H * 0.12 - H * evaCross(1).down, H, 0.32 * rise * breathe, rise);
        ctx.restore();
      }

      for (const b of bursts) drawBurst(b, t);
      ctx.globalAlpha = 1;
    };

    /** One animation step: update the reactive state, draw, and keep going while anything moves. */
    const frame = (now: number) => {
      raf = 0;
      if (document.hidden || isPageLocked(html)) return;
      // Cap at ~40 fps: smooth enough, and gentle on laptops and phones.
      if (now - lastDraw < 24) {
        raf = requestAnimationFrame(frame);
        return;
      }
      lastDraw = now;
      const t = now / 1000;
      const dt = Math.min(0.1, Math.max(0.001, t - lastT));
      lastT = t;
      const y = scrollY;
      vel = approach(vel, (y - lastY) / dt, 12, dt);
      if (Math.abs(vel) < 5) vel = 0;
      lastY = y;
      const tx = onPage ? (px / w) * 2 - 1 : tiltX;
      const ty = onPage ? (py / h) * 2 - 1 : tiltY;
      offX = approach(offX, tx, 3.5, dt);
      offY = approach(offY, ty, 3.5, dt);

      if (t > nextShooter) {
        shooters.push(spawnShootingStar(rnd, w, h, t));
        nextShooter = t + 6 + rnd() * 9;
      }
      for (let i = shooters.length - 1; i >= 0; i--)
        if (t - shooters[i].born > shooters[i].life) shooters.splice(i, 1);
      for (let i = bursts.length - 1; i >= 0; i--)
        if (t - bursts[i].born > bursts[i].life) bursts.splice(i, 1);

      draw(t);

      const settling = Math.abs(offX - tx) > 0.002 || Math.abs(offY - ty) > 0.002;
      if (t < activeUntil || vel !== 0 || settling || bursts.length || shooters.length)
        raf = requestAnimationFrame(frame);
    };
    const wake = (ms = 0) => {
      activeUntil = Math.max(activeUntil, performance.now() / 1000 + ms / 1000);
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const burst = (x: number, y: number, size: number, power: number) => {
      bursts.push({ x, y, size, power, born: performance.now() / 1000, life: 1.8 });
      if (bursts.length > 6) bursts.shift();
      wake();
    };

    resize();
    draw(lastT);
    const onResize = () => {
      resize();
      draw(performance.now() / 1000);
    };
    addEventListener("resize", onResize);
    if (!animate) return () => removeEventListener("resize", onResize);

    const onScroll = () => wake(150);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      py = e.clientY;
      onPage = true;
      const el = e.target as Element | null;
      hot = !!el?.closest?.("a,button,[role=button]");
      wake(200);
    };
    const onLeave = () => {
      onPage = false;
      wake(200);
    };
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || isPageLocked(html)) return;
      const el = e.target as Element | null;
      if (el?.closest?.(INTERACTIVE)) return;
      if (String(getSelection?.() ?? "").length > 0) return;
      burst(e.clientX, e.clientY, Math.min(h * 0.75, 560), 1);
    };
    // Touch screens: tilt the phone to drift the sky (only where no permission prompt is needed).
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tiltX = Math.max(-1, Math.min(1, e.gamma / 30));
      tiltY = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      wake(150);
    };
    const tiltable =
      !fine &&
      typeof DeviceOrientationEvent !== "undefined" &&
      !("requestPermission" in DeviceOrientationEvent);
    if (tiltable) addEventListener("deviceorientation", onTilt);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("click", onClick);
    if (fine) {
      addEventListener("pointermove", onMove, { passive: true });
      html.addEventListener("pointerleave", onLeave);
    }

    // Each section that comes into view sets off a cross at the edge of the screen.
    const lastBurst = new Map<Element, number>();
    const io = new IntersectionObserver(
      (entries) => {
        const t = performance.now() / 1000;
        for (const en of entries) {
          if (!en.isIntersecting || isPageLocked(html)) continue;
          if (t - (lastBurst.get(en.target) ?? -99) < 10) continue;
          lastBurst.set(en.target, t);
          const side = rnd() < 0.5 ? 0.04 + rnd() * 0.1 : 0.86 + rnd() * 0.1;
          burst(w * side, h * (0.5 + rnd() * 0.25), h * 0.5, 0.6);
        }
      },
      { threshold: 0.2 },
    );
    document.querySelectorAll("main > section:not(#home), #footer").forEach((s) => io.observe(s));

    // Idle: a slow tick keeps the sky twinkling and lets shooting stars in.
    const tick = setInterval(() => {
      if (!raf && performance.now() - lastDraw > 100) wake();
    }, 125);

    return () => {
      removeEventListener("resize", onResize);
      removeEventListener("scroll", onScroll);
      removeEventListener("click", onClick);
      removeEventListener("pointermove", onMove);
      removeEventListener("deviceorientation", onTilt);
      html.removeEventListener("pointerleave", onLeave);
      io.disconnect();
      clearInterval(tick);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      data-testid="starfield"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
