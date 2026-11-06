import { cn } from "@/lib/utils";

/**
 * A short white light travelling around its parent's border (parent must be `relative`).
 * Pure CSS (`@property --beam-angle` in global.css); hidden under reduced motion.
 */
export default function BorderBeam({ durationS = 6, delayS = 0, className }: { durationS?: number; delayS?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-beam
      className={cn("border-beam pointer-events-none absolute -inset-px motion-reduce:hidden", className)}
      style={{ animationDuration: `${durationS}s`, animationDelay: `${-delayS}s` }}
    />
  );
}
