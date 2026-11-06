import { useEffect, useRef, useState } from "react";
import { useLang, type Dict } from "@/i18n";
import { canAnimate } from "@/lib/motion/env";
import { complete, runCommand, type TermAction } from "../terminal";
import { askTriad, metaLine, scoreOf, type TriadResult } from "../triad/triadClient";
import { emitSky } from "../events";

/** `shown`: how many lines are typed out so far (undefined = all). */
type Block = { id: number; input?: string; lines: string[]; shown?: number };
export type TerminalAction = Exclude<TermAction, { type: "clear" } | { type: "triad" } | { type: "atfield" }>;

/** ms per typed line. */
const TYPE_MS = 18;

/** TRIAD's answer as terminal lines: one per core, then the verdict and where it came from. */
function triadLines(r: TriadResult, t: Dict): string[] {
  const tr = t.triad;
  const name = { ENGINEER: tr.cores.engineer, COWBOY: tr.cores.cowboy, STUDENT: tr.cores.student };
  const width = Math.max(...Object.values(name).map((n) => n.length));
  const verdict = r.response.verdict === "APPROVED" ? tr.approved : tr.rejected;
  const source = !r.offline ? tr.linkOk : r.reason === "quota" ? tr.quota : tr.linkLost;
  return [
    ...r.response.cores.map((c) => `${name[c.id].padEnd(width)}  ${(c.vote === "YES" ? tr.yes : tr.no).padEnd(3)}  ${c.line}`),
    "",
    `${tr.resolution.replace("{verdict}", verdict).replace("{score}", scoreOf(r.response))}  ·  ${source}`,
    ...(r.meta && !r.offline ? [`└ ${metaLine(r.meta)}`] : []),
  ];
}

const PROMPT = "pablo@omarchy:~$";
const MAX_BLOCKS = 80;
const MAX_HISTORY = 50;

/** Portfolio shell. Output is rendered as plain text nodes only. */
export default function TerminalWin({ onAction }: { onAction(a: TerminalAction): void }) {
  const { lang, t } = useLang();
  const animate = useRef(canAnimate());
  const [blocks, setBlocks] = useState<Block[]>(() => [
    { id: 0, lines: [t.omarchy.terminal.welcome, t.omarchy.terminal.tips] },
  ]);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Typewriter: reveal the newest block's lines one by one.
  const typing = blocks.some((b) => b.shown !== undefined && b.shown < b.lines.length);
  useEffect(() => {
    if (!typing) return;
    const id = setInterval(() => {
      setBlocks((bs) =>
        bs.map((b) => (b.shown !== undefined && b.shown < b.lines.length ? { ...b, shown: b.shown + 1 } : b)),
      );
    }, TYPE_MS);
    return () => clearInterval(id);
  }, [typing]);
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const histIdx = useRef(-1);
  const nextId = useRef(1);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scroller.current?.parentElement;
    if (el) el.scrollTop = el.scrollHeight;
  }, [blocks]);

  const submit = () => {
    const cmd = value;
    setValue("");
    histIdx.current = -1;
    if (cmd.trim()) {
      history.current = [cmd, ...history.current.filter((h) => h !== cmd)].slice(0, MAX_HISTORY);
    }
    const res = runCommand(cmd, { lang, t, history: history.current.slice(1) });
    if (res.action?.type === "clear") {
      setBlocks([]);
      return;
    }
    const id = nextId.current++;
    const shown = animate.current && res.lines.length > 2 ? 0 : undefined;
    setBlocks((b) => [...b, { id, input: cmd, lines: res.lines, shown }].slice(-MAX_BLOCKS));
    const action = res.action;
    if (action?.type === "triad") {
      // Live call to the TRIAD backend (Lambda -> Bedrock); falls back to the local pool by itself.
      void askTriad(action.question, lang).then((r) => {
        if (!mounted.current) return;
        emitSky("verdict");
        const lines = [...res.lines, ...triadLines(r, t)];
        setBlocks((bs) =>
          bs.map((b) => (b.id === id ? { ...b, lines, shown: animate.current ? res.lines.length : undefined } : b)),
        );
      });
    } else if (action?.type === "atfield") emitSky("atfield");
    else if (action) onAction(action);
  };

  /** Tab: complete the command; with several matches, list them like a real shell. */
  const onTab = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const r = complete(value);
    if (!r) return; // nothing to complete: let Tab move focus as usual
    e.preventDefault();
    if (r.options.length > 1)
      setBlocks((b) =>
        [...b, { id: nextId.current++, input: value, lines: [r.options.map((o) => o.trim()).join("   ")] }].slice(
          -MAX_BLOCKS,
        ),
      );
    setValue(r.value);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && value.trim()) {
      onTab(e);
    } else if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const h = history.current;
      if (!h.length) return;
      e.preventDefault();
      const i = Math.max(-1, Math.min(h.length - 1, histIdx.current + (e.key === "ArrowUp" ? 1 : -1)));
      histIdx.current = i;
      setValue(i === -1 ? "" : h[i]);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setBlocks([]);
    }
  };

  return (
    <div
      ref={scroller}
      className="om-crt relative min-h-full cursor-text font-mono text-[12px] leading-[1.45]"
      onClick={() => {
        if (!window.getSelection()?.toString()) input.current?.focus({ preventScroll: true });
      }}
    >
      <div aria-hidden="true" className="om-crt-lines pointer-events-none absolute -inset-3" />
      {blocks.map((b) => (
        <div key={b.id} data-testid="omarchy-terminal-output" className="mb-1">
          {b.input !== undefined && (
            <p className="break-all whitespace-pre-wrap">
              <span className="om-accent">{PROMPT}</span> {b.input}
            </p>
          )}
          {(b.shown === undefined ? b.lines : b.lines.slice(0, b.shown)).map((l, i) => (
            <p key={i} className="break-words whitespace-pre-wrap text-bone/85">
              {l || " "}
            </p>
          ))}
        </div>
      ))}
      <label className="flex items-center gap-2">
        <span aria-hidden="true" className="om-accent shrink-0">
          {PROMPT}
        </span>
        <span className="sr-only">{t.omarchy.terminal.inputLabel}</span>
        <input
          ref={input}
          data-testid="omarchy-terminal-input"
          value={value}
          maxLength={200}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-base text-bone caret-[var(--om-accent)] outline-none md:text-[12px]"
        />
      </label>
    </div>
  );
}
