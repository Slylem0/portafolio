import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { useLang } from "@/i18n";
import { sessions } from "@/data/sessions";
import AsciiOctahedron from "@/components/ascii/AsciiOctahedron";
import { keyToAction, type Action } from "./shortcuts";
import { dwindle, type Rect } from "./tiling";
import type { TermAction } from "./terminal";
import TopBar, { WORKSPACES, type WsNum } from "./TopBar";
import Dock from "./Dock";
import Window from "./Window";
import AboutWin from "./windows/AboutWin";
import SessionsWin, { SessionDetail } from "./windows/SessionsWin";
import SkillsWin from "./windows/SkillsWin";
import LogWin from "./windows/LogWin";
import TriadWin from "./windows/TriadWin";
import TerminalWin from "./windows/TerminalWin";
import DisplaySwitchWin, { THEMES, type Theme } from "./windows/DisplaySwitchWin";

type Kind = "about" | "sessions" | "skills" | "triad" | "log" | "terminal" | "display" | "session";
type Win = { id: string; kind: Kind; n?: number; fresh?: boolean };
type Ws = { wins: Win[]; focus: string | null };
type State = { active: WsNum; dir: 1 | -1; ws: Record<WsNum, Ws>; seq: number; selected: number };

type Msg =
  | { type: "workspace"; n: WsNum }
  | { type: "spawn"; kind: "terminal" | "display" }
  | { type: "session"; n: number }
  | { type: "focus"; id: string }
  | { type: "close"; id?: string }
  | { type: "select"; n: number };

const BASE: Record<WsNum, Kind> = { 1: "about", 2: "sessions", 3: "skills", 4: "triad", 5: "log" };
const GAP = 8;
const MOBILE_GAP = 6;
const SWIPE_PX = 50;

function initial(): State {
  const ws = {} as Record<WsNum, Ws>;
  for (const n of WORKSPACES) ws[n] = { wins: [{ id: BASE[n], kind: BASE[n] }], focus: BASE[n] };
  return { active: 1, dir: 1, ws, seq: 0, selected: sessions[0].n };
}

function reducer(s: State, m: Msg): State {
  const cur = s.ws[s.active];
  const put = (w: Ws, extra: Partial<State> = {}): State => ({ ...s, ...extra, ws: { ...s.ws, [s.active]: w } });

  switch (m.type) {
    case "workspace":
      return m.n === s.active ? s : { ...s, active: m.n, dir: m.n > s.active ? 1 : -1 };
    case "spawn": {
      // One terminal / Display Switch per workspace: re-focus it if it already exists.
      const existing = cur.wins.find((w) => w.kind === m.kind);
      if (existing) return put({ ...cur, focus: existing.id });
      const id = `${m.kind}-${s.seq}`;
      return put({ wins: [...cur.wins, { id, kind: m.kind, fresh: true }], focus: id }, { seq: s.seq + 1 });
    }
    case "session": {
      const existing = cur.wins.find((w) => w.kind === "session");
      if (existing)
        return put(
          { wins: cur.wins.map((w) => (w === existing ? { ...w, n: m.n } : w)), focus: existing.id },
          { selected: m.n },
        );
      const id = `session-${s.seq}`;
      return put(
        { wins: [...cur.wins, { id, kind: "session", n: m.n, fresh: true }], focus: id },
        { seq: s.seq + 1, selected: m.n },
      );
    }
    case "focus":
      return cur.focus === m.id || !cur.wins.some((w) => w.id === m.id) ? s : put({ ...cur, focus: m.id });
    case "close": {
      const id = m.id ?? cur.focus;
      const i = cur.wins.findIndex((w) => w.id === id);
      if (i < 0) return s;
      const wins = cur.wins.filter((w) => w.id !== id);
      const focus = cur.focus === id ? (wins[Math.min(i, wins.length) - 1] ?? wins[0])?.id ?? null : cur.focus;
      return put({ wins, focus });
    }
    case "select":
      return { ...s, selected: m.n };
  }
}

function isTyping(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
}
const isActivatable = (el: Element | null) => !!el?.closest("button, a[href], [role='button']");

