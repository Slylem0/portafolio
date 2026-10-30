import { useLang } from "@/i18n";
import { profile } from "@/data/profile";
import TitleCard from "@/components/ui/TitleCard";
import { EPISODE_COUNT } from "@/data/sections";
import { HudCorners, HudRule } from "@/components/ui/HudFrame";
import DitherRule from "@/components/ui/DitherRule";

export default function About() {
  const { lang, t } = useLang();
  // "EPISODE 01: THE BUILDER FROM BUGA" → episode line + big title.
  const [episode, ...rest] = t.about.title.split(":");
  const title = rest.join(":").trim() || episode;

  // "live": blinking block cursor after the value. "inverse": white tag with black text.
  const fields: { label: string; value: string; mark?: "live" | "inverse" }[] = [
    { label: t.about.name, value: profile.name },
    { label: t.about.base, value: profile.base },
    { label: t.about.status, value: profile.status[lang], mark: "live" },
    { label: t.about.dailyDriver, value: profile.dailyDriver },
    { label: t.about.sync, value: t.about.syncValue, mark: "inverse" },
  ];

  return (
    <section id="about" aria-labelledby="about-title" className="relative bg-bg">
      <TitleCard id="about-title" episode={episode.trim()} title={title} total={EPISODE_COUNT} />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-8 md:py-24 lg:grid-cols-[1.35fr_1fr] lg:gap-14 lg:px-12">
        {/* Story */}
        <div className="min-w-0">
          <HudRule index="001" label={t.nav.about.replace(/^\d+\s*/, "")} className="mb-8" />
          <div className="space-y-5 font-sans text-[15px] leading-relaxed text-g-100 md:text-base">
            {t.about.story.map((p, i) => (
              <p key={i} className="relative pl-8">
                <span aria-hidden="true" className="absolute top-[0.2em] left-0 font-mono text-xs text-g-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {p}
              </p>
            ))}
          </div>
          <DitherRule variant="lines" className="mt-10 h-2 w-40" />
        </div>

        {/* Pilot dossier */}
        <aside
          data-testid="pilot-dossier"
          aria-labelledby="dossier-title"
          className="relative min-w-0 self-start border border-bone/20 bg-panel"
        >
          <HudCorners className="size-4 border-bone/80 lg:size-5" />
          <div className="flex items-stretch border-b border-bone/20">
            <DitherRule className="w-6 shrink-0 border-r border-bone/20" />
            <h3 id="dossier-title" className="flex-1 px-4 py-3 font-mono text-xs font-bold tracking-[0.3em] text-bone">
              {t.about.dossier}
            </h3>
            <span aria-hidden="true" className="flex items-center px-4 font-mono text-[10px] tracking-widest text-bone/60">
              001
            </span>
          </div>
          <dl className="divide-y divide-bone/10 px-4 font-mono">
            {fields.map((f) => (
              <div key={f.label} className="grid gap-1 py-3.5 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                <dt className="text-[10px] tracking-[0.25em] text-g-300 uppercase">{f.label}</dt>
                <dd className="text-sm text-bone">
                  <span className={f.mark === "inverse" ? "bg-bone box-decoration-clone px-1.5 py-0.5 font-bold text-bg" : undefined}>{f.value}</span>
                  {f.mark === "live" && (
                    <span aria-hidden="true" className="ml-1 inline-block h-3.5 w-[7px] translate-y-[2px] bg-bone motion-safe:animate-pulse" />
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div aria-hidden="true" className="flex items-center gap-2 border-t border-bone/20 px-4 py-2.5 font-mono text-[9px] tracking-widest text-bone/60">
            <span className="size-1.5 bg-bone" />
            <span>{t.hero.coords}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
