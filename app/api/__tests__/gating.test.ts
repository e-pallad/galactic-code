import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeUser, dbCalls, resetDb } from "@/lib/__tests__/helpers/db-mock"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("@/lib/auth", () => ({ getClerkId: vi.fn(), isDemo: vi.fn() }))
vi.mock("@/lib/missions", () => ({
  getUser: vi.fn(), awardXP: vi.fn(), checkMedals: vi.fn(), awardDailyLoginXP: vi.fn(), updateStreak: vi.fn(),
}))
vi.mock("@/lib/combat", () => ({
  getOrCreateShip: vi.fn(), getEquippedItems: vi.fn(), getEffectiveStats: vi.fn(), resolveTurn: vi.fn(),
  rollLoot: vi.fn(), awardCredits: vi.fn(), deductCredits: vi.fn(),
}))
vi.mock("@/lib/rate-limit", () => ({ mutationRateLimit: {}, applyRateLimit: vi.fn().mockResolvedValue(null) }))

import { getClerkId, isDemo } from "@/lib/auth"
import { getUser } from "@/lib/missions"

import * as activeBattles from "@/app/api/combat/battles/active/route"
import * as startBattle from "@/app/api/combat/battles/start/route"
import * as battleLog from "@/app/api/combat/battles/[battleId]/log/route"
import * as attack from "@/app/api/combat/battles/[battleId]/attack/route"
import * as joinBattle from "@/app/api/combat/battles/[battleId]/join/route"
import * as flee from "@/app/api/combat/battles/[battleId]/flee/route"
import * as entities from "@/app/api/combat/entities/route"
import * as createFleet from "@/app/api/combat/fleets/route"
import * as fleetRole from "@/app/api/combat/fleets/[fleetId]/role/route"
import * as fleetTransfer from "@/app/api/combat/fleets/[fleetId]/transfer/route"
import * as fleetSearch from "@/app/api/combat/fleets/search/route"
import * as fleetMine from "@/app/api/combat/fleets/mine/route"
import * as fleetLeave from "@/app/api/combat/fleets/leave/route"
import * as fleetJoin from "@/app/api/combat/fleets/join/route"
import * as inventory from "@/app/api/combat/inventory/route"
import * as equip from "@/app/api/combat/inventory/equip/route"
import * as ship from "@/app/api/combat/ship/route"
import * as shop from "@/app/api/combat/shop/route"
import * as shopBuy from "@/app/api/combat/shop/buy/route"
import * as operations from "@/app/api/operations/route"

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>
// Route handlers declare narrower `params` types than this table can express.
const asHandler = (fn: unknown) => fn as Handler

const req = (body: unknown = {}) =>
  new Request("http://test.local/api", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } })
const ctx = { params: Promise.resolve({ battleId: "b1", fleetId: "f1" }) }

// Every state-changing or data-returning route that belongs to a rank-gated
// area. A route added under /api/combat or /api/operations without
// requireUnlock should be added here and will fail until it is gated.
const gated: [string, Handler, unknown][] = [
  ["GET combat/battles/active", asHandler(activeBattles.GET), undefined],
  ["POST combat/battles/start", asHandler(startBattle.POST), {}],
  ["GET combat/battles/[id]/log", asHandler(battleLog.GET), undefined],
  ["POST combat/battles/[id]/attack", asHandler(attack.POST), {}],
  ["POST combat/battles/[id]/join", asHandler(joinBattle.POST), {}],
  ["POST combat/battles/[id]/flee", asHandler(flee.POST), {}],
  ["GET combat/entities", asHandler(entities.GET), undefined],
  ["POST combat/fleets", asHandler(createFleet.POST), {}],
  ["PATCH combat/fleets/[id]/role", asHandler(fleetRole.PATCH), {}],
  ["POST combat/fleets/[id]/transfer", asHandler(fleetTransfer.POST), {}],
  ["GET combat/fleets/search", asHandler(fleetSearch.GET), undefined],
  ["GET combat/fleets/mine", asHandler(fleetMine.GET), undefined],
  ["POST combat/fleets/leave", asHandler(fleetLeave.POST), undefined],
  ["POST combat/fleets/join", asHandler(fleetJoin.POST), {}],
  ["GET combat/inventory", asHandler(inventory.GET), undefined],
  ["POST combat/inventory/equip", asHandler(equip.POST), {}],
  ["GET combat/ship", asHandler(ship.GET), undefined],
  ["PATCH combat/ship", asHandler(ship.PATCH), {}],
  ["GET combat/shop", asHandler(shop.GET), undefined],
  ["POST combat/shop/buy", asHandler(shopBuy.POST), {}],
  ["POST operations", asHandler(operations.POST), { action: "create", trackId: "javascript", systemNumber: 1, title: "t", description: "d" }],
]

beforeEach(() => {
  resetDb()
  vi.mocked(isDemo).mockResolvedValue(false)
  vi.mocked(getClerkId).mockResolvedValue("clerk_1")
  vi.mocked(getUser).mockResolvedValue(makeUser({ totalXp: 0 }) as never)
})

describe.each(gated)("%s", (_name, handler, body) => {
  it("answers 401 when signed out", async () => {
    vi.mocked(getClerkId).mockResolvedValue(null)
    const res = await handler(req(body), ctx)
    expect(res.status).toBe(401)
  })

  it("answers 403 with the required rank while the area is locked, before touching the database", async () => {
    const res = await handler(req(body), ctx)
    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ error: "Area locked" })
    expect(dbCalls).toHaveLength(0)
  })
})
