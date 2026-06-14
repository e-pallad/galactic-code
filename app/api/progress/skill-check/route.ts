import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { skillCheckAttempts } from "@/lib/db/schema"
import { getUser, awardXP, checkMedals } from "@/lib/missions"
import { XP_VALUES } from "@/lib/xp"
import { z } from "zod"

const schema = z.object({
  missionId: z.string().uuid(),
  score: z.number().int().min(0).max(100),
})

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { missionId, score } = parsed.data
  const passed = score >= 70
  const perfect = score === 100

  let xpEarned: number
  if (perfect) xpEarned = XP_VALUES.SKILL_CHECK_PERFECT
  else if (passed) xpEarned = XP_VALUES.SKILL_CHECK_PASS
  else xpEarned = XP_VALUES.SKILL_CHECK_ATTEMPT

  let result: { leveledUp: boolean; newRank: number; newXp: number }

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

  const newMedals = await checkMedals(user.id)

  return NextResponse.json({
    success: true,
    xpEarned,
    passed,
    perfect,
    leveledUp: result!.leveledUp,
    newMedals,
  })
}
