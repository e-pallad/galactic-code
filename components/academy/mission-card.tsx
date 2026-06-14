"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, SkipForward, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Mission } from "@/lib/db/schema"

const missionTypeBorderColors = {
  "briefing": "border-l-blue-500",
  "training-op": "border-l-green-500",
  "strike-mission": "border-l-purple-500",
  "debrief": "border-l-orange-500",
}

const missionTypeVariants: Record<string, "briefing" | "training-op" | "strike-mission" | "debrief"> = {
  "briefing": "briefing",
  "training-op": "training-op",
  "strike-mission": "strike-mission",
  "debrief": "debrief",
}

interface MissionCardProps {
  mission: Mission
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED"
  onComplete: (missionId: string, usedFocusCycle: boolean) => Promise<void>
  onSkip: (missionId: string) => Promise<void>
}

export function MissionCard({ mission, status, onComplete, onSkip }: MissionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  const borderColor = missionTypeBorderColors[mission.type] ?? "border-l-gray-500"
  const typeVariant = missionTypeVariants[mission.type] ?? "outline"

  const handleComplete = async (usedFocusCycle: boolean) => {
    setLoading(true)
    try { await onComplete(mission.id, usedFocusCycle) } finally { setLoading(false) }
  }
  const handleSkip = async () => {
    setLoading(true)
    try { await onSkip(mission.id) } finally { setLoading(false) }
  }

  const isCompleted = status === "COMPLETED"
  const isSkipped = status === "SKIPPED"

  return (
    <div className={cn(
      "rounded-lg border border-[#1e2d3d] bg-[#0d1520] border-l-4 overflow-hidden transition-all",
      borderColor,
      (isCompleted || isSkipped) && "opacity-70"
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant={typeVariant} className="capitalize">{mission.type.replace("-", " ")}</Badge>
              <div className="flex items-center gap-1 text-xs text-[#94a3b8]">
                <Clock className="h-3 w-3" />
                {mission.durationMinutes}m
              </div>
              {isCompleted && <CheckCircle className="h-4 w-4 text-green-400" />}
              {isSkipped && <span className="text-xs text-[#94a3b8]">Skipped</span>}
            </div>
            <h4 className="font-medium text-[#e2e8f0] text-sm">{mission.title}</h4>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-[#94a3b8] hover:text-[#e2e8f0] mt-1">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-[#94a3b8]">{mission.description}</p>
            {!isCompleted && !isSkipped && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleComplete(false)} disabled={loading}>Complete Mission</Button>
                <Button size="sm" variant="secondary" onClick={() => handleComplete(true)} disabled={loading}>
                  Complete with Focus Cycle
                </Button>
                <Button size="sm" variant="ghost" onClick={handleSkip} disabled={loading}>
                  <SkipForward className="h-3 w-3 mr-1" />
                  Skip
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
