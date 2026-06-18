import { db } from "@/lib/db"
import { users, ships, items, userInventory, fleets, fleetMembers } from "@/lib/db/schema"
import { eq, sql, and, gte } from "drizzle-orm"
import type { Ship, Item, Entity } from "@/lib/db/schema"

export const CREDIT_VALUES = {
  MISSION_BRIEFING: 5,
  MISSION_TRAINING_OP: 10,
  MISSION_STRIKE: 20,
  MISSION_DEBRIEF: 5,
  FOCUS_CYCLE_BONUS: 5,
  SKILL_CHECK_PASS: 10,
  SKILL_CHECK_PERFECT: 20,
} as const

export interface EffectiveStats {
  hp: number
  atk: number
  def: number
  spd: number
}

export function getEffectiveStats(ship: Ship, equippedItems: Item[]): EffectiveStats {
  return {
    hp: ship.baseHp + equippedItems.reduce((s, i) => s + i.bonusHp, 0),
    atk: ship.baseAtk + equippedItems.reduce((s, i) => s + i.bonusAtk, 0),
    def: ship.baseDef + equippedItems.reduce((s, i) => s + i.bonusDef, 0),
    spd: ship.baseSpd + equippedItems.reduce((s, i) => s + i.bonusSpd, 0),
  }
}

function speedMultiplier(pilotSpd: number, entitySpd: number): number {
  const ratio = pilotSpd / Math.max(entitySpd, 1)
  return Math.min(1.5, Math.max(0.75, 0.75 + (ratio - 0.5) * 0.75))
}

export interface TurnResult {
  pilotDamage: number
  entityDamage: number
  isCrit: boolean
  logEntries: { actorUserId: string | null; damageDealt: number; isCritical: boolean; description: string }[]
}

export function resolveTurn(
  pilotStats: EffectiveStats,
  entity: Entity,
  participantUserId: string,
  pilotName: string
): TurnResult {
  const critChance = Math.min(0.30, 0.10 + Math.max(0, pilotStats.spd - entity.spd) * 0.01)
  const isCrit = Math.random() < critChance
  const rawDmg = Math.floor(
    pilotStats.atk * (1 - entity.def / (entity.def + 50)) * speedMultiplier(pilotStats.spd, entity.spd)
  )
  const pilotDamage = Math.max(1, isCrit ? Math.floor(rawDmg * 1.75) : rawDmg)
  const entityDamage = Math.max(1, Math.floor(entity.atk * (1 - pilotStats.def / (pilotStats.def + 50))))

  return {
    pilotDamage,
    entityDamage,
    isCrit,
    logEntries: [
      {
        actorUserId: participantUserId,
        damageDealt: pilotDamage,
        isCritical: isCrit,
        description: isCrit
          ? `${pilotName} lands a CRITICAL HIT for ${pilotDamage} damage!`
          : `${pilotName} attacks for ${pilotDamage} damage.`,
      },
      {
        actorUserId: null,
        damageDealt: entityDamage,
        isCritical: false,
        description: `${entity.name} retaliates for ${entityDamage} damage.`,
      },
    ],
  }
}

export function fleePartyShot(entity: Entity): number {
  return Math.floor(entity.atk * 0.5)
}

export function rollLoot(entity: Entity, allItems: Item[]): Item[] {
  const itemMap = new Map(allItems.map((i) => [i.slug, i]))
  return entity.lootTable
    .filter((entry) => Math.random() < entry.chance)
    .map((entry) => itemMap.get(entry.itemSlug))
    .filter((item): item is Item => item !== undefined)
}

export async function awardCredits(userId: string, amount: number): Promise<{ newBalance: number }> {
  const [updated] = await db
    .update(users)
    .set({ credits: sql`${users.credits} + ${amount}` })
    .where(eq(users.id, userId))
    .returning({ credits: users.credits })
  return { newBalance: updated?.credits ?? 0 }
}

export async function deductCredits(userId: string, amount: number): Promise<{ newBalance: number } | null> {
  // Atomic conditional deduction: the `credits >= amount` guard lives inside the
  // UPDATE so two concurrent purchases cannot both pass a separate read-check and
  // drive the balance negative. No row is returned when funds are insufficient.
  const updated = await db
    .update(users)
    .set({ credits: sql`${users.credits} - ${amount}` })
    .where(and(eq(users.id, userId), gte(users.credits, amount)))
    .returning({ credits: users.credits })
  if (updated.length === 0) return null
  return { newBalance: updated[0].credits }
}

export async function getOrCreateShip(userId: string): Promise<Ship> {
  const [existing] = await db.select().from(ships).where(eq(ships.userId, userId)).limit(1)
  if (existing) return existing
  const [created] = await db.insert(ships).values({ userId }).returning()
  return created
}

/** Recompute and persist a fleet's totalXp as the sum of its members' XP. */
export async function recomputeFleetXp(fleetId: string): Promise<number> {
  const [agg] = await db
    .select({ total: sql<number>`COALESCE(SUM(${users.totalXp}), 0)` })
    .from(fleetMembers)
    .innerJoin(users, eq(users.id, fleetMembers.userId))
    .where(eq(fleetMembers.fleetId, fleetId))
  const total = Number(agg?.total ?? 0)
  await db.update(fleets).set({ totalXp: total }).where(eq(fleets.id, fleetId))
  return total
}

export async function getEquippedItems(userId: string): Promise<Item[]> {
  const rows = await db
    .select({ item: items, isEquipped: userInventory.isEquipped })
    .from(userInventory)
    .innerJoin(items, eq(items.id, userInventory.itemId))
    .where(eq(userInventory.userId, userId))
  return rows.filter((r) => r.isEquipped).map((r) => r.item)
}
