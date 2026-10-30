import { useLang } from "@/i18n";

/** Placeholder for workspace 4; Task 12 replaces it with the real TRIAD console. */
export default function TriadWin() {
  const { t } = useLang();
  const cores = [t.triad.cores.engineer, t.triad.cores.cowboy, t.triad.cores.student];
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 py-4 text-center">
      <p className="om-accent font-eva text-xl font-extrabold sm:text-2xl">{t.omarchy.triadWin.title}</p>
      <ul className="flex flex-wrap justify-center gap-3">
        {cores.map((c, i) => (
          <li key={c} className="flex flex-col items-center gap-2">
            <span
              aria-hidden="true"
              className="hex grid size-14 place-items-center bg-[var(--om-accent)]/80 font-mono text-[10px] text-bg motion-safe:animate-pulse"
              style={{ animationDelay: `${i * 300}ms` }}
            >
              0{i + 1}
            </span>
            <span className="font-mono text-[10px] tracking-widest text-bone/80">{c}</span>
          </li>
        ))}
      </ul>
      <p className="max-w-sm text-bone/70">{t.omarchy.triadWin.body}</p>
    </div>
  );
}
