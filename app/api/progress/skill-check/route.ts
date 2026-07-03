import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { skillCheckAttempts, skillCheckQuestions } from "@/lib/db/schema"
import { getUser, awardXP, checkMedals } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { XP_VALUES } from "@/lib/xp"
import { CREDIT_VALUES, awardCredits } from "@/lib/combat"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

const schema = z.object({
  missionId: z.string().uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        selectedIndex: z.number().int().min(0).max(3),
      })
    )
    .min(1)
    .max(50),
})

// XP/credits are awarded per tier reached (attempt < pass < perfect), and each
// user can only ever earn up to the perfect-tier total per mission: retries pay
// out the difference to the best previous attempt, never the full tier again.
function xpForTier(passed: boolean, perfect: boolean): number {
  if (perfect) return XP_VALUES.SKILL_CHECK_PERFECT
  if (passed) return XP_VALUES.SKILL_CHECK_PASS
  return XP_VALUES.SKILL_CHECK_ATTEMPT
}

function creditsForTier(passed: boolean, perfect: boolean): number {
  if (perfect) return CREDIT_VALUES.SKILL_CHECK_PERFECT
  if (passed) return CREDIT_VALUES.SKILL_CHECK_PASS
  return 0
}

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

  const { missionId, answers } = parsed.data

  // Grade server-side against the question bank — never trust a client score.
  const questions = await db
    .select({ id: skillCheckQuestions.id, correctIndex: skillCheckQuestions.correctIndex })
    .from(skillCheckQuestions)
    .where(eq(skillCheckQuestions.missionId, missionId))

  if (questions.length === 0) {
    return NextResponse.json({ error: "No skill check for this mission" }, { status: 404 })
  }

  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedIndex]))
  if (answerMap.size !== answers.length) {
    return NextResponse.json({ error: "Duplicate answers" }, { status: 400 })
  }
  for (const a of answers) {
    if (!questions.some((q) => q.id === a.questionId)) {
      return NextResponse.json({ error: "Answer for unknown question" }, { status: 400 })
    }
  }

  const correct = questions.filter((q) => answerMap.get(q.id) === q.correctIndex).length
  const score = Math.round((correct / questions.length) * 100)
  const passed = score >= 70
  const perfect = score === 100

  // Cap rewards: pay only the delta above the best tier already earned here.
  const prior = await db
    .select({ passed: skillCheckAttempts.passed, perfect: skillCheckAttempts.perfect })
    .from(skillCheckAttempts)
    .where(and(eq(skillCheckAttempts.userId, user.id), eq(skillCheckAttempts.missionId, missionId)))

  const bestPriorXp = prior.reduce((best, p) => Math.max(best, xpForTier(p.passed, p.perfect)), 0)
  const bestPriorCredits = prior.reduce((best, p) => Math.max(best, creditsForTier(p.passed, p.perfect)), 0)

  const xpEarned = Math.max(0, xpForTier(passed, perfect) - bestPriorXp)
  const creditsEarned = Math.max(0, creditsForTier(passed, perfect) - bestPriorCredits)

  let result: { leveledUp: boolean; newRank: number; newXp: number } = {
    leveledUp: false,
    newRank: user.rank,
    newXp: user.totalXp,
  }

  // drizzle-orm/neon-http does not support interactive transactions
  // (the driver throws on db.transaction()); run steps sequentially.
  await db.insert(skillCheckAttempts).values({
    userId: user.id,
    missionId,
    score,
    passed,
    perfect,
    xpEarned,
  })

  if (xpEarned > 0) result = await awardXP(user.id, xpEarned)
  if (creditsEarned > 0) await awardCredits(user.id, creditsEarned)

  const newMedals = await checkMedals(user.id)

  return NextResponse.json({
    success: true,
    score,
    xpEarned,
    passed,
    perfect,
    leveledUp: result.leveledUp,
    newMedals,
  })
}
