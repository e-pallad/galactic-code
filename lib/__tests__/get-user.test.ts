import { describe, it, expect, vi, beforeEach } from "vitest"
import { queueDb, resetDb, dbOps } from "@/lib/__tests__/helpers/db-mock"

vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))
vi.mock("react", () => ({ cache: <T,>(fn: T) => fn }))
vi.mock("@clerk/nextjs/server", () => ({ currentUser: vi.fn() }))

import { currentUser } from "@clerk/nextjs/server"
import { getUser } from "@/lib/missions"

const clerkUser = {
  id: "clerk_new",
  primaryEmailAddressId: "e2",
  emailAddresses: [{ id: "e1", emailAddress: "other@x.dev" }, { id: "e2", emailAddress: "me@x.dev" }],
  firstName: "Ada",
  lastName: "Lovelace",
  imageUrl: "https://img/a.png",
}

beforeEach(() => {
  resetDb()
  vi.clearAllMocks()
})

describe("getUser", () => {
  it("returns the existing row without asking Clerk", async () => {
    queueDb([{ id: "u1" }])
    expect(await getUser("clerk_1")).toEqual({ id: "u1" })
    expect(currentUser).not.toHaveBeenCalled()
  })

  it("creates the row from the Clerk session when the webhook hasn't delivered yet", async () => {
    vi.mocked(currentUser).mockResolvedValue(clerkUser as never)
    queueDb([], [{ id: "u2", deletedAt: null }])
    expect(await getUser("clerk_new")).toMatchObject({ id: "u2" })
    expect(dbOps()).toEqual(["select", "insert"])
  })

  it("does not provision the demo pilot or a mismatching session", async () => {
    queueDb([])
    expect(await getUser("demo_user")).toBeNull()
    vi.mocked(currentUser).mockResolvedValue({ ...clerkUser, id: "someone_else" } as never)
    queueDb([])
    expect(await getUser("clerk_new")).toBeNull()
  })

  it("stays null for a soft-deleted pilot", async () => {
    vi.mocked(currentUser).mockResolvedValue(clerkUser as never)
    queueDb([], [{ id: "u3", deletedAt: new Date() }])
    expect(await getUser("clerk_new")).toBeNull()
  })

  it("returns null instead of throwing when Clerk is unreachable", async () => {
    vi.mocked(currentUser).mockRejectedValue(new Error("no request scope"))
    queueDb([])
    expect(await getUser("clerk_new")).toBeNull()
  })
})
