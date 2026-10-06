import { describe, it, expect } from "vitest"
import {
  getAccess,
  canAccess,
  visibleNavItems,
  unlockRankForPath,
  nextUnlock,
  newlyUnlocked,
} from "@/lib/unlocks"

const hrefs = (xp: number, explorer = false) =>
  visibleNavItems(getAccess({ totalXp: xp, explorerMode: explorer }, false)).map((i) => i.href)

describe("visibleNavItems", () => {
  it("shows only the core loop to a brand-new pilot", () => {
    expect(hrefs(0)).toEqual(["/dashboard", "/academy", "/character"])
  })
  it("reveals areas as rank rises", () => {
    expect(hrefs(100)).toContain("/sim-bay")
    expect(hrefs(100)).not.toContain("/operations")
    expect(hrefs(250)).toContain("/operations")
    expect(hrefs(500)).toEqual(expect.arrayContaining(["/hangar", "/combat"]))
    expect(hrefs(499)).not.toContain("/combat")
    expect(hrefs(1000)).toContain("/fleet")
  })
  it("shows everything in explorer mode and in the demo", () => {
    expect(hrefs(0, true)).toHaveLength(8)
    const demo = getAccess(null, true)
    expect(visibleNavItems(demo)).toHaveLength(8)
  })
})

describe("unlockRankForPath", () => {
  it("maps merged routes onto their parent area", () => {
    expect(unlockRankForPath("/armory")).toBe(4)
    expect(unlockRankForPath("/leaderboard")).toBe(5)
    expect(unlockRankForPath("/combat/abc")).toBe(4)
    expect(unlockRankForPath("/mission-log")).toBe(1)
    expect(unlockRankForPath("/star-map/js")).toBe(1)
  })
  it("leaves ungated routes open", () => {
    expect(unlockRankForPath("/settings")).toBe(1)
    expect(unlockRankForPath("/dashboard")).toBe(1)
  })
})

describe("nextUnlock / newlyUnlocked", () => {
  it("finds the nearest locked area", () => {
    expect(nextUnlock(1)?.href).toBe("/sim-bay")
    expect(nextUnlock(3)?.unlockRank).toBe(4)
    expect(nextUnlock(5)).toBeNull()
  })
  it("lists everything crossed by a rank-up, including skipped ranks", () => {
    expect(newlyUnlocked(1, 2).map((i) => i.href)).toEqual(["/sim-bay"])
    expect(newlyUnlocked(3, 5).map((i) => i.href)).toEqual(["/hangar", "/combat", "/fleet"])
    expect(newlyUnlocked(5, 5)).toEqual([])
  })
})

describe("canAccess", () => {
  it("respects rank unless explorer", () => {
    expect(canAccess({ rank: 1, explorer: false }, 2)).toBe(false)
    expect(canAccess({ rank: 2, explorer: false }, 2)).toBe(true)
    expect(canAccess({ rank: 1, explorer: true }, 5)).toBe(true)
  })
})
