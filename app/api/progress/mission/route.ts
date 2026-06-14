import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { missionProgress, missions, dailyLogs } from "@/lib/db/schema"
import { getUser, awardXP, updateStreak, checkMedals } from "@/lib/missions"
import { XP_VALUES } from "@/lib/xp"
import { eq, sql } from "drizzle-orm"
import { z } from "zod"
import { startOfDay } from "date-fns"

const schema = z.object({
  missionId: z.string().uuid(),
  action: z.enum(["complete", "skip"]),
  usedFocusCycle: z.boolean().optional().default(false),
})

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { missionId, action, usedFocusCycle } = parsed.data

  const [mission] = await db.select().from(missions).where(eq(missions.id, missionId)).limit(1)
  if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 })

  const xpAmount = action === "skip"
    ? XP_VALUES.SKIP_MISSION
    : usedFocusCycle
    ? XP_VALUES.COMPLETE_MISSION_FOCUS_CYCLE
    : XP_VALUES.COMPLETE_MISSION

  const status = action === "skip" ? "SKIPPED" : "COMPLETED"

  let result: { leveledUp: boolean; newRank: number; newXp: number }

  await db.transaction(async (tx) => {
    await tx
      .insert(missionProgress)
      .values({
        userId: user.id,
        missionId,
        status,
        xpEarned: xpAmount,
        usedFocusCycle: usedFocusCycle ?? false,
        completedAt: action === "complete" ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [missionProgress.userId, missionProgress.missionId],
        set: { status, xpEarned: xpAmount, usedFocusCycle: usedFocusCycle ?? false, completedAt: action === "complete" ? new Date() : null },
      })

    result = await awardXP(user.id, xpAmount, { tx })

    if (action === "complete") {
      const today = startOfDay(new Date()).toISOString().slice(0, 10)
      await (tx as typeof db)
        .insert(dailyLogs)
        .values({ userId: user.id, date: today, missionsCompleted: 1, xpEarned: 0 })
        .onConflictDoUpdate({
          target: [dailyLogs.userId, dailyLogs.date],
          set: { missionsCompleted: sql`${dailyLogs.missionsCompleted} + 1` },
        })
    }
  })

  const [newStreak, newMedals] = await Promise.all([
    updateStreak(user.id),
    checkMedals(user.id),
  ])

  return NextResponse.json({
    success: true,
    xpEarned: xpAmount,
    leveledUp: result!.leveledUp,
    newRank: result!.newRank,
    newXp: result!.newXp,
    newStreak,
    newMedals,
  })
}
