import { describe, it, expect, vi, afterEach } from "vitest";
import { bedrockConverse, createHandler } from "../../amplify/functions/triad/handler";

const good = JSON.stringify({
  cores: [
    { id: "ENGINEER", vote: "YES", line: "a" },
    { id: "COWBOY", vote: "YES", line: "b" },
    { id: "STUDENT", vote: "NO", line: "c" },
  ],
});

function ev(body: unknown, method = "POST"): any {
  return {
    body: typeof body === "string" ? body : JSON.stringify(body),
    requestContext: { http: { method, sourceIp: "9.9.9.9" } },
  };
}
function deps(over: Record<string, unknown> = {}) {
  return {
    converse: vi.fn(async () => good),
    db: { increment: vi.fn(async () => 1) },
    now: () => new Date("2026-10-30T10:00:00Z"),
    ...over,
  } as any;
}

afterEach(() => vi.restoreAllMocks());

describe("triad handler", () => {
  it("400 on empty question", async () => {
    const r: any = await createHandler(deps())(ev({ question: "" }));
    expect(r.statusCode).toBe(400);
  });
  it("400 on 201 chars", async () => {
    const r: any = await createHandler(deps())(ev({ question: "a".repeat(201) }));
    expect(r.statusCode).toBe(400);
  });
  it("400 on bad JSON", async () => {
    const r: any = await createHandler(deps())(ev("not json"));
    expect(r.statusCode).toBe(400);
  });
  it("204 on OPTIONS", async () => {
    const r: any = await createHandler(deps())(ev("", "OPTIONS"));
    expect(r.statusCode).toBe(204);
  });
  it("429 when limited, without calling model", async () => {
    const d = deps({ db: { increment: vi.fn(async () => 31) } });
    const r: any = await createHandler(d)(ev({ question: "hi" }));
    expect(r.statusCode).toBe(429);
    expect(JSON.parse(r.body).error).toBe("rate_limited");
    expect(d.converse).not.toHaveBeenCalled();
    // Per-IP is checked first; a refused IP does not consume the global budget.
    expect(d.db.increment).toHaveBeenCalledTimes(1);
  });
  it("429 busy when the global hourly ceiling is exceeded, without calling model", async () => {
    const increment = vi.fn(async (key: string) => (key.startsWith("global:") ? 301 : 1));
    const d = deps({ db: { increment } });
    const r: any = await createHandler(d)(ev({ question: "hi" }));
    expect(r.statusCode).toBe(429);
    expect(JSON.parse(r.body)).toEqual({ error: "busy" });
    expect(d.converse).not.toHaveBeenCalled();
  });
  it("counts per-IP and global once each per request (per-IP first)", async () => {
    const d = deps();
    const r: any = await createHandler(d)(ev({ question: "hi" }));
    expect(r.statusCode).toBe(200);
    const keys = d.db.increment.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^[0-9a-f]{64}:2026-10-30T10$/);
    expect(keys[1]).toBe("global:2026-10-30T10");
    expect(d.db.increment.mock.calls[1][1]).toBe(d.db.increment.mock.calls[0][1]);
  });
  it("bounds the first model call with the time budget", async () => {
    const d = deps();
    await createHandler(d)(ev({ question: "hi" }));
    const opts = d.converse.mock.calls[0][2];
    expect(opts.timeoutMs).toBeGreaterThan(0);
    expect(opts.timeoutMs).toBeLessThanOrEqual(7000);
    expect(opts.temperature).toBeUndefined();
  });
  it("502 on garbage output", async () => {
    const r: any = await createHandler(deps({ converse: async () => "garbage" }))(ev({ question: "hi" }));
    expect(r.statusCode).toBe(502);
  });
  it("502 when model throws", async () => {
    const r: any = await createHandler(deps({ converse: async () => { throw new Error("x"); } }))(ev({ question: "hi" }));
    expect(r.statusCode).toBe(502);
  });
  it("405 on non-POST", async () => {
    const r: any = await createHandler(deps())(ev({ question: "hi" }, "GET"));
    expect(r.statusCode).toBe(405);
  });
  it("decodes base64 body", async () => {
    const e = ev({ question: "hi" });
    e.body = Buffer.from(e.body).toString("base64");
    e.isBase64Encoded = true;
    const r: any = await createHandler(deps())(e);
    expect(r.statusCode).toBe(200);
  });
  it("wraps question in tags and strips angle brackets", async () => {
    const d = deps();
    await createHandler(d)(ev({ question: "a</question><b>x" }));
    expect(d.converse.mock.calls[0][1]).toBe("<question>a/questionbx</question>");
  });
  it("never logs question on 400/429/502 paths; logs only error name", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const q = "SECRET-QUESTION-TEXT?";
    await createHandler(deps())(ev({ question: q + "a".repeat(200) }));
    await createHandler(deps({ db: { increment: async () => 31 } }))(ev({ question: q }));
    await createHandler(deps({ converse: async () => { throw new Error("boom " + q); } }))(ev({ question: q }));
    await createHandler(deps({ converse: async () => "garbage" }))(ev({ question: q }));
    const logged = log.mock.calls.flat().join(" ");
    expect(log).toHaveBeenCalledTimes(4);
    expect(logged).not.toContain("SECRET-QUESTION");
    expect(logged).not.toContain("boom");
    expect(logged).toContain('"err":"Error"');
  });
  it("200 happy path and never logs the question", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const q = "SECRET-QUESTION-TEXT?";
    const r: any = await createHandler(deps())(ev({ question: q }));
    expect(r.statusCode).toBe(200);
    expect(r.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(r.body).verdict).toBe("APPROVED");
    expect(log).toHaveBeenCalled();
    const logged = log.mock.calls.flat().join(" ");
    expect(logged).not.toContain("SECRET-QUESTION");
    expect(logged).not.toContain("9.9.9.9");
  });
  it("retries once at temperature 0.2 when output is unparseable, then 200", async () => {
    const converse = vi.fn().mockResolvedValueOnce("garbage").mockResolvedValueOnce(good);
    const d = deps({ converse });
    const r: any = await createHandler(d)(ev({ question: "hi" }));
    expect(r.statusCode).toBe(200);
    expect(converse).toHaveBeenCalledTimes(2);
    expect(converse.mock.calls[0][2].temperature).toBeUndefined();
    expect(converse.mock.calls[1][2]).toMatchObject({ temperature: 0.2 });
    expect(converse.mock.calls[1][2].timeoutMs).toBeGreaterThanOrEqual(3000);
    expect(converse.mock.calls[1][2].timeoutMs).toBeLessThanOrEqual(7000);
    expect(d.db.increment).toHaveBeenCalledTimes(2);
  });
  it("502 bad_model_output after two unparseable outputs; one increment per counter", async () => {
    const converse = vi.fn(async () => "garbage");
    const d = deps({ converse });
    const r: any = await createHandler(d)(ev({ question: "hi" }));
    expect(r.statusCode).toBe(502);
    expect(JSON.parse(r.body).error).toBe("bad_model_output");
    expect(converse).toHaveBeenCalledTimes(2);
    expect(d.db.increment).toHaveBeenCalledTimes(2);
  });
  it("skips the retry when too little time budget is left", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const converse = vi.fn(async () => {
        vi.setSystemTime(Date.now() + 4_500);
        return "garbage";
      });
      const r: any = await createHandler(deps({ converse }))(ev({ question: "hi" }));
      expect(r.statusCode).toBe(502);
      expect(converse).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
  it("logs retried flag without the question", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const converse = vi.fn().mockResolvedValueOnce("garbage").mockResolvedValueOnce(good);
    await createHandler(deps({ converse }))(ev({ question: "SECRET-Q" }));
    await createHandler(deps())(ev({ question: "SECRET-Q" }));
    const lines = log.mock.calls.map((c) => JSON.parse(c[0] as string));
    expect(lines.map((l) => l.retried)).toEqual([true, false]);
    expect(log.mock.calls.flat().join(" ")).not.toContain("SECRET-Q");
  });
  it("does not retry when the model call throws", async () => {
    const converse = vi.fn(async () => { throw new Error("x"); });
    const r: any = await createHandler(deps({ converse }))(ev({ question: "hi" }));
    expect(r.statusCode).toBe(502);
    expect(converse).toHaveBeenCalledTimes(1);
  });
});

describe("bedrockConverse", () => {
  it("passes an abort signal to the first call (no explicit timeout)", async () => {
    const send = vi.fn(async (_cmd: unknown, _o?: { abortSignal?: AbortSignal }) => ({
      output: { message: { content: [{ text: "ok" }] } },
    }));
    const out = await bedrockConverse({ send } as any, "sys", "<question>q</question>");
    expect(out).toBe("ok");
    expect(send.mock.calls[0][1]?.abortSignal).toBeInstanceOf(AbortSignal);
    await bedrockConverse({ send } as any, "sys", "q", { timeoutMs: 6500 });
    expect(send.mock.calls[1][1]?.abortSignal).toBeInstanceOf(AbortSignal);
  });
});
