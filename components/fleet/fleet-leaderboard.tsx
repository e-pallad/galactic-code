"use client"

import { useEffect, useState } from "react"
import { Trophy } from "lucide-react"

interface LeaderboardFleet {
  id: string
  name: string
  tag: string
  emblem: string
  totalXp: number
  memberCount: number
}

export function FleetLeaderboard({ myTag }: { myTag?: string | null }) {
  const [fleets, setFleets] = useState<LeaderboardFleet[] | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/combat/fleets/leaderboard")
      .then((r) => (r.ok ? r.json() : { fleets: [] }))
      .then((d: { fleets?: LeaderboardFleet[] }) => {
        if (active) setFleets(d.fleets ?? [])
      })
      .catch(() => {
        if (active) setFleets([])
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <h2 className="flex items-center gap-2 text-sm font-medium text-[#94a3b8] mb-3">
        <Trophy className="h-4 w-4 text-[#06B6D4]" /> Top Fleets
      </h2>
      {fleets === null ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-[#0d1520]" />
          ))}
        </div>
      ) : fleets.length === 0 ? (
        <p className="text-[#94a3b8] text-sm">No fleets yet. Be the first to form one!</p>
      ) : (
        <div className="space-y-2">
          {fleets.map((f, i) => {
            const isMine = !!myTag && f.tag === myTag
            return (
              <div
                key={f.id}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  isMine ? "border-[#06B6D4]/50 bg-[#06B6D4]/5" : "border-[#1e2d3d] bg-[#0d1520]"
                }`}
              >
                <span className={`w-6 text-center font-bold font-heading ${
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-[#94a3b8]"
                }`}>
                  {i + 1}
                </span>
                <span className="text-2xl shrink-0" aria-hidden="true">{f.emblem}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#e2e8f0] truncate">
                    {f.name} <span className="text-xs text-[#06B6D4] font-mono">[{f.tag}]</span>
                    {isMine && <span className="text-xs text-[#06B6D4] ml-1">(yours)</span>}
                  </p>
                  <p className="text-xs text-[#94a3b8]">{f.memberCount} {f.memberCount === 1 ? "pilot" : "pilots"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#06B6D4] text-sm">{f.totalXp.toLocaleString()}</p>
                  <p className="text-xs text-[#94a3b8]">XP</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
