import { cn } from "@/lib/utils"
import { getRankProgress } from "@/lib/xp"

interface RankBadgeProps {
  xp: number
  className?: string
  showLabel?: boolean
}

const rankColors = [
  "from-gray-400 to-gray-600",
  "from-green-400 to-green-600",
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-yellow-400 to-yellow-600",
  "from-orange-400 to-orange-600",
  "from-red-400 to-red-600",
  "from-pink-400 to-pink-600",
  "from-cyan-400 to-cyan-600",
  "from-[#06B6D4] to-[#6366F1]",
]

export function RankBadge({ xp, className, showLabel = true }: RankBadgeProps) {
  const { rank, label } = getRankProgress(xp)
  const colorClass = rankColors[rank - 1] ?? rankColors[rankColors.length - 1]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br text-white font-bold text-sm shadow-lg", colorClass)}>
        {rank}
      </div>
      {showLabel && <span className="text-sm font-medium text-[#94a3b8]">{label}</span>}
    </div>
  )
}
