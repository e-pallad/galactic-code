import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { makeUser, queueDb, resetDb } from "@/lib/__tests__/helpers/db-mock"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("@/lib/auth", () => ({ getClerkId: vi.fn(), isDemo: vi.fn() }))
vi.mock("@/lib/missions", () => ({ getUser: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ aiRateLimit: {}, applyRateLimit: vi.fn() }))
const create = vi.fn()
vi.mock("@anthropic-ai/sdk", () => ({ default: class { messages = { create } } }))

import { getClerkId, isDemo } from "@/lib/auth"
import { getUser } from "@/lib/missions"
import { applyRateLimit } from "@/lib/rate-limit"
import { POST } from "@/app/api/ai/recommendations/route"

const future = new Date(Date.now() + 3_600_000)
const past = new Date(Date.now() - 3_600_000)

beforeEach(() => {
  resetDb()
  vi.clearAllMocks()
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key")
  vi.mocked(getClerkId).mockResolvedValue("clerk_1")
  vi.mocked(isDemo).mockResolvedValue(false)
  vi.mocked(getUser).mockResolvedValue(makeUser() as never)
  vi.mocked(applyRateLimit).mockResolvedValue(null)
})
afterEach(() => vi.unstubAllEnvs())

describe("POST /api/ai/recommendations", () => {
  it("serves a fresh cached recommendation without calling the model or the rate limiter", async () => {
    queueDb([{ content: "cached", expiresAt: future }])
    expect(await (await POST()).json()).toEqual({ content: "cached", cached: true })
    expect(create).not.toHaveBeenCalled()
    expect(applyRateLimit).not.toHaveBeenCalled()
  })

  it("generates and stores a new recommendation when the cache is stale", async () => {
    queueDb([{ content: "old", expiresAt: past }])
    create.mockResolvedValue({ content: [{ type: "text", text: "new advice" }] })
    expect(await (await POST()).json()).toEqual({ content: "new advice", cached: false })
  })

  it("answers 502 instead of crashing when the model call fails", async () => {
    queueDb([])
    create.mockRejectedValue(new Error("overloaded"))
    expect((await POST()).status).toBe(502)
  })
})
