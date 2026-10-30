import { useState, type ReactNode } from "react";
import type { Rect } from "./tiling";
import { cn } from "@/lib/utils";

interface WindowProps {
  id: string;
  kind: string;
  title: string;
  /** Short tag shown in the title bar, e.g. the app name. */
  tag: string;
  rect: Rect;
  focused: boolean;
  hidden: boolean;
  /** Plays the open animation once (windows spawned by the user). */
  fresh: boolean;
  closeLabel: string;
  onFocus(): void;
  onClose(): void;
  children: ReactNode;
}

/** A tiled window: absolutely positioned at its dwindle rect, animated by CSS transitions. */
export default function Window(p: WindowProps) {
  const [fresh, setFresh] = useState(p.fresh);
  const { x, y, w, h } = p.rect;

  return (
    <section
      role="group"
      aria-label={p.title}
      data-testid="omarchy-window"
      data-kind={p.kind}
      data-win-id={p.id}
      data-focused={p.focused}
      tabIndex={-1}
      hidden={p.hidden}
      onPointerDown={p.onFocus}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setFresh(false);
      }}
      className={cn("om-win", fresh && "om-win-new")}
      style={{ transform: `translate(${Math.round(x)}px, ${Math.round(y)}px)`, width: Math.round(w), height: Math.round(h) }}
    >
      <div className="om-win-inner">
        <header className="flex h-7 shrink-0 items-center gap-2 border-b border-[var(--om-inactive)] px-2.5 font-mono text-[10px] tracking-[0.2em] uppercase">
          <span aria-hidden="true" className={cn("size-1.5 shrink-0", p.focused ? "bg-[var(--om-accent)]" : "bg-bone/30")} />
          <span className={cn("min-w-0 truncate", p.focused ? "text-bone" : "text-bone/70")}>{p.title}</span>
          <span aria-hidden="true" className="om-muted ml-auto hidden shrink-0 text-[9px] sm:inline">
            {p.tag}
          </span>
          <button
            type="button"
            aria-label={p.closeLabel}
            onClick={p.onClose}
            className="om-focus -mr-1 ml-auto grid size-6 shrink-0 place-items-center text-bone/60 hover:text-[var(--om-accent)] sm:ml-1"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>
        <div className="@container min-h-0 flex-1 overflow-auto overscroll-contain p-3 text-xs leading-relaxed">
          {p.children}
        </div>
      </div>
    </section>
  );
}
