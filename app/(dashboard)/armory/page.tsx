export const dynamic = "force-dynamic"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Armory",
  description: "Spend your Credits on weapons, shields, and engines to upgrade your ship's combat stats.",
}

import { getClerkId } from "@/lib/auth"
import { getUser } from "@/lib/missions"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { items, userInventory } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { ArmoryClient } from "@/components/armory/armory-client"
import { ShoppingBag } from "lucide-react"

export default async function ArmoryPage() {
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/sign-in")
  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const allItems = await db.select().from(items)
  const inventoryRows = await db
    .select({ item: items, isEquipped: userInventory.isEquipped, inventoryId: userInventory.id })
    .from(userInventory)
    .innerJoin(items, eq(items.id, userInventory.itemId))
    .where(eq(userInventory.userId, user.id))

  const ownedItemIds = new Set(inventoryRows.map((r) => r.item.id))
  const shopItems = allItems.map((item) => ({ ...item, owned: ownedItemIds.has(item.id) }))

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-[#06B6D4] shrink-0" />
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Armory</h1>
            <p className="text-[#94a3b8] text-sm">Buy and equip gear to enhance your ship</p>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-xl font-bold text-[#f59e0b] font-mono">⟁ {user.credits.toLocaleString()} CR</p>
          <p className="text-xs text-[#94a3b8]">Available credits</p>
        </div>
      </div>

      <ArmoryClient shopItems={shopItems} inventory={inventoryRows} initialCredits={user.credits} />
    </div>
  )
}
