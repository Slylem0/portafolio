import { useLang } from "@/i18n";
import { WORKSPACES, type WsNum } from "./TopBar";

interface DockProps {
  /** Focus is in a text field: show how to get out of it instead of the plain-key legend. */
  typing: boolean;
  active: WsNum;
  names: Record<WsNum, string>;
  onWorkspace(n: WsNum): void;
  onTerminal(): void;
  onDisplaySwitch(): void;
  onClose(): void;
  onExit(): void;
}

const item =
  "om-focus flex items-center gap-2 px-2.5 py-1.5 text-bone/85 transition-colors hover:bg-bone/10 hover:text-[var(--om-accent)]";

/** Bottom dock: shortcut buttons with key hints (desktop) or workspace tabs (mobile). */
export default function Dock({ typing, active, names, onWorkspace, onTerminal, onDisplaySwitch, onClose, onExit }: DockProps) {
  const { t } = useLang();
  const d = t.omarchy.dock;
  const kbd = (k: string) => (
    <kbd aria-hidden="true" className="om-chip px-1 font-mono text-[9px] text-bone/70">
      {k}
    </kbd>
  );

  return (
    <nav
      data-testid="omarchy-dock"
      aria-label={d.label}
      className="om-bar relative z-10 shrink-0 border-t font-mono text-[11px]"
    >
      {/* Desktop: actions + key legend */}
      <div className="hidden h-10 items-center justify-center gap-1 px-3 md:flex">
        <button type="button" onClick={onTerminal} className={item}>
          <span aria-hidden="true" className="om-accent">›_</span> {d.terminal} {kbd("T")}
        </button>
        <button type="button" onClick={onDisplaySwitch} className={item}>
          <span aria-hidden="true" className="om-accent">◐</span> {d.displaySwitch} {kbd("P")}
        </button>
        <button type="button" onClick={onClose} className={item}>
          <span aria-hidden="true" className="om-accent">▢</span> {d.close} {kbd("Q")}
        </button>
        <button type="button" onClick={onExit} className={item}>
          <span aria-hidden="true" className="om-accent">⏻</span> {d.exit} {kbd("ESC")}
        </button>
        <p aria-live="polite" className="om-muted ml-4 hidden tracking-widest lg:block">
          {typing ? d.keysHint : d.keys}
        </p>
      </div>

      {/* Mobile: workspace tabs + terminal */}
      <div className="grid grid-cols-6 md:hidden">
        {WORKSPACES.map((n) => (
          <button
            key={n}
            type="button"
            aria-current={n === active ? "true" : undefined}
            onClick={() => onWorkspace(n)}
            className="om-focus flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 aria-[current=true]:bg-[var(--om-accent)] aria-[current=true]:text-bg"
          >
            <span className="tabular-nums">{n}</span>
            <span className="w-full truncate text-center text-[9px] tracking-wide">{names[n]}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={onTerminal}
          className="om-focus flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 border-l border-[var(--om-inactive)] px-0.5"
        >
          <span aria-hidden="true" className="om-accent">›_</span>
          <span className="w-full truncate text-center text-[9px] tracking-wide">{d.terminal}</span>
        </button>
      </div>
      <p className="om-muted pb-1 text-center text-[9px] tracking-widest md:hidden">{d.swipe}</p>
    </nav>
  );
}
