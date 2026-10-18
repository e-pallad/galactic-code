import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeUser, queueDb, resetDb, dbOps } from "@/lib/__tests__/helpers/db-mock"
import { XP_VALUES } from "@/lib/xp"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("@/lib/auth", () => ({ getClerkId: vi.fn(), isDemo: vi.fn() }))
vi.mock("@/lib/missions", () => ({ getUser: vi.fn(), awardXP: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ mutationRateLimit: {}, courseRewardLimit: { limit: vi.fn() }, applyRateLimit: vi.fn() }))

import { getClerkId } from "@/lib/auth"
import { getUser, awardXP } from "@/lib/missions"
import { applyRateLimit, courseRewardLimit } from "@/lib/rate-limit"
import { POST } from "@/app/api/courses/route"

const ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7"
const post = (body: unknown) =>
  POST(new Request("http://test.local/api/courses", { method: "POST", body: JSON.stringify(body) }))
const add = { action: "add", platform: "Udemy", url: "https://example.com/c", title: "T", totalLessons: 10 }

beforeEach(() => {
  resetDb()
  vi.clearAllMocks()
  vi.mocked(getClerkId).mockResolvedValue("clerk_1")
  vi.mocked(getUser).mockResolvedValue(makeUser() as never)
  vi.mocked(applyRateLimit).mockResolvedValue(null)
  vi.mocked(courseRewardLimit.limit).mockResolvedValue({ success: true } as never)
  vi.mocked(awardXP).mockResolvedValue({ leveledUp: false, newRank: 1, newXp: 50 })
})

describe("POST /api/courses add", () => {
  it("pays no XP for adding a course", async () => {
    queueDb([], [{ id: ID }])
    expect((await post(add)).status).toBe(200)
    expect(awardXP).not.toHaveBeenCalled()
  })

  it("rejects non-http(s) urls and oversized fields", async () => {
    expect((await post({ ...add, url: "javascript:alert(1)" })).status).toBe(400)
    expect((await post({ ...add, title: "x".repeat(201) })).status).toBe(400)
    expect((await post({ ...add, totalLessons: 1_000_000 })).status).toBe(400)
  })

  it("rejects a duplicate url", async () => {
    queueDb([{ url: "https://EXAMPLE.com/c" }])
    expect((await post(add)).status).toBe(409)
  })

  it("rejects adding past the tracked-course limit", async () => {
    queueDb(Array.from({ length: 50 }, (_, i) => ({ url: `https://e.com/${i}` })))
    expect((await post(add)).status).toBe(409)
  })
})

describe("POST /api/courses complete", () => {
  it("pays the completion XP once, within the daily allowance", async () => {
    queueDb([{ id: ID, totalLessons: 10 }], [])
    const body = await (await post({ action: "complete", id: ID })).json()
    expect(body.xpEarned).toBe(XP_VALUES.COMPLETE_COURSE)
    expect(awardXP).toHaveBeenCalledWith("user-1", XP_VALUES.COMPLETE_COURSE)
    expect(courseRewardLimit.limit).toHaveBeenCalledWith("user-1")
  })

  it("completes without XP once the atomic daily allowance is used up", async () => {
    vi.mocked(courseRewardLimit.limit).mockResolvedValue({ success: false } as never)
    queueDb([{ id: ID, totalLessons: 10 }])
    expect((await (await post({ action: "complete", id: ID })).json()).xpEarned).toBe(0)
    expect(awardXP).not.toHaveBeenCalled()
  })

  it("completes without XP, and without spending an allowance slot, for short courses", async () => {
    queueDb([{ id: ID, totalLessons: 1 }])
    await post({ action: "complete", id: ID })
    expect(awardXP).not.toHaveBeenCalled()
    expect(courseRewardLimit.limit).not.toHaveBeenCalled()
  })

  it("completes without XP when the limiter is unreachable", async () => {
    vi.mocked(courseRewardLimit.limit).mockRejectedValue(new Error("redis down"))
    queueDb([{ id: ID, totalLessons: 10 }])
    const res = await post({ action: "complete", id: ID })
    expect(res.status).toBe(200)
    expect(awardXP).not.toHaveBeenCalled()
  })

  it("pays nothing and takes no slot when another request already completed it", async () => {
    queueDb([])
    expect((await (await post({ action: "complete", id: ID })).json()).course).toBeNull()
    expect(awardXP).not.toHaveBeenCalled()
    expect(courseRewardLimit.limit).not.toHaveBeenCalled()
    expect(dbOps()).toEqual(["update"])
  })
})
