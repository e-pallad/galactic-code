import { describe, it, expect, vi, beforeEach } from "vitest"

const execute = vi.fn()
vi.mock("@/lib/db", () => ({ db: { execute: (...a: unknown[]) => execute(...a) } }))

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.resetModules()
    execute.mockReset()
    vi.useFakeTimers()
  })

  it("reports ok and only queries the database once per cache window", async () => {
    execute.mockResolvedValue([])
    const { GET } = await import("@/app/api/health/route")
    expect((await GET()).status).toBe(200)
    expect((await GET()).status).toBe(200)
    expect(execute).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(11_000)
    await GET()
    expect(execute).toHaveBeenCalledTimes(2)
  })

  it("answers 503 when the database is unreachable", async () => {
    execute.mockRejectedValue(new Error("down"))
    const { GET } = await import("@/app/api/health/route")
    expect((await GET()).status).toBe(503)
  })
})

describe("POST /api/csp-report", () => {
  it("logs a trimmed line and answers 204, also for junk bodies", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { POST } = await import("@/app/api/csp-report/route")
    const report = { "csp-report": { "violated-directive": "script-src", "blocked-uri": "https://x.dev", "document-uri": "https://galacticcode.app/", secret: "no" } }
    expect((await POST(new Request("http://t.local", { method: "POST", body: JSON.stringify(report) }))).status).toBe(204)
    expect(warn).toHaveBeenCalledWith("[csp-report]", expect.not.stringContaining("secret"))
    expect((await POST(new Request("http://t.local", { method: "POST", body: "not json" }))).status).toBe(204)
    warn.mockRestore()
  })
})
