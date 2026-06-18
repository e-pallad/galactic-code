import { db } from "@/lib/db"
import { users, missionProgress, dailyLogs, medals, missions, sectors, starSystems, ships, items, userInventory } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export const DEMO_CLERK_ID = "demo_user"

export async function resetDemoUser(): Promise<void> {
  // drizzle-orm/neon-http uses a batch HTTP API that does not support
  // interactive transactions (reading mid-tx and branching on results).
  // Run each step sequentially without a transaction wrapper instead.

  await db
    .insert(users)
    .values({
      clerkId: DEMO_CLERK_ID,
      email: "demo@galactic.code",
      name: "Demo Pilot",
      avatarUrl: null,
      totalXp: 150,
      rank: 2,
      track: "javascript",
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
        streak: 3,
        credits: 200,
        lastSeenAt: new Date(),
        deletedAt: null,
      },
    })

  const [demoUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, DEMO_CLERK_ID))
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

  // Mark first 2 missions in JS system as completed
  const jsMissions = await db
    .select({ id: missions.id })
    .from(missions)
    .innerJoin(sectors, eq(sectors.id, missions.sectorId))
    .innerJoin(starSystems, eq(starSystems.id, sectors.systemId))
    .where(sql`${starSystems.trackId} = 'javascript' AND ${starSystems.number} = 1`)
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
