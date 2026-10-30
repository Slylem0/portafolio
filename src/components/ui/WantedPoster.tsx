import type { Lang } from "@/i18n";
import { dicts } from "@/i18n";
import type { Session } from "@/data/sessions";
import { cn } from "@/lib/utils";

interface WantedPosterProps {
  session: Session;
  lang: Lang;
  className?: string;
}

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-jazz focus-visible:ring-offset-2 focus-visible:ring-offset-bone";

/**
 * Bounty-poster card for one project: aged paper, Bebas Neue type, no artwork.
 * Homage only: the "photo" plate is a halftone panel holding the session number.
 */
export default function WantedPoster({ session, lang, className }: WantedPosterProps) {
  const t = dicts[lang].sessions;
  const num = String(session.n).padStart(2, "0");
  const nameId = `session-${session.slug}`;

  return (
    <article
      data-testid="wanted-poster"
      aria-labelledby={nameId}
      className={cn("paper relative flex min-w-0 flex-col p-4 sm:p-5", className)}
    >
      {/* Pin holes */}
      <span
        aria-hidden="true"
        className="absolute top-1.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[var(--ink)]/70"
      />

      {/* WANTED header */}
      <header className="border-b-2 border-[var(--ink)] pt-2 pb-2 text-center">
        <p className="font-bebop text-6xl leading-[0.85] tracking-[0.06em] sm:text-7xl">{t.wanted}</p>
        <div className="mt-2 flex items-center gap-2">
          <span aria-hidden="true" className="h-px flex-1 bg-[var(--ink)]/60" />
          <p className="font-bebop text-xl tracking-[0.2em] text-jazz">
            {t.session} #{num}
          </p>
          <span aria-hidden="true" className="h-px flex-1 bg-[var(--ink)]/60" />
        </div>
      </header>

      {/* "Photo" plate: halftone + giant number, no character art */}
      <div
        aria-hidden="true"
        className="halftone mt-4 flex flex-col overflow-hidden border-2 border-[var(--ink)] bg-bone/60 px-2 py-1 font-mono text-[9px] tracking-widest text-[var(--ink)]"
      >
        <span className="truncate">{session.slug.toUpperCase()}</span>
        <span className="py-1 text-center font-bebop text-7xl leading-none tracking-normal text-jazz/85">#{num}</span>
        <span className="truncate text-right">{t.alive}</span>
      </div>

      {/* Name + pitch */}
      <h3 id={nameId} className="mt-4 font-bebop text-3xl leading-none tracking-wide sm:text-[2rem]">
        {session.name}
      </h3>
      <p className="mt-2 font-mono text-[13px] leading-relaxed text-[#2e2a22]">{session.pitch[lang]}</p>

      {/* Stack chips */}
      <div className="mt-4">
        <ul className="flex flex-wrap gap-1.5" aria-label={t.stack}>
          {session.stack.map((s) => (
            <li
              key={s}
              className="border border-[var(--ink)]/70 bg-bone/70 px-1.5 py-0.5 font-mono text-[11px] leading-tight"
            >
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Status (jazz panel, amber type) */}
      {session.status && (
        <p
          data-testid="session-status"
          className="mt-4 border-l-4 border-amber bg-jazz px-3 py-2 font-mono text-[11px] leading-snug tracking-wide text-amber"
        >
          {session.status[lang]}
        </p>
      )}

      {/* Bottom: bounty (real stars only) + links */}
      <footer className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
        {session.stars !== undefined && (
          <p className="font-bebop text-2xl leading-none tracking-wider">
            {t.bounty}: <span className="text-jazz">★ {session.stars}</span>{" "}
            <span className="font-mono text-[11px] tracking-normal">{t.stars}</span>
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
                  "inline-flex min-h-9 items-center gap-1 bg-[var(--ink)] px-3 py-1.5 font-mono text-xs font-bold tracking-[0.2em] text-amber transition-colors hover:bg-jazz",
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
