import { describe, it, expect } from "vitest"
import { getRankFromXP, getRankProgress, getCharacterClass, XP_VALUES } from "../xp"

describe("getRankFromXP", () => {
  it("returns rank 1 at 0 XP", () => expect(getRankFromXP(0)).toBe(1))
  it("returns rank 2 at 100 XP", () => expect(getRankFromXP(100)).toBe(2))
  it("returns rank 2 at 249 XP", () => expect(getRankFromXP(249)).toBe(2))
  it("returns rank 3 at 250 XP", () => expect(getRankFromXP(250)).toBe(3))
  it("returns rank 10 at 10000 XP", () => expect(getRankFromXP(10000)).toBe(10))
  it("returns rank 10 beyond max XP", () => expect(getRankFromXP(99999)).toBe(10))
})

describe("getRankProgress", () => {
  it("returns correct progress at rank 1", () => {
    const p = getRankProgress(50)
    expect(p.rank).toBe(1)
    expect(p.label).toBe("Cadet")
    expect(p.nextXp).toBe(100)
    expect(p.progress).toBe(50)
  })

  it("handles max rank — nextXp is null", () => {
    const p = getRankProgress(10000)
    expect(p.rank).toBe(10)
    expect(p.nextXp).toBeNull()
    expect(p.progress).toBe(100)
  })

  it("caps progress at 100", () => {
    const p = getRankProgress(9999)
    expect(p.progress).toBeLessThanOrEqual(100)
  })
})

describe("getCharacterClass", () => {
  it("returns Code Pilot for javascript", () => expect(getCharacterClass("javascript").name).toBe("Code Pilot"))
  it("returns Data Mage for python", () => expect(getCharacterClass("python").name).toBe("Data Mage"))
  it("returns Space Cadet for unknown track", () => expect(getCharacterClass("cobol").name).toBe("Space Cadet"))
})

describe("XP_VALUES", () => {
  it("COMPLETE_MISSION is 15", () => expect(XP_VALUES.COMPLETE_MISSION).toBe(15))
  it("COMPLETE_MISSION_FOCUS_CYCLE is 20", () => expect(XP_VALUES.COMPLETE_MISSION_FOCUS_CYCLE).toBe(20))
  it("SKIP_MISSION is 2", () => expect(XP_VALUES.SKIP_MISSION).toBe(2))
})
