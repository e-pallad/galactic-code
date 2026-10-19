import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and, isNull, ne, lt, sql } from "drizzle-orm"
import { getClerkId, isDemo } from "@/lib/auth"
import { getUser, awardXP } from "@/lib/missions"
import { REFERRAL_LIMITS } from "@/lib/xp"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

export async function POST() {
  if (await isDemo()) return NextResponse.json({ claimed: false })

  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const jar = await cookies()
  const refCode = jar.get("gc_ref")?.value
  if (!refCode) return NextResponse.json({ claimed: false })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  if (user.referredBy) {
    const response = NextResponse.json({ claimed: false })
    response.cookies.delete("gc_ref")
    return response
  }

  const [referrer] = await db
    .select()
    .from(users)
    .where(and(eq(users.referralCode, refCode), ne(users.id, user.id), isNull(users.deletedAt)))
    .limit(1)

  if (!referrer) {
    return NextResponse.json({ claimed: false })
  }

  // Claim the sign-up atomically: only the request that flips referred_by from
  // NULL goes on to pay, so parallel claims can't pay twice.
  const claimed = await db
    .update(users)
    .set({ referredBy: referrer.id })
    .where(and(eq(users.id, user.id), isNull(users.referredBy)))
    .returning({ id: users.id })
  if (claimed.length === 0) {
    const response = NextResponse.json({ claimed: false })
    response.cookies.delete("gc_ref")
    return response
  }

  // Reserve one of the referrer's rewarded slots; past the cap the link is undone.
  const slot = await db
    .update(users)
    .set({ referralCount: sql`${users.referralCount} + 1` })
    .where(and(eq(users.id, referrer.id), lt(users.referralCount, REFERRAL_LIMITS.maxRewarded)))
    .returning({ id: users.id })
  if (slot.length === 0) {
    await db.update(users).set({ referredBy: null }).where(eq(users.id, user.id))
    const response = NextResponse.json({ claimed: false })
    response.cookies.delete("gc_ref")
    return response
  }

  await Promise.all([awardXP(user.id, REFERRAL_LIMITS.xpEach), awardXP(referrer.id, REFERRAL_LIMITS.xpEach)])

  const response = NextResponse.json({ claimed: true, xpAwarded: REFERRAL_LIMITS.xpEach })
  response.cookies.delete("gc_ref")
  return response
}
