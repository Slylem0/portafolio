import { useLang } from "@/i18n";
import { cn } from "@/lib/utils";

export type Theme = "mono" | "inverse" | "terminal";
export const THEMES: Theme[] = ["mono", "inverse", "terminal"];

/** Greys for the mini previews (accent, secondary, background). */
const PREVIEW: Record<Theme, [string, string, string]> = {
  mono: ["#f5f5f5", "#737373", "#0a0a0a"],
  inverse: ["#0a0a0a", "#a3a3a3", "#f5f5f5"],
  terminal: ["#ffffff", "#525252", "#000000"],
};

/** Win+P-style picker (homage to the Omarchy Display Switch plugin): one tile per theme. */
export default function DisplaySwitchWin({ theme, onTheme }: { theme: Theme; onTheme(t: Theme): void }) {
  const { t } = useLang();
  const ds = t.omarchy.displaySwitch;
  return (
    <div className="flex min-h-full flex-col justify-center gap-3">
      <p className="text-bone/70">{ds.hint}</p>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={ds.title}>
        {THEMES.map((th) => {
          const [a, b, bg] = PREVIEW[th];
          const on = th === theme;
          return (
            <button
              key={th}
              type="button"
              aria-pressed={on}
              onClick={() => onTheme(th)}
              className={cn(
                "om-focus flex min-w-0 flex-col items-center gap-2 border p-2 text-center transition-colors",
                on ? "border-[var(--om-accent)] bg-bone/10" : "border-[var(--om-inactive)] hover:bg-bone/5",
              )}
            >
              {/* Mini monitor with a tiled layout in the theme colours */}
              <span aria-hidden="true" className="flex w-full max-w-24 flex-col items-center">
                <span className="grid aspect-video w-full grid-cols-2 gap-[3px] p-[3px]" style={{ background: bg, outline: `1px solid ${b}` }}>
                  <span style={{ outline: `2px solid ${a}`, outlineOffset: -2 }} />
                  <span className="grid gap-[3px]">
                    <span style={{ outline: `1px solid ${b}`, outlineOffset: -1 }} />
                    <span style={{ outline: `1px solid ${b}`, outlineOffset: -1 }} />
                  </span>
                </span>
                <span className="h-1.5 w-2" style={{ background: b }} />
                <span className="h-px w-8" style={{ background: b }} />
              </span>
              <span className="font-sans text-sm leading-none font-semibold tracking-[-0.01em]">{ds[th]}</span>
              <span className="hidden text-[10px] leading-tight text-bone/60 @md:block">{ds.desc[th]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
