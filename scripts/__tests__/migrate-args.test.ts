import { describe, it, expect, vi } from "vitest"
import { parseArgs } from "@/scripts/migrate-args"
import { clientExecutor } from "@/scripts/migrations"

describe("parseArgs", () => {
  it("defaults to status", () => {
    expect(parseArgs([])).toEqual({ kind: "status", check: false })
  })

  it("parses each command", () => {
    expect(parseArgs(["status", "--check"])).toEqual({ kind: "status", check: true })
    expect(parseArgs(["up"])).toEqual({ kind: "up" })
    expect(parseArgs(["baseline", "--all"])).toEqual({ kind: "baseline", all: true, names: [] })
    expect(parseArgs(["help"])).toEqual({ kind: "help" })
    expect(parseArgs(["--help"])).toEqual({ kind: "help" })
  })

  it("accepts baseline file names or tab-completed paths", () => {
    expect(parseArgs(["baseline", "drizzle/manual/2026-07-03_exercise_xp.sql", "2026-10-06_explorer_mode.sql"])).toEqual({
      kind: "baseline",
      all: false,
      names: ["2026-07-03_exercise_xp.sql", "2026-10-06_explorer_mode.sql"],
    })
  })

  it.each([
    [["baseline"], /needs file names or --all/],
    [["baseline", "--all", "x.sql"], /either --all or file names/],
    [["up", "--force"], /Unknown option: --force/],
    [["status", "extra"], /takes no arguments/],
    [["up", "extra"], /takes no arguments/],
    [["migrate"], /Unknown command: migrate/],
  ])("rejects %j", (argv, message) => {
    expect(() => parseArgs(argv)).toThrow(message)
  })
})

describe("clientExecutor", () => {
  it("sends scripts with no parameters and returns rows for queries", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ n: 1 }] })
    const db = clientExecutor({ query })

    await db.exec("CREATE TABLE a (id int); CREATE TABLE b (id int);")
    expect(query).toHaveBeenLastCalledWith("CREATE TABLE a (id int); CREATE TABLE b (id int);")

    expect(await db.query("SELECT $1::int AS n", [1])).toEqual([{ n: 1 }])
    expect(query).toHaveBeenLastCalledWith("SELECT $1::int AS n", [1])
  })
})
