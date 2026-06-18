import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { battles, battleParticipants, battleLog, entities } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { fleePartyShot } from "@/lib/combat"
import { eq, and, sql } from "drizzle-orm"
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
  if (!battle || battle.status !== "active") return NextResponse.json({ error: "Battle not active" }, { status: 404 })

  const [participant] = await db.select().from(battleParticipants)
    .where(and(eq(battleParticipants.battleId, battleId), eq(battleParticipants.userId, user.id)))
    .limit(1)
  if (!participant) return NextResponse.json({ error: "Not in this battle" }, { status: 403 })

  const [entity] = await db.select().from(entities).where(eq(entities.id, battle.entityId)).limit(1)
  if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 500 })

  const partingDmg = fleePartyShot(entity)
  const newHp = Math.max(0, participant.pilotHpRemaining - partingDmg)
  const logCount = await db.select({ count: sql<number>`count(*)` }).from(battleLog).where(eq(battleLog.battleId, battleId))
  const turnNumber = Number(logCount[0]?.count ?? 0) + 1

  await db.update(battleParticipants).set({ hasFled: true, pilotHpRemaining: newHp }).where(eq(battleParticipants.id, participant.id))
  await db.insert(battleLog).values({
    battleId,
    actorUserId: user.id,
    damageDealt: partingDmg,
    isCritical: false,
    description: `${user.name ?? "Pilot"} flees! Takes ${partingDmg} parting damage from ${entity.name}.`,
    turnNumber,
  })

  // End the battle once no active pilots remain. A pilot is inactive if they have
  // fled OR been defeated (0 HP) — otherwise a fleet battle where everyone else is
  // already down would never end after the last pilot flees.
  const allParticipants = await db.select().from(battleParticipants).where(eq(battleParticipants.battleId, battleId))
  const noneActive = allParticipants.every((p) => p.hasFled || p.pilotHpRemaining <= 0)
  if (noneActive) {
    await db.update(battles).set({ status: "fled", endedAt: new Date() }).where(and(eq(battles.id, battleId), eq(battles.status, "active")))
  }

  return NextResponse.json({ success: true, partingDamage: partingDmg, newHp })
}
