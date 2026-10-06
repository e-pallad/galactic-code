import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeUser } from "@/lib/__tests__/helpers/db-mock"

vi.mock("@/lib/auth", () => ({ getClerkId: vi.fn(), isDemo: vi.fn() }))
vi.mock("@/lib/missions", () => ({ getUser: vi.fn(), awardDailyLoginXP: vi.fn(), updateStreak: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ mutationRateLimit: {}, applyRateLimit: vi.fn() }))

import { NextResponse } from "next/server"
import { getClerkId, isDemo } from "@/lib/auth"
import { getUser, awardDailyLoginXP, updateStreak } from "@/lib/missions"
import { applyRateLimit } from "@/lib/rate-limit"
import { POST } from "@/app/api/user/check-in/route"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(isDemo).mockResolvedValue(false)
  vi.mocked(getClerkId).mockResolvedValue("clerk_1")
  vi.mocked(applyRateLimit).mockResolvedValue(null)
})

describe("POST /api/user/check-in", () => {
  it("does nothing for the shared demo pilot", async () => {
    vi.mocked(isDemo).mockResolvedValue(true)
    const res = await POST()
    expect(await res.json()).toEqual({ changed: false })
    expect(getUser).not.toHaveBeenCalled()
    expect(awardDailyLoginXP).not.toHaveBeenCalled()
  })

  it("rejects a signed-out request", async () => {
    vi.mocked(getClerkId).mockResolvedValue(null)
    expect((await POST()).status).toBe(401)
  })

  it("rejects an unknown pilot", async () => {
    vi.mocked(getUser).mockResolvedValue(null)
    expect((await POST()).status).toBe(404)
  })

  it("is rate limited before it writes anything", async () => {
    vi.mocked(getUser).mockResolvedValue(makeUser() as never)
    vi.mocked(applyRateLimit).mockResolvedValue(NextResponse.json({ error: "Too many requests" }, { status: 429 }))
    expect((await POST()).status).toBe(429)
    expect(awardDailyLoginXP).not.toHaveBeenCalled()
    expect(updateStreak).not.toHaveBeenCalled()
  })

  it("pays the login XP and advances the streak, reporting the change", async () => {
    vi.mocked(getUser)
      .mockResolvedValueOnce(makeUser({ totalXp: 100, streak: 2 }) as never)
      .mockResolvedValueOnce(makeUser({ totalXp: 105, streak: 3 }) as never)
    const res = await POST()
    expect(await res.json()).toEqual({ changed: true })
    expect(awardDailyLoginXP).toHaveBeenCalledWith("user-1")
    expect(updateStreak).toHaveBeenCalledWith("user-1")
  })

  it("reports no change when today's check-in was already recorded", async () => {
    vi.mocked(getUser).mockResolvedValue(makeUser({ totalXp: 100, streak: 2 }) as never)
    const res = await POST()
    expect(await res.json()).toEqual({ changed: false })
  })
})
