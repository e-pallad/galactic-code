import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fleets, fleetMembers, users } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { eq } from "drizzle-orm"

export async function GET() {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const [membership] = await db.select().from(fleetMembers).where(eq(fleetMembers.userId, user.id)).limit(1)
  if (!membership) return NextResponse.json({ fleet: null, members: [] })

  const [fleet] = await db.select().from(fleets).where(eq(fleets.id, membership.fleetId)).limit(1)
  const members = await db
    .select({ member: fleetMembers, user: { id: users.id, name: users.name, avatarUrl: users.avatarUrl, rank: users.rank, totalXp: users.totalXp } })
    .from(fleetMembers)
    .innerJoin(users, eq(users.id, fleetMembers.userId))
    .where(eq(fleetMembers.fleetId, membership.fleetId))

  return NextResponse.json({ fleet, members, myRole: membership.role })
}
