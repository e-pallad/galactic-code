import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

// The endpoint is public, so the database round trip is cached briefly per
// instance: hammering it can't turn into a stream of queries against Neon.
const CACHE_MS = 10_000
let last: { at: number; ok: boolean } | null = null

export async function GET() {
  const now = Date.now()
  if (!last || now - last.at > CACHE_MS) {
    try {
      await db.execute(sql`SELECT 1`)
      last = { at: now, ok: true }
    } catch (err) {
      void err
      last = { at: now, ok: false }
    }
  }
  return last.ok
    ? NextResponse.json({ status: "ok", timestamp: new Date().toISOString() })
    : NextResponse.json({ status: "error" }, { status: 503 })
}
