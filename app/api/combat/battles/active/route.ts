import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { battles, battleParticipants, entities } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { eq, and } from "drizzle-orm"

export async function GET() {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const [row] = await db
    .select({ battle: battles, entity: entities })
    .from(battleParticipants)
    .innerJoin(battles, eq(battles.id, battleParticipants.battleId))
    .innerJoin(entities, eq(entities.id, battles.entityId))
    .where(and(eq(battleParticipants.userId, user.id), eq(battles.status, "active")))
    .limit(1)

  return NextResponse.json({ battle: row?.battle ?? null, entity: row?.entity ?? null })
}
