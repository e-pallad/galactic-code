export const dynamic = "force-dynamic"

import { getClerkId } from "@/lib/auth"
import { getUser } from "@/lib/missions"
import { getOrCreateShip, getEquippedItems, getEffectiveStats } from "@/lib/combat"
import { redirect } from "next/navigation"
import { ShipStatsPanel } from "@/components/hangar/ship-stats-panel"
import { GearSlot } from "@/components/hangar/gear-slot"
import { HangarClient } from "@/components/hangar/hangar-client"
import { Anchor } from "lucide-react"
import Link from "next/link"

export default async function HangarPage() {
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/")
  const user = await getUser(clerkId)
  if (!user) redirect("/")

  const ship = await getOrCreateShip(user.id)
  const equippedItems = await getEquippedItems(user.id)
  const effectiveStats = getEffectiveStats(ship, equippedItems)

  const equippedByType = {
    weapon: equippedItems.find((i) => i.type === "weapon") ?? null,
    shield: equippedItems.find((i) => i.type === "shield") ?? null,
    engine: equippedItems.find((i) => i.type === "engine") ?? null,
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Anchor className="h-6 w-6 text-[#06B6D4]" />
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">{ship.name}</h1>
            <p className="text-[#94a3b8] text-sm">Your personal vessel</p>
          </div>
        </div>
        <HangarClient ship={ship} />
      </div>

      <ShipStatsPanel ship={ship} effectiveStats={effectiveStats} />

      <div>
        <h2 className="text-sm font-medium text-[#94a3b8] mb-3">Equipped Gear</h2>
        <div className="grid gap-3">
          <GearSlot type="weapon" equippedItem={equippedByType.weapon} />
          <GearSlot type="shield" equippedItem={equippedByType.shield} />
          <GearSlot type="engine" equippedItem={equippedByType.engine} />
        </div>
      </div>

      <p className="text-xs text-[#94a3b8]">
        Visit the <Link href="/armory" className="text-[#06B6D4] hover:underline">Armory</Link> to buy and equip gear.
      </p>
    </div>
  )
}
