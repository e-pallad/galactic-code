import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { missionProgress, missions, dailyLogs } from "@/lib/db/schema"
import { getUser, awardXP, updateStreak, checkMedals } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { XP_VALUES } from "@/lib/xp"
import { CREDIT_VALUES, awardCredits } from "@/lib/combat"
import { eq, sql, and } from "drizzle-orm"
import { z } from "zod"
import { startOfDay } from "date-fns"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

const schema = z.object({
  missionId: z.string().uuid(),
  action: z.enum(["complete", "skip"]),
  usedFocusCycle: z.boolean().optional().default(false),
})

export async function POST(req: Request) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  const { missionId, action, usedFocusCycle } = parsed.data

  const [mission] = await db.select().from(missions).where(eq(missions.id, missionId)).limit(1)
  if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 })

  // Check existing progress to prevent re-awarding XP on already-completed missions
  const [existing] = await db
    .select({ status: missionProgress.status })
    .from(missionProgress)
    .where(and(eq(missionProgress.userId, user.id), eq(missionProgress.missionId, missionId)))
    .limit(1)

  const alreadyCompleted = existing?.status === "COMPLETED"

  const xpAmount = action === "skip"
    ? XP_VALUES.SKIP_MISSION
    : usedFocusCycle
    ? XP_VALUES.COMPLETE_MISSION_FOCUS_CYCLE
    : XP_VALUES.COMPLETE_MISSION

  const status = action === "skip" ? "SKIPPED" : "COMPLETED"

  let result: { leveledUp: boolean; newRank: number; newXp: number } = {
    leveledUp: false,
    newRank: user.rank,
    newXp: user.totalXp,
  }

  // drizzle-orm/neon-http uses a batch HTTP API that does not support
  // interactive transactions (the driver throws on db.transaction()).
  // Run each step as a sequential await instead.
  await db
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

  // Only award XP if this is a new completion (not re-completing an already-completed mission)
  if (!alreadyCompleted) {
    result = await awardXP(user.id, xpAmount)
  }

  if (action === "complete") {
    const today = startOfDay(new Date()).toISOString().slice(0, 10)
    await db
      .insert(dailyLogs)
      .values({ userId: user.id, date: today, missionsCompleted: 1, xpEarned: 0 })
      .onConflictDoUpdate({
        target: [dailyLogs.userId, dailyLogs.date],
        set: { missionsCompleted: sql`${dailyLogs.missionsCompleted} + 1` },
      })
  }

  // Award credits for mission completion (only for fresh completions)
  if (!alreadyCompleted && action === "complete") {
    const typeMap: Record<string, keyof typeof CREDIT_VALUES> = {
      "briefing": "MISSION_BRIEFING",
      "training-op": "MISSION_TRAINING_OP",
      "strike-mission": "MISSION_STRIKE",
      "debrief": "MISSION_DEBRIEF",
    }
    const creditAmount = CREDIT_VALUES[typeMap[mission.type] ?? "MISSION_BRIEFING"]
    await awardCredits(user.id, creditAmount + (usedFocusCycle ? CREDIT_VALUES.FOCUS_CYCLE_BONUS : 0))
  }

  const [newStreak, newMedals] = await Promise.all([
    updateStreak(user.id),
    checkMedals(user.id),
  ])

  return NextResponse.json({
    success: true,
    xpEarned: alreadyCompleted ? 0 : xpAmount,
    leveledUp: result.leveledUp,
    newRank: result.newRank,
    newXp: result.newXp,
    newStreak,
    newMedals,
  })
}
