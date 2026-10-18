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
import { POST } from "@/app/api/star-map/route"

const post = (body: unknown) =>
  POST(new Request("http://test.local/api/star-map", { method: "POST", body: JSON.stringify(body) }))

beforeEach(() => {
  resetDb()
  vi.clearAllMocks()
  vi.mocked(getClerkId).mockResolvedValue("clerk_1")
  vi.mocked(getUser).mockResolvedValue(makeUser() as never)
  vi.mocked(applyRateLimit).mockResolvedValue(null)
  vi.mocked(awardXP).mockResolvedValue({ leveledUp: false, newRank: 1, newXp: 10 })
})

describe("POST /api/star-map", () => {
  it("rejects a signed-out request", async () => {
    vi.mocked(getClerkId).mockResolvedValue(null)
    expect((await post({ roadmapSlug: "javascript", nodeId: "fundamentals", completed: true })).status).toBe(401)
  })

  it("rejects nodes that are not part of the roadmap", async () => {
    expect((await post({ roadmapSlug: "javascript", nodeId: "made-up", completed: true })).status).toBe(404)
    expect((await post({ roadmapSlug: "../secrets", nodeId: "x", completed: true })).status).toBe(404)
    expect(awardXP).not.toHaveBeenCalled()
    expect(dbOps()).toEqual([])
  })

  it("pays the topic reward once, when the one-time claim succeeds", async () => {
    queueDb([{ id: "p1" }], [{ id: "p1" }])
    expect((await post({ roadmapSlug: "javascript", nodeId: "fundamentals", completed: true })).status).toBe(200)
    expect(awardXP).toHaveBeenCalledWith("user-1", XP_VALUES.STAR_MAP_TOPIC)
  })

  it("pays the subtopic reward based on the roadmap, not on client input", async () => {
    queueDb([{ id: "p1" }], [{ id: "p1" }])
    await post({ roadmapSlug: "javascript", nodeId: "variables", nodeType: "topic", completed: true })
    expect(awardXP).toHaveBeenCalledWith("user-1", XP_VALUES.STAR_MAP_SUBTOPIC)
  })

  it("pays nothing when the node was already paid (re-check after un-check)", async () => {
    queueDb([{ id: "p1" }], [])
    await post({ roadmapSlug: "javascript", nodeId: "fundamentals", completed: true })
    expect(awardXP).not.toHaveBeenCalled()
  })

  it("never pays when un-checking", async () => {
    queueDb([{ id: "p1" }])
    await post({ roadmapSlug: "javascript", nodeId: "fundamentals", completed: false })
    expect(awardXP).not.toHaveBeenCalled()
    expect(dbOps()).toEqual(["insert"])
  })
})
