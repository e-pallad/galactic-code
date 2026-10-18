import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { GET } from "@/app/api/og/route"

const get = (qs: string) => GET(new NextRequest(`http://test.local/api/og?${qs}`))

describe("GET /api/og", () => {
  it("renders an image for hostile or oversized parameters instead of failing", async () => {
    const res = await get(`type=rank&name=${"x".repeat(5000)}&rank=999&label=Starfleet+Legend&xp=-5&icon=${"🚀".repeat(500)}`)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("image/png")
  })

  it("renders a medal card", async () => {
    expect((await get("type=medal&medal=Flawless&description=" + "d".repeat(1000))).status).toBe(200)
  })
})
