import type { Lang } from "@/i18n";
import { getTriadUrl } from "@/lib/config";
import type { Core, CoreId, TriadResponse } from "../../../../amplify/functions/triad/parse";
import { localAnswer } from "./fallback";

export type { Core, CoreId, TriadResponse };
export type TriadResult = { response: TriadResponse; offline: boolean };
type Deps = { fetch?: typeof fetch; url?: string | null; timeoutMs?: number };

export const MAX_QUESTION = 200;
const TIMEOUT_MS = 8_000;
const MAX_LINE = 200;
const IDS: CoreId[] = ["ENGINEER", "COWBOY", "STUDENT"];

/**
 * TRIAD endpoint: `window.__TRIAD_URL__` when set (e2e tests inject a fake https URL so
 * `page.route` can intercept it; it only affects the browser that sets it), else amplify_outputs.json.
 */
export function resolveTriadUrl(): string | null {
  try {
    const o = (globalThis as { __TRIAD_URL__?: unknown }).__TRIAD_URL__;
    if (typeof o === "string" && o.startsWith("https://")) return o;
  } catch {
    /* ignore */
  }
  return getTriadUrl();
}

/** Strict client-side check of a 200 body; the verdict is recomputed from the votes. */
export function toResponse(data: unknown): TriadResponse | null {
  const raw = (data as { cores?: unknown } | null)?.cores;
  if (!Array.isArray(raw) || raw.length !== 3) return null;
  const cores: Core[] = [];
  for (let i = 0; i < 3; i++) {
    const c = raw[i] as Partial<Core> | null;
    if (!c || c.id !== IDS[i] || (c.vote !== "YES" && c.vote !== "NO") || typeof c.line !== "string") return null;
    const line = c.line.trim().slice(0, MAX_LINE);
    if (!line) return null;
    cores.push({ id: c.id, vote: c.vote, line });
  }
  const yes = cores.filter((c) => c.vote === "YES").length;
  return { cores: cores as [Core, Core, Core], verdict: yes >= 2 ? "APPROVED" : "REJECTED" };
}

/** "2–1": YES votes – NO votes. */
export function scoreOf(r: TriadResponse): string {
  const yes = r.cores.filter((c) => c.vote === "YES").length;
  return `${yes}–${3 - yes}`;
}

/** Asks the TRIAD backend; never rejects — any failure answers from the local pool with `offline: true`. */
export async function askTriad(question: string, lang: Lang, deps: Deps = {}): Promise<TriadResult> {
  const q = question.trim().slice(0, MAX_QUESTION);
  const offline = (): TriadResult => ({ response: localAnswer(q, lang), offline: true });
  const url = deps.url === undefined ? resolveTriadUrl() : deps.url;
  if (!url) return offline();

  const doFetch = deps.fetch ?? globalThis.fetch;
  const ctrl = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      ctrl.abort();
      resolve(null);
    }, deps.timeoutMs ?? TIMEOUT_MS);
  });
  const request = (async () => {
    // No explicit content-type: a text/plain body is a CORS "simple request" (no preflight round trip);
    // the Lambda parses the JSON body regardless.
    const res = await doFetch(url, { method: "POST", body: JSON.stringify({ question: q, lang }), signal: ctrl.signal });
    if (!res.ok) return null;
    return toResponse(await res.json());
  })().catch(() => null);

  try {
    const response = await Promise.race([request, timeout]);
    return response ? { response, offline: false } : offline();
  } catch {
    return offline();
  } finally {
    clearTimeout(timer);
  }
}
