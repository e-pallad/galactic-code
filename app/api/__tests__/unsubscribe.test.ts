import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { queueDb, resetDb, dbOps } from "@/lib/__tests__/helpers/db-mock"
import { NextRequest } from "next/server"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))

import { unsubscribeToken } from "@/lib/email"
import { GET, POST } from "@/app/api/email/unsubscribe/route"

const url = (u: string, t: string) => `http://test.local/api/email/unsubscribe?u=${u}&t=${t}`

beforeEach(() => {
  resetDb()
  vi.stubEnv("CRON_SECRET", "s3cret")
})
afterEach(() => vi.unstubAllEnvs())

describe("unsubscribe", () => {
  it("GET only shows a confirmation and never writes", async () => {
    const res = await GET(new NextRequest(url("u1", unsubscribeToken("u1"))))
    expect(res.status).toBe(200)
    expect(await res.text()).toContain("<form")
    expect(dbOps()).toEqual([])
  })

  it("GET rejects a bad token", async () => {
    expect((await GET(new NextRequest(url("u1", "bad")))).status).toBe(400)
  })

  it("POST opts the pilot out (one-click, JSON)", async () => {
    queueDb([])
    const res = await POST(new NextRequest(url("u1", unsubscribeToken("u1")), { method: "POST" }))
    expect(await res.json()).toEqual({ unsubscribed: true })
    expect(dbOps()).toEqual(["update"])
  })

  it("POST from the confirmation form answers with a page", async () => {
    queueDb([])
    const res = await POST(new NextRequest(url("u1", unsubscribeToken("u1")), { method: "POST", headers: { accept: "text/html" } }))
    expect(await res.text()).toContain("Signal terminated")
  })

  it("POST with a bad token changes nothing", async () => {
    expect((await POST(new NextRequest(url("u1", "bad"), { method: "POST" }))).status).toBe(400)
    expect(dbOps()).toEqual([])
  })
})
