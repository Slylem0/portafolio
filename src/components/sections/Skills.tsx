import { useLang } from "@/i18n";
import { skills, type SkillGroup } from "@/data/skills";
import SyncBar, { type SyncColor } from "@/components/ui/SyncBar";
import { HudCorners, HudRule } from "@/components/ui/HudFrame";

const GROUP_COLOR: Record<SkillGroup["id"], SyncColor> = {
  cloud: "alert",
  languages: "phosphor",
  linux: "unit",
  ai: "amber",
};

/** Skills below this sync are flagged as still being learned. */
const LEARNING_BELOW = 50;

export default function Skills() {
  const { t } = useLang();

  return (
    <section id="skills" aria-labelledby="skills-title" className="relative overflow-hidden bg-bg py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-12">
        <HudRule index="002" label={t.nav.skills.replace(/^\d+\s*/, "")} className="mb-8" />

        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <h2
            id="skills-title"
            className="font-eva text-4xl leading-none font-extrabold tracking-[-0.01em] text-bone sm:text-5xl md:text-6xl"
          >
            {t.skills.title}
          </h2>
          <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] text-phosphor">
            <span aria-hidden="true" className="size-1.5 bg-phosphor motion-safe:animate-pulse" />
            {t.skills.subtitle}
          </p>
        </div>

        <div aria-hidden="true" className="hex-divider mb-10" />

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {skills.map((group, gi) => {
            const color = GROUP_COLOR[group.id];
            const avg = Math.round(group.items.reduce((s, it) => s + it.sync, 0) / group.items.length);
            const headingId = `skills-${group.id}`;
            return (
              <div
                key={group.id}
                role="group"
                aria-labelledby={headingId}
                className="relative min-w-0 border border-bone/20 bg-panel"
              >
                <HudCorners className="size-3 border-bone/50 lg:size-4" />
                {/* Warning-stripe header with a black label plate */}
                <div className="warning-stripes relative flex h-11 items-center border-b border-bone/20 px-3">
                  <div className="flex items-center gap-3 bg-bg px-3 py-1.5">
                    <span aria-hidden="true" className="font-mono text-[10px] tracking-widest text-bone/60">
                      02-{String.fromCharCode(65 + gi)}
                    </span>
                    <h3 id={headingId} className="font-mono text-xs font-bold tracking-[0.25em] text-bone">
                      {t.skills.groups[group.id]}
                    </h3>
                  </div>
                </div>

                <div className="space-y-4 px-4 py-5 md:px-5">
                  {group.items.map((item) => (
                    <SyncBar
                      key={item.name}
                      name={item.name}
                      sync={item.sync}
                      color={color}
                      tag={item.sync < LEARNING_BELOW ? t.skills.learning : undefined}
                    />
                  ))}
                </div>

                <div
                  aria-hidden="true"
                  className="flex items-center justify-between border-t border-bone/15 px-4 py-2 font-mono text-[10px] tracking-widest text-bone/55 md:px-5"
                >
                  <span>Σ {group.items.length}</span>
                  <span>
                    {t.skills.average} <span className="text-bone/85">{avg}%</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
