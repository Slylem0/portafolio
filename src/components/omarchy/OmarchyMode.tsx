import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useLang } from "@/i18n";
import Boot from "./Boot";
import Desktop from "./Desktop";
import { THEMES, type Theme } from "./windows/DisplaySwitchWin";
import "./omarchy.css";

const THEME_KEY = "omarchy-theme";

function loadTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return THEMES.includes(v as Theme) ? (v as Theme) : "mono";
  } catch {
    return "mono";
  }
}
function saveTheme(v: Theme) {
  try {
    localStorage.setItem(THEME_KEY, v);
  } catch {
    /* ignore */
  }
}

function prefersReduced(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Visible Omarchy hint to return focus to on exit (navbar keeps one per breakpoint). */
function visibleHint(): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>('[data-testid="omarchy-hint"]')].find(
    (el) => el.getClientRects().length > 0,
  );
}

/** Full-screen modal overlay: boot sequence, then the tiling desktop. */
export default function OmarchyMode({ onExit }: { onExit(): void }) {
  const { t } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const [booting, setBooting] = useState(true);
  const [theme, setThemeState] = useState<Theme>(loadTheme);
  const [reduced] = useState(prefersReduced);

  const setTheme = useCallback((v: Theme) => {
    setThemeState(v);
    saveTheme(v);
  }, []);

  // Modal behaviour: lock page scroll, make the page inert, take focus; undo all of it on exit.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    let host: Element = root;
    while (host.parentElement && host.parentElement !== document.body) host = host.parentElement;
    const inerted = [...document.body.children].filter((el) => el !== host && !el.hasAttribute("inert"));
    inerted.forEach((el) => el.setAttribute("inert", ""));
    root.focus({ preventScroll: true });

    return () => {
      inerted.forEach((el) => el.removeAttribute("inert"));
      html.style.overflow = prevOverflow;
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
      visibleHint()?.focus({ preventScroll: true });
    };
  }, []);

  const endBoot = useCallback(() => {
    setBooting(false);
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={t.omarchy.label}
      data-testid="omarchy"
      data-theme={theme}
      tabIndex={-1}
      className="om-root fixed inset-0 z-[60] overflow-hidden outline-none"
    >
      {booting ? (
        <Boot onDone={endBoot} onExit={onExit} reduced={reduced} />
      ) : (
        <Desktop theme={theme} onTheme={setTheme} onExit={onExit} rootRef={rootRef} />
      )}
    </div>
  );
}
