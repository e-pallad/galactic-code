import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeUser, queueDb, resetDb, dbOps } from "@/lib/__tests__/helpers/db-mock"
import { XP_VALUES } from "@/lib/xp"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("@/lib/auth", () => ({ getClerkId: vi.fn(), isDemo: vi.fn() }))
vi.mock("@/lib/missions", () => ({ getUser: vi.fn(), awardXP: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ mutationRateLimit: {}, applyRateLimit: vi.fn() }))

import { getClerkId } from "@/lib/auth"
import { getUser, awardXP } from "@/lib/missions"
import { applyRateLimit } from "@/lib/rate-limit"
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
    queueDb([{ totalLessons: 10 }], [{ count: 1 }], [{ id: ID }])
    const body = await (await post({ action: "complete", id: ID })).json()
    expect(body.xpEarned).toBe(XP_VALUES.COMPLETE_COURSE)
    expect(awardXP).toHaveBeenCalledWith("user-1", XP_VALUES.COMPLETE_COURSE)
  })

  it("completes without XP past the daily allowance", async () => {
    queueDb([{ totalLessons: 10 }], [{ count: 2 }], [{ id: ID }])
    expect((await (await post({ action: "complete", id: ID })).json()).xpEarned).toBe(0)
    expect(awardXP).not.toHaveBeenCalled()
  })

  it("completes without XP for short courses", async () => {
    queueDb([{ totalLessons: 1 }], [{ count: 0 }], [{ id: ID }])
    await post({ action: "complete", id: ID })
    expect(awardXP).not.toHaveBeenCalled()
  })

  it("pays nothing when another request already completed it", async () => {
    queueDb([{ totalLessons: 10 }], [{ count: 0 }], [])
    await post({ action: "complete", id: ID })
    expect(awardXP).not.toHaveBeenCalled()
  })

  it("does nothing for an unknown or already completed course", async () => {
    queueDb([])
    expect((await (await post({ action: "complete", id: ID })).json()).course).toBeNull()
    expect(dbOps()).toEqual(["select"])
  })
})
