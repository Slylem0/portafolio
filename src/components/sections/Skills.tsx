import { useLang } from "@/i18n";
import { skills } from "@/data/skills";
import SyncBar from "@/components/ui/SyncBar";
import { HudCorners, HudRule } from "@/components/ui/HudFrame";
import DitherRule from "@/components/ui/DitherRule";
import SpotlightCard from "@/components/fx/SpotlightCard";
import Marquee from "@/components/fx/Marquee";
import { cn } from "@/lib/utils";

/** Bento spans on the 6-column desktop grid, in group order (repeats). */
const SPANS = [
  "lg:col-span-4",
  "lg:col-span-2",
  "lg:col-span-3",
  "lg:col-span-3",
];
/** Every skill name once, for the stack band. */
const STACK = [...new Set(skills.flatMap((g) => g.items.map((it) => it.name)))];

/** Skills below this sync are flagged as still being learned. */
const LEARNING_BELOW = 50;

export default function Skills() {
  const { t } = useLang();

  return (
    <section
      id="skills"
      aria-labelledby="skills-title"
      className="relative overflow-hidden py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-12">
        <HudRule
          index="002"
          label={t.nav.skills.replace(/^\d+\s*/, "")}
          className="mb-8"
        />

        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <h2
            id="skills-title"
            className="font-sans text-4xl leading-none font-bold tracking-[-0.04em] text-bone sm:text-5xl md:text-6xl"
          >
            {t.skills.title}
          </h2>
          <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] text-g-300">
            <span
              aria-hidden="true"
              className="size-1.5 bg-bone motion-safe:animate-pulse"
            />
            {t.skills.subtitle}
          </p>
        </div>

        <div aria-hidden="true" className="hex-divider mb-8" />
      </div>

      <Marquee
        data-testid="stack-marquee"
        items={STACK}
        className="mb-10 border-y border-bone/15 bg-panel py-3 font-mono text-sm tracking-[0.2em] text-bone/80 uppercase md:text-base"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-12">
        <div className="grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-6">
          {skills.map((group, gi) => {
            const avg = Math.round(
              group.items.reduce((s, it) => s + it.sync, 0) /
                group.items.length,
            );
            const headingId = `skills-${group.id}`;
            return (
              <SpotlightCard
                key={group.id}
                className={cn("min-w-0", SPANS[gi % SPANS.length])}
              >
                <div
                  role="group"
                  aria-labelledby={headingId}
                  className="relative h-full min-w-0 border border-bone/20 bg-panel"
                >
                  <HudCorners className="size-3 border-bone/50 lg:size-4" />
                  {/* Inverted header: white bar, black label, ink dither at the end */}
                  <div className="relative flex h-11 items-center gap-3 bg-bone px-4 text-bg">
                    <span
                      aria-hidden="true"
                      className="font-mono text-[10px] tracking-widest text-bg/65"
                    >
                      02-{String.fromCharCode(65 + gi)}
                    </span>
                    <h3
                      id={headingId}
                      className="font-mono text-xs font-bold tracking-[0.25em]"
                    >
                      {t.skills.groups[group.id]}
                    </h3>
                    <DitherRule
                      variant="ink"
                      className="ml-auto h-3 w-12 shrink-0 opacity-60 sm:w-20"
                    />
                  </div>

                  <div
                    className={cn(
                      "space-y-4 px-4 py-5 md:px-5",
                      SPANS[gi % SPANS.length] === "lg:col-span-4" &&
                        "lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-4 lg:space-y-0",
                    )}
                  >
                    {group.items.map((item) => (
                      <SyncBar
                        key={item.name}
                        name={item.name}
                        sync={item.sync}
                        tag={
                          item.sync < LEARNING_BELOW
                            ? t.skills.learning
                            : undefined
                        }
                        scrub
                      />
                    ))}
                  </div>

                  <div
                    aria-hidden="true"
                    className="flex items-center justify-between border-t border-bone/15 px-4 py-2 font-mono text-[10px] tracking-widest text-bone/55 md:px-5"
                  >
                    <span>Σ {group.items.length}</span>
                    <span>
                      {t.skills.average}{" "}
                      <span className="text-bone/85">{avg}%</span>
                    </span>
                  </div>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
