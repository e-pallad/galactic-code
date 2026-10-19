import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { skillCheckAttempts, skillCheckQuestions, skillCheckRewards, missionProgress } from "@/lib/db/schema"
import { getUser, awardXP, checkMedals } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { XP_VALUES, getRankFromXP } from "@/lib/xp"
import { CREDIT_VALUES, awardCredits } from "@/lib/combat"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"
import { readJson } from "@/lib/http"

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
// tier pays out once per pilot and mission: a retry only pays the tiers it newly
// reaches. Tier 1 = attempt, 2 = pass, 3 = perfect; the amounts below are the
// step from the previous tier, so reaching perfect in one go sums to the full 35 XP.
const TIER_XP = [XP_VALUES.SKILL_CHECK_ATTEMPT, XP_VALUES.SKILL_CHECK_PASS - XP_VALUES.SKILL_CHECK_ATTEMPT, XP_VALUES.SKILL_CHECK_PERFECT - XP_VALUES.SKILL_CHECK_PASS]
const TIER_CREDITS = [0, CREDIT_VALUES.SKILL_CHECK_PASS, CREDIT_VALUES.SKILL_CHECK_PERFECT - CREDIT_VALUES.SKILL_CHECK_PASS]

export async function POST(req: Request) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await readJson(req)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  const { missionId, answers } = parsed.data

  // Skill checks come after the mission: it has to be completed or skipped first.
  const [progress] = await db
    .select({ status: missionProgress.status })
    .from(missionProgress)
    .where(and(eq(missionProgress.userId, user.id), eq(missionProgress.missionId, missionId)))
    .limit(1)
  if (!progress || (progress.status !== "COMPLETED" && progress.status !== "SKIPPED")) {
    return NextResponse.json({ error: "Finish the mission first" }, { status: 422 })
  }

  // Grade server-side against the question bank — never trust a client score.
  const questions = await db
    .select({ id: skillCheckQuestions.id, correctIndex: skillCheckQuestions.correctIndex, explanation: skillCheckQuestions.explanation })
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
  if (answerMap.size !== questions.length) {
    return NextResponse.json({ error: "Answer every question" }, { status: 400 })
  }

  const correct = questions.filter((q) => answerMap.get(q.id) === q.correctIndex).length
  const score = Math.round((correct / questions.length) * 100)
  const passed = score >= 70
  const perfect = score === 100

  // Claim every tier this attempt reaches; the unique key means only the request
  // that inserts a tier row gets paid for it, even when submissions race.
  const reached = perfect ? 3 : passed ? 2 : 1
  const claimedTiers = await db
    .insert(skillCheckRewards)
    .values(Array.from({ length: reached }, (_, i) => ({ userId: user.id, missionId, tier: i + 1 })))
    .onConflictDoNothing()
    .returning({ tier: skillCheckRewards.tier })

  const xpEarned = claimedTiers.reduce((sum, c) => sum + (TIER_XP[c.tier - 1] ?? 0), 0)
  const creditsEarned = claimedTiers.reduce((sum, c) => sum + (TIER_CREDITS[c.tier - 1] ?? 0), 0)

  let result: { leveledUp: boolean; newRank: number; newXp: number } = {
    leveledUp: false,
    newRank: getRankFromXP(user.totalXp),
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
    review: questions.map((q) => ({
      questionId: q.id,
      selectedIndex: answerMap.get(q.id) ?? null,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    })),
  })
}
