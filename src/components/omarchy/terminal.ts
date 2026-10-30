import type { Dict, Lang } from "@/i18n";
import { sessions } from "@/data/sessions";

export type TermAction =
  | { type: "openSession"; n: number }
  | { type: "lang"; lang: Lang }
  | { type: "clear" }
  | { type: "exit" };

export type TermResult = { lines: string[]; action?: TermAction };

const fmt = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

const MARK = [
  "    /\\    ",
  "   /  \\   ",
  "  /____\\  ",
  "  \\    /  ",
  "   \\  /   ",
  "    \\/    ",
];

function neofetch(): string[] {
  const info = [
    "pablo@omarchy",
    "-------------",
    "OS: Omarchy (Arch Linux)",
    "WM: Hyprland",
    "Shell: zsh",
    "Editor: Neovim",
    "Uptime: since Feb 2024 (Univalle)",
    "Cert: AWS Certified Cloud Practitioner",
    "Location: Buga, CO",
  ];
  const rows = Math.max(MARK.length, info.length);
  const width = MARK[0].length;
  return Array.from({ length: rows }, (_, i) => `${(MARK[i] ?? "").padEnd(width)}  ${info[i] ?? ""}`.trimEnd());
}

export function runCommand(input: string, ctx: { lang: Lang; t: Dict }): TermResult {
  const { t } = ctx;
  const tt = t.omarchy.terminal;
  const clean = input.trim().replace(/\s+/g, " ");
  const norm = clean.toLowerCase();
  if (!norm) return { lines: [] };
  const [cmd, ...args] = norm.split(" ");

  switch (cmd) {
    case "help":
      return { lines: [...tt.help] };
    case "whoami":
      return { lines: [tt.whoami] };
    case "ls":
      if (args[0] === "sessions")
        return { lines: sessions.map((s) => `${String(s.n).padStart(2, "0")}  ${s.name}`) };
      break;
    case "cat":
      if (args[0] === "about.md") return { lines: [...t.about.story] };
      break;
    case "neofetch":
      return { lines: neofetch() };
    case "open": {
      if (args.length !== 1) return { lines: [tt.usageOpen] };
      const n = /^\d+$/.test(args[0]) ? Number(args[0]) : NaN;
      if (sessions.some((s) => s.n === n))
        return { lines: [], action: { type: "openSession", n } };
      return { lines: [fmt(tt.invalidSession, { n: args[0] })] };
    }
    case "lang": {
      const l = args[0];
      if (args.length === 1 && (l === "en" || l === "es"))
        return { lines: [fmt(tt.langSet, { lang: l })], action: { type: "lang", lang: l } };
      return { lines: [tt.usageLang] };
    }
    case "clear":
      return { lines: [], action: { type: "clear" } };
    case "exit":
      return { lines: [], action: { type: "exit" } };
  }
  return { lines: [fmt(tt.unknown, { cmd: clean.length > 40 ? `${clean.slice(0, 40)}…` : clean })] };
}
