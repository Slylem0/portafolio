import { describe, it, expect } from "vitest";
import { dicts, getInitialLang, saveLang } from "@/i18n";

function paths(o: unknown, p = ""): string[] {
  if (Array.isArray(o)) return [p + "[]", ...(o.length ? paths(o[0], p + "[]") : [])];
  if (o && typeof o === "object")
    return Object.entries(o).flatMap(([k, v]) => paths(v, p ? `${p}.${k}` : k));
  return [p];
}

describe("i18n", () => {
  it("en and es have identical key sets", () => {
    expect(paths(dicts.es).sort()).toEqual(paths(dicts.en).sort());
  });
  it("arrays have equal lengths in en and es", () => {
    const walk = (a: any, b: any) => {
      if (Array.isArray(a)) {
        expect(b.length).toBe(a.length);
        a.forEach((x, i) => walk(x, b[i]));
      } else if (a && typeof a === "object") Object.keys(a).forEach((k) => walk(a[k], b[k]));
    };
    walk(dicts.en, dicts.es);
  });
  it("getInitialLang returns en when storage throws", () => {
    expect(getInitialLang({ getItem: () => { throw new Error("x"); } })).toBe("en");
  });
  it("getInitialLang returns stored es", () => {
    expect(getInitialLang({ getItem: () => "es" })).toBe("es");
  });
  it("getInitialLang ignores invalid values", () => {
    expect(getInitialLang({ getItem: () => "fr" })).toBe("en");
  });
  it("saveLang swallows storage errors", () => {
    expect(() => saveLang("es", { setItem: () => { throw new Error("x"); } })).not.toThrow();
  });
});
