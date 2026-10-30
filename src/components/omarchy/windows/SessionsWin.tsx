import { useLang, type Dict, type Lang } from "@/i18n";
import { sessions, type Session } from "@/data/sessions";
import { cn } from "@/lib/utils";

const num = (n: number) => String(n).padStart(2, "0");

/** Compact project card used by the Sessions window and `open <n>` session windows. */
export function SessionDetail({ session, lang, t }: { session: Session; lang: Lang; t: Dict }) {
  return (
    <article className="min-w-0">
      <p className="om-accent font-mono text-[10px] tracking-[0.3em]">
        {t.sessions.session} #{num(session.n)}
        {session.stars !== undefined && <span className="ml-2 text-bone">★ {session.stars}</span>}
      </p>
      <h3 className="mt-1 font-sans text-2xl leading-tight font-bold tracking-[-0.03em] text-bone">{session.name}</h3>
      <p className="mt-2 text-bone/85">{session.pitch[lang]}</p>
      <ul className="mt-3 flex flex-wrap gap-1" aria-label={t.sessions.stack}>
        {session.stack.map((s) => (
          <li key={s} className="om-chip px-1.5 py-0.5 font-mono text-[10px] text-bone/85">
            {s}
          </li>
        ))}
      </ul>
      {session.status && (
        <p className="mt-3 border border-dashed border-bone/40 px-2 py-1.5 font-mono text-[10px] text-bone/85">
          {session.status[lang]}
        </p>
      )}
      <ul className="mt-3 flex flex-wrap gap-2">
        {session.links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="om-chip om-focus inline-flex min-h-8 items-center gap-1 px-2.5 font-mono text-[11px] font-bold tracking-widest hover:text-[var(--om-accent)]"
            >
              {l.label}
              <span aria-hidden="true">↗</span>
              <span className="sr-only">
                {" "}
                {session.name} {t.sessions.newTab}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function SessionsWin({ selected, onSelect }: { selected: number; onSelect(n: number): void }) {
  const { lang, t } = useLang();
  const current = sessions.find((s) => s.n === selected) ?? sessions[0];

  return (
    <div className="grid gap-4 @lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <ul className="font-mono text-[11px]">
        {sessions.map((s) => (
          <li key={s.n}>
            <button
              type="button"
              aria-current={s.n === current.n ? "true" : undefined}
              onClick={() => onSelect(s.n)}
              className={cn(
                "om-focus flex w-full items-baseline gap-2 px-2 py-1 text-left hover:bg-bone/5",
                s.n === current.n && "bg-[var(--om-accent)] text-bg hover:bg-[var(--om-accent)]",
              )}
            >
              <span className={s.n === current.n ? undefined : "om-muted"}>{num(s.n)}</span>
              <span className="truncate">{s.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <SessionDetail session={current} lang={lang} t={t} />
    </div>
  );
}
