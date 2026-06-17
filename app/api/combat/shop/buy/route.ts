import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { items, userInventory } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { deductCredits } from "@/lib/combat"
import { eq, and } from "drizzle-orm"
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
  const parsed = z.object({ itemId: z.string().uuid() }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const [item] = await db.select().from(items).where(eq(items.id, parsed.data.itemId)).limit(1)
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })

  const [owned] = await db.select().from(userInventory)
    .where(and(eq(userInventory.userId, user.id), eq(userInventory.itemId, item.id)))
    .limit(1)
  if (owned) return NextResponse.json({ error: "Already owned" }, { status: 409 })

  const result = await deductCredits(user.id, item.creditCost)
  if (!result) return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })

  await db.insert(userInventory).values({ userId: user.id, itemId: item.id })

  return NextResponse.json({ success: true, newBalance: result.newBalance })
}
