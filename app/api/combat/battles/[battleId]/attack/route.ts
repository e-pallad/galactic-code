import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { battles, battleParticipants, battleLog, entities, items, userInventory } from "@/lib/db/schema"
import { getUser, awardXP } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { getOrCreateShip, getEquippedItems, getEffectiveStats, resolveTurn, rollLoot, awardCredits } from "@/lib/combat"
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

  // Fetch battle
  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1)
  if (!battle || battle.status !== "active") return NextResponse.json({ error: "Battle not active" }, { status: 404 })

  // Fetch participant
  const [participant] = await db.select().from(battleParticipants)
    .where(and(eq(battleParticipants.battleId, battleId), eq(battleParticipants.userId, user.id)))
    .limit(1)
  if (!participant) return NextResponse.json({ error: "Not in this battle" }, { status: 403 })
  if (participant.hasFled) return NextResponse.json({ error: "You have fled" }, { status: 400 })
  if (participant.pilotHpRemaining <= 0) return NextResponse.json({ error: "You are defeated" }, { status: 400 })

  // Fetch entity
  const [entity] = await db.select().from(entities).where(eq(entities.id, battle.entityId)).limit(1)
  if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 500 })

  // Get pilot stats
  const ship = await getOrCreateShip(user.id)
  const equippedItems = await getEquippedItems(user.id)
  const stats = getEffectiveStats(ship, equippedItems)

  // Get turn number
  const logCount = await db.select({ count: sql<number>`count(*)` }).from(battleLog).where(eq(battleLog.battleId, battleId))
  const turnNumber = Number(logCount[0]?.count ?? 0) + 1

  // Resolve turn
  const turn = resolveTurn(stats, entity, user.id, user.name ?? "Pilot")

  // Apply damage sequentially
  const newEntityHp = Math.max(0, battle.entityHpRemaining - turn.pilotDamage)
  const newPilotHp = Math.max(0, participant.pilotHpRemaining - turn.entityDamage)
  const entityDefeated = newEntityHp <= 0
  const pilotDefeated = newPilotHp <= 0

  await db.update(battles).set({ entityHpRemaining: newEntityHp }).where(eq(battles.id, battleId))
  await db.update(battleParticipants)
    .set({
      pilotHpRemaining: newPilotHp,
      totalDamageDealt: sql`${battleParticipants.totalDamageDealt} + ${turn.pilotDamage}`,
    })
    .where(eq(battleParticipants.id, participant.id))

  for (const entry of turn.logEntries) {
    await db.insert(battleLog).values({
      battleId,
      actorUserId: entry.actorUserId,
      damageDealt: entry.damageDealt,
      isCritical: entry.isCritical,
      description: entry.description,
      turnNumber,
    })
  }

  let lootItems: typeof items.$inferSelect[] = []
  let creditsAwarded = 0
  let xpAwarded = 0

  if (entityDefeated) {
    const allItems = await db.select().from(items)
    lootItems = rollLoot(entity, allItems)

    for (const lootItem of lootItems) {
      await db.insert(userInventory).values({ userId: user.id, itemId: lootItem.id }).onConflictDoNothing()
    }

    creditsAwarded = entity.creditReward
    xpAwarded = entity.xpReward
    await awardCredits(user.id, creditsAwarded)
    await awardXP(user.id, xpAwarded)
    await db.update(battles).set({ status: "victory", endedAt: new Date() }).where(eq(battles.id, battleId))
    await db.insert(battleLog).values({
      battleId,
      actorUserId: user.id,
      damageDealt: 0,
      isCritical: false,
      description: `Victory! ${entity.name} has been defeated! +${creditsAwarded} CR, +${xpAwarded} XP`,
      turnNumber: turnNumber + 1,
    })
  } else if (pilotDefeated) {
    await db.update(battles).set({ status: "defeat", endedAt: new Date() }).where(eq(battles.id, battleId))
    await db.insert(battleLog).values({
      battleId,
      actorUserId: null,
      damageDealt: 0,
      isCritical: false,
      description: `${user.name ?? "Pilot"} has been defeated by ${entity.name}!`,
      turnNumber: turnNumber + 1,
    })
  }

  return NextResponse.json({
    turn,
    newEntityHp,
    newPilotHp,
    entityDefeated,
    pilotDefeated,
    lootItems,
    creditsAwarded,
    xpAwarded,
    battleStatus: entityDefeated ? "victory" : pilotDefeated ? "defeat" : "active",
  })
}
