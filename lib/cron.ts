import { createHash, timingSafeEqual } from "crypto"

/**
 * Vercel Cron invokes with `Authorization: Bearer ${CRON_SECRET}`; `x-cron-secret`
 * is kept for manual triggering. Both sides are hashed first so the comparison is
 * constant-time whatever the lengths.
 */
export function isCronAuthorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const given = bearer ?? req.headers.get("x-cron-secret")
  if (!expected || !given) return false
  const digest = (v: string) => createHash("sha256").update(v).digest()
  return timingSafeEqual(digest(given), digest(expected))
}

/** Runs `fn` over `items` a few at a time; one failure never stops the rest. Returns the success count. */
export async function sendInBatches<T>(items: T[], fn: (item: T) => Promise<unknown>, size = 5): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0
  for (let i = 0; i < items.length; i += size) {
    const results = await Promise.allSettled(items.slice(i, i + size).map(fn))
    for (const r of results) {
      if (r.status === "fulfilled") sent++
      else failed++
    }
  }
  return { sent, failed }
}
