import { describe, it, expect, vi, beforeEach } from "vitest"
import { queueDb, resetDb, dbOps } from "@/lib/__tests__/helpers/db-mock"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn().mockResolvedValue({ userId: "clerk_real" }) }))
const jar = vi.hoisted(() => ({ value: undefined as string | undefined }))
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => (jar.value === undefined ? undefined : { value: jar.value }) }) }))

import { parseDemoSession, newDemoSessionId, demoClerkId, isDemoClerkId } from "@/lib/demo-session"
import { getClerkId, isDemo } from "@/lib/auth"
import { deleteExpiredDemoUsers } from "@/lib/demo"

const SID = "0123456789abcdef0123456789abcdef"

beforeEach(() => {
  resetDb()
  jar.value = undefined
})

describe("demo session ids", () => {
  it("only accepts well-formed 128-bit ids, never the old shared '1'", () => {
    expect(parseDemoSession(SID)).toBe(SID)
    for (const bad of ["1", "", "demo_user", SID.toUpperCase(), SID + "0", "g".repeat(32), undefined, null]) {
      expect(parseDemoSession(bad)).toBeNull()
    }
  })

  it("generates unique ids that parse", () => {
    const a = newDemoSessionId()
    expect(parseDemoSession(a)).toBe(a)
    expect(newDemoSessionId()).not.toBe(a)
  })

  it("derives a prefixed Clerk id", () => {
    expect(demoClerkId(SID)).toBe(`demo_${SID}`)
    expect(isDemoClerkId(demoClerkId(SID))).toBe(true)
    expect(isDemoClerkId("user_2abc")).toBe(false)
  })
})

describe("auth with a demo cookie", () => {
  it("maps a valid session to that visitor's own pilot", async () => {
    jar.value = SID
    expect(await isDemo()).toBe(true)
    expect(await getClerkId()).toBe(`demo_${SID}`)
  })

  it("gives two visitors different pilots", async () => {
    jar.value = SID
    const a = await getClerkId()
    jar.value = newDemoSessionId()
    expect(await getClerkId()).not.toBe(a)
  })

  it("ignores a forged or legacy cookie and falls back to Clerk", async () => {
    jar.value = "1"
    expect(await isDemo()).toBe(false)
    expect(await getClerkId()).toBe("clerk_real")
  })
})

describe("deleteExpiredDemoUsers", () => {
  it("clears battle log references before deleting the pilots", async () => {
    queueDb([{ id: "u1" }, { id: "u2" }])
    expect(await deleteExpiredDemoUsers(new Date())).toBe(2)
    expect(dbOps()).toEqual(["select", "delete", "delete"])
  })

  it("does nothing when no demo pilot is stale", async () => {
    queueDb([])
    expect(await deleteExpiredDemoUsers(new Date())).toBe(0)
    expect(dbOps()).toEqual(["select"])
  })
})
