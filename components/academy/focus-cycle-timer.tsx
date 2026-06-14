"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Timer } from "lucide-react"
import { cn } from "@/lib/utils"

const FOCUS_DURATION = 25 * 60 // 25 minutes in seconds

export function FocusCycleTimer({ onComplete }: { onComplete?: () => void }) {
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const progress = ((FOCUS_DURATION - timeLeft) / FOCUS_DURATION) * 100
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimeLeft(FOCUS_DURATION)
    setIsRunning(false)
    setIsComplete(false)
  }, [])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setIsRunning(false)
            setIsComplete(true)
            onComplete?.()
            return 0
          }
          return t - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, timeLeft, onComplete])

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress / 100)

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-[#1e2d3d] bg-[#0d1520]">
      <div className="flex items-center gap-2 text-sm font-medium text-[#94a3b8]">
        <Timer className="h-4 w-4" />
        Focus Cycle
      </div>
      <div className="relative w-36 h-36">
        <svg width="144" height="144" className="-rotate-90">
          <circle cx="72" cy="72" r={radius} fill="none" stroke="#1e2d3d" strokeWidth="8" />
          <circle
            cx="72" cy="72" r={radius}
            fill="none"
            stroke={isComplete ? "#10B981" : "#06B6D4"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-2xl font-bold font-heading", isComplete ? "text-green-400" : "text-[#e2e8f0]")}>
            {isComplete ? "✓" : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        {!isComplete && (
          <Button size="sm" variant={isRunning ? "outline" : "default"} onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? <><Pause className="h-3 w-3 mr-1" />Pause</> : <><Play className="h-3 w-3 mr-1" />Start</>}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw className="h-3 w-3 mr-1" />Reset
        </Button>
      </div>
      {isComplete && <p className="text-sm text-green-400 font-medium">Focus Cycle Complete!</p>}
    </div>
  )
}
