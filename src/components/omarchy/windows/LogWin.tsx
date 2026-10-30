import { useLang } from "@/i18n";
import { log } from "@/data/log";
import { monoGlyphs } from "@/lib/utils";

export default function LogWin() {
  const { lang, t } = useLang();
  return (
    <div>
      <p className="om-muted mb-3 font-mono text-[10px] tracking-[0.3em]">{t.log.subtitle}</p>
      <ol className="border-l border-[var(--om-inactive)]">
        {log.map((e, i) => (
          <li key={i} className="relative mb-3 pl-4">
            <span aria-hidden="true" className="hex absolute top-1 -left-[5px] size-2.5 bg-[var(--om-accent)]" />
            <p className="om-accent font-mono text-[10px] tracking-widest">{e.date}</p>
            <p className="font-bold text-bone">{e.title[lang]}</p>
            <p className="text-bone/75">{monoGlyphs(e.detail[lang])}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
