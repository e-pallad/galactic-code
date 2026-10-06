// Tracked runner for the hand-written SQL migrations in drizzle/manual/.
//
// `drizzle-kit push` is unusable on this database (Postgres 18 catalogues NOT
// NULL constraints, and push dies trying to drop users_id_not_null), so schema
// changes ship as SQL files. This applies them in order, one transaction each,
// and records what ran in a `schema_migrations` table so nobody has to
// remember which files were already run by hand.
//
// The logic here is driver-agnostic (see `Executor`) so it is tested against an
// in-process Postgres; scripts/migrate.ts wires it to Neon.

import { createHash } from "node:crypto"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

/** Minimal database surface the runner needs. Must be ONE connection, not a pool. */
export interface Executor {
  /** Run one or more statements (simple query protocol). */
  exec(sql: string): Promise<void>
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>
}

/** The slice of a `pg`-style client (Neon's Pool client included) the adapter needs. */
export interface QueryableClient {
  query(text: string, params?: unknown[]): Promise<{ rows: unknown[] }>
}

/** Adapts a single `pg`-style client to the runner's `Executor`. */
export function clientExecutor(client: QueryableClient): Executor {
  return {
    exec: async (sql) => {
      await client.query(sql)
    },
    query: async <T>(sql: string, params?: unknown[]) => (await client.query(sql, params)).rows as T[],
  }
}

export interface MigrationFile {
  name: string
  sql: string
  checksum: string
}

export interface AppliedMigration {
  name: string
  checksum: string
  appliedAt: Date
}

export interface MigrationStatus {
  /** Files not yet recorded, in the order they will run. */
  pending: MigrationFile[]
  /** Recorded and present, with an unchanged checksum. */
  applied: AppliedMigration[]
  /** Recorded, but the file's contents changed since it ran. */
  changed: { name: string; recorded: string; current: string }[]
  /** Recorded, but no file with that name exists (database ahead of the code). */
  missing: string[]
}

/** YYYY-MM-DD_snake_case.sql, so lexical order is chronological order. */
export const MIGRATION_NAME = /^\d{4}-\d{2}-\d{2}_[a-z0-9_]+\.sql$/

// Arbitrary constant: serialises concurrent runs of this tool via an advisory lock.
const LOCK_KEY = 7_243_001

export class MigrationError extends Error {
  constructor(
    readonly migration: string,
    readonly original: unknown
  ) {
    super(`Migration ${migration} failed: ${original instanceof Error ? original.message : String(original)}`)
    this.name = "MigrationError"
  }
}

export function checksumOf(sql: string): string {
  return createHash("sha256").update(sql).digest("hex")
}

/** Reads and validates every *.sql file in `dir`, sorted by name. */
export function loadMigrationFiles(dir: string): MigrationFile[] {
  const names = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
  const bad = names.filter((n) => !MIGRATION_NAME.test(n))
  if (bad.length > 0) {
    throw new Error(
      `Migration files must be named YYYY-MM-DD_snake_case.sql so they sort chronologically. Rename: ${bad.join(", ")}`
    )
  }
  return names.map((name) => {
    const sql = readFileSync(join(dir, name), "utf8")
    return { name, sql, checksum: checksumOf(sql) }
  })
}

export async function ensureMigrationsTable(db: Executor): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)
}

async function readApplied(db: Executor): Promise<AppliedMigration[]> {
  const rows = await db.query<{ name: string; checksum: string; applied_at: string | Date }>(
    "SELECT name, checksum, applied_at FROM schema_migrations ORDER BY name"
  )
  return rows.map((r) => ({ name: r.name, checksum: r.checksum, appliedAt: new Date(r.applied_at) }))
}

export async function getStatus(db: Executor, files: MigrationFile[]): Promise<MigrationStatus> {
  await ensureMigrationsTable(db)
  const recorded = await readApplied(db)
  const byName = new Map(files.map((f) => [f.name, f]))
  const recordedNames = new Set(recorded.map((r) => r.name))

  const applied: AppliedMigration[] = []
  const changed: MigrationStatus["changed"] = []
  const missing: string[] = []
  for (const r of recorded) {
    const file = byName.get(r.name)
    if (!file) missing.push(r.name)
    else if (file.checksum !== r.checksum) changed.push({ name: r.name, recorded: r.checksum, current: file.checksum })
    else applied.push(r)
  }
  return { pending: files.filter((f) => !recordedNames.has(f.name)), applied, changed, missing }
}

async function withLock<T>(db: Executor, fn: () => Promise<T>): Promise<T> {
  await db.query("SELECT pg_advisory_lock($1)", [LOCK_KEY])
  try {
    return await fn()
  } finally {
    await db.query("SELECT pg_advisory_unlock($1)", [LOCK_KEY])
  }
}

/**
 * Applies every pending migration in order, each in its own transaction together
 * with its bookkeeping row, so a failure leaves no partial change and no record.
 * Stops at the first failure. Refuses to run if an already-applied file was edited
 * (fix forward with a new migration instead).
 */
export async function migrateUp(
  db: Executor,
  files: MigrationFile[],
  log: (message: string) => void = () => {}
): Promise<string[]> {
  return withLock(db, async () => {
    const status = await getStatus(db, files)
    if (status.changed.length > 0) {
      throw new Error(
        `Applied migration(s) were modified after they ran: ${status.changed.map((c) => c.name).join(", ")}. ` +
          "Revert the edit and add a new migration instead."
      )
    }
    for (const name of status.missing) log(`warning: ${name} is recorded as applied but no longer exists in the repo`)

    const ran: string[] = []
    for (const file of status.pending) {
      log(`applying ${file.name}`)
      await db.exec("BEGIN")
      try {
        await db.exec(file.sql)
        await db.query("INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)", [file.name, file.checksum])
        await db.exec("COMMIT")
      } catch (err) {
        await db.exec("ROLLBACK").catch(() => {})
        throw new MigrationError(file.name, err)
      }
      ran.push(file.name)
    }
    return ran
  })
}

/**
 * Records migrations as applied WITHOUT running them. For adopting the runner on
 * a database where files were already run by hand. `names` must exist and be unrecorded.
 */
export async function baseline(db: Executor, files: MigrationFile[], names: string[]): Promise<string[]> {
  return withLock(db, async () => {
    const status = await getStatus(db, files)
    const pending = new Map(status.pending.map((f) => [f.name, f]))
    const unknown = names.filter((n) => !pending.has(n))
    if (unknown.length > 0) {
      throw new Error(`Cannot baseline (not a pending migration file): ${unknown.join(", ")}`)
    }
    const marked: string[] = []
    for (const name of [...names].sort()) {
      const file = pending.get(name)!
      await db.query("INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)", [file.name, file.checksum])
      marked.push(name)
    }
    return marked
  })
}
