import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n";
import { cn } from "@/lib/utils";
import { askTriad, MAX_QUESTION, scoreOf, type CoreId, type TriadResult } from "./triadClient";

const REVEAL_MS = 350;
const CORE_KEYS: Record<CoreId, "engineer" | "cowboy" | "student"> = {
  ENGINEER: "engineer",
  COWBOY: "cowboy",
  STUDENT: "student",
};
const ORDER: CoreId[] = ["ENGINEER", "COWBOY", "STUDENT"];

function prefersReduced(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** TRIAD console: three advisory cores vote on a yes/no question. Model lines render as text only. */
export default function Triad() {
  const { lang, t } = useLang();
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<TriadResult | null>(null);
  const [shown, setShown] = useState(0);
  const [error, setError] = useState(false);
  const inFlight = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Cores light up one by one; instantly under reduced motion.
  useEffect(() => {
    if (!result || shown >= 3) return;
    if (prefersReduced()) {
      setShown(3);
      return;
    }
    const id = setTimeout(() => setShown((n) => n + 1), REVEAL_MS);
    return () => clearTimeout(id);
  }, [result, shown]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (inFlight.current) return;
    if (!q) {
      setError(true);
      return;
    }
    inFlight.current = true;
    setError(false);
    setPending(true);
    setResult(null);
    setShown(0);
    try {
      const r = await askTriad(q.slice(0, MAX_QUESTION), lang);
      if (alive.current) setResult(r);
    } finally {
      inFlight.current = false;
      if (alive.current) {
        setPending(false);
        refocus();
      }
    }
  };

  // The disabled submit button drops focus; hand it back to the input (not on touch, where the
  // on-screen keyboard would cover the verdict) unless the visitor has moved elsewhere meanwhile.
  const refocus = () => {
    requestAnimationFrame(() => {
      const active = document.activeElement;
      const lost = !active || active === document.body || active === rootRef.current?.closest("[data-win-id]");
      let coarse = false;
      try {
        coarse = window.matchMedia("(pointer: coarse)").matches;
      } catch {
        /* ignore */
      }
      if (!coarse && (lost || rootRef.current?.contains(active))) inputRef.current?.focus({ preventScroll: true });
    });
  };

  const done = !!result && shown >= 3;
  const verdict = result?.response.verdict;
  const resolution =
    result && verdict
      ? t.triad.resolution
          .replace("{verdict}", verdict === "APPROVED" ? t.triad.approved : t.triad.rejected)
          .replace("{score}", scoreOf(result.response))
      : "";
  // Concise screen-reader summary, e.g. "CORE·ENGINEER YES, CORE·COWBOY NO, CORE·STUDENT YES — RESOLUTION: APPROVED 2–1".
  const summary =
    done && result
      ? `${result.response.cores
          .map((c) => `${t.triad.cores[CORE_KEYS[c.id]]} ${c.vote === "YES" ? t.triad.yes : t.triad.no}`)
          .join(", ")} — ${resolution}${result.offline ? `. ${t.triad.linkLost}` : ""}`
      : "";

  return (
    <div ref={rootRef} className="flex min-h-full flex-col gap-3 font-mono" data-testid="triad">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-bone/75">{t.triad.intro}</p>
        {result && (
          <span
            data-testid={result.offline ? "triad-offline" : "triad-online"}
            className={cn(
              "border px-1.5 py-0.5 text-[10px] tracking-widest",
              result.offline ? "border-alert/70 text-alert" : "border-phosphor/60 text-phosphor",
            )}
          >
            {result.offline ? t.triad.linkLost : t.triad.linkOk}
          </span>
        )}
      </div>

      <form
        className="flex flex-col gap-2 @md:flex-row @md:items-start"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="sr-only">{t.triad.inputLabel}</span>
          <input
            ref={inputRef}
            data-testid="triad-input"
            value={question}
            maxLength={MAX_QUESTION}
            placeholder={t.triad.placeholder}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="send"
            aria-invalid={error || undefined}
            aria-describedby="triad-counter"
            onChange={(e) => {
              setQuestion(e.target.value);
              if (error) setError(false);
            }}
            className="om-chip w-full min-w-0 bg-transparent px-2 py-1.5 text-base text-bone caret-[var(--om-accent)] outline-none placeholder:text-bone/40 focus:border-[var(--om-accent)] md:text-xs"
          />
          <span id="triad-counter" className="flex justify-between text-[10px] text-bone/55">
            <span role="alert">{error ? t.triad.empty : ""}</span>
            <span>{t.triad.counter.replace("{n}", String(question.length)).replace("{max}", String(MAX_QUESTION))}</span>
          </span>
        </label>
        <button
          type="submit"
          data-testid="triad-submit"
          disabled={pending}
          className="om-chip om-focus shrink-0 px-3 py-1.5 tracking-widest text-bone hover:text-[var(--om-accent)] disabled:cursor-wait disabled:opacity-50 disabled:hover:text-bone"
        >
          {t.triad.submit}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="om-muted tracking-widest">{t.triad.examplesLabel}</span>
        {t.triad.examples.map((ex) => (
          <button
            key={ex}
            type="button"
            data-testid="triad-example"
            disabled={pending}
            onClick={() => {
              setQuestion(ex);
              void ask(ex);
            }}
            className="om-chip om-focus px-2 py-0.5 text-left text-bone/80 hover:text-[var(--om-accent)] disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>

      <ol className="grid grid-cols-1 gap-3 @lg:grid-cols-3" aria-label={t.triad.title}>
        {ORDER.map((id, i) => {
          const core = result?.response.cores[i];
          const lit = !!core && i < shown;
          const vote = lit ? core.vote : null;
          return (
            <li
              key={id}
              data-testid="triad-core"
              data-vote={vote ?? ""}
              className={cn("triad-core flex items-center gap-3 @lg:flex-col @lg:text-center", vote && "is-lit")}
              style={{ "--core": vote === "YES" ? "var(--phosphor)" : vote === "NO" ? "var(--alert)" : "var(--om-inactive)" } as React.CSSProperties}
            >
              <span aria-hidden="true" className={cn("triad-hex shrink-0", pending && "motion-safe:animate-pulse")}>
                <span className="triad-hex-ring hex">
                  <span className="triad-hex-face hex">
                    <span className="font-bebop text-2xl tracking-wider text-[var(--core)]">
                      {vote === "YES" ? t.triad.yes : vote === "NO" ? t.triad.no : pending ? "···" : "—"}
                    </span>
                  </span>
                </span>
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-[10px] tracking-[0.2em] text-bone">{t.triad.cores[CORE_KEYS[id]]}</span>
                <span className="sr-only">{vote ? (vote === "YES" ? t.triad.yes : t.triad.no) : ""}</span>
                <span className="min-h-[2.5em] break-words text-bone/80">
                  {lit ? core.line : pending ? t.triad.pending : t.triad.idle}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <p aria-live="polite" data-testid="triad-live" className="sr-only">
        {pending ? t.triad.thinking : summary}
      </p>
      <div aria-hidden="true" className="mt-auto min-h-12">
        {pending && (
          <p data-testid="triad-status" className="om-accent text-center tracking-[0.3em] motion-safe:animate-pulse">
            {t.triad.thinking}
          </p>
        )}
        {done && (
          <p
            data-testid="triad-resolution"
            data-verdict={verdict}
            className={cn(
              "triad-banner border-y-2 py-2 text-center font-eva text-lg font-extrabold tracking-wider break-words @md:text-2xl",
              verdict === "APPROVED" ? "border-phosphor text-phosphor" : "border-alert text-alert",
            )}
          >
            {resolution}
          </p>
        )}
      </div>
    </div>
  );
}
