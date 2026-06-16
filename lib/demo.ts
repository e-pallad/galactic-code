import { db } from "@/lib/db"
import { users, missionProgress, dailyLogs, medals, missions, sectors, starSystems } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export const DEMO_CLERK_ID = "demo_user"

export async function resetDemoUser(): Promise<void> {
  await db.transaction(async (tx) => {
    // Upsert demo user
    await tx
      .insert(users)
      .values({
        clerkId: DEMO_CLERK_ID,
        email: "demo@galactic.code",
        name: "Demo Pilot",
        avatarUrl: null,
        role: "user",
        totalXp: 150,
        rank: 2,
        track: "javascript",
        streak: 3,
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
          lastSeenAt: new Date(),
          deletedAt: null,
        },
      })

    const [demoUser] = await tx.select().from(users).where(eq(users.clerkId, DEMO_CLERK_ID)).limit(1)
    if (!demoUser) return

    // Clear existing progress
    await tx.delete(missionProgress).where(eq(missionProgress.userId, demoUser.id))
    await tx.delete(dailyLogs).where(eq(dailyLogs.userId, demoUser.id))
    await tx.delete(medals).where(eq(medals.userId, demoUser.id))

    // Seed today's activity log
    const today = new Date().toISOString().slice(0, 10)
    await tx
      .insert(dailyLogs)
      .values({ userId: demoUser.id, date: today, xpEarned: 45, missionsCompleted: 3 })
      .onConflictDoNothing()

    // Mark first 2 missions in JS system as completed
    const jsMissions = await tx
      .select({ id: missions.id })
      .from(missions)
      .innerJoin(sectors, eq(sectors.id, missions.sectorId))
      .innerJoin(starSystems, eq(starSystems.id, sectors.systemId))
      .where(sql`${starSystems.trackId} = 'javascript' AND ${starSystems.number} = 1`)
      .limit(2)

    if (jsMissions.length > 0) {
      await tx
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
  })
}
