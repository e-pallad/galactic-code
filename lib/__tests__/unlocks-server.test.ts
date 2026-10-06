import { describe, it, expect, vi, beforeEach } from "vitest"

const isDemo = vi.fn()
vi.mock("@/lib/auth", () => ({ isDemo: () => isDemo() }))

import { requireUnlock } from "@/lib/unlocks-server"

const pilot = (totalXp: number, explorerMode = false) => ({ totalXp, explorerMode })

describe("requireUnlock", () => {
  beforeEach(() => isDemo.mockResolvedValue(false))

  it("lets a pilot through once the area's rank is reached", async () => {
    expect(await requireUnlock(pilot(500), "/combat")).toBeNull()
    expect(await requireUnlock(pilot(500), "/hangar")).toBeNull()
  })

  it("answers 403 with the required rank while the area is locked", async () => {
    const res = await requireUnlock(pilot(499), "/combat")
    expect(res?.status).toBe(403)
    expect(await res?.json()).toEqual({ error: "Area locked", requiredRank: 4 })
  })

  it("gates operations at their own rank", async () => {
    expect((await requireUnlock(pilot(249), "/operations"))?.status).toBe(403)
    expect(await requireUnlock(pilot(250), "/operations")).toBeNull()
  })

  it("passes explorers and the demo through", async () => {
    expect(await requireUnlock(pilot(0, true), "/combat")).toBeNull()
    isDemo.mockResolvedValue(true)
    expect(await requireUnlock(pilot(0), "/combat")).toBeNull()
  })

  it("never gates routes that aren't an unlockable area", async () => {
    expect(await requireUnlock(pilot(0), "/settings")).toBeNull()
  })
})
