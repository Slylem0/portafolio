import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";
import { magnet } from "./math";
import { usePointerFx } from "./usePointerFx";

/** Wraps an action so it drifts toward the pointer when it comes near, and springs back. */
export default function MagneticButton({
  strength = 0.3,
  radius = 120,
  className,
  children,
}: {
  strength?: number;
  radius?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const on = usePointerFx();

  useEffect(() => {
    const el = ref.current;
    if (!on || !el) return;
    const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    let near = false;
    const move = (e: PointerEvent) => {
      // Measure without our own offset so the pull does not chase itself.
      const r = el.getBoundingClientRect();
      const tx = Number(gsap.getProperty(el, "x")) || 0;
      const ty = Number(gsap.getProperty(el, "y")) || 0;
      const m = magnet({ left: r.left - tx, top: r.top - ty, width: r.width, height: r.height }, e.clientX, e.clientY, strength, radius);
      const isNear = m.dx !== 0 || m.dy !== 0;
      if (isNear) {
        near = true;
        x(m.dx);
        y(m.dy);
      } else if (near) {
        near = false;
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)" });
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [on, strength, radius]);

  return (
    <span ref={ref} className={cn("inline-block will-change-transform", className)}>
      {children}
    </span>
  );
}
