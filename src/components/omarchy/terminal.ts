import type { Dict, Lang } from "@/i18n";
import { sessions } from "@/data/sessions";
import { skills } from "@/data/skills";
import { profile } from "@/data/profile";
import { THEMES, type Theme } from "./windows/DisplaySwitchWin";
import type { WsNum } from "./TopBar";

export type TermAction =
  | { type: "openSession"; n: number }
  | { type: "lang"; lang: Lang }
  | { type: "triad"; question: string }
  | { type: "theme"; theme: Theme }
  | { type: "workspace"; n: WsNum }
  | { type: "atfield" }
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

/** Command names (first word) for typo suggestions. */
const NAMES = [
  "help", "whoami", "ls", "cat", "neofetch", "open", "lang", "clear", "exit",
  "triad", "aws", "skills", "contact", "theme", "ws", "history",
];

/** Everything Tab can complete to (a trailing space means "an argument follows"). */
const COMPLETIONS = [
  "help", "whoami", "ls sessions", "cat about.md", "neofetch", "open ", "lang en", "lang es",
  "clear", "exit", "triad ", "aws architecture", "aws services", "skills", "contact",
  ...THEMES.map((th) => `theme ${th}`), "ws ", "history",
];

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Closest command name to a mistyped one (edit distance 2 at most), or null. */
export function suggest(word: string): string | null {
  const w = word.toLowerCase();
  if (w.length < 3 || NAMES.includes(w)) return null;
  let best: string | null = null;
  let bestD = 3;
  for (const n of NAMES) {
    const dd = distance(w, n);
    if (dd < bestD) {
      bestD = dd;
      best = n;
    }
  }
  return best;
}

/**
 * Tab completion: the input extended as far as all matches agree, plus the matches themselves
 * (so the shell can list them when there is more than one). Null when nothing matches.
 */
export function complete(input: string): { value: string; options: string[] } | null {
  const q = input.replace(/^\s+/, "").replace(/\s+/g, " ").toLowerCase();
  if (!q) return null;
  const options = COMPLETIONS.filter((c) => c.startsWith(q));
  if (!options.length) return null;
  let value = options[0];
  for (const o of options) {
    let i = 0;
    while (i < value.length && i < o.length && value[i] === o[i]) i++;
    value = value.slice(0, i);
  }
  return { value, options };
}

/** The A.T. Field, drawn as an Eva cross. */
const AT_FIELD = [
  "           ##",
  "           ##",
  "  #####################",
  "           ##",
  "           ##",
  "           ##",
  "           ##",
  "           ##",
];

const BAR = 10;
function skillLines(): string[] {
  const width = Math.max(...skills.flatMap((g) => g.items.map((i) => i.name.length)));
  return skills.flatMap((g, gi) => [
    ...(gi ? [""] : []),
    `[${g.id.toUpperCase()}]`,
    ...g.items.map((i) => {
      const lit = Math.round((i.sync / 100) * BAR);
      return `  ${i.name.padEnd(width)}  ${"#".repeat(lit)}${".".repeat(BAR - lit)}  ${String(i.sync).padStart(3)}%`;
    }),
  ]);
}

export function runCommand(
  input: string,
  ctx: { lang: Lang; t: Dict; history?: string[] },
): TermResult {
  const { t } = ctx;
  const tt = t.omarchy.terminal;
  const clean = input.trim().replace(/\s+/g, " ");
  const norm = clean.toLowerCase();
  if (!norm) return { lines: [] };
  // Classified: wiping the filesystem (with or without sudo) deploys the A.T. Field.
  if (/^(sudo )?rm -rf \/\*?$/.test(norm))
    return { lines: [...AT_FIELD, "", tt.atField], action: { type: "atfield" } };
  if (norm === "see you space cowboy" || norm === "see you space cowboy...") return { lines: [tt.cowboy] };
  const [cmd, ...args] = norm.split(" ");
  // Original-case text after the command word (for TRIAD questions).
  const rest = clean.slice(clean.indexOf(" ") + 1);

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
    case "triad":
      if (!args.length) return { lines: [tt.usageTriad] };
      return { lines: [tt.triadAsking], action: { type: "triad", question: rest } };
    case "aws":
      if (args.length === 1 && args[0] === "architecture") return { lines: [...tt.awsArchitecture] };
      if (args.length === 1 && args[0] === "services") return { lines: [...tt.awsServices] };
      return { lines: [tt.usageAws] };
    case "skills":
      return { lines: skillLines() };
    case "contact":
      return {
        lines: [
          `  email     ${profile.email}`,
          `  github    ${profile.github.replace(/^https:\/\//, "")}`,
          `  linkedin  ${profile.linkedin.replace(/^https:\/\/www\./, "")}`,
        ],
      };
    case "theme": {
      const th = args[0] as Theme;
      if (args.length === 1 && THEMES.includes(th))
        return { lines: [fmt(tt.themeSet, { theme: th })], action: { type: "theme", theme: th } };
      return { lines: [tt.usageTheme] };
    }
    case "ws": {
      const n = args.length === 1 && /^[1-5]$/.test(args[0]) ? (Number(args[0]) as WsNum) : null;
      if (n) return { lines: [fmt(tt.wsSet, { n })], action: { type: "workspace", n } };
      return { lines: [tt.usageWs] };
    }
    case "history": {
      const h = [...(ctx.history ?? [])].reverse();
      if (!h.length) return { lines: [tt.historyEmpty] };
      return { lines: h.map((c, i) => `${String(i + 1).padStart(3)}  ${c}`) };
    }
    case "sudo":
      return { lines: [tt.sudoPrompt, tt.sudoDenied] };
    case "pacman": {
      if (args[0] !== "-s" || !args[1]) return { lines: [tt.usagePacman] };
      const pkg = rest.split(" ").slice(1).join(" ").slice(0, 30);
      return {
        lines: [tt.pacmanSync, args[1] === "pablo" ? tt.pacmanSelf : fmt(tt.pacmanFound, { pkg })],
      };
    }
    case "hyprctl":
      return { lines: [tt.hyprctl] };
    case "clear":
      return { lines: [], action: { type: "clear" } };
    case "exit":
      return { lines: [], action: { type: "exit" } };
  }
  const lines = [fmt(tt.unknown, { cmd: clean.length > 40 ? `${clean.slice(0, 40)}…` : clean })];
  const guess = suggest(cmd);
  if (guess) lines.push(fmt(tt.didYouMean, { cmd: guess }));
  return { lines };
}
