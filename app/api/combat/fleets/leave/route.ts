import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fleets, fleetMembers } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { eq, and, ne } from "drizzle-orm"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

export async function POST() {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  const [membership] = await db.select().from(fleetMembers).where(eq(fleetMembers.userId, user.id)).limit(1)
  if (!membership) return NextResponse.json({ error: "Not in a fleet" }, { status: 404 })
  if (membership.role === "captain") {
    // Check if there are other members
    const others = await db.select().from(fleetMembers)
      .where(and(eq(fleetMembers.fleetId, membership.fleetId), ne(fleetMembers.userId, user.id)))
      .limit(1)
    if (others.length > 0) return NextResponse.json({ error: "Transfer captaincy before leaving" }, { status: 400 })
    // Delete the fleet entirely (captain leaving empty fleet)
    await db.delete(fleetMembers).where(eq(fleetMembers.userId, user.id))
    await db.delete(fleets).where(eq(fleets.id, membership.fleetId))
  } else {
    await db.delete(fleetMembers).where(eq(fleetMembers.userId, user.id))
  }

  return NextResponse.json({ success: true })
}
