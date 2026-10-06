export type MigrateCommand =
  | { kind: "status"; check: boolean }
  | { kind: "up" }
  | { kind: "baseline"; all: boolean; names: string[] }
  | { kind: "help" }

export const USAGE = `Usage: npx tsx scripts/migrate.ts <command> [options]

Applies the SQL files in drizzle/manual/ and tracks them in a schema_migrations table.
DATABASE_URL must be set (for example: npx tsx --env-file=.env.local scripts/migrate.ts status).

Commands:
  status [--check]          Show applied and pending migrations. With --check, exit 1 if any
                            are pending or an applied file was edited.
  up                        Apply pending migrations in order, one transaction each.
  baseline <file...>        Record files as applied WITHOUT running them, for changes that were
  baseline --all            already made by hand. --all records every pending file.
  help                      Show this message.`

/** Parses CLI arguments (without node/script). Throws an Error with a usable message. */
export function parseArgs(argv: string[]): MigrateCommand {
  const [command = "status", ...rest] = argv
  const flags = rest.filter((a) => a.startsWith("-"))
  const positional = rest.filter((a) => !a.startsWith("-"))
  const unknownFlags = (allowed: string[]) => {
    const bad = flags.filter((f) => !allowed.includes(f))
    if (bad.length > 0) throw new Error(`Unknown option: ${bad.join(", ")}\n\n${USAGE}`)
  }

  switch (command) {
    case "help":
    case "-h":
    case "--help":
      return { kind: "help" }
    case "status":
      unknownFlags(["--check"])
      if (positional.length > 0) throw new Error(`status takes no arguments\n\n${USAGE}`)
      return { kind: "status", check: flags.includes("--check") }
    case "up":
      unknownFlags([])
      if (positional.length > 0) throw new Error(`up takes no arguments\n\n${USAGE}`)
      return { kind: "up" }
    case "baseline": {
      unknownFlags(["--all"])
      const all = flags.includes("--all")
      if (all && positional.length > 0) throw new Error(`Use either --all or file names, not both\n\n${USAGE}`)
      if (!all && positional.length === 0) throw new Error(`baseline needs file names or --all\n\n${USAGE}`)
      // Accept paths (tab-completed drizzle/manual/x.sql) as well as bare names.
      return { kind: "baseline", all, names: positional.map((p) => p.split("/").pop()!) }
    }
    default:
      throw new Error(`Unknown command: ${command}\n\n${USAGE}`)
  }
}
