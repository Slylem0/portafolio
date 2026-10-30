export type CoreId = "ENGINEER" | "COWBOY" | "STUDENT";
export type Core = { id: CoreId; vote: "YES" | "NO"; line: string };
export type TriadResponse = { cores: [Core, Core, Core]; verdict: "APPROVED" | "REJECTED" };

const IDS: CoreId[] = ["ENGINEER", "COWBOY", "STUDENT"];
const MAX_LINE = 160;
export const MAX_QUESTION = 200;

export function parseModelOutput(text: string): TriadResponse | null {
  if (typeof text !== "string") return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let data: unknown;
  try {
    data = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  const raw = (data as { cores?: unknown })?.cores;
  if (!Array.isArray(raw) || raw.length !== 3) return null;
  const byId = new Map<CoreId, Core>();
  for (const c of raw) {
    if (!c || typeof c !== "object") return null;
    const { id, vote, line } = c as Record<string, unknown>;
    if (typeof id !== "string" || !IDS.includes(id as CoreId)) return null;
    if (byId.has(id as CoreId)) return null;
    if (vote !== "YES" && vote !== "NO") return null;
    if (typeof line !== "string") return null;
    byId.set(id as CoreId, { id: id as CoreId, vote, line: line.slice(0, MAX_LINE) });
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
