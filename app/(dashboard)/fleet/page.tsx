export const dynamic = "force-dynamic"

import { getClerkId } from "@/lib/auth"
import { getUser } from "@/lib/missions"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { fleets, fleetMembers, users, battles, battleParticipants, entities } from "@/lib/db/schema"
import { eq, and, inArray, sql } from "drizzle-orm"
import { FleetPageClient } from "@/components/fleet/fleet-page-client"
import { Users } from "lucide-react"

export default async function FleetPage() {
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/sign-in")
  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const [membership] = await db
    .select()
    .from(fleetMembers)
    .where(eq(fleetMembers.userId, user.id))
    .limit(1)

  let fleet: (typeof fleets.$inferSelect & { totalXp: number }) | null = null
  let members: { member: typeof fleetMembers.$inferSelect; user: { id: string; name: string | null; avatarUrl: string | null; rank: number; totalXp: number } }[] = []
  let myRole: string | null = null
  let fleetId: string | null = null
  let activeBattles: {
    id: string
    entityName: string
    entityIcon: string
    entityHpRemaining: number
    entityMaxHp: number
    participantCount: number
    isParticipant: boolean
  }[] = []

  if (membership) {
    fleetId = membership.fleetId
    myRole = membership.role

    const fleetRows = await db.select().from(fleets).where(eq(fleets.id, membership.fleetId)).limit(1)
    members = await db
      .select({
        member: fleetMembers,
        user: { id: users.id, name: users.name, avatarUrl: users.avatarUrl, rank: users.rank, totalXp: users.totalXp },
      })
      .from(fleetMembers)
      .innerJoin(users, eq(users.id, fleetMembers.userId))
      .where(eq(fleetMembers.fleetId, membership.fleetId))

    // Display the live sum of member XP rather than the stored (possibly stale) value.
    const fleetXp = members.reduce((sum, m) => sum + m.user.totalXp, 0)
    fleet = fleetRows[0] ? { ...fleetRows[0], totalXp: fleetXp } : null

    // Active fleet battles the roster can join.
    const battleRows = await db
      .select({ battle: battles, entity: entities })
      .from(battles)
      .innerJoin(entities, eq(entities.id, battles.entityId))
      .where(and(eq(battles.fleetId, membership.fleetId), eq(battles.status, "active")))

    if (battleRows.length > 0) {
      const battleIds = battleRows.map((r) => r.battle.id)
      const counts = await db
        .select({ battleId: battleParticipants.battleId, count: sql<number>`count(*)` })
        .from(battleParticipants)
        .where(inArray(battleParticipants.battleId, battleIds))
        .groupBy(battleParticipants.battleId)
      const countMap = new Map(counts.map((c) => [c.battleId, Number(c.count)]))

      const mine = await db
        .select({ battleId: battleParticipants.battleId })
        .from(battleParticipants)
        .where(and(inArray(battleParticipants.battleId, battleIds), eq(battleParticipants.userId, user.id)))
      const myBattleIds = new Set(mine.map((m) => m.battleId))

      activeBattles = battleRows.map((r) => ({
        id: r.battle.id,
        entityName: r.entity.name,
        entityIcon: r.entity.icon,
        entityHpRemaining: r.battle.entityHpRemaining,
        entityMaxHp: r.entity.hp,
        participantCount: countMap.get(r.battle.id) ?? 0,
        isParticipant: myBattleIds.has(r.battle.id),
      }))
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-[#06B6D4]" />
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Fleet</h1>
          <p className="text-[#94a3b8] text-sm">Unite with other pilots to take on boss entities</p>
        </div>
      </div>
      <FleetPageClient
        fleet={fleet}
        fleetId={fleetId}
        members={members}
        myRole={myRole}
        userId={user.id}
        activeBattles={activeBattles}
      />
    </div>
  )
}
