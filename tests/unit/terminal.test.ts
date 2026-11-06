import { describe, it, expect } from "vitest";
import { complete, runCommand, suggest } from "@/components/omarchy/terminal";
import { dicts } from "@/i18n";

const run = (input: string, lang: "en" | "es" = "en") => runCommand(input, { lang, t: dicts[lang] });

describe("runCommand", () => {
  it("help lists every command", () => {
    const text = run("help").lines.join("\n");
    for (const c of ["help", "whoami", "ls sessions", "cat about.md", "neofetch", "open <n>", "lang en|es", "clear", "exit",
      "triad <q>", "aws architecture", "aws services", "skills", "contact", "theme <name>", "ws <n>", "history"])
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
    const r = run("make coffee");
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
    expect(run("Make COFFEE").lines[0]).toBe("command not found: Make COFFEE. Try 'help'.");
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

describe("new commands", () => {
  it("triad keeps the question's case and asks for the async action", () => {
    const r = run("TRIAD  Should I hire Pablo?");
    expect(r.action).toEqual({ type: "triad", question: "Should I hire Pablo?" });
    expect(r.lines).toEqual([dicts.en.omarchy.terminal.triadAsking]);
    expect(run("triad").lines).toEqual([dicts.en.omarchy.terminal.usageTriad]);
    expect(run("triad").action).toBeUndefined();
  });
  it("aws architecture draws the real stack, aws services explains it", () => {
    const arch = run("aws architecture").lines.join("\n");
    for (const s of ["Amplify", "Lambda", "Bedrock", "DynamoDB", "CloudWatch"]) expect(arch).toContain(s);
    const svc = run("aws services", "es").lines.join("\n");
    for (const s of ["Amplify", "Lambda", "Bedrock", "DynamoDB", "CloudWatch", "Budgets"]) expect(svc).toContain(s);
    expect(run("aws").lines).toEqual([dicts.en.omarchy.terminal.usageAws]);
    expect(run("aws s3 ls").lines).toEqual([dicts.en.omarchy.terminal.usageAws]);
  });
  it("skills prints ASCII bars from the data", () => {
    const lines = run("skills").lines;
    const lambda = lines.find((l) => l.includes("AWS Lambda"))!;
    expect(lambda).toMatch(/#{8}\.{2}\s+80%$/);
    expect(lines.every((l) => /^[\x20-\x7e]*$/.test(l))).toBe(true);
  });
  it("contact lists email, GitHub and LinkedIn", () => {
    const text = run("contact").lines.join("\n");
    expect(text).toContain("pnicolasmarin2007@gmail.com");
    expect(text).toContain("github.com/Slylem0");
    expect(text).toContain("linkedin.com/in/pablo-nicolas-marin");
  });
  it("theme switches the display, ws switches workspace", () => {
    expect(run("theme inverse").action).toEqual({ type: "theme", theme: "inverse" });
    expect(run("theme pink").action).toBeUndefined();
    expect(run("theme pink").lines).toEqual([dicts.en.omarchy.terminal.usageTheme]);
    expect(run("ws 4").action).toEqual({ type: "workspace", n: 4 });
    for (const bad of ["ws", "ws 0", "ws 6", "ws x"]) {
      expect(run(bad).action).toBeUndefined();
      expect(run(bad).lines).toEqual([dicts.en.omarchy.terminal.usageWs]);
    }
  });
  it("history numbers past commands, oldest first", () => {
    const r = runCommand("history", { lang: "en", t: dicts.en, history: ["whoami", "help"] });
    expect(r.lines).toEqual(["  1  help", "  2  whoami"]);
    expect(run("history").lines).toEqual([dicts.en.omarchy.terminal.historyEmpty]);
  });
  it("typos get a did-you-mean", () => {
    const text = run("neofech").lines.join("\n");
    expect(text).toContain("neofetch");
    expect(suggest("neofech")).toBe("neofetch");
    expect(suggest("trad")).toBe("triad");
    expect(suggest("xyzzy")).toBeNull();
    expect(suggest("ls")).toBeNull();
  });
});

describe("complete (Tab)", () => {
  it("completes a unique prefix", () => {
    expect(complete("neo")).toEqual({ value: "neofetch", options: ["neofetch"] });
    expect(complete("aws a")).toEqual({ value: "aws architecture", options: ["aws architecture"] });
    expect(complete("con")).toEqual({ value: "contact", options: ["contact"] });
  });
  it("extends to the common prefix and lists the options", () => {
    const r = complete("aws")!;
    expect(r.value).toBe("aws ");
    expect(r.options).toEqual(["aws architecture", "aws services"]);
    const t = complete("t")!;
    expect(t.value).toBe("t");
    expect(t.options).toContain("triad ");
    expect(t.options).toContain("theme mono");
  });
  it("returns null without matches or input", () => {
    expect(complete("zzz")).toBeNull();
    expect(complete("")).toBeNull();
  });
});

describe("classified commands", () => {
  it("sudo is reported to NERV and does nothing", () => {
    const r = run("sudo make me a sandwich");
    expect(r.lines.join("\n")).toContain("NERV");
    expect(r.action).toBeUndefined();
    expect(run("sudo", "es").lines.join("\n")).toContain("NERV");
  });
  it("rm -rf / deploys the A.T. Field (also through sudo) and makes the sky react", () => {
    for (const c of ["rm -rf /", "sudo rm -rf /", "rm -rf /*", "RM -RF /"]) {
      const r = run(c);
      expect(r.action).toEqual({ type: "atfield" });
      expect(r.lines.join("\n")).toContain("A.T. FIELD");
      expect(r.lines.every((l) => /^[\x20-\x7e]*$/.test(l))).toBe(true);
    }
  });
  it("see you space cowboy", () => {
    expect(run("see you space cowboy").lines.join(" ")).toContain("carry that weight");
  });
  it("pacman and hyprctl answer in character", () => {
    expect(run("pacman -S pablo").lines.join(" ")).toContain("pablo");
    expect(run("pacman -S neovim").lines.join(" ")).toContain("neovim");
    expect(run("pacman").lines).toEqual([dicts.en.omarchy.terminal.usagePacman]);
    expect(run("hyprctl").lines.join(" ")).toContain("dwindle");
  });
  it("classified commands stay out of help, which only hints at them", () => {
    const help = run("help").lines.join("\n");
    expect(help).not.toContain("sudo");
    expect(help).toContain(dicts.en.omarchy.terminal.classified);
  });
});
