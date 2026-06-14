import { cn } from "@/lib/utils"
import { MEDAL_DEFINITIONS } from "@/lib/xp"
import type { Medal } from "@/lib/db/schema"

interface MedalGridProps {
  earnedMedals: Medal[]
  showAll?: boolean
}

export function MedalGrid({ earnedMedals, showAll = true }: MedalGridProps) {
  const earnedSlugs = new Set(earnedMedals.map((m) => m.slug))
  const displayMedals = showAll ? MEDAL_DEFINITIONS : MEDAL_DEFINITIONS.filter((d) => earnedSlugs.has(d.slug))

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
      {displayMedals.map((def) => {
        const earned = earnedSlugs.has(def.slug)
        const medal = earnedMedals.find((m) => m.slug === def.slug)
        return (
          <div
            key={def.slug}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-all",
              earned
                ? "border-[#06B6D4]/30 bg-[#06B6D4]/5"
                : "border-[#1e2d3d] bg-[#0d1520] opacity-50 grayscale"
            )}
            title={earned ? `Unlocked ${medal?.unlockedAt ? new Date(medal.unlockedAt).toLocaleDateString() : ""}` : "Locked"}
          >
            <span className="text-2xl">{def.icon}</span>
            <div>
              <p className="text-xs font-medium text-[#e2e8f0] leading-tight">{def.label}</p>
              <p className="text-xs text-[#94a3b8] mt-0.5 hidden sm:block">{def.description}</p>
            </div>
            {earned && def.xpBonus > 0 && (
              <span className="text-xs text-[#06B6D4]">+{def.xpBonus} XP</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
