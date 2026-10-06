# Manual migrations

`drizzle-kit push` is unusable on this database (it runs on Postgres 18, where NOT NULL
constraints are catalogued, and push dies trying to drop `users_id_not_null`), so schema
changes are SQL files in this folder. They are applied and tracked by `scripts/migrate.ts`:
each file runs once, in order, in its own transaction, and is recorded in a
`schema_migrations` table (name, SHA-256 of the file, when it ran).

```bash
# DATABASE_URL must be set; --env-file is the easy way locally
npx tsx --env-file=.env.local scripts/migrate.ts status          # what ran, what is pending
npx tsx --env-file=.env.local scripts/migrate.ts status --check  # exit 1 if behind (for a pre-deploy check)
npx tsx --env-file=.env.local scripts/migrate.ts up              # apply pending migrations
npx tsx --env-file=.env.local scripts/migrate.ts baseline --all  # record files as applied WITHOUT running them
```

(`npm run db:status` and `npm run db:migrate` are shortcuts for `status` and `up`.)

## Adding a migration

1. Create `drizzle/manual/YYYY-MM-DD_short_description.sql` (lowercase, underscores). The date
   prefix is what orders migrations; names that don't match are rejected.
2. Write plain SQL. Prefer idempotent statements (`IF NOT EXISTS`) where Postgres allows it.
3. Do **not** put `BEGIN`/`COMMIT` in the file (the runner wraps it in a transaction), and don't
   use `CREATE INDEX CONCURRENTLY`, which can't run inside one.
4. Try it on a [Neon branch](https://neon.tech/docs/introduction/branching) first:
   `DATABASE_URL=<branch connection string> npx tsx scripts/migrate.ts up`.
5. Apply it to the real database **before** deploying code that needs it. A deploy that expects
   a new column breaks until the migration has run.

If a migration fails, its transaction is rolled back, nothing is recorded, and later files are
not run. Fix the file and run `up` again.

## Rules the runner enforces

- **Applied files are immutable.** If a file changes after it ran, `up` refuses to continue and
  `status` shows `EDITED`. Fix forward with a new migration instead.
- **Concurrent runs are serialised** with a Postgres advisory lock.
- A recorded migration whose file no longer exists is reported as `missing` (a warning: the
  database is ahead of the code you have checked out).
- There are no down migrations.

## Adopting the runner on an existing database (one time)

`2026-07-03_exercise_xp.sql` and `2026-10-06_explorer_mode.sql` were run by hand before the
runner existed, and the first one is **not** safe to run twice (it adds constraints without
`IF NOT EXISTS`). On the production database, run:

```bash
npx tsx --env-file=.env.local scripts/migrate.ts status           # both should show as pending
npx tsx --env-file=.env.local scripts/migrate.ts baseline --all   # record them; nothing is executed
npx tsx --env-file=.env.local scripts/migrate.ts status --check    # should now pass
```

Only baseline files you know were applied. On a database where they were not, use `up` instead.

## Not covered

The runner applies incremental changes. It does not create the initial schema (the base tables
come from `lib/db/schema.ts`), so a brand-new empty database can't be built from these files alone.
