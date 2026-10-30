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
  it("Escape exits when not typing, blurs the input when typing", () => {
    expect(keyToAction(k("Escape"), true, false)).toEqual({ type: "exit" });
    expect(keyToAction(k("Escape"), true, true)).toEqual({ type: "blur" });
    expect(keyToAction(k("Escape"), true)).toEqual({ type: "blur" });
    expect(keyToAction(k("Escape", { ctrlKey: true }), true, true)).toEqual({ type: "blur" });
  });
  it("Ctrl+6 returns null", () => {
    for (const key of ["6", "7", "8", "9", "0"])
      expect(keyToAction(k(key, { ctrlKey: true }), true)).toBeNull();
  });
  it("Mod+K while open toggles the mode off (also while typing)", () => {
    for (const typing of [true, false]) {
      expect(keyToAction(k("k", { ctrlKey: true }), true, typing)).toEqual({ type: "exit" });
      expect(keyToAction(k("K", { metaKey: true }), true, typing)).toEqual({ type: "exit" });
    }
    expect(keyToAction(k("k", { ctrlKey: true, altKey: true }), true)).toBeNull();
  });
  it("alt combos return null while open", () => {
    expect(keyToAction(k("Enter", { ctrlKey: true, altKey: true }), true)).toBeNull();
    expect(keyToAction(k("1", { metaKey: true, altKey: true }), true)).toBeNull();
  });
  it("non-typing plain keys map when open", () => {
    for (const n of [1, 2, 3, 4, 5])
      expect(keyToAction(k(String(n)), true, false)).toEqual({ type: "workspace", n });
    expect(keyToAction(k("t"), true, false)).toEqual({ type: "terminal" });
    expect(keyToAction(k("Enter"), true, false)).toEqual({ type: "terminal" });
    expect(keyToAction(k("p"), true, false)).toEqual({ type: "displaySwitch" });
    expect(keyToAction(k("q"), true, false)).toEqual({ type: "close" });
    expect(keyToAction(k("Escape"), true, false)).toEqual({ type: "exit" });
    expect(keyToAction(k("6"), true, false)).toBeNull();
  });
  it("non-typing plain keys: alt/shift null, typing=true null, closed null", () => {
    for (const key of ["1", "t", "Enter", "p", "q"]) {
      expect(keyToAction(k(key, { altKey: true }), true, false)).toBeNull();
      expect(keyToAction(k(key, { shiftKey: true }), true, false)).toBeNull();
      expect(keyToAction(k(key), true, true)).toBeNull();
      expect(keyToAction(k(key), true)).toBeNull();
      expect(keyToAction(k(key), false, false)).toBeNull();
    }
  });
  it("pins Meta alone while open, Shift handling", () => {
    expect(keyToAction(k("Meta", { metaKey: true }), true)).toBeNull();
    expect(keyToAction(k("P", { ctrlKey: true, shiftKey: true }), true)).toEqual({ type: "displaySwitch" });
    expect(keyToAction(k("1", { ctrlKey: true, shiftKey: true }), true)).toBeNull();
  });
});
