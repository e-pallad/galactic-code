import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeUser, queueDb, resetDb, dbOps } from "@/lib/__tests__/helpers/db-mock"
import { XP_VALUES } from "@/lib/xp"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("@/lib/auth", () => ({ getClerkId: vi.fn(), isDemo: vi.fn() }))
vi.mock("@/lib/missions", () => ({ getUser: vi.fn(), awardXP: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ mutationRateLimit: {}, applyRateLimit: vi.fn() }))

import { NextResponse } from "next/server"
import { getClerkId } from "@/lib/auth"
import { getUser, awardXP } from "@/lib/missions"
import { applyRateLimit } from "@/lib/rate-limit"
import { POST } from "@/app/api/progress/exercise/route"

const EXERCISE_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7"
const post = (body: unknown) =>
  POST(new Request("http://test.local/api/progress/exercise", { method: "POST", body: JSON.stringify(body) }))

beforeEach(() => {
  resetDb()
  vi.clearAllMocks()
  vi.mocked(getClerkId).mockResolvedValue("clerk_1")
  // Rank 1 on purpose: exercises live inside Academy missions, so they must not be rank-gated.
  vi.mocked(getUser).mockResolvedValue(makeUser({ totalXp: 40 }) as never)
  vi.mocked(applyRateLimit).mockResolvedValue(null)
})

describe("POST /api/progress/exercise", () => {
  it("rejects a signed-out request", async () => {
    vi.mocked(getClerkId).mockResolvedValue(null)
    expect((await post({ exerciseId: EXERCISE_ID })).status).toBe(401)
  })

  it("rejects a malformed exercise id", async () => {
    expect((await post({ exerciseId: "nope" })).status).toBe(400)
    expect((await post({})).status).toBe(400)
  })

  it("rejects an unknown pilot", async () => {
    vi.mocked(getUser).mockResolvedValue(null)
    expect((await post({ exerciseId: EXERCISE_ID })).status).toBe(404)
  })

  it("is rate limited before any lookup", async () => {
    vi.mocked(applyRateLimit).mockResolvedValue(NextResponse.json({ error: "Too many requests" }, { status: 429 }))
    expect((await post({ exerciseId: EXERCISE_ID })).status).toBe(429)
    expect(dbOps()).toEqual([])
  })

  it("answers 404 for an exercise that does not exist", async () => {
    queueDb([])
    expect((await post({ exerciseId: EXERCISE_ID })).status).toBe(404)
    expect(awardXP).not.toHaveBeenCalled()
  })

  it("pays nothing when the exercise was already completed", async () => {
    queueDb([{ id: EXERCISE_ID }], [])
    const res = await post({ exerciseId: EXERCISE_ID })
    expect(await res.json()).toMatchObject({ xpEarned: 0, alreadyCompleted: true, leveledUp: false, newRank: 1, newXp: 40 })
    expect(awardXP).not.toHaveBeenCalled()
  })

  it("pays the exercise XP exactly once on first completion, even at Rank 1", async () => {
    queueDb([{ id: EXERCISE_ID }], [{ id: "progress-1" }])
    vi.mocked(awardXP).mockResolvedValue({ leveledUp: false, newRank: 1, newXp: 50 })
    const res = await post({ exerciseId: EXERCISE_ID })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ xpEarned: XP_VALUES.COMPLETE_EXERCISE, alreadyCompleted: false, leveledUp: false, newRank: 1, newXp: 50 })
    expect(awardXP).toHaveBeenCalledTimes(1)
    expect(awardXP).toHaveBeenCalledWith("user-1", XP_VALUES.COMPLETE_EXERCISE)
  })

  it("passes a level-up from awardXP through to the client", async () => {
    queueDb([{ id: EXERCISE_ID }], [{ id: "progress-1" }])
    vi.mocked(awardXP).mockResolvedValue({ leveledUp: true, newRank: 2, newXp: 100 })
    expect(await (await post({ exerciseId: EXERCISE_ID })).json()).toMatchObject({ leveledUp: true, newRank: 2 })
  })
})
