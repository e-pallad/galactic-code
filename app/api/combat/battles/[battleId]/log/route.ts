import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { battleLog, battles, battleParticipants } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { eq, and, asc } from "drizzle-orm"

export async function GET(req: Request, { params }: { params: Promise<{ battleId: string }> }) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { battleId } = await params
  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1)
  if (!battle) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Only participants may read a battle's log — otherwise any authed user could
  // enumerate battles by id and read their turn-by-turn history.
  const [participant] = await db.select().from(battleParticipants)
    .where(and(eq(battleParticipants.battleId, battleId), eq(battleParticipants.userId, user.id)))
    .limit(1)
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const logs = await db.select().from(battleLog).where(eq(battleLog.battleId, battleId)).orderBy(asc(battleLog.turnNumber))
  return NextResponse.json({ logs, battle })
}
