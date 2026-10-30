import { createHmac } from "node:crypto";

// Task 11 must set TRIAD_SALT; the constant fallback is only for local/test use.
// 30/IP/hour leaves room for several judges behind one shared NAT.
export const LIMIT_PER_HOUR = 30;
// Global cost ceiling across all callers, whatever their IP.
export const GLOBAL_LIMIT_PER_HOUR = 300;

type Db = { increment(key: string, ttl: number): Promise<number> };

const hourOf = (now: Date) => now.toISOString().slice(0, 13);
const ttlOf = (now: Date) => Math.floor(now.getTime() / 1000) + 2 * 3600;

export async function checkRateLimit(db: Db, ip: string, now: Date): Promise<boolean> {
  const hash = createHmac("sha256", process.env.TRIAD_SALT || "triad-default-salt").update(ip).digest("hex");
  const count = await db.increment(`${hash}:${hourOf(now)}`, ttlOf(now));
  return count <= LIMIT_PER_HOUR;
}

/** Atomic hourly counter shared by every caller (key `global:<UTC hour>`, same table and TTL). */
export async function checkGlobalLimit(db: Db, now: Date): Promise<boolean> {
  const count = await db.increment(`global:${hourOf(now)}`, ttlOf(now));
  return count <= GLOBAL_LIMIT_PER_HOUR;
}
