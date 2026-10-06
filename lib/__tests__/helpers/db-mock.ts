// Queue-driven drizzle stand-in for route tests. Every query-builder chain is a
// thenable that resolves to the next queued result (an empty array once the
// queue runs dry), and every builder call is recorded so tests can assert on
// reads and writes. Wire it up with:
//   vi.mock("@/lib/db", async () => ({ db: (await import("@/lib/__tests__/helpers/db-mock")).db }))

export const dbQueue: unknown[] = []
export const dbCalls: { method: string; args: unknown[] }[] = []

export function queueDb(...results: unknown[]) {
  dbQueue.push(...results)
}

export function resetDb() {
  dbQueue.length = 0
  dbCalls.length = 0
}

/** Names of the top-level operations issued so far, e.g. ["select", "insert"]. */
export function dbOps(): string[] {
  return dbCalls.filter((c) => ["select", "insert", "update", "delete"].includes(c.method)).map((c) => c.method)
}

/** Arguments of every `.set(...)` / `.values(...)` write so far. */
export function dbWrites(): Record<string, unknown>[] {
  return dbCalls.filter((c) => c.method === "set" || c.method === "values").map((c) => c.args[0] as Record<string, unknown>)
}

function chain(): unknown {
  const proxy: unknown = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "then") {
        const next = dbQueue.length ? dbQueue.shift() : []
        return (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(next).then(res, rej)
      }
      return (...args: unknown[]) => {
        dbCalls.push({ method: String(prop), args })
        return proxy
      }
    },
  })
  return proxy
}

const op = (method: string) => (...args: unknown[]) => {
  dbCalls.push({ method, args })
  return chain()
}

export const db = { select: op("select"), insert: op("insert"), update: op("update"), delete: op("delete") }

/** A minimal signed-in pilot; override what a test cares about. */
export function makeUser(over: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    clerkId: "clerk_1",
    totalXp: 0,
    rank: 1,
    streak: 0,
    credits: 100,
    explorerMode: false,
    ...over,
  }
}
