import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { skillCheckAttempts } from "@/lib/db/schema"
import { getUser, awardXP, checkMedals } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { XP_VALUES } from "@/lib/xp"
import { CREDIT_VALUES, awardCredits } from "@/lib/combat"
import { z } from "zod"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

const schema = z.object({
  missionId: z.string().uuid(),
  score: z.number().int().min(0).max(100),
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

  const { missionId, score } = parsed.data
  const passed = score >= 70
  const perfect = score === 100

  let xpEarned: number
  if (perfect) xpEarned = XP_VALUES.SKILL_CHECK_PERFECT
  else if (passed) xpEarned = XP_VALUES.SKILL_CHECK_PASS
  else xpEarned = XP_VALUES.SKILL_CHECK_ATTEMPT

  let result: { leveledUp: boolean; newRank: number; newXp: number } = {
    leveledUp: false,
    newRank: user.rank,
    newXp: user.totalXp,
  }

  await db.transaction(async (tx) => {
    await tx.insert(skillCheckAttempts).values({
      userId: user.id,
      missionId,
      score,
      passed,
      perfect,
      xpEarned,
    })
    result = await awardXP(user.id, xpEarned, { tx })
  })

  if (passed) {
    await awardCredits(user.id, perfect ? CREDIT_VALUES.SKILL_CHECK_PERFECT : CREDIT_VALUES.SKILL_CHECK_PASS)
  }

  const newMedals = await checkMedals(user.id)

  return NextResponse.json({
    success: true,
    xpEarned,
    passed,
    perfect,
    leveledUp: result.leveledUp,
    newMedals,
  })
}
