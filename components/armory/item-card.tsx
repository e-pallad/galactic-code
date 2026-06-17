import { RarityBadge } from "./rarity-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ItemCardItem {
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
  owned?: boolean
}

interface ItemCardProps {
  item: ItemCardItem
  isEquipped?: boolean
  onBuy?: () => void
  onEquip?: () => void
  onUnequip?: () => void
  loading?: boolean
}

const rarityBorderColors: Record<string, string> = {
  common: "border-[#94a3b8]/20",
  uncommon: "border-[#10b981]/30",
  rare: "border-[#3b82f6]/40",
  epic: "border-[#a855f7]/40",
  legendary: "border-[#f59e0b]/50",
}

export function ItemCard({ item, isEquipped, onBuy, onEquip, onUnequip, loading }: ItemCardProps) {
  const statBonuses = [
    item.bonusAtk > 0 && `+${item.bonusAtk} ATK`,
    item.bonusDef > 0 && `+${item.bonusDef} DEF`,
    item.bonusSpd > 0 && `+${item.bonusSpd} SPD`,
    item.bonusHp > 0 && `+${item.bonusHp} HP`,
  ].filter(Boolean) as string[]

  return (
    <div className={cn(
      "rounded-xl border bg-[#0d1520] p-4 space-y-3 transition-all",
      isEquipped ? "border-[#06B6D4]/50 bg-[#06B6D4]/5" : (rarityBorderColors[item.rarity] ?? "border-[#1e2d3d]")
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{item.icon}</span>
          <div>
            <p className="font-medium text-[#e2e8f0] text-sm">{item.name}</p>
            <p className="text-xs text-[#94a3b8] capitalize">{item.type}</p>
          </div>
        </div>
        <RarityBadge rarity={item.rarity} />
      </div>
      {statBonuses.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {statBonuses.map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 rounded bg-[#06B6D4]/10 text-[#06B6D4] font-mono">{s}</span>
          ))}
        </div>
      )}
      <p className="text-xs text-[#94a3b8]">{item.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono text-[#f59e0b]">⟁ {item.creditCost.toLocaleString()} CR</span>
        {item.owned ? (
          isEquipped ? (
            <Button size="sm" variant="outline" onClick={onUnequip} disabled={loading}>Unequip</Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onEquip} disabled={loading}>Equip</Button>
          )
        ) : (
          <Button size="sm" onClick={onBuy} disabled={loading}>Buy</Button>
        )}
      </div>
      {isEquipped && <p className="text-xs text-[#06B6D4]">Equipped</p>}
    </div>
  )
}
