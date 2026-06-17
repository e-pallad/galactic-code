"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BattleLogFeed } from "./battle-log-feed"
import { LootRevealModal } from "./loot-reveal-modal"
import Link from "next/link"

interface Entity {
  id: string
  name: string
  icon: string
  hp: number
  creditReward: number
  xpReward: number
}

interface Battle {
  id: string
  status: string
  entityHpRemaining: number
}

interface Participant {
  id: string
  pilotHpRemaining: number
  hasFled: boolean
  totalDamageDealt: number
}

interface LogEntry {
  id: string
  actorUserId: string | null
  damageDealt: number
  isCritical: boolean
  description: string
  turnNumber: number
}

interface LootItem {
  id: string
  name: string
  icon: string
  rarity: string
}

interface BattleArenaClientProps {
  battle: Battle
  entity: Entity
  participant: Participant
  logs: LogEntry[]
  userId: string
  userName: string
}

function HpBar({ current, max, label, color }: { current: number; max: number; label: string; color: string }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (current / max) * 100 : 0))
  return (
    <div>
      <div className="flex justify-between text-xs text-[#94a3b8] mb-1">
        <span>{label}</span>
        <span className="font-mono">{Math.max(0, current)} / {max}</span>
      </div>
      <div className="h-3 bg-[#1e2d3d] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function BattleArenaClient({
  battle: initialBattle,
  entity,
  participant: initialParticipant,
  logs: initialLogs,
  userId,
  userName,
}: BattleArenaClientProps) {
  const router = useRouter()
  const [battle, setBattle] = useState(initialBattle)
  const [participant, setParticipant] = useState(initialParticipant)
  const [logs, setLogs] = useState(initialLogs)
  const [loading, setLoading] = useState(false)
  const [lootModal, setLootModal] = useState<{ lootItems: LootItem[]; creditsEarned: number; xpEarned: number } | null>(null)
  const [pilotMaxHp] = useState(initialParticipant.pilotHpRemaining)

  const handleAttack = async () => {
    if (loading || battle.status !== "active") return
    setLoading(true)
    const res = await fetch(`/api/combat/battles/${battle.id}/attack`, { method: "POST" })
    const data = await res.json() as {
      newEntityHp?: number
      newPilotHp?: number
      battleStatus?: string
      lootItems?: LootItem[]
      creditsAwarded?: number
      xpAwarded?: number
    }
    if (res.ok) {
      if (data.newEntityHp !== undefined) setBattle((b) => ({ ...b, entityHpRemaining: data.newEntityHp! }))
      if (data.newPilotHp !== undefined) setParticipant((p) => ({ ...p, pilotHpRemaining: data.newPilotHp! }))
      if (data.battleStatus) setBattle((b) => ({ ...b, status: data.battleStatus! }))
      const logRes = await fetch(`/api/combat/battles/${battle.id}/log`)
      const logData = await logRes.json() as { logs?: LogEntry[] }
      if (logData.logs) setLogs(logData.logs)
      if (data.battleStatus === "victory") {
        setLootModal({ lootItems: data.lootItems ?? [], creditsEarned: data.creditsAwarded ?? 0, xpEarned: data.xpAwarded ?? 0 })
      }
    }
    setLoading(false)
  }

  const handleFlee = async () => {
    if (loading) return
    setLoading(true)
    await fetch(`/api/combat/battles/${battle.id}/flee`, { method: "POST" })
    setLoading(false)
    router.push("/combat")
  }

  const isOver = battle.status !== "active"

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/combat" className="text-[#94a3b8] text-sm hover:text-[#06B6D4]">← Back to Arena</Link>
        <span className={`text-xs px-2 py-1 rounded font-medium ${
          battle.status === "active" ? "bg-green-500/10 text-green-400" :
          battle.status === "victory" ? "bg-[#f59e0b]/10 text-[#f59e0b]" :
          "bg-red-500/10 text-red-400"
        }`}>
          {battle.status.toUpperCase()}
        </span>
      </div>

      <div className="rounded-xl border border-[#1e2d3d] bg-[#0d1520] p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{entity.icon}</span>
          <h2 className="font-heading text-xl font-bold text-[#e2e8f0]">{entity.name}</h2>
        </div>
        <HpBar current={battle.entityHpRemaining} max={entity.hp} label="Entity HP" color="#ef4444" />
        <HpBar current={participant.pilotHpRemaining} max={pilotMaxHp} label={`${userName} HP`} color="#06B6D4" />
      </div>

      <BattleLogFeed logs={logs} currentUserId={userId} />

      {battle.status === "active" && !participant.hasFled && participant.pilotHpRemaining > 0 && (
        <div className="flex gap-3">
          <Button className="flex-1" onClick={handleAttack} disabled={loading}>
            {loading ? "Processing..." : "⚔️ Attack"}
          </Button>
          <Button variant="outline" onClick={handleFlee} disabled={loading}>Flee</Button>
        </div>
      )}

      {isOver && battle.status !== "victory" && (
        <div className="text-center space-y-3">
          <p className="text-[#94a3b8]">
            {battle.status === "defeat" ? "Your ship was destroyed." : "You fled the battle."}
          </p>
          <Link href="/combat"><Button variant="outline">Return to Arena</Button></Link>
        </div>
      )}

      {lootModal && (
        <LootRevealModal
          open={true}
          onClose={() => { setLootModal(null); router.push("/combat") }}
          lootItems={lootModal.lootItems}
          creditsEarned={lootModal.creditsEarned}
          xpEarned={lootModal.xpEarned}
          entityName={entity.name}
        />
      )}
    </div>
  )
}
