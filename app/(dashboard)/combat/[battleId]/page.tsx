export const dynamic = "force-dynamic"

import { getClerkId } from "@/lib/auth"
import { getUser } from "@/lib/missions"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { battles, battleParticipants, battleLog, entities } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { getOrCreateShip, getEquippedItems, getEffectiveStats } from "@/lib/combat"
import { BattleArenaClient } from "@/components/combat/battle-arena-client"

export default async function BattlePage({ params }: { params: Promise<{ battleId: string }> }) {
  const { battleId } = await params
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/sign-in")
  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1)
  if (!battle) notFound()

  const [participant] = await db
    .select()
    .from(battleParticipants)
    .where(and(eq(battleParticipants.battleId, battleId), eq(battleParticipants.userId, user.id)))
    .limit(1)
  if (!participant) redirect("/combat")

  const [entity] = await db.select().from(entities).where(eq(entities.id, battle.entityId)).limit(1)
  if (!entity) notFound()

  const logs = await db
    .select()
    .from(battleLog)
    .where(eq(battleLog.battleId, battleId))
    .orderBy(asc(battleLog.turnNumber))

  // The pilot's max HP is the ship's effective HP (base + equipped gear), not the
  // current remaining HP — otherwise the bar would reset to "full" on reload.
  const ship = await getOrCreateShip(user.id)
  const equipped = await getEquippedItems(user.id)
  const pilotMaxHp = getEffectiveStats(ship, equipped).hp

  return (
    <BattleArenaClient
      battle={battle}
      entity={entity}
      participant={participant}
      logs={logs}
      userId={user.id}
      userName={user.name ?? "Pilot"}
      pilotMaxHp={pilotMaxHp}
    />
  )
}
