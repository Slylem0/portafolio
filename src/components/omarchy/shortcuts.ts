export type Action =
  | { type: "terminal" }
  | { type: "workspace"; n: 1 | 2 | 3 | 4 | 5 }
  | { type: "displaySwitch" }
  | { type: "close" }
  | { type: "exit" }
  | { type: "open" };

export type KeyLike = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
};

export function keyToAction(e: KeyLike, open: boolean): Action | null {
  const mod = e.metaKey || e.ctrlKey;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

  if (!open) {
    if (key === "Meta" && !e.ctrlKey && !e.altKey && !e.shiftKey) return { type: "open" };
    if (mod && !e.altKey && key === "k") return { type: "open" };
    return null;
  }

  if (key === "Escape") return { type: "exit" };
  if (!mod || e.altKey) return null;
  switch (key) {
    case "Enter":
      return { type: "terminal" };
    case "p":
      return { type: "displaySwitch" };
    case "q":
      return { type: "close" };
    case "1": case "2": case "3": case "4": case "5":
      return { type: "workspace", n: Number(key) as 1 | 2 | 3 | 4 | 5 };
    default:
      return null;
  }
}
