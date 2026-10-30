import { useLang } from "@/i18n";
import { profile } from "@/data/profile";
import { cn } from "@/lib/utils";
import DitherRule from "@/components/ui/DitherRule";

const focusRing =
  "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone";

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
      <DitherRule className="h-2" />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8 md:py-20 lg:px-12">
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] text-bone">
          <span aria-hidden="true" className="size-1.5 bg-bone motion-safe:animate-pulse" />
          {t.footer.channel}
        </p>

        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {links.map((l) => (
            <li key={l.label} className="min-w-0">
              <a
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={cn(
                  "group flex min-w-0 flex-col gap-1.5 border border-bone/20 bg-panel px-4 py-3.5 transition-colors hover:border-bone hover:bg-bone",
                  focusRing,
                )}
              >
                <span className="font-sans text-xl leading-none font-semibold tracking-[-0.02em] text-bone group-hover:text-bg">
                  {l.label}
                  {l.external && <span aria-hidden="true"> ↗</span>}
                </span>
                <span className="truncate font-mono text-xs text-g-300 group-hover:text-bg">{l.value}</span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-16 font-sans text-[clamp(2.25rem,9vw,7rem)] leading-[0.92] font-bold tracking-[-0.045em] text-bone md:mt-24">
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
