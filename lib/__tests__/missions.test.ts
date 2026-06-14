import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    transaction: vi.fn().mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb({})),
  },
}))

vi.mock("@/lib/db/schema", () => ({
  users: {},
  dailyLogs: {},
  medals: {},
  missionProgress: {},
  operations: {},
  skillCheckAttempts: {},
}))

describe("getUser", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns null when user not found", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as never)

    const { getUser } = await import("@/lib/missions")
    const result = await getUser("nonexistent_clerk_id")
    expect(result).toBeNull()
  })
})
