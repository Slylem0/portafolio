import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { usePointerFx } from "./usePointerFx";

const INTERACTIVE = "a, button, [role=button], input, textarea, select, label";

/**
 * Crosshair dot that tracks the mouse and a ring that trails it, growing over anything clickable.
 * Only with a fine pointer and motion allowed; Omarchy Mode keeps its own cursor (hidden there).
 */
export default function HudCursor() {
  const on = usePointerFx();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = dot.current;
    const r = ring.current;
    if (!on || !d || !r) return;
    const html = document.documentElement;
    html.classList.add("hud-cursor-on");
    const dx = gsap.quickTo(d, "x", { duration: 0.15, ease: "power3.out" });
    const dy = gsap.quickTo(d, "y", { duration: 0.15, ease: "power3.out" });
    const rx = gsap.quickTo(r, "x", { duration: 0.45, ease: "power3.out" });
    const ry = gsap.quickTo(r, "y", { duration: 0.45, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      d.style.opacity = r.style.opacity = "1";
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      const hot = (e.target as Element | null)?.closest?.(INTERACTIVE);
      gsap.to(r, { scale: hot ? 2 : 1, duration: 0.3, overwrite: "auto" });
    };
    const hide = () => (d.style.opacity = r.style.opacity = "0");
    addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", hide);
    return () => {
      html.classList.remove("hud-cursor-on");
      removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", hide);
    };
  }, [on]);

  if (!on) return null;
  return (
    <div aria-hidden="true" data-testid="hud-cursor" className="hud-cursor pointer-events-none fixed inset-0 z-[55]">
      <div ref={ring} className="absolute top-0 left-0 -mt-4 -ml-4 size-8 border border-bone/70 opacity-0 mix-blend-difference" />
      <div ref={dot} className="absolute top-0 left-0 opacity-0 mix-blend-difference">
        <span className="absolute -top-px -left-2 h-px w-4 bg-bone" />
        <span className="absolute -top-2 -left-px h-4 w-px bg-bone" />
      </div>
    </div>
  );
}
