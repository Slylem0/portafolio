export type CoreId = "ENGINEER" | "COWBOY" | "STUDENT";
export type Core = { id: CoreId; vote: "YES" | "NO"; line: string };
export type TriadResponse = { cores: [Core, Core, Core]; verdict: "APPROVED" | "REJECTED" };

const IDS: CoreId[] = ["ENGINEER", "COWBOY", "STUDENT"];
const MAX_LINE = 160;
export const MAX_QUESTION = 200;

function tryParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return undefined;
  const whole = tryParse(text.slice(start, end + 1));
  if (whole !== undefined) return whole;
  // Fallback: first balanced-brace object (string-aware).
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return tryParse(text.slice(start, i + 1));
  }
  return undefined;
}

export function parseModelOutput(text: string): TriadResponse | null {
  if (typeof text !== "string") return null;
  const data = extractJson(text);
  if (data === undefined) return null;
  const raw = (data as { cores?: unknown })?.cores;
  if (!Array.isArray(raw) || raw.length !== 3) return null;
  const byId = new Map<CoreId, Core>();
  for (const c of raw) {
    if (!c || typeof c !== "object") return null;
    const { id, vote, line } = c as Record<string, unknown>;
    if (typeof id !== "string" || !IDS.includes(id as CoreId)) return null;
    if (byId.has(id as CoreId)) return null;
    const v = typeof vote === "string" ? vote.toUpperCase() : "";
    if (v !== "YES" && v !== "NO") return null;
    if (typeof line !== "string") return null;
    byId.set(id as CoreId, { id: id as CoreId, vote: v, line: line.slice(0, MAX_LINE) });
  }
  const cores = IDS.map((i) => byId.get(i)) as [Core, Core, Core];
  if (cores.some((c) => !c)) return null;
  const yes = cores.filter((c) => c.vote === "YES").length;
  return { cores, verdict: yes >= 2 ? "APPROVED" : "REJECTED" };
}

export function validateQuestion(body: unknown): { question: string; lang: "en" | "es" } | null {
  if (!body || typeof body !== "object") return null;
  const { question, lang } = body as Record<string, unknown>;
  if (typeof question !== "string") return null;
  const q = question.trim();
  if (q.length < 1 || q.length > MAX_QUESTION) return null;
  return { question: q, lang: lang === "es" ? "es" : "en" };
}
