import { useLayoutEffect, useRef, useState } from "react";
import { useLang } from "@/i18n";
import { cn } from "@/lib/utils";

type Phase = "alert" | "log" | "fade" | "static";

const ALERT_MS = 1200;
const LOG_MS = 1500;
const FADE_MS = 300;
const STATIC_MS = 400;

const MODIFIERS = new Set(["Control", "Meta", "Shift", "Alt", "AltGraph", "CapsLock", "OS"]);

/** Splits "[ OK ] message" so the status tag can be coloured. */
function BootLine({ text }: { text: string }) {
  const m = /^(\[\s*OK\s*\])\s*(.*)$/.exec(text);
  if (!m) return <>{text}</>;
  return (
    <>
      <span className="text-phosphor">{m[1]}</span> {m[2]}
    </>
  );
}

/** Emergency boot: red hex alert, systemd-style boot log, fade. Any key or tap skips. */
/** Escape leaves Omarchy Mode right away; every other key skips to the desktop. */
export default function Boot({ onDone, onExit, reduced }: { onDone(): void; onExit(): void; reduced: boolean }) {
  const { t } = useLang();
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
      if (MODIFIERS.has(e.key) || e.isComposing) return;
      e.preventDefault();
      if (e.key === "Escape") {
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
        <div className="om-hexes om-alert-flash absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="font-bebop text-2xl tracking-[0.4em] text-bg sm:text-4xl">{t.omarchy.alert}</p>
          <div className="w-full max-w-4xl border-y-4 border-bg bg-bg px-4 py-5 sm:py-8">
            <p className="font-eva text-3xl leading-tight font-extrabold text-alert sm:text-6xl">{t.omarchy.pattern}</p>
          </div>
          <p className="font-bebop text-2xl tracking-[0.4em] text-bg sm:text-4xl">{t.omarchy.alert}</p>
        </div>
      ) : (
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-center bg-bg px-5 font-mono text-xs leading-6 text-bone sm:px-16 sm:text-sm",
            phase === "fade" && "om-fade",
          )}
        >
          <p className="mb-4 font-eva text-xl font-extrabold text-alert sm:text-3xl">{t.omarchy.pattern}</p>
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
      <p className="absolute right-4 bottom-4 font-mono text-[10px] tracking-widest text-bone/70 uppercase mix-blend-difference">
        {t.omarchy.skip}
      </p>
    </div>
  );
}
