import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ships } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { getOrCreateShip, getEquippedItems, getEffectiveStats } from "@/lib/combat"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

export async function GET() {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const ship = await getOrCreateShip(user.id)
  const equippedItems = await getEquippedItems(user.id)
  const effectiveStats = getEffectiveStats(ship, equippedItems)

  return NextResponse.json({ ship, effectiveStats, equippedItems })
}

export async function PATCH(req: Request) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  const body = await req.json() as unknown
  const parsed = z.object({ name: z.string().min(1).max(40) }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  await db.update(ships).set({ name: parsed.data.name }).where(eq(ships.userId, user.id))
  return NextResponse.json({ success: true })
}
