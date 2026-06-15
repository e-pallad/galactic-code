export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/missions"
import { db } from "@/lib/db"
import { operations, starSystems } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { OperationsClient } from "@/components/operations/operations-client"

export const metadata = { title: "Operations" }

export default async function OperationsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const [userOps, systems] = await Promise.all([
    db.select().from(operations).where(eq(operations.userId, user.id)),
    db.select().from(starSystems).where(eq(starSystems.trackId, user.track)),
  ])

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Operations</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Capstone projects that prove your skills in the field</p>
      </div>
      <OperationsClient operations={userOps} systems={systems} userId={user.id} />
    </div>
  )
}
