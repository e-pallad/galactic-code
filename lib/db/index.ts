import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

type Db = ReturnType<typeof drizzle<typeof schema>>

let _db: Db | undefined

function getDb(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL is not set")
    _db = drizzle(neon(url), { schema })
  }
  return _db
}

export const db = new Proxy({} as Db, {
  get(_, prop) {
    return getDb()[prop as keyof Db]
  },
})
