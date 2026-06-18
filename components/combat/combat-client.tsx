"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EntityCard } from "./entity-card"
import { toast } from "@/hooks/use-toast"

interface Entity {
  id: string
  name: string
  icon: string
  rarity: string
  hp: number
  atk: number
  def: number
  spd: number
  creditReward: number
  xpReward: number
  requiresFleet: boolean
  description: string
}

export function CombatClient({ entities, inFleet }: { entities: Entity[]; inFleet: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleEngage = async (entityId: string) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/combat/battles/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId }),
      })
      const data = await res.json().catch(() => ({})) as { battleId?: string; error?: string }
      if (!res.ok || !data.battleId) {
        toast({ title: "Could not engage", description: data.error ?? "Something went wrong.", variant: "destructive" })
        setLoading(false)
        return
      }
      router.push(`/combat/${data.battleId}`)
    } catch {
      toast({ title: "Connection error", description: "Could not reach the arena.", variant: "destructive" })
      setLoading(false)
    }
    // On success we navigate away, so loading intentionally stays true to keep
    // the buttons disabled until the route transition completes.
  }

  const soloEntities = entities.filter((e) => !e.requiresFleet)
  const fleetEntities = entities.filter((e) => e.requiresFleet)

  return (
    <Tabs defaultValue="solo">
      <TabsList className="bg-[#0d1520] border border-[#1e2d3d]">
        <TabsTrigger value="solo">Solo ({soloEntities.length})</TabsTrigger>
        <TabsTrigger value="fleet">Fleet Bosses ({fleetEntities.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="solo" className="mt-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {soloEntities.map((e) => (
            <EntityCard key={e.id} entity={e} onEngage={() => handleEngage(e.id)} loading={loading} inFleet={inFleet} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="fleet" className="mt-4">
        {!inFleet && (
          <p className="text-[#94a3b8] text-sm mb-4">Join or create a fleet to engage bosses.</p>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          {fleetEntities.map((e) => (
            <EntityCard key={e.id} entity={e} onEngage={() => handleEngage(e.id)} loading={loading} inFleet={inFleet} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
