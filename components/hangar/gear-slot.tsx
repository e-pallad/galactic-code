import { RarityBadge } from "@/components/armory/rarity-badge"

interface GearSlotProps {
  type: "weapon" | "shield" | "engine"
  equippedItem?: { name: string; icon: string; rarity: string } | null
}

const slotLabels = { weapon: "Weapon", shield: "Shield", engine: "Engine" }
const slotIcons = { weapon: "⚔️", shield: "🛡️", engine: "⚡" }

export function GearSlot({ type, equippedItem }: GearSlotProps) {
  return (
    <div className="rounded-xl border border-[#1e2d3d] bg-[#0d1520] p-4">
      <p className="text-xs text-[#94a3b8] mb-2">{slotIcons[type]} {slotLabels[type]}</p>
      {equippedItem ? (
        <div className="flex items-center gap-3">
          <span className="text-xl">{equippedItem.icon}</span>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[#e2e8f0]">{equippedItem.name}</p>
            <RarityBadge rarity={equippedItem.rarity} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#94a3b8] italic">Empty — visit Armory to equip</p>
      )}
    </div>
  )
}
