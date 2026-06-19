export const dynamic = "force-dynamic"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Combat Arena",
  description: "Choose a Void Entity and engage in turn-based space combat to earn Credits, XP, and rare loot drops.",
}

import { getClerkId } from "@/lib/auth"
import { getUser } from "@/lib/missions"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { entities, fleetMembers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { CombatClient } from "@/components/combat/combat-client"
import { Swords } from "lucide-react"

export default async function CombatPage() {
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/")
  const user = await getUser(clerkId)
  if (!user) redirect("/")

  const allEntities = await db.select().from(entities)
  const [membership] = await db.select().from(fleetMembers).where(eq(fleetMembers.userId, user.id)).limit(1)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Swords className="h-6 w-6 text-[#06B6D4]" />
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Combat Arena</h1>
          <p className="text-[#94a3b8] text-sm">Engage Void Entities to earn Credits and loot</p>
        </div>
      </div>
      <CombatClient entities={allEntities} inFleet={!!membership} />
    </div>
  )
}
