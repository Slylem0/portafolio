import { cn } from "@/lib/utils";

interface DitherRuleProps {
  /** "dots": offset dot grid (default). "lines": 1-bit hairline dither. "ink": black dots for white plates. */
  variant?: "dots" | "lines" | "ink";
  className?: string;
}

/** Decorative monochrome band: replaces the old warning stripes. Size it with className (e.g. `h-2`). */
export default function DitherRule({ variant = "dots", className }: DitherRuleProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(variant === "lines" ? "dither-pattern" : variant === "ink" ? "dots-ink" : "dots", className)}
    />
  );
}
