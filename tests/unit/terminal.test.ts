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
  it("neofetch includes Omarchy, Hyprland, Shell, Cert, Location", () => {
    const { lines } = run("neofetch");
    const text = lines.join("\n");
    expect(text).toContain("Omarchy");
    expect(text).toContain("Hyprland");
    expect(text).toMatch(/Shell: zsh/);
    expect(text).toContain("Cert: AWS Certified Cloud Practitioner");
    expect(text).toContain("Location: Buga, CO");
    const markLines = lines.filter((l) => /^\s*[/\\_]/.test(l));
    expect(markLines.length).toBeLessThanOrEqual(7);
    expect(lines.every((l) => /^[\x20-\x7e]*$/.test(l))).toBe(true);
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

  it("open rejects non-session numbers without an action", () => {
    for (const a of ["0", "-1", "1.5", "abc", "8"]) {
      const r = run(`open ${a}`);
      expect(r.action).toBeUndefined();
      expect(r.lines).toHaveLength(1);
    }
    expect(run("open 1").action).toEqual({ type: "openSession", n: 1 });
    expect(run("open 7").action).toEqual({ type: "openSession", n: 7 });
  });
  it("unknown echoes the command in original case, capped at 40 chars", () => {
    expect(run("Sudo RM").lines[0]).toBe("command not found: Sudo RM. Try 'help'.");
    const long = run("x".repeat(60)).lines[0];
    expect(long).toContain("x".repeat(40) + "…");
    expect(long).not.toContain("x".repeat(41));
  });
  it("lang edge cases", () => {
    expect(run("lang").lines).toEqual([dicts.en.omarchy.terminal.usageLang]);
    expect(run("lang en es").action).toBeUndefined();
    expect(run("lang en es").lines).toEqual([dicts.en.omarchy.terminal.usageLang]);
    expect(run("lang es").action).toEqual({ type: "lang", lang: "es" });
  });
  it("Spanish localization", () => {
    expect(run("help", "es").lines[0]).toBe("Comandos disponibles:");
    expect(run("whoami", "es").lines).toEqual(["Pablo Nicolás Marín — Constructor Cloud & Backend · Buga, Colombia"]);
    expect(run("foo", "es").lines[0]).toBe("comando no encontrado: foo. Prueba 'help'.");
    expect(run("open 9", "es").lines[0]).toBe("no existe la sesión: 9. Prueba 'ls sessions'.");
    expect(run("open", "es").lines[0]).toBe("uso: open <n>");
    expect(run("open abc", "es").lines[0]).toContain("no existe la sesión");
    expect(run("lang", "es").lines[0]).toBe("uso: lang en|es");
    expect(run("lang fr", "es").lines[0]).toBe("uso: lang en|es");
    expect(run("lang en es", "es").lines[0]).toBe("uso: lang en|es");
    expect(run("lang es", "es").lines[0]).toBe("idioma cambiado a es");
  });
});
