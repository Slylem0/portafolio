import { useLang } from "@/i18n";
import { log, nextMissions } from "@/data/log";
import { HudRule } from "@/components/ui/HudFrame";
import { cn, monoGlyphs } from "@/lib/utils";
import { useRef } from "react";
import BorderBeam from "@/components/fx/BorderBeam";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { useScrollFx } from "@/lib/motion/useScrollFx";

/** Vertical timeline with hexagon nodes, newest first. */
export default function MissionLog() {
  const { lang, t } = useLang();
  const timeline = useRef<HTMLDivElement>(null);

  // The spine draws itself as the visitor scrolls; each node lights up when the line reaches it.
  useScrollFx(timeline, ({ el }) => {
    const line = el.querySelector<HTMLElement>("[data-testid=log-line]");
    if (!line) return;
    gsap.fromTo(
      line,
      { scaleY: 0 },
      { scaleY: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 70%", end: "bottom 60%", scrub: true } },
    );
    for (const node of el.querySelectorAll<HTMLElement>(".log-node")) {
      ScrollTrigger.create({
        trigger: node,
        start: "top 60%",
        onToggle: (self) => node.classList.toggle("is-lit", self.isActive || self.progress === 1),
        end: "max",
      });
    }
  });

  return (
    <section id="log" aria-labelledby="log-title" className="relative overflow-hidden py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 lg:px-12">
        <HudRule index="004" label={t.log.subtitle} className="mb-8" />
        <h2
          id="log-title"
          className="mb-8 font-sans text-4xl leading-none font-bold tracking-[-0.04em] text-bone sm:text-5xl md:text-6xl"
        >
          {t.log.title}
        </h2>
        <div aria-hidden="true" className="hex-divider mb-12" />

        {/* Goals ahead of the timeline: dashed, never styled as achievements */}
        <div className="mb-12 border border-dashed border-bone/35 p-4 sm:p-6">
          <h3 className="mb-4 font-mono text-xs tracking-[0.3em] text-bone">{t.log.next}</h3>
          <ul aria-label={t.log.next} className="grid gap-3 sm:grid-cols-2">
            {nextMissions.map((m, i) => (
              <li
                key={m.title.en}
                className="relative flex min-w-0 items-start gap-3 border border-bone/15 bg-panel px-3 py-3"
              >
                <BorderBeam durationS={6} delayS={i * 3} />
                <span aria-hidden="true" className="hex mt-0.5 grid size-5 shrink-0 place-items-center bg-g-500">
                  <span className="hex size-3.5 bg-bg" />
                </span>
                <div className="min-w-0">
                  <p className="font-sans text-sm leading-snug font-semibold text-bone">{m.title[lang]}</p>
                  <p className="mt-1 font-mono text-[11px] tracking-[0.2em] text-g-300">
                    {t.log.queued} · {m.status[lang]}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div ref={timeline} className="relative">
          {/* Spine: a faint rail, and the bright line that draws over it with the scroll */}
          <span aria-hidden="true" className="absolute top-2 bottom-2 left-[13px] w-px bg-bone/12 md:left-[calc(8rem+13px)]" />
          <span
            aria-hidden="true"
            data-testid="log-line"
            className="absolute top-2 bottom-2 left-[13px] w-px origin-top bg-gradient-to-b from-bone via-bone/70 to-bone/30 md:left-[calc(8rem+13px)]"
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
                    className="col-start-2 row-start-1 font-mono text-xs tracking-[0.25em] text-g-300 md:col-start-1 md:pt-1 md:text-right"
                  >
                    {entry.date}
                  </time>

                  {/* Hex node: outer ring, inner core */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "log-node hex relative col-start-1 row-span-2 row-start-1 mt-0.5 grid size-7 place-items-center md:col-start-2",
                      latest ? "bg-bone" : "bg-g-500",
                    )}
                  >
                    {/* Latest: solid white hex with a black core. Older: grey ring, grey core. */}
                    <span className={cn("hex grid size-5 place-items-center", latest ? "bg-bone" : "bg-bg")}>
                      <span className={cn("hex size-2.5", latest ? "bg-bg motion-safe:animate-pulse" : "bg-g-500")} />
                    </span>
                  </span>

                  <div className="col-start-2 row-start-2 min-w-0 md:col-start-3 md:row-start-1">
                    <h3 className="mt-1 font-sans text-base leading-snug font-semibold tracking-[-0.01em] text-bone md:mt-0 md:text-lg">
                      {entry.title[lang]}
                    </h3>
                    <p className="mt-1.5 font-sans text-sm leading-relaxed text-g-300">{monoGlyphs(entry.detail[lang])}</p>
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
