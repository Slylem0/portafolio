import { describe, it, expect } from "vitest";
import { checkGlobalLimit, checkRateLimit } from "../../amplify/functions/triad/rateLimit";

function fakeDb() {
  const counts = new Map<string, number>();
  const keys: string[] = [];
  const ttls: number[] = [];
  return {
    keys,
    ttls,
    async increment(key: string, ttl: number) {
      keys.push(key);
      ttls.push(ttl);
      const n = (counts.get(key) ?? 0) + 1;
      counts.set(key, n);
      return n;
    },
  };
}

describe("checkRateLimit", () => {
  const now = new Date("2026-10-30T10:15:00Z");
  it("allows 30th, refuses 31st", async () => {
    const db = fakeDb();
    for (let i = 1; i <= 30; i++) expect(await checkRateLimit(db, "1.2.3.4", now)).toBe(true);
    expect(await checkRateLimit(db, "1.2.3.4", now)).toBe(false);
  });
  it("different hour is allowed", async () => {
    const db = fakeDb();
    for (let i = 0; i < 31; i++) await checkRateLimit(db, "1.2.3.4", now);
    expect(await checkRateLimit(db, "1.2.3.4", new Date("2026-10-30T11:00:00Z"))).toBe(true);
  });
  it("never includes raw IP; ttl is now+2h", async () => {
    const db = fakeDb();
    await checkRateLimit(db, "1.2.3.4", now);
    expect(db.keys[0]).not.toContain("1.2.3.4");
    expect(db.keys[0]).toMatch(/^[0-9a-f]{64}:/);
    expect(db.ttls[0]).toBe(Math.floor(now.getTime() / 1000) + 7200);
  });
});

describe("checkGlobalLimit", () => {
  const now = new Date("2026-10-30T10:15:00Z");
  it("allows 300th, refuses 301st, across IPs; key global:<UTC hour>, ttl now+2h", async () => {
    const db = fakeDb();
    for (let i = 1; i <= 300; i++) expect(await checkGlobalLimit(db, now)).toBe(true);
    expect(await checkGlobalLimit(db, now)).toBe(false);
    expect(db.keys[0]).toBe("global:2026-10-30T10");
    expect(db.ttls[0]).toBe(Math.floor(now.getTime() / 1000) + 7200);
    expect(await checkGlobalLimit(db, new Date("2026-10-30T11:00:00Z"))).toBe(true);
  });
});
