"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FleetCard } from "./fleet-card"
import { CreateFleetForm } from "./create-fleet-form"
import { FleetLeaderboard } from "./fleet-leaderboard"
import { toast } from "@/hooks/use-toast"

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

interface ActiveBattle {
  id: string
  entityName: string
  entityIcon: string
  entityHpRemaining: number
  entityMaxHp: number
  participantCount: number
  isParticipant: boolean
}

interface FleetPageClientProps {
  fleet: FleetData | null
  fleetId: string | null
  members: Member[]
  myRole: string | null
  userId: string
  activeBattles: ActiveBattle[]
}

export function FleetPageClient({ fleet, fleetId, members, myRole, userId, activeBattles }: FleetPageClientProps) {
  const router = useRouter()
  const [searchQ, setSearchQ] = useState("")
  const [searchResults, setSearchResults] = useState<Array<FleetData & { id: string }>>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [transferTarget, setTransferTarget] = useState<Member | null>(null)

  const handleSearch = async () => {
    if (!searchQ.trim() || searching) return
    setSearching(true)
    try {
      const res = await fetch(`/api/combat/fleets/search?q=${encodeURIComponent(searchQ)}`)
      const data = await res.json().catch(() => ({})) as { fleets?: Array<FleetData & { id: string }> }
      setSearchResults(data.fleets ?? [])
      setSearched(true)
    } catch {
      toast({ title: "Search failed", description: "Could not reach the fleet registry.", variant: "destructive" })
    } finally {
      setSearching(false)
    }
  }

  const handleJoin = async (tag: string) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/combat/fleets/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag }),
      })
      const data = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) {
        toast({ title: "Could not join fleet", description: data.error ?? "Something went wrong.", variant: "destructive" })
        return
      }
      toast({ title: "Joined fleet", description: `Welcome to [${tag}]!`, variant: "success" })
      router.refresh()
    } catch {
      toast({ title: "Connection error", description: "Could not reach the fleet registry.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/combat/fleets/leave", { method: "POST" })
      const data = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) {
        toast({ title: "Could not leave fleet", description: data.error ?? "Something went wrong.", variant: "destructive" })
        return
      }
      router.refresh()
    } catch {
      toast({ title: "Connection error", description: "Could not reach the fleet registry.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleRole = async (targetUserId: string, role: "officer" | "pilot") => {
    if (loading || !fleetId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/combat/fleets/${fleetId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, role }),
      })
      const data = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) {
        toast({ title: "Could not update role", description: data.error ?? "Something went wrong.", variant: "destructive" })
        return
      }
      toast({ title: role === "officer" ? "Promoted to officer" : "Demoted to pilot", variant: "success" })
      router.refresh()
    } catch {
      toast({ title: "Connection error", description: "Could not update the role.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = async () => {
    if (loading || !fleetId || !transferTarget) return
    setLoading(true)
    try {
      const res = await fetch(`/api/combat/fleets/${fleetId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: transferTarget.user.id }),
      })
      const data = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) {
        toast({ title: "Could not transfer captaincy", description: data.error ?? "Something went wrong.", variant: "destructive" })
        return
      }
      toast({ title: "Captaincy transferred", description: `${transferTarget.user.name ?? "A pilot"} now commands the fleet.`, variant: "success" })
      setTransferTarget(null)
      router.refresh()
    } catch {
      toast({ title: "Connection error", description: "Could not transfer captaincy.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleBattle = async (battleId: string, isParticipant: boolean) => {
    if (isParticipant) {
      router.push(`/combat/${battleId}`)
      return
    }
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/combat/battles/${battleId}/join`, { method: "POST" })
      const data = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) {
        toast({ title: "Could not join battle", description: data.error ?? "Something went wrong.", variant: "destructive" })
        setLoading(false)
        return
      }
      router.push(`/combat/${battleId}`)
    } catch {
      toast({ title: "Connection error", description: "Could not join the battle.", variant: "destructive" })
      setLoading(false)
    }
  }

  if (fleet) {
    const isCaptain = myRole === "captain"
    return (
      <div className="space-y-6">
        <FleetCard fleet={fleet} memberCount={members.length} />

        {activeBattles.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-[#94a3b8] mb-3">Active Fleet Battles</h2>
            <div className="space-y-2">
              {activeBattles.map((b) => {
                const pct = Math.max(0, Math.min(100, b.entityMaxHp > 0 ? (b.entityHpRemaining / b.entityMaxHp) * 100 : 0))
                return (
                  <div key={b.id} className="rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl shrink-0" aria-hidden="true">{b.entityIcon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#e2e8f0] truncate">{b.entityName}</p>
                        <p className="text-xs text-[#94a3b8]">{b.participantCount} {b.participantCount === 1 ? "pilot" : "pilots"} engaged</p>
                      </div>
                      <Button size="sm" onClick={() => handleBattle(b.id, b.isParticipant)} disabled={loading}>
                        {b.isParticipant ? "Enter" : "Join Battle"}
                      </Button>
                    </div>
                    <div className="mt-2 h-2 bg-[#1e2d3d] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#ef4444] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-medium text-[#94a3b8] mb-3">Pilots ({members.length})</h2>
          <div className="space-y-2">
            {members.map((m) => {
              const isMe = m.user.id === userId
              const canManage = isCaptain && !isMe && m.member.role !== "captain"
              return (
                <div key={m.member.id} className="flex items-center gap-3 rounded-xl border border-[#1e2d3d] bg-[#0d1520] p-3">
                  <div className="h-8 w-8 rounded-full bg-[#06B6D4]/10 flex items-center justify-center text-[#06B6D4] text-sm font-bold shrink-0">
                    {m.user.name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e2e8f0] truncate">
                      {m.user.name ?? "Unknown Pilot"}
                      {isMe && <span className="text-xs text-[#94a3b8] ml-1">(you)</span>}
                    </p>
                    <p className="text-xs text-[#94a3b8]">Rank {m.user.rank} · {m.user.totalXp.toLocaleString()} XP</p>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2 shrink-0">
                      {m.member.role === "pilot" ? (
                        <Button size="sm" variant="outline" onClick={() => handleRole(m.user.id, "officer")} disabled={loading}>Promote</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleRole(m.user.id, "pilot")} disabled={loading}>Demote</Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setTransferTarget(m)} disabled={loading}>Make Captain</Button>
                    </div>
                  )}
                  <span className="text-xs capitalize px-2 py-0.5 rounded bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 shrink-0">
                    {m.member.role}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {!isCaptain && (
          <Button
            variant="outline"
            onClick={handleLeave}
            disabled={loading}
            className="text-red-400 border-red-400/30 hover:bg-red-400/10"
          >
            Leave Fleet
          </Button>
        )}
        {isCaptain && members.length === 1 && (
          <Button
            variant="outline"
            onClick={handleLeave}
            disabled={loading}
            className="text-red-400 border-red-400/30 hover:bg-red-400/10"
          >
            Disband Fleet
          </Button>
        )}
        {isCaptain && members.length > 1 && (
          <p className="text-xs text-[#94a3b8]">Use “Make Captain” to hand over command — once you&apos;re no longer captain you can leave the fleet.</p>
        )}

        <FleetLeaderboard myTag={fleet.tag} />

        <Dialog open={!!transferTarget} onOpenChange={(open) => !open && setTransferTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer captaincy?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-[#94a3b8]">
                {transferTarget?.user.name ?? "This pilot"} will become the fleet captain and you will
                step down to officer. This can&apos;t be undone unless the new captain hands it back.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setTransferTarget(null)} disabled={loading}>Cancel</Button>
                <Button onClick={handleTransfer} disabled={loading}>{loading ? "Transferring…" : "Confirm"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
    <div className="space-y-6">
      <p className="text-[#94a3b8] text-sm">You are not in a fleet. Search for one to join or create your own.</p>
      <div className="flex gap-2">
        <Input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search by name or tag..."
          className="max-w-xs"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button variant="outline" onClick={handleSearch} disabled={searching || !searchQ.trim()}>
          {searching ? "Searching…" : "Search"}
        </Button>
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
      {searched && !searching && searchResults.length === 0 && (
        <p className="text-[#94a3b8] text-sm">No fleets match “{searchQ}”. Try a different name or tag, or create your own.</p>
      )}
      <Button onClick={() => setShowCreate(true)}>Create Fleet</Button>

      <FleetLeaderboard />
    </div>
  )
}
