import { createHash } from "node:crypto";

export const LIMIT_PER_HOUR = 10;

export async function checkRateLimit(
  db: { increment(key: string, ttl: number): Promise<number> },
  ip: string,
  now: Date,
): Promise<boolean> {
  const hash = createHash("sha256").update(ip).digest("hex");
  const hour = now.toISOString().slice(0, 13);
  const ttl = Math.floor(now.getTime() / 1000) + 2 * 3600;
  const count = await db.increment(`${hash}:${hour}`, ttl);
  return count <= LIMIT_PER_HOUR;
}
