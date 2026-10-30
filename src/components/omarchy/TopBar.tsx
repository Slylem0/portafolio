import { useEffect, useState } from "react";
import { useLang } from "@/i18n";
import { cn } from "@/lib/utils";

export type WsNum = 1 | 2 | 3 | 4 | 5;
export const WORKSPACES: WsNum[] = [1, 2, 3, 4, 5];

function useClock(lang: string) {
  const fmt = () => new Date().toLocaleTimeString(lang === "es" ? "es-CO" : "en-US", { hour: "2-digit", minute: "2-digit" });
  const [now, setNow] = useState(fmt);
  useEffect(() => {
    setNow(fmt());
    const id = window.setInterval(() => setNow(fmt()), 15000);
    return () => clearInterval(id);
  }, [lang]);
  return now;
}

interface TopBarProps {
  active: WsNum;
  names: Record<WsNum, string>;
  focusedTitle: string;
  onWorkspace(n: WsNum): void;
  onDisplaySwitch(): void;
  onExit(): void;
}

/** Waybar-style top bar: workspaces, focused window title, now playing, LANG, clock, exit. */
export default function TopBar({ active, names, focusedTitle, onWorkspace, onDisplaySwitch, onExit }: TopBarProps) {
  const { lang, t, setLang } = useLang();
  const tb = t.omarchy.topBar;
  const clock = useClock(lang);

  return (
    <header
      data-testid="omarchy-topbar"
      className="om-bar relative z-10 flex h-9 shrink-0 items-center gap-2 border-b px-2 font-mono text-[11px] sm:gap-3 sm:px-3"
    >
      <nav aria-label={tb.workspaces} className="flex shrink-0 items-center gap-1">
        {WORKSPACES.map((n) => (
          <button
            key={n}
            type="button"
            data-workspace={n}
            aria-current={n === active ? "true" : undefined}
            aria-label={tb.workspace.replace("{n}", String(n)).replace("{name}", names[n])}
            title={names[n]}
            onClick={() => onWorkspace(n)}
            className="om-chip om-focus grid h-6 min-w-6 place-items-center px-1 tabular-nums transition-colors"
          >
            {n}
          </button>
        ))}
      </nav>
      <p className="om-accent hidden shrink-0 tracking-widest uppercase sm:block">{names[active]}</p>
      <p className="hidden min-w-0 flex-1 truncate text-center text-bone/70 md:block">{focusedTitle}</p>
      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
        <p aria-hidden="true" className="om-muted hidden lg:block">
          {tb.nowPlaying}
        </p>
        <button
          type="button"
          aria-label={t.omarchy.dock.displaySwitch}
          onClick={onDisplaySwitch}
          className="om-chip om-focus grid size-6 place-items-center md:hidden"
        >
          <span aria-hidden="true">◐</span>
        </button>
        <button
          type="button"
          aria-label={tb.langLabel}
          onClick={() => setLang(lang === "en" ? "es" : "en")}
          className="om-chip om-focus h-6 px-1.5 tracking-widest"
        >
          {tb.lang} {lang.toUpperCase()}
        </button>
        <time className="tabular-nums text-bone">{clock}</time>
        <button
          type="button"
          onClick={onExit}
          className={cn("om-focus h-6 border border-bone/60 px-1.5 font-bold tracking-widest text-bone hover:bg-bone hover:text-bg")}
        >
          <span aria-hidden="true">✕ </span>
          {tb.exit.replace(/^✕\s*/, "")}
        </button>
      </div>
    </header>
  );
}
