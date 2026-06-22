import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Lock, CheckCircle2 } from "lucide-react"
import type { StarSystem } from "@/lib/db/schema"

interface StarSystemCardProps {
  system: StarSystem
  progress: number // 0-100
  totalMissions: number
  completedMissions: number
  operationStatus?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
  isLocked?: boolean
  /** Highlights the first unlocked, not-yet-finished system as the next thing to do. */
  isCurrent?: boolean
  /** Number of the system that must be finished to unlock this one. */
  unlockAfterSystem?: number
}

export function StarSystemCard({
  system,
  progress,
  totalMissions,
  completedMissions,
  operationStatus,
  isLocked,
  isCurrent,
  unlockAfterSystem,
}: StarSystemCardProps) {
  const isComplete = totalMissions > 0 && completedMissions >= totalMissions

  const content = (
    <div
      className={`relative h-full p-5 rounded-xl border transition-all ${
        isLocked
          ? "border-[#1e2d3d] bg-[#080C14] opacity-70"
          : isCurrent
            ? "border-[#06B6D4]/60 bg-[#0d1520] ring-1 ring-[#06B6D4]/30 hover:border-[#06B6D4] cursor-pointer"
            : "border-[#1e2d3d] bg-[#0d1520] hover:border-[#06B6D4]/40 cursor-pointer"
      }`}
    >
      {isCurrent && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-[#06B6D4] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#080C14]">
          Continue here
        </span>
      )}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium text-[#06B6D4] uppercase tracking-wide">System {system.number}</span>
            {isComplete && <Badge variant="success">Complete</Badge>}
            {!isComplete && operationStatus === "COMPLETED" && <Badge variant="success">Operation Complete</Badge>}
            {operationStatus === "IN_PROGRESS" && <Badge variant="secondary">Op In Progress</Badge>}
          </div>
          <h3 className="font-heading font-semibold text-[#e2e8f0]">{system.title}</h3>
        </div>
        {isLocked ? (
          <Lock className="h-4 w-4 text-[#94a3b8] mt-1 shrink-0" />
        ) : isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-[#10B981] mt-1 shrink-0" />
        ) : (
          <ArrowRight className="h-4 w-4 text-[#94a3b8] mt-1 shrink-0" />
        )}
      </div>
      <p className="text-sm text-[#94a3b8] mb-4 line-clamp-2">{system.description}</p>
      {isLocked ? (
        <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
          <Lock className="h-3 w-3" />
          {unlockAfterSystem
            ? `Finish System ${unlockAfterSystem} to unlock`
            : "Complete the previous system to unlock"}
        </div>
      ) : (
        <div>
          <div className="flex justify-between text-xs text-[#94a3b8] mb-1.5">
            <span>{completedMissions} / {totalMissions} missions</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}
    </div>
  )

  if (isLocked) {
    return <div aria-label={`${system.title} (locked)`}>{content}</div>
  }
  return (
    <Link
      href={`/academy/${system.id}`}
      aria-label={`System ${system.number}: ${system.title}, ${progress}% complete`}
      className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
    >
      {content}
    </Link>
  )
}
