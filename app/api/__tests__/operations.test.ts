import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeUser, queueDb, resetDb, dbWrites } from "@/lib/__tests__/helpers/db-mock"
import { XP_VALUES } from "@/lib/xp"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("@/lib/auth", () => ({ getClerkId: vi.fn(), isDemo: vi.fn() }))
vi.mock("@/lib/missions", () => ({ getUser: vi.fn(), awardXP: vi.fn(), checkMedals: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ mutationRateLimit: {}, applyRateLimit: vi.fn() }))
vi.mock("@/lib/unlocks-server", () => ({ requireUnlock: vi.fn() }))

import { getClerkId } from "@/lib/auth"
import { getUser, awardXP } from "@/lib/missions"
import { applyRateLimit } from "@/lib/rate-limit"
import { requireUnlock } from "@/lib/unlocks-server"
import { POST } from "@/app/api/operations/route"

const ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7"
const post = (body: unknown) =>
  POST(new Request("http://test.local/api/operations", { method: "POST", body: JSON.stringify(body) }))
const system = { operationTitle: "Real title", operationDescription: "Real brief" }

beforeEach(() => {
  resetDb()
  vi.clearAllMocks()
  vi.mocked(getClerkId).mockResolvedValue("clerk_1")
  vi.mocked(getUser).mockResolvedValue(makeUser() as never)
  vi.mocked(applyRateLimit).mockResolvedValue(null)
  vi.mocked(requireUnlock).mockResolvedValue(null)
  vi.mocked(awardXP).mockResolvedValue({ leveledUp: false, newRank: 1, newXp: 100 })
})

describe("POST /api/operations create", () => {
  it("404s for a star system that does not exist", async () => {
    queueDb([])
    expect((await post({ action: "create", trackId: "javascript", systemNumber: 99 })).status).toBe(404)
  })

  it("takes title and brief from the star system, not from the client", async () => {
    queueDb([system], [{ id: ID }])
    await post({ action: "create", trackId: "javascript", systemNumber: 1, title: "mine", description: "mine" })
    expect(dbWrites()[0]).toMatchObject({ title: "Real title", description: "Real brief" })
  })

  it("returns the existing operation instead of failing on a repeat create", async () => {
    queueDb([system], [], [{ id: ID }])
    expect(await (await post({ action: "create", trackId: "javascript", systemNumber: 1 })).json()).toEqual({ operation: { id: ID } })
  })
})

describe("POST /api/operations complete / update", () => {
  it("requires an http(s) repo url", async () => {
    expect((await post({ action: "complete", id: ID, repoUrl: "javascript:alert(1)" })).status).toBe(400)
  })

  it("pays the completion XP once", async () => {
    queueDb([{ id: ID }])
    await post({ action: "complete", id: ID, repoUrl: "https://github.com/a/b" })
    expect(awardXP).toHaveBeenCalledWith("user-1", XP_VALUES.COMPLETE_OPERATION)
  })

  it("pays nothing when the operation was already completed", async () => {
    queueDb([])
    await post({ action: "complete", id: ID, repoUrl: "https://github.com/a/b" })
    expect(awardXP).not.toHaveBeenCalled()
  })

  it("cannot reopen a completed operation via update", async () => {
    queueDb([])
    const body = await (await post({ action: "update", id: ID, repoUrl: "https://github.com/a/b" })).json()
    expect(body).toEqual({ operation: null })
  })
})
