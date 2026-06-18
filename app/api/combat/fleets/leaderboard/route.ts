import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fleets } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { getClerkId } from "@/lib/auth"

export async function GET() {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const topFleets = await db.select().from(fleets).orderBy(desc(fleets.totalXp)).limit(20)
  return NextResponse.json({ fleets: topFleets })
}
