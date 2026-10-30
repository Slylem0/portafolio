import { describe, it, expect } from "vitest";
import { runCommand } from "@/components/omarchy/terminal";
import { dicts } from "@/i18n";

const run = (input: string, lang: "en" | "es" = "en") => runCommand(input, { lang, t: dicts[lang] });

describe("runCommand", () => {
  it("help lists all 9 commands", () => {
    const text = run("help").lines.join("\n");
    for (const c of ["help", "whoami", "ls sessions", "cat about.md", "neofetch", "open <n>", "lang en|es", "clear", "exit"])
      expect(text).toContain(c);
  });
  it("whoami contains Pablo", () => {
    expect(run("whoami").lines.join("\n")).toContain("Pablo");
  });
  it("ls sessions lists 7 numbered lines", () => {
    const { lines } = run("ls sessions");
    expect(lines).toHaveLength(7);
    lines.forEach((l, i) => expect(l.startsWith(`0${i + 1}  `)).toBe(true));
    expect(lines[0]).toBe("01  Shaggy Barber");
  });
  it("cat about.md returns the story", () => {
    expect(run("cat about.md").lines).toEqual(dicts.en.about.story);
    expect(run("cat about.md", "es").lines).toEqual(dicts.es.about.story);
  });
  it("neofetch includes Omarchy and Hyprland", () => {
    const text = run("neofetch").lines.join("\n");
    expect(text).toContain("Omarchy");
    expect(text).toContain("Hyprland");
    expect(run("neofetch").lines.length).toBeGreaterThan(0);
  });
  it("open n", () => {
    expect(run("open 3").action).toEqual({ type: "openSession", n: 3 });
    const bad = run("open 9");
    expect(bad.action).toBeUndefined();
    expect(bad.lines[0]).toContain("9");
    expect(run("open").lines[0]).toBe(dicts.en.omarchy.terminal.usageOpen);
    expect(run("open abc").action).toBeUndefined();
  });
  it("lang", () => {
    const r = run("lang es");
    expect(r.action).toEqual({ type: "lang", lang: "es" });
    expect(r.lines[0]).toContain("es");
    expect(run("lang fr").lines[0]).toBe(dicts.en.omarchy.terminal.usageLang);
    expect(run("lang fr").action).toBeUndefined();
  });
  it("clear and exit", () => {
    expect(run("clear").action).toEqual({ type: "clear" });
    expect(run("exit").action).toEqual({ type: "exit" });
  });
  it("normalises input", () => {
    expect(run("  WHOAMI  ")).toEqual(run("whoami"));
    expect(run("LS   Sessions")).toEqual(run("ls sessions"));
  });
  it("unknown command suggests help", () => {
    const r = run("sudo rm -rf /");
    expect(r.lines.join(" ")).toContain("help");
    expect(r.action).toBeUndefined();
  });
  it("empty input yields no lines", () => {
    expect(run("")).toEqual({ lines: [] });
    expect(run("   ")).toEqual({ lines: [] });
  });
});
