"use client"

import { getRankProgress } from "@/lib/xp"
import { cn } from "@/lib/utils"

interface XPBarProps {
  xp: number
  className?: string
  showValues?: boolean
}

export function XPBar({ xp, className, showValues = true }: XPBarProps) {
  const { currentXp, nextXp, progress, label } = getRankProgress(xp)

  return (
    <div className={cn("w-full", className)}>
      {showValues && (
        <div className="flex justify-between text-xs text-[#94a3b8] mb-1">
          <span>{label}</span>
          {nextXp !== null ? (
            <span>{currentXp} / {nextXp} XP</span>
          ) : (
            <span>MAX RANK</span>
          )}
        </div>
      )}
      <div className="relative h-2 w-full rounded-full bg-[#1e2d3d] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#06B6D4] to-[#6366F1] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
