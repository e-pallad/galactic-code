import { cn } from "@/lib/utils"

interface HyperdriveCounterProps {
  streak: number
  className?: string
}

export function HyperdriveCounter({ streak, className }: HyperdriveCounterProps) {
  const isActive = streak > 0
  const isMilestone = streak >= 7

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all",
        isActive
          ? isMilestone
            ? "border-orange-400/50 bg-orange-400/10 text-orange-300"
            : "border-orange-500/30 bg-orange-500/10 text-orange-400"
          : "border-[#1e2d3d] bg-[#0d1520] text-[#94a3b8]"
      )}>
        <span className="text-base">{streak >= 30 ? "⚡" : "🔥"}</span>
        <span>{streak}</span>
        <span className="hidden sm:inline text-xs opacity-70">day{streak !== 1 ? "s" : ""}</span>
      </div>
    </div>
  )
}
