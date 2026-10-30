import { useEffect, useState, type ComponentType } from "react";
import { dicts, type Lang } from "@/i18n";

type SpiralProps = { className?: string };

/** Dispatched on `window` by the inline intro script in index.astro once the overlay is gone. */
export const INTRO_CLOSED = "intro:closed";

const LANGS: Lang[] = ["en", "es"];

/** Both languages are server-rendered; the inline script shows the stored one before first paint. */
function Copy({ pick }: { pick: (d: (typeof dicts)["en"]["intro"]) => string }) {
  return (
    <>
      {LANGS.map((l) => (
        <span key={l} data-intro-copy={l}>
          {pick(dicts[l].intro)}
        </span>
      ))}
    </>
  );
}

/**
 * Full-screen ENTER intro, rendered on the server so there is no flash of the portfolio.
 * Showing, skipping and dismissing are owned by the inline script in index.astro, so ENTER
 * works before (or without) hydration. This island only adds the lazily loaded spiral
 * canvas behind the button while the intro is open, and drops it once it closes.
 */
export default function IntroGate() {
  const [Spiral, setSpiral] = useState<ComponentType<SpiralProps> | null>(null);

  useEffect(() => {
    if (!document.documentElement.classList.contains("intro-open")) return;
    let live = true;
    const onClosed = () => {
      live = false;
      setSpiral(null);
    };
    window.addEventListener(INTRO_CLOSED, onClosed);
    import("@/components/ui/spiral-animation").then(
      (m) => {
        if (live) setSpiral(() => m.SpiralAnimation);
      },
      () => {
        /* No spiral: the black overlay and ENTER still work. */
      },
    );
    return () => {
      live = false;
      window.removeEventListener(INTRO_CLOSED, onClosed);
    };
  }, []);

  return (
    <div
      id="intro"
      role="dialog"
      aria-modal="true"
      aria-label={dicts.en.intro.label}
      className="fixed inset-0 z-[49] cursor-pointer overflow-hidden bg-black text-white"
    >
      {Spiral && <Spiral className="intro-canvas absolute inset-0 h-full w-full" />}
      <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
        {/* GET to #home: without JavaScript this reloads with #home targeted, and CSS hides the overlay. */}
        <form method="get" action="#home" className="intro-rise flex flex-col items-center gap-4">
          <button
            id="intro-enter"
            type="submit"
            className="intro-enter cursor-pointer px-6 py-3 font-sans text-2xl font-extralight tracking-[0.2em] text-white uppercase transition-[letter-spacing] duration-700 outline-none hover:tracking-[0.3em] focus-visible:tracking-[0.3em] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white/70"
          >
            <Copy pick={(c) => c.enter} />
          </button>
          <p className="max-w-[22rem] font-mono text-[0.6875rem] leading-relaxed tracking-[0.25em] text-white/70 uppercase sm:max-w-none">
            <Copy pick={(c) => c.tagline} />
          </p>
        </form>
        <p className="absolute inset-x-0 bottom-6 font-mono text-[0.6875rem] tracking-[0.3em] text-white/60">
          <Copy pick={(c) => c.hint} />
        </p>
      </div>
    </div>
  );
}
