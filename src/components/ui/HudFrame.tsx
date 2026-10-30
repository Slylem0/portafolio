import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const CORNERS = [
  "top-0 left-0 border-t-2 border-l-2",
  "top-0 right-0 border-t-2 border-r-2",
  "bottom-0 left-0 border-b-2 border-l-2",
  "bottom-0 right-0 border-b-2 border-r-2",
];

/** Four HUD corner brackets filling the nearest positioned ancestor (or the frame itself). */
export function HudCorners({ className }: { className?: string }) {
  return (
    <>
      {CORNERS.map((pos) => (
        <span
          key={pos}
          aria-hidden="true"
          className={cn("pointer-events-none absolute size-8 border-bone/30 lg:size-12", pos, className)}
        />
      ))}
    </>
  );
}

/** `001 ──── LABEL ────` counter rule. */
export function HudRule({ index, label, className }: { index?: string; label?: string; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex items-center gap-2 opacity-60", className)}>
      <span className="h-px w-8 bg-bone" />
      {index && <span className="font-mono text-[10px] tracking-widest text-bone">{index}</span>}
      <span className="h-px flex-1 bg-bone" />
      {label && (
        <>
          <span className="font-mono text-[10px] tracking-widest text-bone">{label}</span>
          <span className="h-px w-8 bg-bone" />
        </>
      )}
    </div>
  );
}

interface HudFrameProps {
  label?: string;
  index?: string;
  className?: string;
  cornerClassName?: string;
  children?: ReactNode;
}

/** Corner-frame wrapper: four brackets, optional `001` counter rule, thin rules. */
export default function HudFrame({ label, index, className, cornerClassName, children }: HudFrameProps) {
  return (
    <div className={cn("relative", className)}>
      <HudCorners className={cornerClassName} />
      {(index || label) && <HudRule index={index} label={label} className="mb-6" />}
      {children}
    </div>
  );
}
