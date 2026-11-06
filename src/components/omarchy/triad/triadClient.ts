import type { Lang } from "@/i18n";
import { getTriadUrl } from "@/lib/config";
import type { Core, CoreId, TriadResponse } from "../../../../amplify/functions/triad/parse";
import { localAnswer } from "./fallback";

export type { Core, CoreId, TriadResponse };
/** Why an answer came from the local pool: the hourly quota (per IP), the global ceiling, or anything else. */
export type OfflineReason = "quota" | "busy" | "error";
/** Telemetry the backend attaches to a live answer. */
export type TriadMeta = { ms: number; model: string; region: string; retried: boolean };
export type TriadResult = { response: TriadResponse; offline: boolean; reason?: OfflineReason; meta?: TriadMeta };
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

/** Strictly validated telemetry, or undefined (never shown unless every field looks right). */
export function toMeta(data: unknown): TriadMeta | undefined {
  const m = data as Partial<TriadMeta> | null | undefined;
  if (!m || typeof m !== "object") return undefined;
  if (typeof m.ms !== "number" || !Number.isFinite(m.ms) || m.ms < 0 || m.ms > 60_000) return undefined;
  if (typeof m.model !== "string" || !/^[a-z0-9.:-]{1,40}$/i.test(m.model)) return undefined;
  if (typeof m.region !== "string" || !/^[a-z]{2}-[a-z]+-\d$/.test(m.region)) return undefined;
  if (typeof m.retried !== "boolean") return undefined;
  return { ms: Math.round(m.ms), model: m.model, region: m.region, retried: m.retried };
}

/** "1.08 s · amazon.nova-lite · us-east-1 · Lambda → Bedrock Converse" (plus "· retry" when it took two calls). */
export function metaLine(m: TriadMeta): string {
  return `${(m.ms / 1000).toFixed(2)} s · ${m.model} · ${m.region} · Lambda → Bedrock Converse${m.retried ? " · retry" : ""}`;
}

/** "2–1": YES votes – NO votes. */
export function scoreOf(r: TriadResponse): string {
  const yes = r.cores.filter((c) => c.vote === "YES").length;
  return `${yes}–${3 - yes}`;
}

/**
 * Asks the TRIAD backend; never rejects — any failure answers from the local pool with `offline: true`
 * and a `reason` (429 `rate_limited` → "quota", 429 `busy` → "busy", anything else → "error").
 */
export async function askTriad(question: string, lang: Lang, deps: Deps = {}): Promise<TriadResult> {
  const q = question.trim().slice(0, MAX_QUESTION);
  const offline = (reason: OfflineReason = "error"): TriadResult => ({ response: localAnswer(q, lang), offline: true, reason });
  const url = deps.url === undefined ? resolveTriadUrl() : deps.url;
  if (!url) return offline();

  const doFetch = deps.fetch ?? globalThis.fetch;
  const ctrl = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<OfflineReason>((resolve) => {
    timer = setTimeout(() => {
      ctrl.abort();
      resolve("error");
    }, deps.timeoutMs ?? TIMEOUT_MS);
  });
  let meta: TriadMeta | undefined;
  const request = (async (): Promise<TriadResponse | OfflineReason> => {
    // No explicit content-type: a text/plain body is a CORS "simple request" (no preflight round trip);
    // the Lambda parses the JSON body regardless.
    const res = await doFetch(url, { method: "POST", body: JSON.stringify({ question: q, lang }), signal: ctrl.signal });
    if (res.status === 429) {
      const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
      return body?.error === "busy" ? "busy" : "quota";
    }
    if (!res.ok) return "error";
    const data = (await res.json()) as { meta?: unknown };
    meta = toMeta(data?.meta);
    return toResponse(data) ?? "error";
  })().catch((): OfflineReason => "error");

  try {
    const out = await Promise.race([request, timeout]);
    return typeof out === "string" ? offline(out) : { response: out, offline: false, ...(meta ? { meta } : {}) };
  } catch {
    return offline();
  } finally {
    clearTimeout(timer);
  }
}
