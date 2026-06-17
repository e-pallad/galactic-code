import { RarityBadge } from "@/components/armory/rarity-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EntityCardEntity {
  id: string
  name: string
  icon: string
  rarity: string
  hp: number
  atk: number
  def: number
  spd: number
  creditReward: number
  xpReward: number
  requiresFleet: boolean
  description: string
}

interface EntityCardProps {
  entity: EntityCardEntity
  onEngage?: () => void
  loading?: boolean
  inFleet?: boolean
}

const rarityBg: Record<string, string> = {
  common: "border-[#94a3b8]/20",
  uncommon: "border-[#10b981]/30",
  rare: "border-[#3b82f6]/40",
  epic: "border-[#a855f7]/40",
  boss: "border-[#f59e0b]/50 shadow-lg shadow-[#f59e0b]/10",
}

export function EntityCard({ entity, onEngage, loading, inFleet }: EntityCardProps) {
  const canEngage = !entity.requiresFleet || inFleet
  return (
    <div className={cn("rounded-xl border bg-[#0d1520] p-5 space-y-4", rarityBg[entity.rarity] ?? "border-[#1e2d3d]")}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{entity.icon}</span>
          <div>
            <p className="font-heading font-semibold text-[#e2e8f0]">{entity.name}</p>
            <RarityBadge rarity={entity.rarity} />
          </div>
        </div>
        {entity.requiresFleet && (
          <span className="text-xs px-2 py-1 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30">Fleet Required</span>
        )}
      </div>
      <p className="text-sm text-[#94a3b8]">{entity.description}</p>
      <div className="grid grid-cols-4 gap-2 text-center">
        {([["HP", entity.hp], ["ATK", entity.atk], ["DEF", entity.def], ["SPD", entity.spd]] as [string, number][]).map(([label, val]) => (
          <div key={label} className="bg-[#080C14] rounded-lg p-2">
            <p className="text-xs text-[#94a3b8]">{label}</p>
            <p className="text-sm font-bold text-[#e2e8f0] font-mono">{val}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs">
          <span className="text-[#f59e0b] font-mono">⟁ {entity.creditReward} CR</span>
          <span className="text-[#06B6D4]">+{entity.xpReward} XP</span>
        </div>
        <Button size="sm" onClick={onEngage} disabled={loading || !canEngage}>
          {entity.requiresFleet && !inFleet ? "Need Fleet" : "Engage"}
        </Button>
      </div>
    </div>
  )
}
