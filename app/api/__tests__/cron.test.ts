import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { queueDb, resetDb } from "@/lib/__tests__/helpers/db-mock"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("@/lib/email", () => ({ sendReEngagementEmail: vi.fn(), sendWeeklySummaryEmail: vi.fn() }))

import { sendReEngagementEmail, sendWeeklySummaryEmail } from "@/lib/email"
import { isCronAuthorized, sendInBatches } from "@/lib/cron"
import { GET as reEngagement } from "@/app/api/cron/re-engagement/route"
import { GET as weekly } from "@/app/api/cron/weekly-summary/route"
import { NextRequest } from "next/server"

const call = (handler: typeof reEngagement, headers: Record<string, string> = { authorization: "Bearer s3cret" }) =>
  handler(new NextRequest("http://test.local/api/cron/x", { headers }))
const pilot = { id: "u1", email: "a@b.c", name: "Ada", streak: 4, totalXp: 120 }

beforeEach(() => {
  resetDb()
  vi.clearAllMocks()
  vi.stubEnv("CRON_SECRET", "s3cret")
})
afterEach(() => vi.unstubAllEnvs())

describe("isCronAuthorized", () => {
  const req = (headers: Record<string, string>) => new Request("http://test.local", { headers })

  it("accepts the bearer token and the manual header", () => {
    expect(isCronAuthorized(req({ authorization: "Bearer s3cret" }))).toBe(true)
    expect(isCronAuthorized(req({ "x-cron-secret": "s3cret" }))).toBe(true)
  })

  it("rejects wrong, shorter and missing secrets", () => {
    expect(isCronAuthorized(req({ authorization: "Bearer nope" }))).toBe(false)
    expect(isCronAuthorized(req({ authorization: "Bearer s3cre" }))).toBe(false)
    expect(isCronAuthorized(req({}))).toBe(false)
  })

  it("rejects everything when CRON_SECRET is unset", () => {
    vi.stubEnv("CRON_SECRET", "")
    expect(isCronAuthorized(req({ authorization: "Bearer " }))).toBe(false)
  })
})

describe("sendInBatches", () => {
  it("keeps going after a failure and reports the counts", async () => {
    const fn = vi.fn(async (n: number) => { if (n === 3) throw new Error("boom") })
    expect(await sendInBatches([1, 2, 3, 4, 5, 6, 7], fn, 3)).toEqual({ sent: 6, failed: 1 })
    expect(fn).toHaveBeenCalledTimes(7)
  })
})

describe("cron routes", () => {
  it("answer 401 without the secret", async () => {
    expect((await call(reEngagement, {})).status).toBe(401)
    expect((await call(weekly, {})).status).toBe(401)
  })

  it("re-engagement mails every selected pilot", async () => {
    queueDb([pilot, { ...pilot, id: "u2" }])
    vi.mocked(sendReEngagementEmail).mockResolvedValue(undefined as never)
    expect(await (await call(reEngagement)).json()).toEqual({ sent: 2, failed: 0, total: 2 })
  })

  it("weekly summary skips pilots without activity and counts failures", async () => {
    queueDb([
      { user: pilot, xpThisWeek: "40", missionsThisWeek: "2" },
      { user: { ...pilot, id: "u2" }, xpThisWeek: "0", missionsThisWeek: "0" },
      { user: { ...pilot, id: "u3" }, xpThisWeek: "5", missionsThisWeek: "0" },
    ])
    vi.mocked(sendWeeklySummaryEmail).mockResolvedValueOnce(undefined as never).mockRejectedValueOnce(new Error("resend down"))
    expect(await (await call(weekly)).json()).toEqual({ sent: 1, failed: 1, total: 2 })
  })
})
