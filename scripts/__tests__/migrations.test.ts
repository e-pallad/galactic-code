import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { PGlite } from "@electric-sql/pglite"
import {
  baseline,
  checksumOf,
  getStatus,
  loadMigrationFiles,
  migrateUp,
  MigrationError,
  type Executor,
  type MigrationFile,
} from "@/scripts/migrations"

// A real (in-process) Postgres, so transactions, rollback and multi-statement
// files behave exactly as they do against Neon.
let pg: PGlite
let db: Executor
let dir: string

const executor = (conn: PGlite): Executor => ({
  exec: async (sql) => {
    await conn.exec(sql)
  },
  query: async <T>(sql: string, params?: unknown[]) => (await conn.query(sql, params)).rows as T[],
})

function write(name: string, sql: string) {
  writeFileSync(join(dir, name), sql)
}

const tableExists = async (name: string) =>
  (await db.query<{ n: number }>("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_name = $1", [name]))[0].n === 1

const advisoryLocksHeld = async () =>
  (await db.query<{ n: number }>("SELECT count(*)::int AS n FROM pg_locks WHERE locktype = 'advisory'"))[0].n

// One Postgres for the whole file (booting one per test is slow); the schema is
// wiped between tests.
beforeAll(async () => {
  pg = new PGlite()
  db = executor(pg)
})

afterAll(async () => {
  await pg.close()
})

