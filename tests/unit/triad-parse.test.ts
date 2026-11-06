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

describe("parseModelOutput leniency", () => {
  it("accepts lowercase votes", () => {
    const r = parseModelOutput(JSON.stringify(mk(["yes", "No", "yes"])));
    expect(r?.cores.map((c) => c.vote)).toEqual(["YES", "NO", "YES"]);
  });
  it("falls back to balanced scan when trailing braces break whole-slice parse", () => {
    const r = parseModelOutput(JSON.stringify(mk(["YES", "YES", "NO"])) + " {note}");
    expect(r?.verdict).toBe("APPROVED");
  });
  it("balanced scan handles braces inside strings", () => {
    const r = parseModelOutput("x " + JSON.stringify(mk(["YES", "YES", "NO"], "a } b { c")) + " tail }");
    expect(r?.cores[0].line).toBe("a } b { c");
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

describe("parseModelOutput recovers Nova's malformed JSON (real outputs)", () => {
  it("stray quote before an object", () => {
    const text =
      '{"cores":[{"id":"ENGINEER","vote":"YES","line":"Pablo has solid cloud skills."},"{"id":"COWBOY","vote":"YES","line":"He\'s got the chops, trust me."},{"id":"STUDENT","vote":"YES","line":"Pablo\'s experience is promising."}]}';
    const r = parseModelOutput(text)!;
    expect(r.cores.map((c) => c.id)).toEqual(["ENGINEER", "COWBOY", "STUDENT"]);
    expect(r.cores[1].line).toBe("He's got the chops, trust me.");
    expect(r.verdict).toBe("APPROVED");
  });
  it("missing opening braces", () => {
    const text =
      '{"cores":[{"id":"ENGINEER","vote":"YES","line":"Pablo has solid cloud knowledge."},"id":"COWBOY","vote":"NO","line":"He\'s got the chops, partner."},"id":"STUDENT","vote":"NO","line":"Pablo\'s experience aligns well."}]';
    const r = parseModelOutput(text)!;
    expect(r.cores.map((c) => c.vote)).toEqual(["YES", "NO", "NO"]);
    expect(r.verdict).toBe("REJECTED");
  });
  it("keeps escaped quotes inside a line", () => {
    const text = '{"cores":[{"id":"ENGINEER","vote":"YES","line":"Say \\"ship it\\"."},"{"id":"COWBOY","vote":"YES","line":"Ride."},{"id":"STUDENT","vote":"NO","line":"Hmm."}]}';
    expect(parseModelOutput(text)!.cores[0].line).toBe('Say "ship it".');
  });
  it("still rejects a missing core so the handler retries", () => {
    const text = '{"cores":[{"id":"ENGINEER","vote":"YES","line":"Go is useful."},{"id":"COWBOY","vote":"YES","line":"Next up?"}]}';
    expect(parseModelOutput(text)).toBeNull();
  });
  it("still rejects duplicate cores and bad votes", () => {
    expect(parseModelOutput('"id":"ENGINEER","vote":"YES","line":"a" "id":"ENGINEER","vote":"NO","line":"b" "id":"STUDENT","vote":"YES","line":"c"')).toBeNull();
    expect(parseModelOutput('"id":"ENGINEER","vote":"MAYBE","line":"a" "id":"COWBOY","vote":"NO","line":"b" "id":"STUDENT","vote":"YES","line":"c"')).toBeNull();
  });
});
