import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";

interface TitleCardProps {
  /** Small line above the title, e.g. "EPISODE 01". */
  episode: string;
  /** Big title; each word is set on its own line, episode-card style. */
  title: string;
  /** Total number of episodes, shown as "01 / 04" in the HUD line. */
  total: number;
  /** id for the heading so a section can reference it with aria-labelledby. */
  id?: string;
  className?: string;
}

/**
 * Full-bleed black episode title card: huge white serif, stacked words, thin rules.
 * Text is always rendered (SSR, no-JS safe); when JS runs and motion is allowed,
 * entering the viewport triggers a one-shot smash cut (inverted frame + jolt).
 */
export default function TitleCard({ episode, title, total, id, className }: TitleCardProps) {
  const [ref, state] = useReveal<HTMLDivElement>(0.35);
  const words = title.split(/\s+/).filter(Boolean);
  const longest = Math.max(...words.map((w) => w.length), 4);
  // Fit the longest word to the viewport (Shippori Mincho caps ≈ 0.8em wide), capped on desktop.
  const fontSize = `min(8.5rem, ${(76 / longest / 0.8).toFixed(2)}vw)`;

  return (
    <div
      ref={ref}
      data-reveal={state}
      className={cn("relative isolate overflow-hidden bg-black text-white", className)}
    >
      <div className={cn("relative px-4 py-14 sm:px-10 md:px-16 md:py-20 lg:px-[10%]", state === "revealed" && "title-cut")}>
        {/* Top rule: thin double line, as on the cards */}
        <div aria-hidden="true" className="mb-6 flex flex-col gap-[3px] md:mb-10">
          <span className="h-px w-full bg-white/80" />
          <span className="h-px w-2/3 bg-white/40" />
        </div>

        <h2 id={id} className="font-eva text-white">
          <span className="block text-sm font-bold tracking-[0.35em] text-white/85 md:text-lg">{episode}</span>
          <span className="sr-only">: </span>
          <span className="mt-4 block font-extrabold leading-[0.92] tracking-[-0.02em] md:mt-6" style={{ fontSize }}>
            {words.map((w, i) => (
              <span
                key={`${w}-${i}`}
                className={cn("block origin-left scale-x-[0.86] whitespace-nowrap", i % 2 === 1 && "pl-[0.35em]")}
              >
                {w}
                {i < words.length - 1 && <span className="sr-only"> </span>}
              </span>
            ))}
          </span>
        </h2>

        {/* Bottom rule + tiny HUD metadata */}
        <div aria-hidden="true" className="mt-8 flex items-center gap-3 md:mt-12">
          <span className="h-px flex-1 bg-white/60" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-white/60">{episode.replace(/\D+/g, "") || "01"} / {String(total).padStart(2, "0")}</span>
          <span className="h-px w-10 bg-alert" />
        </div>
      </div>
    </div>
  );
}
