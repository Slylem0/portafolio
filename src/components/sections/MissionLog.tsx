import { useLang } from "@/i18n";
import { log } from "@/data/log";
import { HudRule } from "@/components/ui/HudFrame";
import { cn } from "@/lib/utils";

/** Vertical timeline with hexagon nodes, newest first. */
export default function MissionLog() {
  const { lang, t } = useLang();

  return (
    <section id="log" aria-labelledby="log-title" className="relative overflow-hidden bg-bg py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 lg:px-12">
        <HudRule index="004" label={t.log.subtitle} className="mb-8" />
        <h2
          id="log-title"
          className="mb-8 font-eva text-4xl leading-none font-extrabold tracking-[-0.01em] text-bone sm:text-5xl md:text-6xl"
        >
          {t.log.title}
        </h2>
        <div aria-hidden="true" className="hex-divider mb-12" />

        <div className="relative">
          {/* Spine: sits under the node column */}
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[13px] w-px bg-gradient-to-b from-alert via-unit to-unit/20 md:left-[calc(8rem+13px)]"
          />
          <ol className="relative">
            {log.map((entry, i) => {
              const latest = i === 0;
              return (
                <li
                  key={`${entry.date}-${entry.title.en}`}
                  className="relative grid grid-cols-[28px_1fr] gap-x-4 pb-10 last:pb-0 md:grid-cols-[6.5rem_28px_1fr] md:gap-x-6"
                >
                  <time
                    dateTime={entry.date}
                    className="col-start-2 row-start-1 font-mono text-xs tracking-[0.25em] text-phosphor md:col-start-1 md:pt-1 md:text-right"
                  >
                    {entry.date}
                  </time>

                  {/* Hex node: outer ring, inner core */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "hex relative col-start-1 row-span-2 row-start-1 mt-0.5 grid size-7 place-items-center md:col-start-2",
                      latest ? "bg-alert" : "bg-unit",
                    )}
                  >
                    <span className="hex grid size-5 place-items-center bg-bg">
                      <span
                        className={cn("hex size-2.5", latest ? "bg-alert motion-safe:animate-pulse" : "bg-unit-soft")}
                      />
                    </span>
                  </span>

                  <div className="col-start-2 row-start-2 min-w-0 md:col-start-3 md:row-start-1">
                    <h3 className="mt-1 font-mono text-sm font-bold leading-snug text-bone md:mt-0 md:text-base">
                      {entry.title[lang]}
                    </h3>
                    <p className="mt-1.5 font-mono text-[13px] leading-relaxed text-bone/75">{entry.detail[lang]}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
