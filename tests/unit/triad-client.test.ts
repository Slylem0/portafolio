import { describe, it, expect, vi, afterEach } from "vitest";
import { askTriad, scoreOf } from "@/components/omarchy/triad/triadClient";
import { localAnswer, POOL_SIZE } from "@/components/omarchy/triad/fallback";

const URL = "https://triad.example.on.aws/";
const valid = {
  cores: [
    { id: "ENGINEER", vote: "YES", line: "Solid plan." },
    { id: "COWBOY", vote: "NO", line: "Eh." },
    { id: "STUDENT", vote: "YES", line: "Let's learn." },
  ],
  verdict: "APPROVED",
};
const res = (status: number, body: unknown) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

function expectShape(r: { cores: { id: string; vote: string; line: string }[]; verdict: string }) {
  expect(r.cores.map((c) => c.id)).toEqual(["ENGINEER", "COWBOY", "STUDENT"]);
  for (const c of r.cores) {
    expect(["YES", "NO"]).toContain(c.vote);
    expect(c.line.length).toBeGreaterThan(0);
  }
  const yes = r.cores.filter((c) => c.vote === "YES").length;
  expect(r.verdict).toBe(yes >= 2 ? "APPROVED" : "REJECTED");
}

afterEach(() => vi.useRealTimers());

describe("askTriad", () => {
  it("null url → offline local answer without fetching", async () => {
    const fetch = vi.fn();
    const r = await askTriad("Should I learn Go?", "en", { url: null, fetch });
    expect(r.offline).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
    expectShape(r.response);
  });
  it("fetch rejects → offline", async () => {
    const r = await askTriad("q", "en", { url: URL, fetch: vi.fn(async () => { throw new TypeError("net"); }) });
    expect(r.offline).toBe(true);
    expectShape(r.response);
  });
  it("429 → offline", async () => {
    const r = await askTriad("q", "en", { url: URL, fetch: vi.fn(async () => res(429, { error: "rate_limited" })) });
    expect(r.offline).toBe(true);
  });
  it("502 → offline", async () => {
    const r = await askTriad("q", "es", { url: URL, fetch: vi.fn(async () => res(502, { error: "x" })) });
    expect(r.offline).toBe(true);
  });
  it("8 s timeout → offline (and aborts the request)", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const fetch = vi.fn((_u: unknown, init?: RequestInit) => {
      signal = init?.signal ?? undefined;
      return new Promise<Response>(() => {}); // never settles, even on abort
    });
    const p = askTriad("q", "en", { url: URL, fetch: fetch as unknown as typeof globalThis.fetch });
    let settled = false;
    p.then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(7_999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const r = await p;
    expect(r.offline).toBe(true);
    expect(signal?.aborted).toBe(true);
  });
  it("malformed 200 body → offline", async () => {
    for (const body of ["not json", { cores: [] }, { cores: [valid.cores[0], valid.cores[1], { id: "X", vote: "YES", line: "" }] }]) {
      const r = await askTriad("q", "en", { url: URL, fetch: vi.fn(async () => res(200, body)) });
      expect(r.offline).toBe(true);
    }
  });
  it("valid 200 → offline:false with server cores; verdict recomputed from votes", async () => {
    const fetch = vi.fn(async () => res(200, { ...valid, verdict: "REJECTED" }));
    const r = await askTriad("  Should I learn Go?  ", "es", { url: URL, fetch });
    expect(r.offline).toBe(false);
    expect(r.response.cores[1].line).toBe("Eh.");
    expect(r.response.verdict).toBe("APPROVED");
    const [u, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(u).toBe(URL);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ question: "Should I learn Go?", lang: "es" });
  });
  it("never rejects even if fetch throws synchronously", async () => {
    const r = await askTriad("q", "en", { url: URL, fetch: (() => { throw new Error("sync"); }) as unknown as typeof fetch });
    expect(r.offline).toBe(true);
  });
});

describe("localAnswer", () => {
  it("is deterministic per question and consistent with votes", () => {
    const a = localAnswer("Pineapple on pizza?", "en");
    expect(localAnswer("Pineapple on pizza?", "en")).toEqual(a);
    expectShape(a);
  });
  it("has at least 12 answers per language and varies across questions", () => {
    expect(POOL_SIZE.en).toBeGreaterThanOrEqual(12);
    expect(POOL_SIZE.es).toBeGreaterThanOrEqual(12);
    const seen = new Set(Array.from({ length: 60 }, (_, i) => JSON.stringify(localAnswer(`question ${i}`, "en"))));
    expect(seen.size).toBeGreaterThan(5);
  });
  it("questions about Pablo always resolve APPROVED (deterministic)", () => {
    for (const lang of ["en", "es"] as const) {
      const a = localAnswer("Is Pablo a good developer?", lang);
      expect(a.verdict).toBe("APPROVED");
      expect(localAnswer("Is Pablo a good developer?", lang)).toEqual(a);
      expectShape(a);
      for (let i = 0; i < 100; i++) expect(localAnswer(`pABLO question ${i}`, lang).verdict).toBe("APPROVED");
    }
  });
  it("answers in the requested language", () => {
    const en = localAnswer("Should I learn Go next?", "en");
    const es = localAnswer("Should I learn Go next?", "es");
    expect(en.cores[0].line).not.toBe(es.cores[0].line);
    expectShape(es);
  });
  it("every pool entry is well-formed in both languages", () => {
    for (let i = 0; i < 400; i++) {
      expectShape(localAnswer(`q${i}`, "en"));
      expectShape(localAnswer(`q${i}`, "es"));
    }
  });
});

describe("scoreOf", () => {
  it("formats yes–no with an en dash", () => {
    expect(scoreOf(valid as any)).toBe("2–1");
  });
});
