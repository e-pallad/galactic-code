import Link from "next/link"
import { Flame } from "lucide-react"
import { getRankProgress } from "@/lib/xp"

export interface PilotRow {
  id: string
  name: string | null
  avatarUrl: string | null
  totalXp: number
  rank: number
  streak: number
  track: string
}

interface PilotListProps {
  pilots: PilotRow[]
  page: number
  pageSize: number
  hasNext: boolean
  baseHref: string
  currentUserId?: string
  emptyHint?: string
}

export function PilotList({ pilots, page, pageSize, hasNext, baseHref, currentUserId, emptyHint }: PilotListProps) {
  return (
    <>
      {pilots.length === 0 ? (
        <div className="text-center py-16 text-[#94a3b8]">
          <p className="text-4xl mb-4">🏆</p>
          <p className="font-medium text-[#e2e8f0]">No pilots on the board yet</p>
          {emptyHint && <p className="text-sm mt-1">{emptyHint}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {pilots.map((pilot, i) => {
            const rankData = getRankProgress(pilot.totalXp)
            const isMe = currentUserId !== undefined && pilot.id === currentUserId
            const globalRank = (page - 1) * pageSize + i + 1
            return (
              <div
                key={pilot.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  isMe ? "border-[#06B6D4]/50 bg-[#06B6D4]/5" : "border-[#1e2d3d] bg-[#0d1520]"
                }`}
              >
                <span className={`w-8 text-center font-bold font-heading text-lg ${
                  globalRank === 1 ? "text-yellow-400" : globalRank === 2 ? "text-gray-300" : globalRank === 3 ? "text-amber-600" : "text-[#94a3b8]"
                }`}>
                  {globalRank}
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#6366F1] flex items-center justify-center text-sm font-bold text-white">
                  {(pilot.name ?? "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#e2e8f0] truncate">{pilot.name ?? "Anonymous Pilot"} {isMe && <span className="text-xs text-[#06B6D4]">(You)</span>}</p>
                  <p className="text-xs text-[#94a3b8]">{rankData.label} · {pilot.track}</p>
                </div>
                {pilot.streak > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span className="text-orange-400">{pilot.streak}</span>
                  </div>
                )}
                <div className="text-right">
                  <p className="font-bold text-[#06B6D4]">{pilot.totalXp.toLocaleString()}</p>
                  <p className="text-xs text-[#94a3b8]">XP</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(page > 1 || hasNext) && (
        <div className="flex items-center justify-between pt-2">
          {page > 1 ? (
            <Link
              href={`${baseHref}?page=${page - 1}`}
              className="px-4 py-2 rounded-md border border-[#1e2d3d] bg-[#0d1520] text-sm text-[#e2e8f0] hover:border-[#06B6D4]/40 transition-colors"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-[#94a3b8]">Page {page}</span>
          {hasNext ? (
            <Link
              href={`${baseHref}?page=${page + 1}`}
              className="px-4 py-2 rounded-md border border-[#1e2d3d] bg-[#0d1520] text-sm text-[#e2e8f0] hover:border-[#06B6D4]/40 transition-colors"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </>
  )
}
