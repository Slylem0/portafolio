import type { Lang } from "@/i18n";
import { dicts } from "@/i18n";
import type { Session } from "@/data/sessions";
import { cn } from "@/lib/utils";
import { HudCorners } from "@/components/ui/HudFrame";

interface WantedPosterProps {
  session: Session;
  lang: Lang;
  className?: string;
}

const focusRing =
  "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone";

/**
 * Monochrome spec sheet for one project: dot-grid panel, hairline frame, mono details.
 * Keeps the bounty-poster homage as a small "WANTED · SESSION #0n" label.
 */
export default function WantedPoster({ session, lang, className }: WantedPosterProps) {
  const t = dicts[lang].sessions;
  const num = String(session.n).padStart(2, "0");
  const nameId = `session-${session.slug}`;

  return (
    <article
      data-testid="wanted-poster"
      aria-labelledby={nameId}
      className={cn(
        "blueprint group/sheet relative flex min-w-0 flex-col border border-bone/20 p-5 transition-colors hover:border-bone/45",
        className,
      )}
    >
      <HudCorners className="size-3 border-bone/70 lg:size-3" />

      {/* Label row */}
      <header className="flex items-center gap-3 font-mono text-[10px] tracking-[0.28em] text-bone/70">
        <p className="shrink-0">
          <span className="bg-bone px-1.5 py-0.5 font-bold text-bg">{t.wanted}</span>
          <span aria-hidden="true"> · </span>
          <span className="text-bone">
            {t.session} #{num}
          </span>
        </p>
        <span aria-hidden="true" className="h-px flex-1 bg-bone/20" />
        <span aria-hidden="true" className="shrink-0">
          REV.{num}
        </span>
      </header>

      {/* Plate: dot grid, giant session number, spec captions */}
      <div
        aria-hidden="true"
        className="halftone relative mt-4 flex flex-col overflow-hidden border border-bone/20 bg-bg/70 px-2.5 py-2 font-mono text-[9px] tracking-widest text-bone/65"
      >
        <span className="self-start truncate bg-bg px-1">{session.slug.toUpperCase()}</span>
        <span className="py-1 text-center font-mono text-7xl leading-none font-bold tracking-[-0.06em] text-bone">
          #{num}
        </span>
        <span className="self-end truncate bg-bg px-1">{t.alive}</span>
      </div>

      {/* Name + pitch */}
      <h3 id={nameId} className="mt-5 font-sans text-2xl leading-tight font-semibold tracking-[-0.03em] text-bone">
        {session.name}
      </h3>
      <p className="mt-2 font-sans text-sm leading-relaxed text-g-300">{session.pitch[lang]}</p>

      {/* Stack chips */}
      <div className="mt-4">
        <ul className="flex flex-wrap gap-1.5" aria-label={t.stack}>
          {session.stack.map((s) => (
            <li key={s} className="border border-bone/25 px-1.5 py-0.5 font-mono text-[11px] leading-tight text-g-100">
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Status: dashed = still in progress */}
      {session.status && (
        <p
          data-testid="session-status"
          className="mt-4 border border-dashed border-bone/40 px-3 py-2 font-mono text-[11px] leading-snug tracking-wide text-g-100"
        >
          {session.status[lang]}
        </p>
      )}

      {/* Bottom: bounty (real stars only) + links, pinned to the sheet's foot */}
      <div aria-hidden="true" className="min-h-5 flex-1" />
      <footer className="flex flex-wrap items-end justify-between gap-3 border-t border-bone/15 pt-4">
        {session.stars !== undefined && (
          <p className="font-mono text-[11px] tracking-[0.2em] text-bone/70">
            {t.bounty}:{" "}
            <span className="text-base font-bold tracking-normal text-bone">
              <span aria-hidden="true">★ </span>
              {session.stars}
            </span>{" "}
            {t.stars}
          </p>
        )}
        <ul className="ml-auto flex flex-wrap gap-2">
          {session.links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex min-h-9 items-center gap-1 border border-bone/60 px-3 py-1.5 font-mono text-xs font-bold tracking-[0.2em] text-bone transition-colors hover:border-bone hover:bg-bone hover:text-bg",
                  focusRing,
                )}
              >
                {l.label}
                <span aria-hidden="true">↗</span>
                <span className="sr-only">
                  {" "}
                  {session.name} {t.newTab}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </article>
  );
}
