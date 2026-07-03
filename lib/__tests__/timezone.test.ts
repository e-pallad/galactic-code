import { describe, it, expect } from "vitest"
import { isValidTimezone, localDateString, calendarDaysBetween } from "@/lib/timezone"

describe("isValidTimezone", () => {
  it("accepts IANA zones", () => {
    expect(isValidTimezone("Europe/Warsaw")).toBe(true)
    expect(isValidTimezone("America/New_York")).toBe(true)
    expect(isValidTimezone("UTC")).toBe(true)
  })

  it("rejects garbage", () => {
    expect(isValidTimezone("Not/AZone")).toBe(false)
    expect(isValidTimezone("<script>")).toBe(false)
  })
})

describe("localDateString", () => {
  // 2026-07-03T23:30Z is already July 4th east of UTC+1
  const instant = new Date("2026-07-03T23:30:00Z")

  it("formats YYYY-MM-DD in the given zone", () => {
    expect(localDateString("UTC", instant)).toBe("2026-07-03")
    expect(localDateString("Europe/Warsaw", instant)).toBe("2026-07-04")
    expect(localDateString("America/Los_Angeles", instant)).toBe("2026-07-03")
  })

  it("falls back to UTC for null or invalid zones", () => {
    expect(localDateString(null, instant)).toBe("2026-07-03")
    expect(localDateString("Not/AZone", instant)).toBe("2026-07-03")
  })
})

describe("calendarDaysBetween", () => {
  it("computes day gaps", () => {
    expect(calendarDaysBetween("2026-07-03", "2026-07-04")).toBe(1)
    expect(calendarDaysBetween("2026-07-03", "2026-07-03")).toBe(0)
    expect(calendarDaysBetween("2026-06-30", "2026-07-02")).toBe(2)
  })

  it("is negative when 'to' is earlier (timezone shifts)", () => {
    expect(calendarDaysBetween("2026-07-04", "2026-07-03")).toBe(-1)
  })

  it("crosses month and year boundaries", () => {
    expect(calendarDaysBetween("2025-12-31", "2026-01-01")).toBe(1)
  })
})
