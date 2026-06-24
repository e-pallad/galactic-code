import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and, isNull, ne, sql } from "drizzle-orm"
import { getClerkId, isDemo } from "@/lib/auth"
import { getUser, awardXP } from "@/lib/missions"

export async function POST() {
  if (await isDemo()) return NextResponse.json({ claimed: false })

  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const jar = await cookies()
  const refCode = jar.get("gc_ref")?.value
  if (!refCode) return NextResponse.json({ claimed: false })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

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

  await db.update(users).set({ referredBy: referrer.id }).where(eq(users.id, user.id))
  await db
    .update(users)
    .set({ referralCount: sql`${users.referralCount} + 1` })
    .where(eq(users.id, referrer.id))

  await Promise.all([awardXP(user.id, 50), awardXP(referrer.id, 50)])

  const response = NextResponse.json({ claimed: true, xpAwarded: 50 })
  response.cookies.delete("gc_ref")
  return response
}
