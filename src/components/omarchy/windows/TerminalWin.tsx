import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n";
import { runCommand, type TermAction } from "../terminal";

type Block = { id: number; input?: string; lines: string[] };

const PROMPT = "pablo@omarchy:~$";
const MAX_BLOCKS = 80;
const MAX_HISTORY = 50;

/** Portfolio shell. Output is rendered as plain text nodes only. */
export default function TerminalWin({ onAction }: { onAction(a: Exclude<TermAction, { type: "clear" }>): void }) {
  const { lang, t } = useLang();
  const [blocks, setBlocks] = useState<Block[]>(() => [{ id: 0, lines: [t.omarchy.terminal.welcome] }]);
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
    const res = runCommand(cmd, { lang, t });
    if (res.action?.type === "clear") {
      setBlocks([]);
      return;
    }
    setBlocks((b) => [...b, { id: nextId.current++, input: cmd, lines: res.lines }].slice(-MAX_BLOCKS));
    if (res.action) onAction(res.action);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.altKey) {
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
      className="min-h-full cursor-text font-mono text-[12px] leading-[1.45]"
      onClick={() => {
        if (!window.getSelection()?.toString()) input.current?.focus({ preventScroll: true });
      }}
    >
      {blocks.map((b) => (
        <div key={b.id} data-testid="omarchy-terminal-output" className="mb-1">
          {b.input !== undefined && (
            <p className="break-all whitespace-pre-wrap">
              <span className="om-accent">{PROMPT}</span> {b.input}
            </p>
          )}
          {b.lines.map((l, i) => (
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
