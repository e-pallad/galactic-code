"use client"

import { cn } from "@/lib/utils"

interface MissionQuotaProps {
  daily: { completed: number; goal: number }
  weekly: { completed: number; goal: number }
  className?: string
}

function Ring({ value, max, label, size = 80 }: { value: number; max: number; label: string; size?: number }) {
  const radius = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, value / Math.max(1, max))
  const offset = circumference * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e2d3d" strokeWidth={6} />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="#06B6D4"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-[#e2e8f0]">{value}</span>
          <span className="text-xs text-[#94a3b8]">/{max}</span>
        </div>
      </div>
      <span className="text-xs text-[#94a3b8]">{label}</span>
    </div>
  )
}

export function MissionQuota({ daily, weekly, className }: MissionQuotaProps) {
  return (
    <div className={cn("flex gap-8 items-center justify-center", className)}>
      <Ring value={daily.completed} max={daily.goal} label="Today" size={80} />
      <Ring value={weekly.completed} max={weekly.goal} label="This Week" size={96} />
    </div>
  )
}
