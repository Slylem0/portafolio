import { useEffect, useRef } from "react";
import { renderOctahedron, RAMP } from "./octahedron";

interface Props {
  variant?: "hero" | "wallpaper";
  className?: string;
}

export default function AsciiOctahedron({ variant = "hero", className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const phosphor = css.getPropertyValue("--phosphor").trim() || "#39ff88";
    const alert = css.getPropertyValue("--alert").trim() || "#ff6a00";
    const unit = css.getPropertyValue("--unit").trim() || "#7b4dff";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = reduced ? 0.2 : 1;
    // Shading bands: dim (' .:-=') in unit purple, mid and edges ('+*#') in phosphor, highlights ('%@') in alert.
    const brightMin = RAMP.length - 2;
    const midMin = 5;
    const band = (ch: string) => {
      const i = RAMP.indexOf(ch);
      return i >= brightMin ? 2 : i >= midMin ? 1 : 0;
    };
    const STYLE = [
      { color: unit, alpha: 0.9 },
      { color: phosphor, alpha: 0.8 },
      { color: alert, alpha: 1 },
    ];

    let width = 0, height = 0, dpr = 1, cellW = 10, cellH = 20;
    let raf = 0, last = 0;
    let visible = true;
    let cancelled = false;
    let rx = 0.35, ry = 0;
    let tx = 0, ty = 0, px = 0, py = 0; // pointer tilt target / current

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      cellW = variant === "wallpaper" ? 8 : window.innerWidth < 768 ? 7 : 10;
      cellH = cellW * 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${cellW * 1.6}px "JetBrains Mono", monospace`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
    };

    const draw = (dt: number) => {
      ry += dt * 0.35 * speed;
      rx += dt * 0.12 * speed;
      px += (tx - px) * Math.min(1, dt * 4);
      py += (ty - py) * Math.min(1, dt * 4);

      const cols = Math.floor(width / cellW);
      const rows = Math.floor(height / cellH);
      const lines = renderOctahedron({
        cols, rows, rx: rx + py, ry: ry + px,
        scale: variant === "wallpaper" ? 1.05 : 0.95,
      });
      ctx.clearRect(0, 0, width, height);
      const offX = (width - cols * cellW) / 2;
      const offY = (height - rows * cellH) / 2;
      // One pass per colour band keeps fillStyle switches to three per frame.
      for (let b = 0; b < STYLE.length; b++) {
        ctx.globalAlpha = STYLE[b].alpha;
        ctx.fillStyle = STYLE[b].color;
        for (let r = 0; r < rows; r++) {
          const line = lines[r];
          for (let c = 0; c < cols; c++) {
            const ch = line[c];
            if (ch === " " || band(ch) !== b) continue;
            ctx.fillText(ch, offX + c * cellW, offY + r * cellH);
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); }
    };

    const onPointer = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 1.2;
      ty = (e.clientY / window.innerHeight - 0.5) * 0.8;
    };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else start();
    };

    const ro = new ResizeObserver(() => { resize(); draw(0); });
    ro.observe(parent);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start(); else { cancelAnimationFrame(raf); raf = 0; }
    });
    io.observe(canvas);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    draw(0);
    start();
    // Re-measure once the webfont is loaded so glyphs use JetBrains Mono.
    const redraw = () => { if (!cancelled) { resize(); draw(0); } };
    const fonts = document.fonts;
    if (fonts) {
      (typeof fonts.load === "function" ? fonts.load('16px "JetBrains Mono"') : fonts.ready)
        .then(redraw, redraw);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  );
}
