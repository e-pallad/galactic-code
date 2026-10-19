import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeUser, queueDb, resetDb, dbOps } from "@/lib/__tests__/helpers/db-mock"
import { XP_VALUES } from "@/lib/xp"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("@/lib/auth", () => ({ getClerkId: vi.fn(), isDemo: vi.fn() }))
vi.mock("@/lib/missions", () => ({ getUser: vi.fn(), awardXP: vi.fn(), checkMedals: vi.fn() }))
vi.mock("@/lib/combat", () => ({ CREDIT_VALUES: { SKILL_CHECK_PASS: 10, SKILL_CHECK_PERFECT: 20 }, awardCredits: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ mutationRateLimit: {}, applyRateLimit: vi.fn() }))

import { getClerkId } from "@/lib/auth"
import { getUser, awardXP, checkMedals } from "@/lib/missions"
import { applyRateLimit } from "@/lib/rate-limit"
import { POST } from "@/app/api/progress/skill-check/route"

const MISSION = "7c9e6679-7425-40de-944b-e07fc1f90ae7"
const Q1 = "11111111-1111-4111-8111-111111111111"
const Q2 = "22222222-2222-4222-8222-222222222222"
const questions = [
  { id: Q1, correctIndex: 1, explanation: "e1" },
  { id: Q2, correctIndex: 2, explanation: "e2" },
]
const post = (body: unknown) =>
  POST(new Request("http://test.local/api/progress/skill-check", { method: "POST", body: JSON.stringify(body) }))
const answer = (a: number, b: number) => ({
  missionId: MISSION,
  answers: [{ questionId: Q1, selectedIndex: a }, { questionId: Q2, selectedIndex: b }],
})

beforeEach(() => {
  resetDb()
  vi.clearAllMocks()
  vi.mocked(getClerkId).mockResolvedValue("clerk_1")
  vi.mocked(getUser).mockResolvedValue(makeUser() as never)
  vi.mocked(applyRateLimit).mockResolvedValue(null)
  vi.mocked(awardXP).mockResolvedValue({ leveledUp: false, newRank: 1, newXp: 35 })
  vi.mocked(checkMedals).mockResolvedValue([])
})

describe("POST /api/progress/skill-check", () => {
  it("refuses a skill check for a mission the pilot has not finished", async () => {
    queueDb([])
    expect((await post(answer(1, 2))).status).toBe(422)
    queueDb([{ status: "IN_PROGRESS" }])
    expect((await post(answer(1, 2))).status).toBe(422)
    expect(awardXP).not.toHaveBeenCalled()
    expect(dbOps()).toEqual(["select", "select"])
  })

  it("requires an answer for every question", async () => {
    queueDb([{ status: "COMPLETED" }], questions)
    expect((await post({ missionId: MISSION, answers: [{ questionId: Q1, selectedIndex: 1 }] })).status).toBe(400)
  })

  it("grades on the server, pays the perfect tier and returns the review", async () => {
    queueDb([{ status: "COMPLETED" }], questions, [{ tier: 1 }, { tier: 2 }, { tier: 3 }])
    const body = await (await post(answer(1, 2))).json()
    expect(body).toMatchObject({ score: 100, passed: true, perfect: true, xpEarned: XP_VALUES.SKILL_CHECK_PERFECT })
    expect(body.review).toEqual([
      { questionId: Q1, selectedIndex: 1, correctIndex: 1, explanation: "e1" },
      { questionId: Q2, selectedIndex: 2, correctIndex: 2, explanation: "e2" },
    ])
    expect(awardXP).toHaveBeenCalledWith("user-1", XP_VALUES.SKILL_CHECK_PERFECT)
  })

  it("pays only the tiers that were not claimed before", async () => {
    queueDb([{ status: "SKIPPED" }], questions, [{ tier: 3 }])
    const body = await (await post(answer(1, 2))).json()
    expect(body.xpEarned).toBe(XP_VALUES.SKILL_CHECK_PERFECT - XP_VALUES.SKILL_CHECK_PASS)
  })

  it("pays nothing when a parallel submission already claimed every tier", async () => {
    queueDb([{ status: "COMPLETED" }], questions, [])
    expect((await (await post(answer(1, 2))).json()).xpEarned).toBe(0)
    expect(awardXP).not.toHaveBeenCalled()
  })
})
