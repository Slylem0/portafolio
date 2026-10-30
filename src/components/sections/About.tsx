import { useLang } from "@/i18n";
import { profile } from "@/data/profile";
import TitleCard from "@/components/ui/TitleCard";
import { HudCorners, HudRule } from "@/components/ui/HudFrame";

export default function About() {
  const { lang, t } = useLang();
  // "EPISODE 01: THE BUILDER FROM BUGA" → episode line + big title.
  const [episode, ...rest] = t.about.title.split(":");
  const title = rest.join(":").trim() || episode;

  const fields: { label: string; value: string; accent?: string }[] = [
    { label: t.about.name, value: profile.name },
    { label: t.about.base, value: profile.base },
    { label: t.about.status, value: profile.status[lang], accent: "text-phosphor" },
    { label: t.about.dailyDriver, value: profile.dailyDriver },
    { label: t.about.sync, value: t.about.syncValue, accent: "text-alert" },
  ];

  return (
    <section id="about" aria-labelledby="about-title" className="relative bg-bg">
      <TitleCard id="about-title" episode={episode.trim()} title={title} />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-8 md:py-24 lg:grid-cols-[1.35fr_1fr] lg:gap-14 lg:px-12">
        {/* Story */}
        <div className="min-w-0">
          <HudRule index="001" label={t.nav.about.replace(/^\d+\s*/, "")} className="mb-8" />
          <div className="space-y-5 font-mono text-sm leading-relaxed text-bone/85 md:text-[15px]">
            {t.about.story.map((p, i) => (
              <p key={i} className="relative pl-6">
                <span aria-hidden="true" className="absolute left-0 top-0 text-unit-soft">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {p}
              </p>
            ))}
          </div>
          <div aria-hidden="true" className="dither mt-10 h-2 w-40" />
        </div>

        {/* Pilot dossier */}
        <aside
          data-testid="pilot-dossier"
          aria-labelledby="dossier-title"
          className="relative min-w-0 self-start border border-bone/20 bg-[#0b0b10]"
        >
          <HudCorners className="size-4 border-alert/70 lg:size-5" />
          <div className="flex items-stretch border-b border-bone/20">
            <div aria-hidden="true" className="warning-stripes w-6 shrink-0 opacity-90" />
            <h3 id="dossier-title" className="flex-1 px-4 py-3 font-mono text-xs font-bold tracking-[0.3em] text-alert">
              {t.about.dossier}
            </h3>
            <span aria-hidden="true" className="flex items-center px-4 font-mono text-[10px] tracking-widest text-bone/50">
              001
            </span>
          </div>
          <dl className="divide-y divide-bone/10 px-4 font-mono">
            {fields.map((f) => (
              <div key={f.label} className="grid gap-1 py-3.5 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                <dt className="text-[10px] tracking-[0.25em] text-unit-soft uppercase">{f.label}</dt>
                <dd className={f.accent ?? "text-sm text-bone"}>
                  <span className={f.accent ? "text-sm" : undefined}>{f.value}</span>
                  {f.accent === "text-phosphor" && (
                    <span aria-hidden="true" className="ml-1 inline-block h-3.5 w-[7px] translate-y-[2px] bg-phosphor motion-safe:animate-pulse" />
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div aria-hidden="true" className="flex items-center gap-2 border-t border-bone/20 px-4 py-2.5 font-mono text-[9px] tracking-widest text-bone/50">
            <span className="size-1.5 bg-phosphor" />
            <span>{t.hero.coords}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
