import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { entities, battles, battleParticipants, battleLog, fleetMembers } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { getOrCreateShip, getEquippedItems, getEffectiveStats } from "@/lib/combat"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  const body = await req.json() as unknown
  const parsed = z.object({ entityId: z.string().uuid() }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const [entity] = await db.select().from(entities).where(eq(entities.id, parsed.data.entityId)).limit(1)
  if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 })

  // A user can only be in one active battle at a time. If they already are,
  // hand back its id so the client can resume it.
  const [activeBattle] = await db
    .select({ id: battles.id })
    .from(battleParticipants)
    .innerJoin(battles, eq(battles.id, battleParticipants.battleId))
    .where(and(eq(battleParticipants.userId, user.id), eq(battles.status, "active")))
    .limit(1)
  if (activeBattle) return NextResponse.json({ error: "You are already in a battle", battleId: activeBattle.id }, { status: 409 })

  // Fleet bosses spawn a shared fleet battle that the user's fleetmates can join.
  let fleetId: string | null = null
  if (entity.requiresFleet) {
    const [membership] = await db.select().from(fleetMembers).where(eq(fleetMembers.userId, user.id)).limit(1)
    if (!membership) return NextResponse.json({ error: "This entity requires a fleet" }, { status: 400 })
    fleetId = membership.fleetId
    // Only one active fleet battle per fleet — fleetmates join the existing one
    // from the Fleet page (no battleId here: the caller isn't a participant yet).
    const [fleetBattle] = await db.select({ id: battles.id }).from(battles)
      .where(and(eq(battles.fleetId, fleetId), eq(battles.status, "active"))).limit(1)
    if (fleetBattle) {
      return NextResponse.json({ error: "Your fleet already has an active battle — join it from the Fleet page." }, { status: 409 })
    }
  }

  const ship = await getOrCreateShip(user.id)
  const equippedItems = await getEquippedItems(user.id)
  const stats = getEffectiveStats(ship, equippedItems)

  // Sequential awaits - no transaction
  const [battle] = await db.insert(battles).values({
    entityId: entity.id,
    type: entity.requiresFleet ? "fleet" : "solo",
    fleetId,
    entityHpRemaining: entity.hp,
  }).returning()

  await db.insert(battleParticipants).values({
    battleId: battle.id,
    userId: user.id,
    pilotHpRemaining: stats.hp,
  })

  await db.insert(battleLog).values({
    battleId: battle.id,
    actorUserId: user.id,
    damageDealt: 0,
    isCritical: false,
    description: `${user.name ?? "Pilot"} engages ${entity.name}!`,
    turnNumber: 0,
  })

  return NextResponse.json({ battleId: battle.id })
}