beforeEach(async () => {
  await pg.exec("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
  dir = mkdtempSync(join(tmpdir(), "migrations-"))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe("loadMigrationFiles", () => {
  it("returns files in chronological (name) order with checksums", () => {
    write("2026-10-06_second.sql", "SELECT 2;")
    write("2026-07-03_first.sql", "SELECT 1;")
    write("notes.txt", "ignored")
    const files = loadMigrationFiles(dir)
    expect(files.map((f) => f.name)).toEqual(["2026-07-03_first.sql", "2026-10-06_second.sql"])
    expect(files[0].checksum).toBe(checksumOf("SELECT 1;"))
  })

  it("rejects names that would not sort chronologically", () => {
    write("add_thing.sql", "SELECT 1;")
    write("2026-1-2_short_date.sql", "SELECT 1;")
    expect(() => loadMigrationFiles(dir)).toThrow(/add_thing\.sql.*2026-1-2_short_date\.sql|2026-1-2_short_date\.sql.*add_thing\.sql/)
  })

  it("accepts every migration file that is actually in the repo", () => {
    expect(() => loadMigrationFiles(join(process.cwd(), "drizzle", "manual"))).not.toThrow()
  })
})

describe("migrateUp", () => {
  it("creates the tracking table and reports everything pending on a fresh database", async () => {
    write("2026-01-01_a.sql", "CREATE TABLE a (id int);")
    const status = await getStatus(db, loadMigrationFiles(dir))
    expect(status.pending.map((f) => f.name)).toEqual(["2026-01-01_a.sql"])
    expect(status.applied).toEqual([])
    expect(await tableExists("schema_migrations")).toBe(true)
  })

  it("applies pending migrations in order and records each one", async () => {
    write("2026-01-01_a.sql", "CREATE TABLE a (id int PRIMARY KEY);")
    write("2026-01-02_b.sql", "CREATE TABLE b (id int REFERENCES a(id)); -- depends on a")
    const logs: string[] = []
    const ran = await migrateUp(db, loadMigrationFiles(dir), (m) => logs.push(m))

    expect(ran).toEqual(["2026-01-01_a.sql", "2026-01-02_b.sql"])
    expect(logs).toEqual(["applying 2026-01-01_a.sql", "applying 2026-01-02_b.sql"])
    expect(await tableExists("a")).toBe(true)
    expect(await tableExists("b")).toBe(true)
    const status = await getStatus(db, loadMigrationFiles(dir))
    expect(status.applied.map((m) => m.name)).toEqual(["2026-01-01_a.sql", "2026-01-02_b.sql"])
    expect(status.pending).toEqual([])
  })

  it("is a no-op the second time, and applies only newly added files later", async () => {
    write("2026-01-01_a.sql", "CREATE TABLE a (id int);")
    await migrateUp(db, loadMigrationFiles(dir))
    expect(await migrateUp(db, loadMigrationFiles(dir))).toEqual([])

    write("2026-02-01_c.sql", "CREATE TABLE c (id int);")
    expect(await migrateUp(db, loadMigrationFiles(dir))).toEqual(["2026-02-01_c.sql"])
  })

  it("runs multi-statement files with comments and DO blocks", async () => {
    write(
      "2026-01-01_multi.sql",
      `-- header comment; with a semicolon
       CREATE TABLE t (id int);
       INSERT INTO t VALUES (1), (2);
       DO $$ BEGIN
         IF (SELECT count(*) FROM t) <> 2 THEN RAISE EXCEPTION 'wrong count'; END IF;
       END $$;`
    )
    await migrateUp(db, loadMigrationFiles(dir))
    expect((await db.query<{ n: number }>("SELECT count(*)::int AS n FROM t"))[0].n).toBe(2)
  })

  it("rolls a failing migration back completely, records nothing for it, and stops", async () => {
    write("2026-01-01_ok.sql", "CREATE TABLE ok (id int);")
    write("2026-01-02_bad.sql", "CREATE TABLE half_done (id int); SELECT 1/0;")
    write("2026-01-03_after.sql", "CREATE TABLE after_it (id int);")

    const err = await migrateUp(db, loadMigrationFiles(dir)).catch((e) => e)
    expect(err).toBeInstanceOf(MigrationError)
    expect(err.migration).toBe("2026-01-02_bad.sql")
    expect(err.message).toMatch(/division by zero/)

    expect(await tableExists("ok")).toBe(true) // earlier migration stays applied
    expect(await tableExists("half_done")).toBe(false) // no partial change
    expect(await tableExists("after_it")).toBe(false) // later files never ran
    const status = await getStatus(db, loadMigrationFiles(dir))
    expect(status.applied.map((m) => m.name)).toEqual(["2026-01-01_ok.sql"])
    expect(status.pending.map((f) => f.name)).toEqual(["2026-01-02_bad.sql", "2026-01-03_after.sql"])
  })

  it("can be re-run after fixing a failed migration", async () => {
    write("2026-01-01_bad.sql", "SELECT 1/0;")
    await expect(migrateUp(db, loadMigrationFiles(dir))).rejects.toBeInstanceOf(MigrationError)
    write("2026-01-01_bad.sql", "CREATE TABLE fixed (id int);")
    expect(await migrateUp(db, loadMigrationFiles(dir))).toEqual(["2026-01-01_bad.sql"])
  })

  it("refuses to run when an already-applied file was edited, applying nothing", async () => {
    write("2026-01-01_a.sql", "CREATE TABLE a (id int);")
    await migrateUp(db, loadMigrationFiles(dir))

    write("2026-01-01_a.sql", "CREATE TABLE a (id int, extra text);") // edited after it ran
    write("2026-01-02_b.sql", "CREATE TABLE b (id int);")
    await expect(migrateUp(db, loadMigrationFiles(dir))).rejects.toThrow(/modified after they ran: 2026-01-01_a\.sql/)
    expect(await tableExists("b")).toBe(false)
    expect((await getStatus(db, loadMigrationFiles(dir))).changed.map((c) => c.name)).toEqual(["2026-01-01_a.sql"])
  })

  it("warns about, but tolerates, a recorded migration whose file is gone", async () => {
    write("2026-01-01_a.sql", "CREATE TABLE a (id int);")
    await migrateUp(db, loadMigrationFiles(dir))
    rmSync(join(dir, "2026-01-01_a.sql"))
    write("2026-01-02_b.sql", "CREATE TABLE b (id int);")

    const logs: string[] = []
    expect(await migrateUp(db, loadMigrationFiles(dir), (m) => logs.push(m))).toEqual(["2026-01-02_b.sql"])
    expect(logs[0]).toMatch(/2026-01-01_a\.sql is recorded as applied but no longer exists/)
  })

  it("releases its advisory lock after success and after failure", async () => {
    write("2026-01-01_a.sql", "CREATE TABLE a (id int);")
    await migrateUp(db, loadMigrationFiles(dir))
    expect(await advisoryLocksHeld()).toBe(0)

    write("2026-01-02_bad.sql", "SELECT 1/0;")
    await expect(migrateUp(db, loadMigrationFiles(dir))).rejects.toBeInstanceOf(MigrationError)
    expect(await advisoryLocksHeld()).toBe(0)
  })
})

describe("baseline", () => {
  const files = (): MigrationFile[] => loadMigrationFiles(dir)

  it("records files as applied without running them", async () => {
    // Would fail if executed: this is the situation for hand-run, non-idempotent files.
    write("2026-01-01_already_run_by_hand.sql", "ALTER TABLE does_not_exist ADD COLUMN x int;")
    write("2026-02-01_new.sql", "CREATE TABLE new_one (id int);")

    const marked = await baseline(db, files(), ["2026-01-01_already_run_by_hand.sql"])
    expect(marked).toEqual(["2026-01-01_already_run_by_hand.sql"])

    expect(await migrateUp(db, files())).toEqual(["2026-02-01_new.sql"])
    expect((await getStatus(db, files())).pending).toEqual([])
  })

  it("rejects names that are unknown or already recorded", async () => {
    write("2026-01-01_a.sql", "CREATE TABLE a (id int);")
    await expect(baseline(db, files(), ["2026-09-09_typo.sql"])).rejects.toThrow(/not a pending migration file\): 2026-09-09_typo\.sql/)

    await baseline(db, files(), ["2026-01-01_a.sql"])
    await expect(baseline(db, files(), ["2026-01-01_a.sql"])).rejects.toThrow(/not a pending migration file/)
  })

  it("detects later edits to a baselined file", async () => {
    write("2026-01-01_a.sql", "CREATE TABLE a (id int);")
    await baseline(db, files(), ["2026-01-01_a.sql"])
    write("2026-01-01_a.sql", "CREATE TABLE a (id int, y int);")
    expect((await getStatus(db, files())).changed.map((c) => c.name)).toEqual(["2026-01-01_a.sql"])
  })
})
