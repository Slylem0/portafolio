export type Action =
  | { type: "terminal" }
  | { type: "workspace"; n: 1 | 2 | 3 | 4 | 5 }
  | { type: "displaySwitch" }
  | { type: "close" }
  | { type: "exit" }
  | { type: "blur" }
  | { type: "open" };

export type KeyLike = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
};

// typing: focus is in an input/textarea/contenteditable (caller decides); when false, plain keys also work.
export function keyToAction(e: KeyLike, open: boolean, typing: boolean = true): Action | null {
  const mod = e.metaKey || e.ctrlKey;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

  if (!open) {
    if (key === "Meta" && !e.ctrlKey && !e.altKey && !e.shiftKey) return { type: "open" };
    if (mod && !e.altKey && key === "k") return { type: "open" };
    return null;
  }

  // Esc first leaves the input (the desktop clears it if non-empty); Esc outside an input exits.
  if (key === "Escape") return typing ? { type: "blur" } : { type: "exit" };
  if (e.altKey) return null;
  // Mod+K toggles the mode off again.
  if (mod && key === "k") return { type: "exit" };
  if (!mod) {
    if (typing || e.shiftKey) return null;
    return mapKey(key, key === "t");
  }
  // Shift is ignored for letters/Enter but disqualifies digits.
  return mapKey(key, false, e.shiftKey);
}

function mapKey(key: string, tKey: boolean, shiftDigits = false): Action | null {
  if (tKey) return { type: "terminal" };
  switch (key) {
    case "Enter":
      return { type: "terminal" };
    case "p":
      return { type: "displaySwitch" };
    case "q":
      return { type: "close" };
    case "1": case "2": case "3": case "4": case "5":
      return shiftDigits ? null : { type: "workspace", n: Number(key) as 1 | 2 | 3 | 4 | 5 };
    default:
      return null;
  }
}

const BOOT_MODIFIERS = new Set(["Control", "Meta", "Shift", "Alt", "AltGraph", "CapsLock", "OS"]);

/**
 * Key handling during the boot screen: Escape or Ctrl/Cmd+K exits, other keys skip to the desktop.
 * Bare modifiers, Ctrl/Cmd combos (reload, devtools, copy…) and F1–F12 pass through to the browser.
 */
export function bootKeyAction(e: KeyLike & { isComposing?: boolean }): "exit" | "skip" | null {
  if (BOOT_MODIFIERS.has(e.key) || e.isComposing) return null;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") return "exit";
  if (e.key === "Escape") return "exit";
  if (e.ctrlKey || e.metaKey || /^F([1-9]|1[0-2])$/.test(e.key)) return null;
  return "skip";
}
