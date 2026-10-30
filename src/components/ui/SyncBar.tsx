import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";

const SEGMENTS = 20;

interface SyncBarProps {
  name: string;
  /** 0–100 */
  sync: number;
  /** Optional short tag shown next to the name (e.g. "learning"). */
  tag?: string;
  /** Accessible name; defaults to `name`. */
  label?: string;
  className?: string;
}

/** Segmented sync-ratio meter. Rendered filled on the server; animates in on reveal when motion is allowed. */
export default function SyncBar({ name, sync, tag, label, className }: SyncBarProps) {
  const [ref, state] = useReveal<HTMLDivElement>(0.4);
  const value = Math.max(0, Math.min(100, Math.round(sync)));
  const lit = Math.round((value / 100) * SEGMENTS);
  const shown = state === "armed" ? 0 : lit;

  return (
    <div
      ref={ref}
      role="meter"
      aria-label={label ?? name}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value}%`}
      className={cn("font-mono", className)}
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
        <span className="flex min-w-0 items-baseline gap-2 text-bone/90">
          <span className="truncate">{name}</span>
          {tag && (
            <span className="shrink-0 border border-dashed border-bone/50 px-1 text-[9px] tracking-widest text-bone/80 uppercase">{tag}</span>
          )}
        </span>
        <span className="shrink-0 font-medium tabular-nums tracking-wider text-bone">
          {value}
          <span className="text-bone/65">%</span>
        </span>
      </div>
      <div aria-hidden="true" className="flex h-2.5 gap-[2px]">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "sync-seg flex-1",
              i < shown ? "bg-bone" : "bg-bone/12",
            )}
            style={state === "revealed" ? { transitionDelay: `${i * 35}ms` } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
