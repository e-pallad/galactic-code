import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/demo", () => ({ resetDemoUser: vi.fn(), deleteExpiredDemoUsers: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ demoRateLimit: { limit: vi.fn() }, clientIp: vi.fn().mockResolvedValue("203.0.113.7") }))

import { resetDemoUser, deleteExpiredDemoUsers } from "@/lib/demo"
import { demoRateLimit } from "@/lib/rate-limit"
import { GET as demoEntry } from "@/app/demo/route"
import { POST as reset } from "@/app/api/demo/reset/route"
import { GET as cleanup } from "@/app/api/cron/demo-cleanup/route"

const SID = "0123456789abcdef0123456789abcdef"
const withCookie = (path: string, cookie?: string, init: { method?: string } = {}) =>
  new NextRequest(`http://test.local${path}`, { method: init.method, headers: cookie ? { cookie: `gc_demo=${cookie}` } : {} })
const setCookie = (res: Response) => res.headers.get("set-cookie") ?? ""

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(demoRateLimit.limit).mockResolvedValue({ success: true } as never)
  vi.stubEnv("CRON_SECRET", "s3cret")
})

describe("GET /demo and POST /api/demo/reset", () => {
  it("gives a new visitor a fresh session id", async () => {
    const res = await demoEntry(withCookie("/demo"))
    const id = vi.mocked(resetDemoUser).mock.calls[0][0]
    expect(id).toMatch(/^[0-9a-f]{32}$/)
    expect(setCookie(res)).toContain(`gc_demo=${id}`)
  })

  it("restarts a returning visitor's own pilot instead of creating another", async () => {
    await demoEntry(withCookie("/demo", SID))
    expect(resetDemoUser).toHaveBeenCalledWith(SID)
  })

  it("replaces the legacy shared cookie with a real session", async () => {
    const res = await reset(withCookie("/api/demo/reset", "1", { method: "POST" }))
    const id = vi.mocked(resetDemoUser).mock.calls[0][0]
    expect(id).not.toBe("1")
    expect(setCookie(res)).toContain(`gc_demo=${id}`)
  })

  it("creates nothing when rate limited", async () => {
    vi.mocked(demoRateLimit.limit).mockResolvedValue({ success: false } as never)
    expect((await reset(withCookie("/api/demo/reset", undefined, { method: "POST" }))).status).toBe(429)
    expect(resetDemoUser).not.toHaveBeenCalled()
  })
})

describe("GET /api/cron/demo-cleanup", () => {
  it("needs the cron secret", async () => {
    expect((await cleanup(withCookie("/api/cron/demo-cleanup"))).status).toBe(401)
    expect(deleteExpiredDemoUsers).not.toHaveBeenCalled()
  })

  it("deletes pilots older than a day", async () => {
    vi.mocked(deleteExpiredDemoUsers).mockResolvedValue(3)
    const req = new NextRequest("http://test.local/api/cron/demo-cleanup", { headers: { authorization: "Bearer s3cret" } })
    expect(await (await cleanup(req)).json()).toEqual({ deleted: 3 })
    const cutoff = vi.mocked(deleteExpiredDemoUsers).mock.calls[0][0]
    expect(Date.now() - cutoff.getTime()).toBeGreaterThan(23 * 3600_000)
  })
})
