import { useLayoutEffect, useRef, useState } from "react";
import { useLang } from "@/i18n";
import { cn } from "@/lib/utils";
import { bootKeyAction } from "./shortcuts";

type Phase = "alert" | "log" | "fade" | "static";

const ALERT_MS = 1200;
const LOG_MS = 1500;
const FADE_MS = 300;
const STATIC_MS = 400;

/** Splits "[ OK ] message" so the status tag can be set in bold white. */
function BootLine({ text }: { text: string }) {
  const m = /^(\[\s*OK\s*\])\s*(.*)$/.exec(text);
  if (!m) return <>{text}</>;
  return (
    <>
      <span className="font-bold text-bone">{m[1]}</span> <span className="text-g-300">{m[2]}</span>
    </>
  );
}

/** Emergency boot: inverted white frame, systemd-style boot log, fade. Any key or tap skips. */
/** Escape or Ctrl/Cmd+K leaves Omarchy Mode right away; other keys skip to the desktop (browser shortcuts pass through). */
export default function Boot({ onDone, onExit, reduced }: { onDone(): void; onExit(): void; reduced: boolean }) {
  const { t } = useLang();
  const [coarse] = useState(() => {
    try {
      return window.matchMedia("(pointer: coarse)").matches;
    } catch {
      return false;
    }
  });
  const [phase, setPhase] = useState<Phase>(reduced ? "static" : "alert");
  const done = useRef(false);
  const finishRef = useRef(onDone);
  finishRef.current = onDone;
  const exitRef = useRef(onExit);
  exitRef.current = onExit;

  // Layout effect: the skip listener must exist as soon as the boot screen is painted.
  useLayoutEffect(() => {
    const finish = () => {
      if (done.current) return;
      done.current = true;
      finishRef.current();
    };
    const timers: number[] = [];
    if (reduced) {
      timers.push(window.setTimeout(finish, STATIC_MS));
    } else {
      timers.push(window.setTimeout(() => setPhase("log"), ALERT_MS));
      timers.push(window.setTimeout(() => setPhase("fade"), ALERT_MS + LOG_MS));
      timers.push(window.setTimeout(finish, ALERT_MS + LOG_MS + FADE_MS));
    }
    const onKey = (e: KeyboardEvent) => {
      const action = bootKeyAction(e);
      if (!action) return;
      e.preventDefault();
      if (action === "exit") {
        done.current = true;
        exitRef.current();
      } else finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
    };
  }, [reduced]);

  const skip = () => {
    if (done.current) return;
    done.current = true;
    finishRef.current();
  };

  const lineDelay = LOG_MS / (t.omarchy.boot.length + 1);

  return (
    <div
      data-testid="omarchy-boot"
      onClick={skip}
      className="absolute inset-0 cursor-pointer overflow-hidden select-none"
    >
      {phase === "alert" ? (
        <div className="om-invert om-alert-flash absolute inset-0 flex flex-col items-center justify-center gap-6 px-4 text-center">
          <p className="font-mono text-xs font-bold tracking-[0.5em] sm:text-sm">{t.omarchy.alert}</p>
          <div className="w-full max-w-4xl border-y border-current px-4 py-6 sm:py-10">
            <p className="font-sans text-3xl leading-[1.02] font-bold tracking-[-0.04em] sm:text-6xl">{t.omarchy.pattern}</p>
          </div>
          <p className="font-mono text-xs font-bold tracking-[0.5em] sm:text-sm">{t.omarchy.alert}</p>
        </div>
      ) : (
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-center bg-bg px-5 font-mono text-xs leading-6 text-bone sm:px-16 sm:text-sm",
            phase === "fade" && "om-fade",
          )}
        >
          <p className="mb-4 font-sans text-xl font-bold tracking-[-0.03em] text-bone sm:text-3xl">{t.omarchy.pattern}</p>
          <ul>
            {t.omarchy.boot.map((line, i) => (
              <li
                key={i}
                className={cn("break-words", phase !== "static" && "om-line")}
                style={phase !== "static" ? { animationDelay: `${Math.round(i * lineDelay)}ms` } : undefined}
              >
                <BootLine text={line} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="absolute right-4 bottom-4 border border-bone/40 bg-bg px-2.5 py-1 font-mono text-xs tracking-widest text-bone uppercase">
        {coarse ? t.omarchy.skipTouch : t.omarchy.skip}
      </p>
    </div>
  );
}
