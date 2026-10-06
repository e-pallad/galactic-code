import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeUser, queueDb, resetDb, dbOps, dbWrites } from "@/lib/__tests__/helpers/db-mock"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("@/lib/auth", () => ({ getClerkId: vi.fn(), isDemo: vi.fn() }))
vi.mock("@/lib/missions", () => ({ getUser: vi.fn() }))

import { getClerkId, isDemo } from "@/lib/auth"
import { getUser } from "@/lib/missions"
import { PATCH } from "@/app/api/user/settings/route"

const patch = (body: unknown) =>
  PATCH(new Request("http://test.local/api/user/settings", { method: "PATCH", body: JSON.stringify(body) }))

beforeEach(() => {
  resetDb()
  vi.clearAllMocks()
  vi.mocked(isDemo).mockResolvedValue(false)
  vi.mocked(getClerkId).mockResolvedValue("clerk_1")
  vi.mocked(getUser).mockResolvedValue(makeUser() as never)
})

describe("PATCH /api/user/settings", () => {
  it("is read-only in the demo", async () => {
    vi.mocked(isDemo).mockResolvedValue(true)
    expect((await patch({ explorerMode: true })).status).toBe(403)
    expect(dbOps()).toEqual([])
  })

  it("rejects a signed-out request", async () => {
    vi.mocked(getClerkId).mockResolvedValue(null)
    expect((await patch({ explorerMode: true })).status).toBe(401)
  })

  it("rejects an unknown pilot", async () => {
    vi.mocked(getUser).mockResolvedValue(null)
    expect((await patch({ explorerMode: true })).status).toBe(404)
  })

  it.each([
    ["a daily goal above the limit", { dailyGoalMissions: 11 }],
    ["a daily goal of zero", { dailyGoalMissions: 0 }],
    ["a weekly goal above the limit", { weeklyGoalMissions: 101 }],
    ["an empty name", { name: "" }],
    ["a non-boolean Explorer Mode", { explorerMode: "yes" }],
  ])("rejects %s", async (_label, body) => {
    expect((await patch(body)).status).toBe(400)
    expect(dbOps()).toEqual([])
  })

  it("saves Explorer Mode", async () => {
    const res = await patch({ explorerMode: true })
    expect(res.status).toBe(200)
    expect(dbWrites()).toEqual([{ explorerMode: true }])
  })

  it("can switch Explorer Mode back off", async () => {
    await patch({ explorerMode: false })
    expect(dbWrites()).toEqual([{ explorerMode: false }])
  })

  it("only writes the fields that were sent", async () => {
    await patch({ name: "Vega", dailyGoalMissions: 5 })
    expect(dbWrites()).toEqual([{ name: "Vega", dailyGoalMissions: 5 }])
  })

  it("refuses a track that is not active", async () => {
    queueDb([])
    const res = await patch({ track: "cobol" })
    expect(res.status).toBe(400)
    expect(dbOps()).not.toContain("update")
  })

  it("accepts an active track", async () => {
    queueDb([{ id: "react" }])
    const res = await patch({ track: "react" })
    expect(res.status).toBe(200)
    expect(dbWrites()).toEqual([{ track: "react" }])
  })

  it("stores a valid timezone and silently ignores an invalid one", async () => {
    await patch({ timezone: "America/Los_Angeles" })
    expect(dbWrites()).toEqual([{ timezone: "America/Los_Angeles" }])
    resetDb()
    await patch({ timezone: "Mars/Olympus_Mons" })
    expect(dbWrites()).toEqual([{}])
  })
})
