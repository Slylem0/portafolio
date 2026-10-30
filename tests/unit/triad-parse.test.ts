import { describe, it, expect } from "vitest";
import { parseModelOutput, validateQuestion } from "../../amplify/functions/triad/parse";

const core = (id: string, vote: string, line = "ok") => ({ id, vote, line });
const mk = (votes: [string, string, string], line = "ok") => ({
  cores: [core("ENGINEER", votes[0], line), core("COWBOY", votes[1], line), core("STUDENT", votes[2], line)],
});

describe("parseModelOutput", () => {
  it("parses valid JSON", () => {
    const r = parseModelOutput(JSON.stringify(mk(["YES", "YES", "NO"])));
    expect(r?.cores).toHaveLength(3);
    expect(r?.verdict).toBe("APPROVED");
  });
  it("parses fenced json", () => {
    const r = parseModelOutput("```json\n" + JSON.stringify(mk(["YES", "YES", "YES"])) + "\n```");
    expect(r?.verdict).toBe("APPROVED");
  });
  it("parses with prose around", () => {
    const r = parseModelOutput("Sure! " + JSON.stringify(mk(["NO", "NO", "YES"])) + " Hope it helps.");
    expect(r?.verdict).toBe("REJECTED");
  });
  it("null when a core is missing", () => {
    const m = mk(["YES", "YES", "YES"]);
    m.cores.pop();
    expect(parseModelOutput(JSON.stringify(m))).toBeNull();
  });
  it("null on duplicate core", () => {
    const m = mk(["YES", "YES", "YES"]);
    m.cores[2].id = "COWBOY";
    expect(parseModelOutput(JSON.stringify(m))).toBeNull();
  });
  it("null on invalid vote", () => {
    expect(parseModelOutput(JSON.stringify(mk(["YES", "MAYBE", "NO"])))).toBeNull();
  });
  it("null on garbage", () => {
    expect(parseModelOutput("no json here")).toBeNull();
    expect(parseModelOutput("{broken")).toBeNull();
  });
  it("truncates lines to 160", () => {
    const r = parseModelOutput(JSON.stringify(mk(["YES", "YES", "YES"], "x".repeat(500))));
    expect(r?.cores.every((c) => c.line.length === 160)).toBe(true);
  });
  it("computes verdict by majority, ignoring model claim", () => {
    const m = { ...mk(["YES", "NO", "NO"]), verdict: "APPROVED" };
    expect(parseModelOutput(JSON.stringify(m))?.verdict).toBe("REJECTED");
  });
});

describe("validateQuestion", () => {
  it("accepts and trims", () => {
    expect(validateQuestion({ question: "  hi?  ", lang: "es" })).toEqual({ question: "hi?", lang: "es" });
  });
  it("defaults lang to en", () => {
    expect(validateQuestion({ question: "hi" })?.lang).toBe("en");
  });
  it("rejects empty, long, non-object", () => {
    expect(validateQuestion({ question: "   " })).toBeNull();
    expect(validateQuestion({ question: "a".repeat(201) })).toBeNull();
    expect(validateQuestion({ question: 5 })).toBeNull();
    expect(validateQuestion(null)).toBeNull();
    expect(validateQuestion("x")).toBeNull();
  });
});
