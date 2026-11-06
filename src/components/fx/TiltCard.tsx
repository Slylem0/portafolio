import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";
import { tilt } from "./math";
import { usePointerFx } from "./usePointerFx";

/** Card that leans toward the pointer in 3D, with a white glare that follows it. */
export default function TiltCard({ max = 8, className, children }: { max?: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);
  const on = usePointerFx();

  useEffect(() => {
    const el = ref.current;
    const g = glare.current;
    if (!on || !el || !g) return;
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.4, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.4, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const r = tilt(el.getBoundingClientRect(), e.clientX, e.clientY, max);
      rx(r.rx);
      ry(r.ry);
      g.style.setProperty("--gx", `${r.gx}%`);
      g.style.setProperty("--gy", `${r.gy}%`);
      g.style.opacity = "1";
    };
    const leave = () => {
      gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.9, ease: "elastic.out(1, 0.5)" });
      g.style.opacity = "0";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [on, max]);

  return (
    <div className={cn("[perspective:900px]", className)}>
      <div ref={ref} className="relative h-full [transform-style:preserve-3d] will-change-transform">
        {children}
        <div
          ref={glare}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-300"
          style={{ background: "radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgb(245 245 245 / 0.35), transparent 55%)" }}
        />
      </div>
    </div>
  );
}
