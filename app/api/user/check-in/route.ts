import { NextResponse } from "next/server"
import { getClerkId, isDemo } from "@/lib/auth"
import { getUser, awardDailyLoginXP, updateStreak } from "@/lib/missions"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/**
 * Daily check-in: pays the login XP and advances the streak. Both are
 * idempotent per local day, so calling this on every app load is safe.
 * Lives in a POST (not the dashboard render) so prefetches and refreshes of a
 * page can't write, and so it fires whichever page the pilot opens first.
 */
export async function POST() {
  // The demo pilot is shared and read-only.
  if (await isDemo()) return NextResponse.json({ changed: false })

  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  await Promise.all([awardDailyLoginXP(user.id), updateStreak(user.id)])

  const after = await getUser(clerkId)
  const changed = !!after && (after.totalXp !== user.totalXp || after.streak !== user.streak)
  return NextResponse.json({ changed })
}
