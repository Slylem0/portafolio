import { useRef, useState } from "react";
import { useLang } from "@/i18n";
import { sessions } from "@/data/sessions";
import WantedPoster from "@/components/ui/WantedPoster";
import { HudRule } from "@/components/ui/HudFrame";
import DitherRule from "@/components/ui/DitherRule";
import TiltCard from "@/components/fx/TiltCard";
import { gsap } from "@/lib/motion/gsap";
import { scrollToY } from "@/lib/motion/lenis";
import { DESKTOP_QUERY } from "@/lib/motion/env";
import { useScrollFx } from "@/lib/motion/useScrollFx";
import { cn } from "@/lib/utils";

const total = String(sessions.length).padStart(2, "0");

export default function Sessions() {
  const { lang, t } = useLang();
  const section = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(1);

  useScrollFx(
    section,
    ({ el, mm }) => {
      const title = el.querySelector<HTMLElement>("[data-fx=title]");
      const stage = el.querySelector<HTMLElement>("[data-fx=stage]");
      const track = el.querySelector<HTMLElement>("[data-testid=sessions-track]");
      if (!title || !stage || !track) return;

      // Title drifts sideways as the section passes (all widths).
      gsap.fromTo(
        title,
        { xPercent: 6 },
        { xPercent: -10, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
      );

      // Desktop: pin the stage and slide the posters horizontally with the scroll.
      mm.add(DESKTOP_QUERY, () => {
        // Switch the markup to its one-row track layout only while this effect runs.
        el.dataset.hscroll = "";
        const distance = () => Math.max(0, track.scrollWidth - stage.clientWidth);
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            start: "center center",
            end: () => "+=" + distance(),
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => setCurrent(Math.round(self.progress * (sessions.length - 1)) + 1),
          },
        });
        const st = tween.scrollTrigger!;

        // Keyboard: focusing a poster off to the side scrolls the page to where it is in view.
        const onFocus = (e: FocusEvent) => {
          const li = (e.target as HTMLElement).closest<HTMLElement>("[data-testid=sessions-track] > li");
          if (!li || distance() === 0) return;
          const want = li.offsetLeft + li.offsetWidth / 2 - stage.clientWidth / 2;
          const p = Math.min(1, Math.max(0, want / distance()));
          scrollToY(st.start + p * (st.end - st.start));
        };
        track.addEventListener("focusin", onFocus);
        return () => {
          track.removeEventListener("focusin", onFocus);
          delete el.dataset.hscroll;
        };
      });

      // Narrow screens: each poster rises in once.
      mm.add(`not all and ${DESKTOP_QUERY}`, () => {
        for (const li of track.querySelectorAll<HTMLElement>(":scope > li")) {
          gsap.from(li, { y: 40, opacity: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: li, start: "top 90%" } });
        }
      });
    },
    [lang],
  );

  return (
    <section ref={section} id="sessions" aria-labelledby="sessions-title" className="group/sessions relative overflow-hidden bg-bg">
      {/* Title panel: raised black slab on a faint dot field */}
      <div className="relative border-y border-bone/15 bg-panel">
        <div aria-hidden="true" className="dither absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-8 md:py-16 lg:px-12">
          <HudRule index="003" label={t.sessions.session} className="mb-6" />
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <h2
              id="sessions-title"
              data-fx="title"
              className="font-sans text-6xl leading-[0.85] font-bold tracking-[-0.05em] text-bone will-change-transform sm:text-8xl md:text-9xl"
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

      <div data-fx="stage" className="relative py-14 md:py-20 group-data-[hscroll]/sessions:flex group-data-[hscroll]/sessions:min-h-screen group-data-[hscroll]/sessions:flex-col group-data-[hscroll]/sessions:justify-center group-data-[hscroll]/sessions:py-10">
        {/* Desktop HUD: counter and hint above the track */}
        <div
          aria-hidden="true"
          className="mx-auto mb-6 hidden w-full max-w-7xl items-center justify-between px-12 font-mono text-xs tracking-[0.3em] text-g-300 group-data-[hscroll]/sessions:flex"
        >
          <span data-testid="sessions-counter" className="text-bone">
            #{String(current).padStart(2, "0")} / {total}
          </span>
          <span className="flex items-center gap-3">
            <span className="h-px w-24 bg-bone/30">
              <span
                className="block h-px bg-bone transition-[width] duration-300"
                style={{ width: `${(current / sessions.length) * 100}%` }}
              />
            </span>
            {t.sessions.drag}
          </span>
        </div>

        <ul
          role="list"
          data-testid="sessions-track"
          className={cn(
            "mx-auto grid max-w-7xl gap-8 px-4 sm:px-8 md:grid-cols-2 md:gap-10 lg:px-12 xl:grid-cols-3",
            // Desktop with motion: one long row that the scroll slides sideways.
            "group-data-[hscroll]/sessions:mx-0 group-data-[hscroll]/sessions:flex group-data-[hscroll]/sessions:w-max group-data-[hscroll]/sessions:max-w-none group-data-[hscroll]/sessions:gap-10 group-data-[hscroll]/sessions:px-[max(3rem,calc((100vw-80rem)/2+3rem))] group-data-[hscroll]/sessions:will-change-transform",
          )}
        >
          {sessions.map((s, i) => (
            <li
              key={s.slug}
              className={cn(
                "flex min-w-0 group-data-[hscroll]/sessions:w-[24rem] group-data-[hscroll]/sessions:shrink-0",
                // Centre a lone last poster instead of leaving it hanging on the left.
                i === sessions.length - 1 &&
                  sessions.length % 2 === 1 &&
                  "md:col-span-2 md:mx-auto md:w-[calc(50%-1.25rem)] xl:col-span-1 xl:w-auto group-data-[hscroll]/sessions:mx-0 group-data-[hscroll]/sessions:w-[24rem]",
                i === sessions.length - 1 && sessions.length % 3 === 1 && "xl:col-start-2",
              )}
            >
              <TiltCard className="w-full">
                <WantedPoster session={s} lang={lang} className="h-full w-full bg-bg" />
              </TiltCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
