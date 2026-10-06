import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeUser, queueDb, resetDb, dbOps, dbWrites } from "@/lib/__tests__/helpers/db-mock"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("@/lib/auth", () => ({ getClerkId: vi.fn(), isDemo: vi.fn() }))
vi.mock("@/lib/missions", () => ({ getUser: vi.fn() }))
vi.mock("@/lib/combat", () => ({ deductCredits: vi.fn(), awardCredits: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ mutationRateLimit: {}, applyRateLimit: vi.fn() }))

import { NextResponse } from "next/server"
import { getClerkId, isDemo } from "@/lib/auth"
import { getUser } from "@/lib/missions"
import { deductCredits, awardCredits } from "@/lib/combat"
import { applyRateLimit } from "@/lib/rate-limit"
import { POST } from "@/app/api/combat/shop/buy/route"

const ITEM_ID = "3f2b8a52-6d1c-4a43-9c0e-0e6b7f6a1111"
const item = { id: ITEM_ID, creditCost: 50 }
const post = (body: unknown) =>
  POST(new Request("http://test.local/api/combat/shop/buy", { method: "POST", body: JSON.stringify(body) }))

beforeEach(() => {
  resetDb()
  vi.clearAllMocks()
  vi.mocked(isDemo).mockResolvedValue(false)
  vi.mocked(getClerkId).mockResolvedValue("clerk_1")
  vi.mocked(getUser).mockResolvedValue(makeUser({ totalXp: 500 }) as never) // Rank 4: Hangar unlocked
  vi.mocked(applyRateLimit).mockResolvedValue(null)
})

describe("POST /api/combat/shop/buy", () => {
  it("rejects a signed-out request", async () => {
    vi.mocked(getClerkId).mockResolvedValue(null)
    expect((await post({ itemId: ITEM_ID })).status).toBe(401)
  })

  it("rejects an unknown pilot", async () => {
    vi.mocked(getUser).mockResolvedValue(null)
    expect((await post({ itemId: ITEM_ID })).status).toBe(404)
  })

  it("blocks purchases while the Hangar is locked, without charging credits", async () => {
    vi.mocked(getUser).mockResolvedValue(makeUser({ totalXp: 499 }) as never)
    const res = await post({ itemId: ITEM_ID })
    expect(res.status).toBe(403)
    expect(deductCredits).not.toHaveBeenCalled()
    expect(dbOps()).toEqual([])
  })

  it("lets an Explorer Mode pilot buy at any rank", async () => {
    vi.mocked(getUser).mockResolvedValue(makeUser({ totalXp: 0, explorerMode: true }) as never)
    queueDb([item], [])
    vi.mocked(deductCredits).mockResolvedValue({ newBalance: 50 } as never)
    expect((await post({ itemId: ITEM_ID })).status).toBe(200)
  })

  it("passes a rate-limit response straight through", async () => {
    vi.mocked(applyRateLimit).mockResolvedValue(NextResponse.json({ error: "Too many requests" }, { status: 429 }))
    expect((await post({ itemId: ITEM_ID })).status).toBe(429)
    expect(deductCredits).not.toHaveBeenCalled()
  })

  it("rejects a malformed item id", async () => {
    expect((await post({ itemId: "not-a-uuid" })).status).toBe(400)
    expect((await post({})).status).toBe(400)
  })

  it("answers 404 for an item that does not exist", async () => {
    queueDb([])
    expect((await post({ itemId: ITEM_ID })).status).toBe(404)
    expect(deductCredits).not.toHaveBeenCalled()
  })

  it("answers 409 when the pilot already owns the item", async () => {
    queueDb([item], [{ id: "inv-1" }])
    expect((await post({ itemId: ITEM_ID })).status).toBe(409)
    expect(deductCredits).not.toHaveBeenCalled()
  })

  it("answers 402 when the pilot cannot afford it", async () => {
    queueDb([item], [])
    vi.mocked(deductCredits).mockResolvedValue(null as never)
    expect((await post({ itemId: ITEM_ID })).status).toBe(402)
    expect(dbOps()).not.toContain("insert")
  })

  it("charges the item's cost, grants the item and returns the new balance", async () => {
    queueDb([item], [])
    vi.mocked(deductCredits).mockResolvedValue({ newBalance: 50 } as never)
    const res = await post({ itemId: ITEM_ID })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, newBalance: 50 })
    expect(deductCredits).toHaveBeenCalledWith("user-1", 50)
    expect(dbWrites()).toContainEqual({ userId: "user-1", itemId: ITEM_ID })
    expect(awardCredits).not.toHaveBeenCalled()
  })
})