function useIsMobile() {
  const query = "(max-width: 767.98px)";
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

interface DesktopProps {
  theme: Theme;
  onTheme(t: Theme): void;
  onExit(): void;
  rootRef: React.RefObject<HTMLDivElement | null>;
}

export default function Desktop({ theme, onTheme, onExit, rootRef }: DesktopProps) {
  const { lang, t, setLang } = useLang();
  const [s, dispatch] = useReducer(reducer, undefined, initial);
  const mobile = useIsMobile();
  const areaRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  // Which window should receive DOM focus after the next render (set by keyboard/dock actions).
  const [focusReq, setFocusReq] = useState<{ n: number; input: boolean } | null>(null);
  const stateRef = useRef(s);
  stateRef.current = s;
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const names: Record<WsNum, string> = {
    1: t.omarchy.workspaces.about,
    2: t.omarchy.workspaces.sessions,
    3: t.omarchy.workspaces.skills,
    4: t.omarchy.workspaces.triad,
    5: t.omarchy.workspaces.log,
  };
  const titleOf = (w: Win): string => {
    switch (w.kind) {
      case "terminal":
        return t.omarchy.terminal.title;
      case "display":
        return t.omarchy.displaySwitch.title;
      case "session": {
        const sn = sessions.find((x) => x.n === w.n);
        return `${String(w.n).padStart(2, "0")} · ${sn?.name ?? ""}`;
      }
      case "about":
        return names[1];
      case "sessions":
        return names[2];
      case "skills":
        return names[3];
      case "triad":
        return names[4];
      case "log":
        return names[5];
    }
  };
  const tagOf: Record<Kind, string> = {
    about: "about.md",
    sessions: "~/sessions",
    skills: "sync --ratio",
    triad: "triad.service",
    log: "journalctl",
    terminal: "zsh",
    display: "display-switch",
    session: "~/sessions",
  };

  const requestFocus = (input = false) => setFocusReq((r) => ({ n: (r?.n ?? 0) + 1, input }));

  const run = useCallback(
    (a: Action | { type: "session"; n: number }) => {
      switch (a.type) {
        case "workspace":
          dispatch({ type: "workspace", n: a.n });
          requestFocus();
          break;
        case "terminal":
          dispatch({ type: "spawn", kind: "terminal" });
          requestFocus(true);
          break;
        case "displaySwitch": {
          const cur = stateRef.current.ws[stateRef.current.active];
          const focused = cur.wins.find((w) => w.id === cur.focus);
          // Like Win+P: pressing again while the picker is focused cycles the mode.
          if (focused?.kind === "display") {
            onTheme(THEMES[(THEMES.indexOf(themeRef.current) + 1) % THEMES.length]);
          } else {
            dispatch({ type: "spawn", kind: "display" });
            requestFocus();
          }
          break;
        }
        case "close":
          dispatch({ type: "close" });
          requestFocus();
          break;
        case "session":
          dispatch({ type: "session", n: a.n });
          requestFocus();
          break;
        case "exit":
          onExit();
          break;
        case "open":
          break;
      }
    },
    [onExit, onTheme],
  );

  // Global shortcuts while the desktop is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing || e.defaultPrevented) return;
      const el = document.activeElement;
      const typing = isTyping(el);
      // Plain Enter on a focused control activates it instead of spawning a terminal.
      if (!typing && e.key === "Enter" && !e.ctrlKey && !e.metaKey && isActivatable(el)) return;
      const a = keyToAction(e, true, typing);
      if (!a || a.type === "open") return;
      e.preventDefault();
      run(a);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  // Move DOM focus to the focused window after keyboard/dock actions.
  useEffect(() => {
    if (!focusReq) return;
    const cur = s.ws[s.active];
    const el = cur.focus ? rootRef.current?.querySelector<HTMLElement>(`[data-win-id="${cur.focus}"]`) : null;
    const input = el?.querySelector<HTMLInputElement>("input");
    if (focusReq.input && input) input.focus({ preventScroll: true });
    else if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
    else if (!el) rootRef.current?.focus({ preventScroll: true });
  }, [focusReq]);

  // Measure the tiling area before paint; windows render only once a size is known.
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((p) => (p && p.w === r.width && p.h === r.height ? p : { w: r.width, h: r.height }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Mobile: horizontal swipe switches workspace.
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (mobile && e.isPrimary) swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const st = swipe.current;
    swipe.current = null;
    if (!mobile || !st || st.id !== e.pointerId) return;
    const dx = e.clientX - st.x;
    const dy = e.clientY - st.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const next = s.active + (dx < 0 ? 1 : -1);
    if (next >= 1 && next <= 5) {
      window.getSelection()?.removeAllRanges();
      dispatch({ type: "workspace", n: next as WsNum });
    }
  };

  const onTermAction = useCallback(
    (a: Exclude<TermAction, { type: "clear" }>) => {
      if (a.type === "lang") setLang(a.lang);
      else if (a.type === "exit") onExit();
      else if (a.type === "openSession") run({ type: "session", n: a.n });
    },
    [setLang, onExit, run],
  );

  const content = (w: Win): ReactNode => {
    switch (w.kind) {
      case "about":
        return <AboutWin />;
      case "sessions":
        return <SessionsWin selected={s.selected} onSelect={(n) => dispatch({ type: "select", n })} />;
      case "skills":
        return <SkillsWin />;
      case "triad":
        return <TriadWin />;
      case "log":
        return <LogWin />;
      case "terminal":
        return <TerminalWin onAction={onTermAction} />;
      case "display":
        return <DisplaySwitchWin theme={theme} onTheme={onTheme} />;
      case "session": {
        const sn = sessions.find((x) => x.n === w.n);
        return sn ? <SessionDetail session={sn} lang={lang} t={t} /> : null;
      }
    }
  };

  const activeWs = s.ws[s.active];
  const focusedWin = activeWs.wins.find((w) => w.id === activeWs.focus);

  return (
    <div className="flex h-full flex-col">
      <TopBar
        active={s.active}
        names={names}
        focusedTitle={focusedWin ? titleOf(focusedWin) : ""}
        onWorkspace={(n) => run({ type: "workspace", n })}
        onDisplaySwitch={() => run({ type: "displaySwitch" })}
        onExit={onExit}
      />
      <div
        ref={areaRef}
        data-testid="omarchy-area"
        className="relative min-h-0 flex-1 touch-pan-y overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
      >
        {!mobile && (
          <div aria-hidden="true" className="om-wall absolute inset-0">
            <AsciiOctahedron variant="wallpaper" />
          </div>
        )}
        <div aria-hidden="true" className="om-vignette pointer-events-none absolute inset-0" />
        {size &&
          WORKSPACES.map((n) => {
            const ws = s.ws[n];
            const area: Rect = { x: 0, y: 0, w: size.w, h: size.h };
            const rects = mobile ? null : dwindle(ws.wins.length, area, GAP);
            const full = dwindle(1, area, MOBILE_GAP)[0];
            return (
              <div
                key={n}
                hidden={n !== s.active}
                className="om-ws absolute inset-0"
                style={{ "--dir": s.dir } as React.CSSProperties}
              >
                {ws.wins.length === 0 && (
                  <p className="om-muted absolute inset-x-4 top-1/2 -translate-y-1/2 text-center font-mono text-xs tracking-widest">
                    {t.omarchy.empty}
                  </p>
                )}
                {ws.wins.map((w, i) => {
                  const title = titleOf(w);
                  return (
                    <Window
                      key={w.id}
                      id={w.id}
                      kind={w.kind}
                      title={title}
                      tag={tagOf[w.kind]}
                      rect={rects ? rects[i] : full}
                      focused={w.id === ws.focus}
                      hidden={mobile && w.id !== ws.focus}
                      fresh={!!w.fresh}
                      closeLabel={t.omarchy.closeWindow.replace("{title}", title)}
                      onFocus={() => dispatch({ type: "focus", id: w.id })}
                      onClose={() => {
                        dispatch({ type: "close", id: w.id });
                        requestFocus();
                      }}
                    >
                      {content(w)}
                    </Window>
                  );
                })}
              </div>
            );
          })}
      </div>
      <Dock
        active={s.active}
        names={names}
        onWorkspace={(n) => run({ type: "workspace", n })}
        onTerminal={() => run({ type: "terminal" })}
        onDisplaySwitch={() => run({ type: "displaySwitch" })}
        onClose={() => run({ type: "close" })}
        onExit={onExit}
      />
    </div>
  );
}
