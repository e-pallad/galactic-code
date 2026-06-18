import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fleets, fleetMembers, users } from "@/lib/db/schema"
import { eq, sql, desc } from "drizzle-orm"
import { getClerkId } from "@/lib/auth"

export async function GET() {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rank by the live sum of members' XP so the board is always accurate, even
  // as members earn XP after joining.
  const topFleets = await db
    .select({
      id: fleets.id,
      name: fleets.name,
      tag: fleets.tag,
      emblem: fleets.emblem,
      totalXp: sql<number>`COALESCE(SUM(${users.totalXp}), 0)`,
      memberCount: sql<number>`COUNT(${fleetMembers.userId})`,
    })
    .from(fleets)
    .leftJoin(fleetMembers, eq(fleetMembers.fleetId, fleets.id))
    .leftJoin(users, eq(users.id, fleetMembers.userId))
    .groupBy(fleets.id)
    .orderBy(desc(sql`COALESCE(SUM(${users.totalXp}), 0)`))
    .limit(20)

  return NextResponse.json({
    fleets: topFleets.map((f) => ({ ...f, totalXp: Number(f.totalXp), memberCount: Number(f.memberCount) })),
  })
}
