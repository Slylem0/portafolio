import { describe, it, expect } from "vitest";
import { sessions } from "@/data/sessions";
import { skills } from "@/data/skills";
import { profile } from "@/data/profile";
import { log } from "@/data/log";

describe("data", () => {
  it("7 sessions numbered 1..7 in spec order", () => {
    expect(sessions.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(sessions.map((s) => s.slug)).toEqual([
      "shaggy-barber", "grandmas-bouncer", "dr-cloud", "aws-daily-topic-agent",
      "quantum-dice", "omarchy-display-switch", "compressed-range-engine",
    ]);
  });
  it("shaggy barber status says in production prep", () => {
    expect(sessions[0].status?.en).toContain("IN PRODUCTION PREP");
  });
  it("no instagram link anywhere", () => {
    expect(JSON.stringify({ profile, sessions, log }).toLowerCase()).not.toContain("instagram");
  });
  it("every sync is 0..100", () => {
    for (const g of skills) for (const i of g.items) {
      expect(i.sync).toBeGreaterThanOrEqual(0);
      expect(i.sync).toBeLessThanOrEqual(100);
    }
  });
  it("log is newest first", () => {
    const d = log.map((l) => l.date);
    expect([...d].sort().reverse()).toEqual(d);
  });
});
