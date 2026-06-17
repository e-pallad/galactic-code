import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { items, userInventory } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
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
  const parsed = z.object({ inventoryId: z.string().uuid(), equip: z.boolean() }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const [inv] = await db.select({ item: items, isEquipped: userInventory.isEquipped })
    .from(userInventory)
    .innerJoin(items, eq(items.id, userInventory.itemId))
    .where(and(eq(userInventory.id, parsed.data.inventoryId), eq(userInventory.userId, user.id)))
    .limit(1)
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (parsed.data.equip && inv.item.type !== "skin") {
    // Unequip any other item of same type first
    const sameTypeItems = await db
      .select({ invId: userInventory.id })
      .from(userInventory)
      .innerJoin(items, eq(items.id, userInventory.itemId))
      .where(and(eq(userInventory.userId, user.id), eq(items.type, inv.item.type)))
    for (const si of sameTypeItems) {
      await db.update(userInventory).set({ isEquipped: false }).where(eq(userInventory.id, si.invId))
    }
  }

  await db.update(userInventory).set({ isEquipped: parsed.data.equip }).where(eq(userInventory.id, parsed.data.inventoryId))
  return NextResponse.json({ success: true })
}
