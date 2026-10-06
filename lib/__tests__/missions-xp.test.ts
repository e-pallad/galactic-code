import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Queue-driven drizzle stand-in: every query-builder chain is a thenable that
// resolves to the next queued result (empty array once the queue runs dry), and
// every builder call is recorded so tests can assert on writes.
const h = vi.hoisted(() => {
  const results: unknown[] = []
  const calls: { method: string; args: unknown[] }[] = []
  function chain(): unknown {
    const target = function () {}
    const proxy: unknown = new Proxy(target, {
      get(_t, prop) {
        if (prop === "then") {
          const next = results.length ? results.shift() : []
          return (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(next).then(res, rej)
        }
        return (...args: unknown[]) => {
          calls.push({ method: String(prop), args })
          return proxy
        }
      },
    })
    return proxy
  }
  return { results, calls, chain }
})

vi.mock("@/lib/db", () => ({
  db: {
    select: (...a: unknown[]) => { h.calls.push({ method: "select", args: a }); return h.chain() },
    update: (...a: unknown[]) => { h.calls.push({ method: "update", args: a }); return h.chain() },
    insert: (...a: unknown[]) => { h.calls.push({ method: "insert", args: a }); return h.chain() },
  },
}))

import { awardXP, awardDailyLoginXP, updateStreak } from "@/lib/missions"

const updates = () => h.calls.filter((c) => c.method === "update").length
const setArgs = () => h.calls.filter((c) => c.method === "set").map((c) => c.args[0] as Record<string, unknown>)

beforeEach(() => {
  h.results.length = 0
  h.calls.length = 0
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-03-10T12:00:00Z"))
})
afterEach(() => vi.useRealTimers())

describe("awardXP", () => {
  it("reports a level-up and stores the new rank when an award crosses a threshold", async () => {
    h.results.push([{ totalXp: 105, rank: 1, timezone: "UTC" }])
    const res = await awardXP("u1", 15)
    expect(res).toEqual({ leveledUp: true, newRank: 2, newXp: 105 })
    expect(setArgs()).toContainEqual({ rank: 2 })
  })

  it("does not report a level-up inside a rank", async () => {
    h.results.push([{ totalXp: 60, rank: 1, timezone: "UTC" }])
    const res = await awardXP("u1", 15)
    expect(res).toEqual({ leveledUp: false, newRank: 1, newXp: 60 })
    expect(setArgs().some((s) => "rank" in s)).toBe(false)
  })

  it("throws when the user does not exist", async () => {
    h.results.push([])
    await expect(awardXP("missing", 15)).rejects.toThrow("User not found")
  })
})

describe("awardDailyLoginXP", () => {
  it("pays XP the first time each day", async () => {
    h.results.push([{ timezone: "UTC" }], [{ id: "log" }], [{ totalXp: 60, rank: 1, timezone: "UTC" }])
    await awardDailyLoginXP("u1")
    expect(updates()).toBe(1)
  })

  it("is a no-op when today's log already exists", async () => {
    h.results.push([{ timezone: "UTC" }], [])
    await awardDailyLoginXP("u1")
    expect(updates()).toBe(0)
  })
})

describe("updateStreak", () => {
  const user = (over: Record<string, unknown>) => ({
    id: "u1",
    timezone: "UTC",
    streak: 3,
    lastSeenAt: new Date("2026-03-09T09:00:00Z"),
    streakFreezeUsedAt: null,
    ...over,
  })

  it("starts a streak on the first visit", async () => {
    h.results.push([user({ lastSeenAt: null, streak: 0 })])
    expect(await updateStreak("u1")).toBe(1)
  })

  it("leaves the streak alone on a repeat visit the same day", async () => {
    h.results.push([user({ lastSeenAt: new Date("2026-03-10T01:00:00Z") })])
    expect(await updateStreak("u1")).toBe(3)
    expect(updates()).toBe(0)
  })

  it("extends the streak on consecutive days", async () => {
    h.results.push([user({})])
    expect(await updateStreak("u1")).toBe(4)
  })

  it("spends the weekly freeze to bridge a single missed day", async () => {
    h.results.push([user({ lastSeenAt: new Date("2026-03-08T09:00:00Z") })])
    expect(await updateStreak("u1")).toBe(4)
    expect(setArgs().some((s) => s.streakFreezeUsedAt instanceof Date)).toBe(true)
  })

  it("resets after a missed day when the freeze was used within the last week", async () => {
    h.results.push([user({
      lastSeenAt: new Date("2026-03-08T09:00:00Z"),
      streakFreezeUsedAt: new Date("2026-03-05T09:00:00Z"),
    })])
    expect(await updateStreak("u1")).toBe(1)
  })

  it("resets after a longer gap", async () => {
    h.results.push([user({ lastSeenAt: new Date("2026-03-04T09:00:00Z") })])
    expect(await updateStreak("u1")).toBe(1)
  })

  it("counts days in the pilot's timezone, not UTC", async () => {
    // 23:30 on Mar 9 in Los Angeles is already Mar 10 in UTC; the pilot's "today" is still Mar 9.
    vi.setSystemTime(new Date("2026-03-10T06:30:00Z"))
    h.results.push([user({ timezone: "America/Los_Angeles", lastSeenAt: new Date("2026-03-09T20:00:00Z") })])
    expect(await updateStreak("u1")).toBe(3)
    expect(updates()).toBe(0)
  })

  it("pays the 7-day streak bonus when the streak reaches 7", async () => {
    h.results.push([user({ streak: 6 })], [], [{ totalXp: 60, rank: 1, timezone: "UTC" }])
    expect(await updateStreak("u1")).toBe(7)
    expect(updates()).toBe(2) // the streak write plus the bonus award
  })
})
