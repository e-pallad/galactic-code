import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fleets } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

export async function GET() {
  const topFleets = await db.select().from(fleets).orderBy(desc(fleets.totalXp)).limit(20)
  return NextResponse.json({ fleets: topFleets })
}
