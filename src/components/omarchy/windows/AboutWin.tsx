import { useLang } from "@/i18n";
import { profile } from "@/data/profile";

export default function AboutWin() {
  const { lang, t } = useLang();
  const rows: [string, string][] = [
    [t.about.name, profile.name],
    [t.about.base, profile.base],
    [t.about.status, profile.status[lang]],
    [t.about.dailyDriver, profile.dailyDriver],
    [t.about.sync, t.about.syncValue],
  ];
  const links = [
    { label: t.footer.github, href: profile.github },
    { label: t.footer.linkedin, href: profile.linkedin },
    { label: t.footer.email, href: `mailto:${profile.email}` },
  ];

  return (
    <div className="grid gap-4 @xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div>
        <p className="om-accent font-mono text-[10px] tracking-[0.3em]">{t.about.dossier}</p>
        <p className="mt-1 font-sans text-xl leading-tight font-bold tracking-[-0.03em] text-bone">{profile.name}</p>
        <p className="om-muted font-mono text-[11px]">{profile.role[lang]}</p>
        <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 font-mono text-[11px]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-bone/55 uppercase">{k}</dt>
              <dd className="break-words text-bone">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="om-muted mt-3 font-mono text-[10px] tracking-widest">{profile.coords}</p>
      </div>
      <div className="min-w-0">
        <h3 className="sr-only">{t.about.title}</h3>
        {t.about.story.map((p, i) => (
          <p key={i} className="mb-2 text-bone/85">
            {p}
          </p>
        ))}
        <ul className="mt-3 flex flex-wrap gap-2">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="om-chip om-focus inline-flex min-h-8 items-center px-2.5 font-mono text-[11px] tracking-widest hover:text-[var(--om-accent)]"
              >
                {l.label} <span aria-hidden="true">&nbsp;↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
