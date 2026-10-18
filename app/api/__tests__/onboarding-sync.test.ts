import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeUser } from "@/lib/__tests__/helpers/db-mock"

vi.mock("@/lib/auth", () => ({ getClerkId: vi.fn() }))
vi.mock("@/lib/missions", () => ({ getUser: vi.fn() }))

import { getClerkId } from "@/lib/auth"
import { getUser } from "@/lib/missions"
import { GET } from "@/app/api/user/onboarding/sync/route"

const get = () => GET(new Request("http://test.local/api/user/onboarding/sync"))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getClerkId).mockResolvedValue("clerk_1")
})

describe("GET /api/user/onboarding/sync", () => {
  it("restores the cookie and goes to the dashboard for a pilot who finished onboarding", async () => {
    vi.mocked(getUser).mockResolvedValue(makeUser({ onboardingCompleted: true }) as never)
    const res = await get()
    expect(res.headers.get("location")).toBe("http://test.local/dashboard")
    expect(res.headers.get("set-cookie")).toContain("gc_onboarding=1")
  })

  it("sends a pilot who hasn't finished back to the questions without a cookie", async () => {
    vi.mocked(getUser).mockResolvedValue(makeUser({ onboardingCompleted: false }) as never)
    const res = await get()
    expect(res.headers.get("location")).toBe("http://test.local/onboarding")
    expect(res.headers.get("set-cookie")).toBeNull()
  })

  it("sends signed-out visitors to sign in", async () => {
    vi.mocked(getClerkId).mockResolvedValue(null)
    expect((await get()).headers.get("location")).toBe("http://test.local/sign-in")
  })
})
