import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { entities, battles, battleParticipants, battleLog } from "@/lib/db/schema"
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
  if (entity.requiresFleet) return NextResponse.json({ error: "This entity requires a fleet" }, { status: 400 })

  // Check for existing active battle
  const [activeBattle] = await db
    .select({ id: battles.id })
    .from(battleParticipants)
    .innerJoin(battles, eq(battles.id, battleParticipants.battleId))
    .where(and(eq(battleParticipants.userId, user.id), eq(battles.status, "active")))
    .limit(1)
  if (activeBattle) return NextResponse.json({ error: "Already in a battle" }, { status: 409 })

  const ship = await getOrCreateShip(user.id)
  const equippedItems = await getEquippedItems(user.id)
  const stats = getEffectiveStats(ship, equippedItems)

  // Sequential awaits - no transaction
  const [battle] = await db.insert(battles).values({
    entityId: entity.id,
    type: "solo",
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
