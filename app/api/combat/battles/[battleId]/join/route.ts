import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { battles, battleParticipants, battleLog } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { getOrCreateShip, getEquippedItems, getEffectiveStats } from "@/lib/combat"
import { eq, and } from "drizzle-orm"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

export async function POST(req: Request, { params }: { params: Promise<{ battleId: string }> }) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  const { battleId } = await params
  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1)
  if (!battle || battle.status !== "active") return NextResponse.json({ error: "Battle not found or ended" }, { status: 404 })
  if (!battle.fleetId) return NextResponse.json({ error: "Not a fleet battle" }, { status: 400 })

  // Check already in battle
  const [alreadyIn] = await db.select().from(battleParticipants)
    .where(and(eq(battleParticipants.battleId, battleId), eq(battleParticipants.userId, user.id)))
    .limit(1)
  if (alreadyIn) return NextResponse.json({ error: "Already in battle" }, { status: 409 })

  const ship = await getOrCreateShip(user.id)
  const equippedItems = await getEquippedItems(user.id)
  const stats = getEffectiveStats(ship, equippedItems)

  await db.insert(battleParticipants).values({
    battleId,
    userId: user.id,
    pilotHpRemaining: stats.hp,
  })

  const turnCount = await db.select().from(battleLog).where(eq(battleLog.battleId, battleId))
  await db.insert(battleLog).values({
    battleId,
    actorUserId: user.id,
    damageDealt: 0,
    isCritical: false,
    description: `${user.name ?? "Pilot"} joins the battle!`,
    turnNumber: turnCount.length,
  })

  return NextResponse.json({ success: true })
}
