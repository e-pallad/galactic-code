"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ItemCard } from "./item-card"

interface BaseItem {
  id: string
  name: string
  icon: string
  type: string
  rarity: string
  creditCost: number
  bonusAtk: number
  bonusDef: number
  bonusSpd: number
  bonusHp: number
  description: string
  slug: string
}

interface ShopItem extends BaseItem {
  owned: boolean
}

interface InventoryRow {
  item: BaseItem
  isEquipped: boolean
  inventoryId: string
}

interface ArmoryClientProps {
  shopItems: ShopItem[]
  inventory: InventoryRow[]
  initialCredits: number
}

export function ArmoryClient({ shopItems, inventory }: ArmoryClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleBuy = async (itemId: string) => {
    setLoading(true)
    await fetch("/api/combat/shop/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    })
    setLoading(false)
    router.refresh()
  }

  const handleEquip = async (inventoryId: string) => {
    setLoading(true)
    await fetch("/api/combat/inventory/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryId, equip: true }),
    })
    setLoading(false)
    router.refresh()
  }

  const handleUnequip = async (inventoryId: string) => {
    setLoading(true)
    await fetch("/api/combat/inventory/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryId, equip: false }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <Tabs defaultValue="shop">
      <TabsList className="bg-[#0d1520] border border-[#1e2d3d]">
        <TabsTrigger value="shop">Shop</TabsTrigger>
        <TabsTrigger value="inventory">My Gear ({inventory.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="shop" className="mt-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {shopItems.map((item) => (
            <ItemCard key={item.id} item={item} onBuy={() => handleBuy(item.id)} loading={loading} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="inventory" className="mt-4">
        {inventory.length === 0 ? (
          <p className="text-[#94a3b8] text-sm">No gear yet. Buy from the Shop!</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {inventory.map((row) => (
              <ItemCard
                key={row.inventoryId}
                item={row.item}
                isEquipped={row.isEquipped}
                onEquip={() => handleEquip(row.inventoryId)}
                onUnequip={() => handleUnequip(row.inventoryId)}
                loading={loading}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
