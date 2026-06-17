import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fleets, fleetMembers } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  const body = await req.json() as unknown
  const parsed = z.object({ tag: z.string().min(2).max(4) }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const [existing] = await db.select().from(fleetMembers).where(eq(fleetMembers.userId, user.id)).limit(1)
  if (existing) return NextResponse.json({ error: "Already in a fleet" }, { status: 409 })

  const [fleet] = await db.select().from(fleets).where(eq(fleets.tag, parsed.data.tag.toUpperCase())).limit(1)
  if (!fleet) return NextResponse.json({ error: "Fleet not found" }, { status: 404 })

  await db.insert(fleetMembers).values({ fleetId: fleet.id, userId: user.id, role: "pilot" })
  return NextResponse.json({ success: true, fleet })
}
