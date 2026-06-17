"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FleetCard } from "./fleet-card"
import { CreateFleetForm } from "./create-fleet-form"

interface Member {
  member: { id: string; role: string }
  user: { id: string; name: string | null; avatarUrl: string | null; rank: number; totalXp: number }
}

interface FleetData {
  name: string
  tag: string
  emblem: string
  totalXp: number
}

interface FleetPageClientProps {
  fleet: FleetData | null
  members: Member[]
  myRole: string | null
  userId: string
}

export function FleetPageClient({ fleet, members, myRole, userId }: FleetPageClientProps) {
  const router = useRouter()
  const [searchQ, setSearchQ] = useState("")
  const [searchResults, setSearchResults] = useState<Array<FleetData & { id: string }>>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const handleSearch = async () => {
    if (!searchQ.trim()) return
    const res = await fetch(`/api/combat/fleets/search?q=${encodeURIComponent(searchQ)}`)
    const data = await res.json() as { fleets?: Array<FleetData & { id: string }> }
    setSearchResults(data.fleets ?? [])
  }

  const handleJoin = async (tag: string) => {
    setLoading(true)
    await fetch("/api/combat/fleets/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    })
    setLoading(false)
    router.refresh()
  }

  const handleLeave = async () => {
    setLoading(true)
    await fetch("/api/combat/fleets/leave", { method: "POST" })
    setLoading(false)
    router.refresh()
  }

  if (fleet) {
    return (
      <div className="space-y-5">
        <FleetCard fleet={fleet} memberCount={members.length} />
        <div>
          <h2 className="text-sm font-medium text-[#94a3b8] mb-3">Pilots ({members.length})</h2>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.member.id} className="flex items-center gap-3 rounded-xl border border-[#1e2d3d] bg-[#0d1520] p-3">
                <div className="h-8 w-8 rounded-full bg-[#06B6D4]/10 flex items-center justify-center text-[#06B6D4] text-sm font-bold shrink-0">
                  {m.user.name?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#e2e8f0] truncate">
                    {m.user.name ?? "Unknown Pilot"}
                    {m.user.id === userId && <span className="text-xs text-[#94a3b8] ml-1">(you)</span>}
                  </p>
                  <p className="text-xs text-[#94a3b8]">Rank {m.user.rank} · {m.user.totalXp.toLocaleString()} XP</p>
                </div>
                <span className="text-xs capitalize px-2 py-0.5 rounded bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 shrink-0">
                  {m.member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
        {myRole !== "captain" && (
          <Button
            variant="outline"
            onClick={handleLeave}
            disabled={loading}
            className="text-red-400 border-red-400/30 hover:bg-red-400/10"
          >
            Leave Fleet
          </Button>
        )}
        {myRole === "captain" && members.length === 1 && (
          <Button
            variant="outline"
            onClick={handleLeave}
            disabled={loading}
            className="text-red-400 border-red-400/30 hover:bg-red-400/10"
          >
            Disband Fleet
          </Button>
        )}
      </div>
    )
  }

  if (showCreate) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold text-[#e2e8f0]">Create Fleet</h2>
          <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Back</Button>
        </div>
        <CreateFleetForm onCreated={() => router.refresh()} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-[#94a3b8] text-sm">You are not in a fleet. Search for one to join or create your own.</p>
      <div className="flex gap-2">
        <Input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search by name or tag..."
          className="max-w-xs"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button variant="outline" onClick={handleSearch}>Search</Button>
      </div>
      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((f) => (
            <div key={f.id} className="flex items-center gap-3">
              <div className="flex-1"><FleetCard fleet={f} /></div>
              <Button size="sm" onClick={() => handleJoin(f.tag)} disabled={loading}>Join</Button>
            </div>
          ))}
        </div>
      )}
      <Button onClick={() => setShowCreate(true)}>Create Fleet</Button>
    </div>
  )
}
