import { useLang } from "@/i18n";
import { sessions } from "@/data/sessions";
import WantedPoster from "@/components/ui/WantedPoster";
import { HudRule } from "@/components/ui/HudFrame";
import { cn } from "@/lib/utils";

/** Slight, alternating tilt on wide screens only (no tilt on mobile to avoid overflow). */
const TILT = ["lg:-rotate-[0.6deg]", "lg:rotate-[0.5deg]", "lg:-rotate-[0.3deg]", "lg:rotate-[0.7deg]"];

export default function Sessions() {
  const { lang, t } = useLang();

  return (
    <section id="sessions" aria-labelledby="sessions-title" className="relative overflow-hidden bg-bg">
      {/* Jazz-blue title panel */}
      <div className="relative bg-jazz">
        <div aria-hidden="true" className="dither absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-8 md:py-16 lg:px-12">
          <HudRule index="003" label={t.sessions.session} className="mb-6" />
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <h2
              id="sessions-title"
              className="font-bebop text-7xl leading-[0.85] tracking-[0.04em] text-amber sm:text-8xl md:text-9xl"
            >
              {t.sessions.title}
            </h2>
            <p className="max-w-xs border-l-2 border-amber pl-3 font-mono text-xs leading-relaxed tracking-[0.2em] text-bone">
              {t.sessions.subtitle}
            </p>
          </div>
        </div>
        <div aria-hidden="true" className="h-1.5 bg-amber" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 md:py-20 lg:px-12">
        <ul role="list" className="grid gap-8 md:grid-cols-2 md:gap-10 xl:grid-cols-3">
          {sessions.map((s, i) => (
            <li
              key={s.slug}
              className={cn(
                "flex min-w-0",
                TILT[i % TILT.length],
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
