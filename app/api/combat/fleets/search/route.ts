import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fleets } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { ilike, or } from "drizzle-orm"

export async function GET(req: Request) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.slice(0, 50) ?? ""

  if (!q) return NextResponse.json({ fleets: [] })

  const results = await db.select().from(fleets).where(
    or(ilike(fleets.name, `%${q}%`), ilike(fleets.tag, `%${q}%`))
  ).limit(10)

  return NextResponse.json({ fleets: results })
}
