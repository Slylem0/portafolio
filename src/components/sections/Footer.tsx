import { useLang } from "@/i18n";
import { profile } from "@/data/profile";
import { cn } from "@/lib/utils";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-phosphor focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export default function Footer() {
  const { t } = useLang();
  const links = [
    {
      label: t.footer.github,
      href: profile.github,
      value: profile.github.replace(/^https:\/\//, ""),
      external: true,
    },
    {
      label: t.footer.linkedin,
      href: profile.linkedin,
      value: "in/pablo-nicolas-marin",
      external: true,
    },
    {
      label: t.footer.email,
      href: `mailto:${profile.email}`,
      value: profile.email,
      external: false,
    },
  ];

  return (
    <footer id="footer" className="relative overflow-hidden border-t border-bone/20 bg-bg">
      <div aria-hidden="true" className="warning-stripes h-2 opacity-80" />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8 md:py-20 lg:px-12">
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] text-phosphor">
          <span aria-hidden="true" className="size-1.5 bg-phosphor motion-safe:animate-pulse" />
          {t.footer.channel}
        </p>

        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {links.map((l) => (
            <li key={l.label} className="min-w-0">
              <a
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={cn(
                  "group flex min-w-0 flex-col gap-1 border border-bone/20 bg-[#0b0b10] px-4 py-3 transition-colors hover:border-amber",
                  focusRing,
                )}
              >
                <span className="font-bebop text-2xl leading-none tracking-wider text-amber">
                  {l.label}
                  {l.external && <span aria-hidden="true"> ↗</span>}
                </span>
                <span className="truncate font-mono text-xs text-bone/70 group-hover:text-bone">{l.value}</span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-16 font-bebop text-[clamp(2.5rem,11vw,7.5rem)] leading-[0.9] tracking-[0.04em] text-bone md:mt-24">
          {t.footer.farewell}
        </p>

        <div
          aria-hidden="true"
          className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-bone/15 pt-4 font-mono text-[10px] tracking-widest text-bone/55"
        >
          <span>{profile.name}</span>
          <span>{t.hero.coords}</span>
          <span>{t.footer.end}</span>
        </div>
      </div>
    </footer>
  );
}
