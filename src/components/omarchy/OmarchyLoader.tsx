import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { useLang } from "@/i18n";
import { onOmarchyOpen, takePendingOpen } from "./events";
import { keyToAction } from "./shortcuts";

type ModeProps = { onExit(): void };

/** Set by the inline pre-hydration script in index.astro; removed once this island is live. */
type EarlyHost = { __omarchyEarly?: EventListener };

const ERROR_MS = 4000;

/**
 * Tiny always-loaded island (client:load). It waits for the hint click or the open
 * shortcut (Super tap, Ctrl/Cmd+K) and only then fetches the Omarchy Mode chunk.
 * Opens requested before hydration are picked up from the pending flag.
 */
export default function OmarchyLoader() {
  const { t } = useLang();
  const [Mode, setMode] = useState<ComponentType<ModeProps> | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const openRef = useRef(false);
  const loading = useRef(false);

  useEffect(() => {
    let superArmed = false;
    let errTimer = 0;
    const activate = () => {
      superArmed = false;
      if (openRef.current) return;
      openRef.current = true;
      setOpen(true);
      setFailed(false);
      if (loading.current) return;
      loading.current = true;
      import("./OmarchyMode").then(
        (m) => setMode(() => m.default),
        () => {
          loading.current = false;
          openRef.current = false;
          setOpen(false);
          setFailed(true);
          clearTimeout(errTimer);
          errTimer = window.setTimeout(() => setFailed(false), ERROR_MS);
        },
      );
    };

    // A bare Super tap opens on keyup, so Super+<key> / Super+click combos never trigger it.
    const onKeyDown = (e: KeyboardEvent) => {
      if (openRef.current) return;
      const action = keyToAction(e, false);
      if (action?.type !== "open") {
        superArmed = false;
        return;
      }
      if (e.key === "Meta") {
        superArmed = !e.repeat;
        return;
      }
      e.preventDefault();
      activate();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "Meta") return;
      const armed = superArmed;
      superArmed = false;
      if (armed && !openRef.current) activate();
    };
    const disarm = () => {
      superArmed = false;
    };

    // Hand over from the inline pre-hydration Ctrl/Cmd+K listener.
    const early = (window as unknown as EarlyHost).__omarchyEarly;
    if (early) {
      window.removeEventListener("keydown", early);
      delete (window as unknown as EarlyHost).__omarchyEarly;
    }

    const off = onOmarchyOpen(activate);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", disarm);
    window.addEventListener("pointerdown", disarm, true);
    window.addEventListener("wheel", disarm, { capture: true, passive: true });
    if (takePendingOpen()) activate();
    return () => {
      off();
      clearTimeout(errTimer);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", disarm);
      window.removeEventListener("pointerdown", disarm, true);
      window.removeEventListener("wheel", disarm, true);
    };
  }, []);

  const exit = useCallback(() => {
    openRef.current = false;
    setOpen(false);
  }, []);

  if (open && Mode) return <Mode onExit={exit} />;
  if (open)
    // Immediate feedback while the chunk downloads: the boot's red frame.
    return (
      <div
        role="status"
        data-testid="omarchy-linking"
        className="fixed inset-0 z-[60] grid place-items-center bg-[color-mix(in_srgb,var(--alert)_55%,#d00000)] font-bebop text-3xl tracking-[0.4em] text-bg"
      >
        {t.omarchy.linking}
      </div>
    );
  if (failed)
    return (
      <div
        role="alert"
        className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-md border border-alert bg-bg px-4 py-3 font-mono text-xs text-bone shadow-lg"
      >
        <span aria-hidden="true" className="text-alert">⚠ </span>
        {t.omarchy.loadError}
      </div>
    );
  return null;
}
