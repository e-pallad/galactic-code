import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { items, userInventory } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { eq } from "drizzle-orm"

export async function GET() {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const allItems = await db.select().from(items)
  const owned = await db.select({ itemId: userInventory.itemId }).from(userInventory).where(eq(userInventory.userId, user.id))
  const ownedSet = new Set(owned.map((o) => o.itemId))

  return NextResponse.json({
    items: allItems.map((item) => ({ ...item, owned: ownedSet.has(item.id) })),
    credits: user.credits,
  })
}
