import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeUser, queueDb, resetDb } from "@/lib/__tests__/helpers/db-mock"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("@/lib/auth", () => ({ getClerkId: vi.fn(), isDemo: vi.fn() }))
vi.mock("@/lib/missions", () => ({ getUser: vi.fn(), awardXP: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ mutationRateLimit: {}, applyRateLimit: vi.fn() }))
vi.mock("next/headers", () => ({ cookies: vi.fn() }))

import { cookies } from "next/headers"
import { getClerkId, isDemo } from "@/lib/auth"
import { getUser, awardXP } from "@/lib/missions"
import { applyRateLimit } from "@/lib/rate-limit"
import { POST } from "@/app/api/referral/claim/route"

beforeEach(() => {
  resetDb()
  vi.clearAllMocks()
  vi.mocked(isDemo).mockResolvedValue(false)
  vi.mocked(getClerkId).mockResolvedValue("clerk_1")
  vi.mocked(getUser).mockResolvedValue(makeUser({ referredBy: null }) as never)
  vi.mocked(applyRateLimit).mockResolvedValue(null)
  vi.mocked(cookies).mockResolvedValue({ get: () => ({ value: "ABCD1234" }) } as never)
})

describe("POST /api/referral/claim", () => {
  it("pays both pilots once when the claim and the referrer slot succeed", async () => {
    queueDb([{ id: "ref-1" }], [{ id: "user-1" }], [{ id: "ref-1" }])
    expect(await (await POST()).json()).toEqual({ claimed: true, xpAwarded: 50 })
    expect(awardXP).toHaveBeenCalledTimes(2)
  })

  it("pays nothing when a parallel request already claimed the sign-up", async () => {
    queueDb([{ id: "ref-1" }], [])
    expect(await (await POST()).json()).toEqual({ claimed: false })
    expect(awardXP).not.toHaveBeenCalled()
  })

  it("pays nothing and undoes the link once the referrer is at the cap", async () => {
    queueDb([{ id: "ref-1" }], [{ id: "user-1" }], [])
    expect(await (await POST()).json()).toEqual({ claimed: false })
    expect(awardXP).not.toHaveBeenCalled()
  })

  it("ignores an unknown code", async () => {
    queueDb([])
    expect(await (await POST()).json()).toEqual({ claimed: false })
  })
})
