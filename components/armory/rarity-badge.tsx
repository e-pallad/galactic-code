import { cn } from "@/lib/utils"

const rarityColors: Record<string, string> = {
  common: "text-[#94a3b8] border-[#94a3b8]/30 bg-[#94a3b8]/10",
  uncommon: "text-[#10b981] border-[#10b981]/30 bg-[#10b981]/10",
  rare: "text-[#3b82f6] border-[#3b82f6]/30 bg-[#3b82f6]/10",
  epic: "text-[#a855f7] border-[#a855f7]/30 bg-[#a855f7]/10",
  legendary: "text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/10",
  boss: "text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10",
}

export function RarityBadge({ rarity }: { rarity: string }) {
  return (
    <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full border capitalize", rarityColors[rarity] ?? rarityColors.common)}>
      {rarity}
    </span>
  )
}
