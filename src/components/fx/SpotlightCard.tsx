import { useRef, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { usePointerFx } from "./usePointerFx";

/** Panel with a soft white light and border highlight that follow the pointer. */
export default function SpotlightCard({ className, children, ...rest }: { className?: string; children: ReactNode } & Record<`data-${string}`, string>) {
  const ref = useRef<HTMLDivElement>(null);
  const on = usePointerFx();
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!on || !el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onPointerMove={move} className={cn("group/spot relative", className)} {...rest}>
      {children}
      {on && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
            style={{ background: "radial-gradient(420px circle at var(--mx) var(--my), rgb(245 245 245 / 0.08), transparent 40%)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
            style={{
              background: "radial-gradient(260px circle at var(--mx) var(--my), rgb(245 245 245 / 0.55), transparent 40%)",
              mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
              padding: 1,
            }}
          />
        </>
      )}
    </div>
  );
}
