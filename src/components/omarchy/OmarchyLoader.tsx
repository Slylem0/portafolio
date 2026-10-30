import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { useLang } from "@/i18n";
import { isIntroOpen, onOmarchyOpen, takePendingOpen } from "./events";
import { keyToAction } from "./shortcuts";

type ModeProps = { onExit(): void };

/** Set by the inline pre-hydration script in index.astro; removed once this island is live. */
type EarlyHost = { __omarchyEarly?: EventListener };

const ERROR_MS = 4000;
// Past this, a chunk that is still downloading counts as failed (error toast, then reset).
export const LINK_TIMEOUT_MS = 10_000;

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
  const loaded = useRef(false);
  const cancelRef = useRef<() => void>(() => {});

  useEffect(() => {
    let superArmed = false;
    let errTimer = 0;
    let linkTimer = 0;
    const showError = () => {
      setFailed(true);
      clearTimeout(errTimer);
      errTimer = window.setTimeout(() => setFailed(false), ERROR_MS);
    };
    // Leave the LINKING overlay without opening (Esc, tap, or the link timeout).
    const cancel = (withError: boolean) => {
      clearTimeout(linkTimer);
      if (!openRef.current || loaded.current) return;
      openRef.current = false;
      setOpen(false);
      if (withError) showError();
    };
    cancelRef.current = () => cancel(false);
    const activate = () => {
      superArmed = false;
      if (openRef.current || isIntroOpen()) return;
      openRef.current = true;
      setOpen(true);
      setFailed(false);
      if (loaded.current) return;
      clearTimeout(linkTimer);
      linkTimer = window.setTimeout(() => cancel(true), LINK_TIMEOUT_MS);
      if (loading.current) return;
      loading.current = true;
      import("./OmarchyMode").then(
        (m) => {
          loaded.current = true;
          clearTimeout(linkTimer);
          setMode(() => m.default);
        },
        () => {
          loading.current = false;
          clearTimeout(linkTimer);
          // A load that fails after the visitor cancelled stays silent.
          if (!openRef.current) return;
          openRef.current = false;
          setOpen(false);
          showError();
        },
      );
    };

    // A bare Super tap opens on keyup, so Super+<key> / Super+click combos never trigger it.
    const onKeyDown = (e: KeyboardEvent) => {
      if (openRef.current) {
        if (e.key === "Escape" && !loaded.current) {
          e.preventDefault();
          cancel(false);
        }
        return;
      }
      // Like the early inline handler: while the intro gate is up, leave the key alone entirely.
      if (isIntroOpen()) {
        superArmed = false;
        return;
      }
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
      clearTimeout(linkTimer);
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
    // Immediate feedback while the chunk downloads: the boot's inverted white frame. Esc or a tap cancels.
    return (
      <div
        role="status"
        data-testid="omarchy-linking"
        onClick={() => cancelRef.current()}
        className="fixed inset-0 z-[60] grid place-items-center bg-bone font-mono text-xl font-bold tracking-[0.4em] text-bg"
      >
        {t.omarchy.linking}
      </div>
    );
  if (failed)
    return (
      <div
        role="alert"
        className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-md border border-bone bg-bg px-4 py-3 font-mono text-xs text-bone shadow-lg"
      >
        <span aria-hidden="true" className="font-bold">⚠ </span>
        {t.omarchy.loadError}
      </div>
    );
  return null;
}
