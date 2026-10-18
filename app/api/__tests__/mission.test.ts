import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeUser, queueDb, resetDb } from "@/lib/__tests__/helpers/db-mock"
import { XP_VALUES } from "@/lib/xp"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("@/lib/auth", () => ({ getClerkId: vi.fn(), isDemo: vi.fn() }))
vi.mock("@/lib/missions", () => ({ getUser: vi.fn(), awardXP: vi.fn(), updateStreak: vi.fn(), checkMedals: vi.fn() }))
vi.mock("@/lib/combat", () => ({
  CREDIT_VALUES: { MISSION_BRIEFING: 5, FOCUS_CYCLE_BONUS: 5 },
  awardCredits: vi.fn(),
}))
vi.mock("@/lib/rate-limit", () => ({ mutationRateLimit: {}, applyRateLimit: vi.fn() }))

import { getClerkId } from "@/lib/auth"
import { getUser, awardXP, updateStreak, checkMedals } from "@/lib/missions"
import { awardCredits } from "@/lib/combat"
import { applyRateLimit } from "@/lib/rate-limit"
import { POST } from "@/app/api/progress/mission/route"

const MISSION = "7c9e6679-7425-40de-944b-e07fc1f90ae7"
const post = (body: unknown) =>
  POST(new Request("http://test.local/api/progress/mission", { method: "POST", body: JSON.stringify(body) }))

// db reads in order: mission, prior missions in sector, existing progress; then the claiming upsert.
const firstInSector = (existing: unknown[], claimed: unknown[]) =>
  queueDb([{ id: MISSION, sectorId: "s1", number: 1, type: "briefing" }], [], existing, claimed)

beforeEach(() => {
  resetDb()
  vi.clearAllMocks()
  vi.mocked(getClerkId).mockResolvedValue("clerk_1")
  vi.mocked(getUser).mockResolvedValue(makeUser() as never)
  vi.mocked(applyRateLimit).mockResolvedValue(null)
  vi.mocked(awardXP).mockResolvedValue({ leveledUp: false, newRank: 1, newXp: 15 })
  vi.mocked(updateStreak).mockResolvedValue(1)
  vi.mocked(checkMedals).mockResolvedValue([])
})

describe("POST /api/progress/mission", () => {
  it("pays XP and credits when the upsert claims the completion", async () => {
    firstInSector([], [{ id: "p1" }])
    const body = await (await post({ missionId: MISSION, action: "complete" })).json()
    expect(body.xpEarned).toBe(XP_VALUES.COMPLETE_MISSION)
    expect(awardXP).toHaveBeenCalledTimes(1)
    expect(awardCredits).toHaveBeenCalledTimes(1)
  })

  it("pays nothing when a parallel request claimed it first", async () => {
    firstInSector([], [])
    const body = await (await post({ missionId: MISSION, action: "complete" })).json()
    expect(body.xpEarned).toBe(0)
    expect(awardXP).not.toHaveBeenCalled()
    expect(awardCredits).not.toHaveBeenCalled()
  })

  it("never downgrades a completed mission to skipped", async () => {
    firstInSector([{ status: "COMPLETED" }], [])
    const body = await (await post({ missionId: MISSION, action: "skip" })).json()
    expect(body).toMatchObject({ success: true, xpEarned: 0 })
    expect(awardXP).not.toHaveBeenCalled()
  })

  it("pays the skip XP once", async () => {
    firstInSector([], [{ id: "p1" }])
    expect((await (await post({ missionId: MISSION, action: "skip" })).json()).xpEarned).toBe(XP_VALUES.SKIP_MISSION)
    expect(awardCredits).not.toHaveBeenCalled()
  })

  it("keeps the mission order", async () => {
    queueDb([{ id: MISSION, sectorId: "s1", number: 2, type: "briefing" }], [{ id: "m1" }], [])
    expect((await post({ missionId: MISSION, action: "complete" })).status).toBe(422)
  })
})
