import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { onOmarchyOpen } from "./events";
import { keyToAction } from "./shortcuts";

type ModeProps = { onExit(): void };

/**
 * Tiny always-loaded island. It waits for the hint click or the open shortcut
 * (Super tap, Ctrl/Cmd+K) and only then fetches the Omarchy Mode chunk.
 */
export default function OmarchyLoader() {
  const [Mode, setMode] = useState<ComponentType<ModeProps> | null>(null);
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const loading = useRef(false);

  useEffect(() => {
    let superArmed = false;
    const activate = () => {
      superArmed = false;
      if (openRef.current) return;
      openRef.current = true;
      setOpen(true);
      if (loading.current) return;
      loading.current = true;
      import("./OmarchyMode").then(
        (m) => setMode(() => m.default),
        () => {
          loading.current = false;
          openRef.current = false;
          setOpen(false);
        },
      );
    };

    // A bare Super tap opens on keyup, so Super+<key> combos (e.g. Cmd+C) never trigger it.
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
    const onBlur = () => {
      superArmed = false;
    };

    const off = onOmarchyOpen(activate);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      off();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const exit = useCallback(() => {
    openRef.current = false;
    setOpen(false);
  }, []);

  if (!open || !Mode) return null;
  return <Mode onExit={exit} />;
}
