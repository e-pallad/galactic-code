export const dynamic = "force-dynamic"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fleet",
  description: "Join or create a fleet to team up with other pilots and take on boss-tier Void Entities together.",
}

import { getClerkId } from "@/lib/auth"
import { getUser } from "@/lib/missions"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { fleets, fleetMembers, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { FleetPageClient } from "@/components/fleet/fleet-page-client"
import { Users } from "lucide-react"

export default async function FleetPage() {
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/")
  const user = await getUser(clerkId)
  if (!user) redirect("/")

  const [membership] = await db
    .select()
    .from(fleetMembers)
    .where(eq(fleetMembers.userId, user.id))
    .limit(1)

  let fleet: typeof fleets.$inferSelect | null = null
  let members: { member: typeof fleetMembers.$inferSelect; user: { id: string; name: string | null; avatarUrl: string | null; rank: number; totalXp: number } }[] = []
  let myRole: string | null = null

  if (membership) {
    const fleetRows = await db.select().from(fleets).where(eq(fleets.id, membership.fleetId)).limit(1)
    fleet = fleetRows[0] ?? null
    members = await db
      .select({
        member: fleetMembers,
        user: { id: users.id, name: users.name, avatarUrl: users.avatarUrl, rank: users.rank, totalXp: users.totalXp },
      })
      .from(fleetMembers)
      .innerJoin(users, eq(users.id, fleetMembers.userId))
      .where(eq(fleetMembers.fleetId, membership.fleetId))
    myRole = membership.role
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-[#06B6D4]" />
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Fleet</h1>
          <p className="text-[#94a3b8] text-sm">Unite with other pilots to take on boss entities</p>
        </div>
      </div>
      <FleetPageClient fleet={fleet} members={members} myRole={myRole} userId={user.id} />
    </div>
  )
}
