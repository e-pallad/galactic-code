import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getClerkId } from "@/lib/auth"
import { eq, desc, and, isNull } from "drizzle-orm"

export async function GET() {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const topPilots = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      totalXp: users.totalXp,
      rank: users.rank,
      streak: users.streak,
      track: users.track,
    })
    .from(users)
    .where(and(eq(users.showOnLeaderboard, true), isNull(users.deletedAt)))
    .orderBy(desc(users.totalXp))
    .limit(50)

  return NextResponse.json({ pilots: topPilots })
}
