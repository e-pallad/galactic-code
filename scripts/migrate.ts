// CLI for the tracked SQL migrations in drizzle/manual/. See scripts/migrations.ts
// and drizzle/manual/README.md.
//
//   npx tsx --env-file=.env.local scripts/migrate.ts status
//   npx tsx --env-file=.env.local scripts/migrate.ts up

import { join } from "node:path"
import { Pool, neonConfig } from "@neondatabase/serverless"
import { parseArgs, USAGE } from "./migrate-args"
import { baseline, clientExecutor, getStatus, loadMigrationFiles, migrateUp } from "./migrations"

/** host/database without credentials, so the target is visible before anything runs. */
function describeTarget(url: string): string {
  try {
    const u = new URL(url)
    return `${u.host}${u.pathname}`
  } catch {
    return "(unparseable DATABASE_URL)"
  }
}

/** Neon's WebSocket driver rejects with an ErrorEvent rather than an Error. */
function describeError(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; error?: { message?: unknown } }
    const message = e.message ?? e.error?.message
    if (typeof message === "string" && message) return message
  }
  return String(err)
}

async function main(): Promise<number> {
  const command = parseArgs(process.argv.slice(2))
  if (command.kind === "help") {
    console.log(USAGE)
    return 0
  }

  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set (try: npx tsx --env-file=.env.local scripts/migrate.ts status)")

  // Neon's Pool speaks WebSocket; Node 22+ has it built in.
  if (typeof WebSocket !== "undefined") neonConfig.webSocketConstructor = WebSocket

  const files = loadMigrationFiles(join(process.cwd(), "drizzle", "manual"))
  console.log(`Database: ${describeTarget(url)}`)

  // One dedicated connection: the advisory lock and each transaction need a single session.
  const pool = new Pool({ connectionString: url })
  pool.on("error", () => {}) // surfaced through connect()/query() below
  let client
  try {
    client = await pool.connect()
  } catch (err) {
    await pool.end().catch(() => {})
    throw new Error(`Could not connect to ${describeTarget(url)}: ${describeError(err)}`)
  }
  try {
    const db = clientExecutor(client)

    if (command.kind === "up") {
      const ran = await migrateUp(db, files, (m) => console.log(m))
      console.log(ran.length === 0 ? "Nothing to apply." : `Applied ${ran.length} migration(s).`)
      return 0
    }

    if (command.kind === "baseline") {
      const names = command.all ? (await getStatus(db, files)).pending.map((f) => f.name) : command.names
      const marked = await baseline(db, files, names)
      for (const name of marked) console.log(`recorded (not run): ${name}`)
      console.log(marked.length === 0 ? "Nothing to baseline." : `Baselined ${marked.length} migration(s).`)
      return 0
    }

    const status = await getStatus(db, files)
    for (const m of status.applied) console.log(`applied  ${m.name}  (${m.appliedAt.toISOString()})`)
    for (const c of status.changed) console.log(`EDITED   ${c.name}  (file changed since it was applied)`)
    for (const name of status.missing) console.log(`missing  ${name}  (applied, but no file in the repo)`)
    for (const f of status.pending) console.log(`pending  ${f.name}`)
    if (files.length === 0 && status.missing.length === 0) console.log("No migration files.")

    const behind = status.pending.length > 0 || status.changed.length > 0
    if (command.check && behind) {
      console.error("Database is not up to date with drizzle/manual/.")
      return 1
    }
    return 0
  } finally {
    client.release()
    await pool.end()
  }
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(describeError(err))
    process.exit(1)
  }
)
