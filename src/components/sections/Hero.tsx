import { useLang } from "@/i18n";
import { cn } from "@/lib/utils";
import AsciiOctahedron from "@/components/ascii/AsciiOctahedron";
import HudFrame, { HudRule } from "@/components/ui/HudFrame";
import { HintLabel, useCoarsePointer } from "@/components/ui/OmarchyHint";
import { openOmarchy } from "@/components/omarchy/events";

// Deterministic decoration (no Math.random in render: avoids hydration mismatches).
// 40-dot row: mostly dim, a few lit, like the hero-ascii status dots.
const DOTS = Array.from({ length: 40 }, (_, i) => (i % 9 === 4 ? "lit" : i % 7 === 2 ? "mid" : "dim"));
const BARS = [40, 75, 55, 95, 35, 80, 60, 45];

const focusRing =
  "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone";

function HudButton({ href, children, primary }: { href: string; children: string; primary?: boolean }) {
  return (
    <a
      href={href}
      className={cn(
        "group relative inline-flex h-11 items-center justify-center border px-5 font-mono text-xs font-bold tracking-[0.2em] transition-colors duration-150",
        primary
          ? "border-bone bg-bone text-bg hover:bg-transparent hover:text-bone"
          : "border-bone/45 text-bone hover:border-bone hover:bg-bone hover:text-bg",
        focusRing,
      )}
    >
      {["-top-1 -left-1 border-t border-l", "-top-1 -right-1 border-t border-r", "-bottom-1 -left-1 border-b border-l", "-bottom-1 -right-1 border-b border-r"].map(
        (pos) => (
          <span
            key={pos}
            aria-hidden="true"
            className={cn(
              "absolute size-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
              "border-bone",
              pos,
            )}
          />
        ),
      )}
      {children}
    </a>
  );
}

export default function Hero() {
  const { t } = useLang();
  const coarse = useCoarsePointer();
  const words = t.hero.title.split(" ");
  const first = words.slice(0, -1).join(" ");
  const last = words[words.length - 1];

  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-bg pt-20 lg:pt-14"
    >
      {/* ASCII octahedron background: right side on desktop, full width above the title on mobile */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[7.5rem] h-[34svh] md:inset-y-0 md:left-auto md:top-0 md:h-auto md:w-[62%] md:opacity-50 lg:w-[58%] lg:opacity-100">
          <AsciiOctahedron variant="hero" />
        </div>
        {/* Contrast veil behind the title block (on mobile it stays clear of the octahedron above the title) */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg from-35% via-bg/80 via-48% to-transparent to-60% md:w-3/5 md:bg-gradient-to-r md:from-0% md:via-bg/60 md:via-50% md:to-100%" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg to-transparent" />
      </div>

      {/* Frame: corners from below the navbar to just above the 5vh status bar */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 top-[5.75rem] bottom-[calc(5vh+0.75rem)] md:inset-x-6 lg:top-20">
        <HudFrame className="h-full w-full" />
      </div>

      {/* Coordinates (top-right) */}
      <div className="relative z-10 flex justify-between px-7 pt-6 font-mono text-[10px] tracking-widest text-bone/70 md:justify-end md:gap-6 md:px-12 md:pt-10">
        <span className="hidden text-g-300 md:inline">{t.hero.base}</span>
        <span className="text-bone">{t.hero.coords}</span>
      </div>

      {/* Title block */}
      <div className="relative z-10 flex flex-1 items-end px-7 pb-[calc(5vh+2.5rem)] pt-6 md:items-center md:px-12 md:pb-[calc(5vh+3rem)] lg:pl-[10%]">
        <div className="relative w-full max-w-lg lg:max-w-xl">
          {/* Dither strip (desktop) */}
          <div aria-hidden="true" className="dither-pattern absolute -left-6 top-10 bottom-10 hidden w-1 lg:block" />

          <HudRule index="001" className="mb-6" />

          <h1
            id="hero-title"
            className="font-sans text-[2.35rem] leading-[0.95] font-bold tracking-[-0.045em] text-bone sm:text-6xl 2xl:text-7xl"
          >
            <span className="block">{first}</span>{" "}
            <span className="block text-g-300">{last}</span>
          </h1>

          <p className="mt-4 font-mono text-sm tracking-wider text-g-300 md:text-base">
            <span aria-hidden="true" className="text-g-300">{"// "}</span>
            <span data-testid="hero-role" className="text-bone">{t.hero.role}</span>
          </p>

          <div aria-hidden="true" className="mt-6 flex max-w-full flex-wrap gap-[5px] overflow-hidden md:gap-1.5">
            {DOTS.map((c, i) => (
              <span
                key={i}
                className={cn(
                  "size-[3px]",
                  c === "lit" ? "bg-bone" : c === "mid" ? "bg-bone/60" : "bg-bone/25",
                  i >= 32 && "hidden sm:block",
                )}
              />
            ))}
          </div>

          <p className="mt-6 max-w-md font-sans text-sm leading-relaxed text-g-300 md:text-base">{t.hero.description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <HudButton href="#sessions" primary>
              {t.hero.viewSessions}
            </HudButton>
            <HudButton href="#footer">{t.hero.contact}</HudButton>
          </div>

          <button
            type="button"
            data-testid="hero-hint"
            data-omarchy-hint=""
            onClick={openOmarchy}
            className={cn(
              "mt-4 inline-flex min-h-8 items-center gap-2 border-b border-dashed border-bone/40 font-mono text-[10px] font-bold tracking-widest text-bone/85 transition-colors hover:border-bone hover:text-bone md:text-[11px]",
              focusRing,
            )}
          >
            <HintLabel text={coarse ? t.hero.hintTouch : t.hero.hint} />
          </button>

          <div aria-hidden="true" className="mt-8 hidden items-center gap-3 font-mono text-[10px] tracking-widest text-bone/50 sm:flex">
            <span className="text-base leading-none text-bone">∞</span>
            <span className="h-px w-16 bg-bone/30" />
            <span>{t.hero.notation}</span>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex h-[5vh] min-h-9 items-center justify-between border-t border-bone/20 bg-bg/60 px-4 font-mono text-[9px] tracking-widest text-bone/70 backdrop-blur-md md:px-8 md:text-[10px]">
        <div className="flex items-center gap-3 md:gap-4">
          <span className="flex items-center gap-1.5 text-bone">
            <span aria-hidden="true" className="size-1.5 bg-bone" />
            {t.hero.systemActive}
          </span>
          <span aria-hidden="true" className="hidden h-3 items-end gap-[2px] sm:flex">
            {BARS.map((h, i) => (
              <span key={i} className={cn("w-[3px]", i === 3 ? "bg-bone" : "bg-bone/40")} style={{ height: `${h}%` }} />
            ))}
          </span>
          <span className="hidden text-bone sm:inline">{t.hero.sync}</span>
          <span>{t.hero.version}</span>
        </div>
        <div className="flex items-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1 rounded-full bg-bone motion-safe:animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
          <span className="ml-1 hidden text-bone/60 sm:inline">{t.hero.rendering}</span>
        </div>
      </div>
    </section>
  );
}
