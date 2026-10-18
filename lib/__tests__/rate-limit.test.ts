import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@upstash/redis", () => ({ Redis: class {} }))
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() { return {} }
  },
}))
vi.mock("@/lib/auth", () => ({ isDemo: vi.fn() }))
vi.mock("next/headers", () => ({ headers: vi.fn() }))

import { headers } from "next/headers"
import { isDemo } from "@/lib/auth"
import { applyRateLimit } from "@/lib/rate-limit"

const limiter = (success: boolean) => ({ limit: vi.fn().mockResolvedValue({ success }) })
const asLimiter = (l: unknown) => l as Parameters<typeof applyRateLimit>[0]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(headers).mockResolvedValue(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }) as never)
})

describe("applyRateLimit", () => {
  it("keys signed-in pilots by user id", async () => {
    vi.mocked(isDemo).mockResolvedValue(false)
    const l = limiter(true)
    expect(await applyRateLimit(asLimiter(l), "user-1")).toBeNull()
    expect(l.limit).toHaveBeenCalledWith("user-1")
  })

  it("keys the shared demo pilot by client IP so one visitor can't lock out the rest", async () => {
    vi.mocked(isDemo).mockResolvedValue(true)
    const l = limiter(true)
    await applyRateLimit(asLimiter(l), "demo-user-id")
    expect(l.limit).toHaveBeenCalledWith("demo-ip:203.0.113.7")
  })

  it("answers 429 when the limit is hit", async () => {
    vi.mocked(isDemo).mockResolvedValue(false)
    const res = await applyRateLimit(asLimiter(limiter(false)), "user-1")
    expect(res?.status).toBe(429)
  })
})
