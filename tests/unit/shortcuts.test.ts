import { describe, it, expect } from "vitest";
import { keyToAction } from "@/components/omarchy/shortcuts";

const k = (key: string, m: Partial<{ metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }> = {}) =>
  ({ key, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...m });

describe("keyToAction", () => {
  it("Meta alone opens when closed", () => {
    expect(keyToAction(k("Meta", { metaKey: true }), false)).toEqual({ type: "open" });
    expect(keyToAction(k("Meta", { metaKey: true, shiftKey: true }), false)).toBeNull();
  });
  it("Ctrl+K opens when closed", () => {
    expect(keyToAction(k("k", { ctrlKey: true }), false)).toEqual({ type: "open" });
    expect(keyToAction(k("K", { metaKey: true }), false)).toEqual({ type: "open" });
    expect(keyToAction(k("Enter", { ctrlKey: true }), false)).toBeNull();
    expect(keyToAction(k("Escape"), false)).toBeNull();
  });
  it("Ctrl and Meta equivalent for Enter/1-5/P/Q", () => {
    for (const mod of [{ ctrlKey: true }, { metaKey: true }]) {
      expect(keyToAction(k("Enter", mod), true)).toEqual({ type: "terminal" });
      for (const n of [1, 2, 3, 4, 5])
        expect(keyToAction(k(String(n), mod), true)).toEqual({ type: "workspace", n });
      expect(keyToAction(k("p", mod), true)).toEqual({ type: "displaySwitch" });
      expect(keyToAction(k("Q", mod), true)).toEqual({ type: "close" });
    }
  });
  it("plain letters, digits, Enter and Backspace return null when open", () => {
    for (const key of ["a", "p", "q", "k", "1", "5", "Enter", "Backspace"])
      expect(keyToAction(k(key), true)).toBeNull();
  });
  it("Escape exits", () => {
    expect(keyToAction(k("Escape"), true)).toEqual({ type: "exit" });
  });
  it("Ctrl+6 returns null", () => {
    for (const key of ["6", "7", "8", "9", "0"])
      expect(keyToAction(k(key, { ctrlKey: true }), true)).toBeNull();
  });
  it("Mod+K while open and alt combos return null", () => {
    expect(keyToAction(k("k", { ctrlKey: true }), true)).toBeNull();
    expect(keyToAction(k("Enter", { ctrlKey: true, altKey: true }), true)).toBeNull();
    expect(keyToAction(k("1", { metaKey: true, altKey: true }), true)).toBeNull();
  });
});
