import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { exercises, exerciseProgress } from "@/lib/db/schema"
import { getUser, awardXP } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { XP_VALUES, getRankFromXP } from "@/lib/xp"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

const schema = z.object({
  exerciseId: z.string().uuid(),
})

// Records a Sim Deck exercise completion. Test results come from the client's
// Sandpack run and are forgeable, so the reward is small and pays exactly once
// per (user, exercise) — the unique constraint makes replays no-ops.
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

  const { exerciseId } = parsed.data

  const [exercise] = await db.select({ id: exercises.id }).from(exercises).where(eq(exercises.id, exerciseId)).limit(1)
  if (!exercise) return NextResponse.json({ error: "Exercise not found" }, { status: 404 })

  const [inserted] = await db
    .insert(exerciseProgress)
    .values({ userId: user.id, exerciseId })
    .onConflictDoNothing()
    .returning({ id: exerciseProgress.id })

  if (!inserted) {
    return NextResponse.json({ xpEarned: 0, alreadyCompleted: true, leveledUp: false, newRank: getRankFromXP(user.totalXp), newXp: user.totalXp })
  }

  const result = await awardXP(user.id, XP_VALUES.COMPLETE_EXERCISE)

  return NextResponse.json({
    xpEarned: XP_VALUES.COMPLETE_EXERCISE,
    alreadyCompleted: false,
    leveledUp: result.leveledUp,
    newRank: result.newRank,
    newXp: result.newXp,
  })
}
