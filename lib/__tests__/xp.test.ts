import { describe, it, expect } from "vitest"
import { getRankFromXP, getRankProgress, getCharacterClass, RANK_THRESHOLDS } from "@/lib/xp"

describe("getRankFromXP", () => {
  it("returns rank 1 for 0 XP", () => {
    expect(getRankFromXP(0)).toBe(1)
  })
  it("returns rank 1 for 99 XP", () => {
    expect(getRankFromXP(99)).toBe(1)
  })
  it("returns rank 2 for exactly 100 XP", () => {
    expect(getRankFromXP(100)).toBe(2)
  })
  it("returns rank 5 for 1000 XP", () => {
    expect(getRankFromXP(1000)).toBe(5)
  })
  it("returns rank 10 for 10000 XP", () => {
    expect(getRankFromXP(10000)).toBe(10)
  })
  it("returns rank 10 for XP beyond max", () => {
    expect(getRankFromXP(99999)).toBe(10)
  })
})

describe("getRankProgress", () => {
  it("returns progress 0 at rank 1 with 0 XP", () => {
    const result = getRankProgress(0)
    expect(result.rank).toBe(1)
    expect(result.progress).toBe(0)
    expect(result.nextXp).not.toBeNull()
  })
  it("returns 100% progress and null nextXp at max rank", () => {
    const result = getRankProgress(10000)
    expect(result.rank).toBe(10)
    expect(result.progress).toBe(100)
    expect(result.nextXp).toBeNull()
  })
  it("returns label for current rank", () => {
    const result = getRankProgress(0)
    expect(result.label).toBe("Cadet")
  })
  it("calculates correct progress percentage mid-rank", () => {
    // rank 1 → 2 requires 100 XP. At 50 XP = 50%
    const result = getRankProgress(50)
    expect(result.progress).toBe(50)
  })
})

describe("getCharacterClass", () => {
  it("returns javascript class", () => {
    const cls = getCharacterClass("javascript")
    expect(cls.name).toBe("Code Pilot")
    expect(cls.icon).toBe("⚡")
  })
  it("returns python class", () => {
    const cls = getCharacterClass("python")
    expect(cls.name).toBe("Data Mage")
  })
  it("returns default for unknown track", () => {
    const cls = getCharacterClass("unknown-track")
    expect(cls.name).toBe("Space Cadet")
  })
})
