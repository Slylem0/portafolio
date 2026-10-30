import { describe, it, expect, vi, afterEach } from "vitest";
import { createHandler } from "../../amplify/functions/triad/handler";

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
    const d = deps({ db: { increment: vi.fn(async () => 11) } });
    const r: any = await createHandler(d)(ev({ question: "hi" }));
    expect(r.statusCode).toBe(429);
    expect(d.converse).not.toHaveBeenCalled();
  });
  it("502 on garbage output", async () => {
    const r: any = await createHandler(deps({ converse: async () => "garbage" }))(ev({ question: "hi" }));
    expect(r.statusCode).toBe(502);
  });
  it("502 when model throws", async () => {
    const r: any = await createHandler(deps({ converse: async () => { throw new Error("x"); } }))(ev({ question: "hi" }));
    expect(r.statusCode).toBe(502);
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
});
