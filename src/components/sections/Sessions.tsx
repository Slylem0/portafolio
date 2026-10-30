import { useLang } from "@/i18n";
import { sessions } from "@/data/sessions";
import WantedPoster from "@/components/ui/WantedPoster";
import { HudRule } from "@/components/ui/HudFrame";
import DitherRule from "@/components/ui/DitherRule";
import { cn } from "@/lib/utils";

export default function Sessions() {
  const { lang, t } = useLang();

  return (
    <section id="sessions" aria-labelledby="sessions-title" className="relative overflow-hidden bg-bg">
      {/* Title panel: raised black slab on a faint dot field */}
      <div className="relative border-y border-bone/15 bg-panel">
        <div aria-hidden="true" className="dither absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-8 md:py-16 lg:px-12">
          <HudRule index="003" label={t.sessions.session} className="mb-6" />
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <h2
              id="sessions-title"
              className="font-sans text-6xl leading-[0.85] font-bold tracking-[-0.05em] text-bone sm:text-8xl md:text-9xl"
            >
              {t.sessions.title}
            </h2>
            <p className="max-w-xs border-l-2 border-bone pl-3 font-mono text-xs leading-relaxed tracking-[0.2em] text-g-100">
              {t.sessions.subtitle}
            </p>
          </div>
        </div>
        <DitherRule variant="lines" className="h-1.5" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 md:py-20 lg:px-12">
        <ul role="list" className="grid gap-8 md:grid-cols-2 md:gap-10 xl:grid-cols-3">
          {sessions.map((s, i) => (
            <li
              key={s.slug}
              className={cn(
                "flex min-w-0",
                // Centre a lone last poster instead of leaving it hanging on the left.
                i === sessions.length - 1 &&
                  sessions.length % 2 === 1 &&
                  "md:col-span-2 md:mx-auto md:w-[calc(50%-1.25rem)] xl:col-span-1 xl:w-auto",
                i === sessions.length - 1 && sessions.length % 3 === 1 && "xl:col-start-2",
              )}
            >
              <WantedPoster session={s} lang={lang} className="w-full" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
