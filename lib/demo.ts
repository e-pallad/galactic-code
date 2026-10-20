import { db } from "@/lib/db"
import { users, missionProgress, dailyLogs, medals, missions, sectors, starSystems, ships, items, userInventory, battleLog } from "@/lib/db/schema"
import { eq, sql, inArray, and, lt } from "drizzle-orm"
import { demoClerkId } from "@/lib/demo-session"

/** Creates the visitor's demo pilot, or puts the existing one back to the starting state. */
export async function resetDemoUser(sessionId: string): Promise<void> {
  const clerkId = demoClerkId(sessionId)
  // drizzle-orm/neon-http uses a batch HTTP API that does not support
  // interactive transactions (reading mid-tx and branching on results).
  // Run each step sequentially without a transaction wrapper instead.

  await db
    .insert(users)
    .values({
      clerkId,
      email: "demo@galactic.code",
      name: "Demo Pilot",
      avatarUrl: null,
      totalXp: 150,
      rank: 2,
      track: "react",
      streak: 3,
      credits: 200,
      onboardingCompleted: true,
      showOnLeaderboard: false,
      lastSeenAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        name: "Demo Pilot",
        totalXp: 150,
        rank: 2,
        track: "react",
        streak: 3,
        credits: 200,
        lastSeenAt: new Date(),
        deletedAt: null,
      },
    })

  const [demoUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1)

  if (!demoUser) return

  // Clear existing progress
  await Promise.all([
    db.delete(missionProgress).where(eq(missionProgress.userId, demoUser.id)),
    db.delete(dailyLogs).where(eq(dailyLogs.userId, demoUser.id)),
    db.delete(medals).where(eq(medals.userId, demoUser.id)),
  ])

  // Seed today's activity log
  const today = new Date().toISOString().slice(0, 10)
  await db
    .insert(dailyLogs)
    .values({ userId: demoUser.id, date: today, xpEarned: 45, missionsCompleted: 3 })
    .onConflictDoNothing()

  // Mark first 2 missions in the React track's first system as completed so
  // the demo dashboard shows real progress against the full curriculum.
  const jsMissions = await db
    .select({ id: missions.id })
    .from(missions)
    .innerJoin(sectors, eq(sectors.id, missions.sectorId))
    .innerJoin(starSystems, eq(starSystems.id, sectors.systemId))
    .where(sql`${starSystems.trackId} = 'react' AND ${starSystems.number} = 1`)
    .orderBy(sectors.number, missions.number)
    .limit(2)

  if (jsMissions.length > 0) {
    await db
      .insert(missionProgress)
      .values(
        jsMissions.map((m) => ({
          userId: demoUser.id,
          missionId: m.id,
          status: "COMPLETED" as const,
          xpEarned: 15,
          completedAt: new Date(),
        }))
      )
      .onConflictDoNothing()
  }

  // Upsert starter ship for demo user
  await db
    .insert(ships)
    .values({ userId: demoUser.id, name: "Starfire I" })
    .onConflictDoUpdate({
      target: ships.userId,
      set: { name: "Starfire I" },
    })

  // Give demo user hull-plating-i (starter shield) if items table is populated
  const [starterItem] = await db
    .select()
    .from(items)
    .where(eq(items.slug, "hull-plating-i"))
    .limit(1)

  if (starterItem) {
    await db
      .insert(userInventory)
      .values({ userId: demoUser.id, itemId: starterItem.id, isEquipped: true })
      .onConflictDoUpdate({
        target: [userInventory.userId, userInventory.itemId],
        set: { isEquipped: true },
      })
  }
}

/**
 * Removes demo pilots nobody has touched since `olderThan` (a reset stamps
 * lastSeenAt, and the cookie lives two hours). Everything hangs off users with
 * ON DELETE CASCADE except battle_log.actor_user_id, which is cleared first.
 * Works in bounded batches; returns how many pilots went.
 */
export async function deleteExpiredDemoUsers(olderThan: Date, batch = 500): Promise<number> {
  const stale = await db
    .select({ id: users.id })
    .from(users)
    .where(and(sql`${users.clerkId} LIKE 'demo\\_%'`, lt(sql`coalesce(${users.lastSeenAt}, ${users.createdAt})`, olderThan)))
    .limit(batch)
  if (stale.length === 0) return 0

  const ids = stale.map((u) => u.id)
  await db.delete(battleLog).where(inArray(battleLog.actorUserId, ids))
  await db.delete(users).where(inArray(users.id, ids))
  return ids.length
}
