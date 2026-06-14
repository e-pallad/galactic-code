import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Lock } from "lucide-react"
import type { StarSystem } from "@/lib/db/schema"

interface StarSystemCardProps {
  system: StarSystem
  progress: number // 0-100
  totalMissions: number
  completedMissions: number
  operationStatus?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
  isLocked?: boolean
}

export function StarSystemCard({ system, progress, totalMissions, completedMissions, operationStatus, isLocked }: StarSystemCardProps) {
  const content = (
    <div className={`p-5 rounded-xl border transition-all ${
      isLocked
        ? "border-[#1e2d3d] bg-[#080C14] opacity-60"
        : "border-[#1e2d3d] bg-[#0d1520] hover:border-[#06B6D4]/40 cursor-pointer"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[#06B6D4] uppercase tracking-wide">System {system.number}</span>
            {operationStatus === "COMPLETED" && <Badge variant="success">Operation Complete</Badge>}
            {operationStatus === "IN_PROGRESS" && <Badge variant="secondary">Op In Progress</Badge>}
          </div>
          <h3 className="font-heading font-semibold text-[#e2e8f0]">{system.title}</h3>
        </div>
        {isLocked ? <Lock className="h-4 w-4 text-[#94a3b8] mt-1" /> : <ArrowRight className="h-4 w-4 text-[#94a3b8] mt-1" />}
      </div>
      <p className="text-sm text-[#94a3b8] mb-4 line-clamp-2">{system.description}</p>
      <div>
        <div className="flex justify-between text-xs text-[#94a3b8] mb-1.5">
          <span>{completedMissions} / {totalMissions} missions</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
    </div>
  )

  if (isLocked) return content
  return <Link href={`/academy/${system.id}`}>{content}</Link>
}
