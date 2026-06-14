import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/missions"
import { db } from "@/lib/db"
import { medals } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { PilotSheet } from "@/components/character/pilot-sheet"
import { MedalGrid } from "@/components/character/medal-grid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = { title: "Character" }

export default async function CharacterPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const userMedals = await db.select().from(medals).where(eq(medals.userId, user.id))

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Pilot Dossier</h1>
      <PilotSheet user={user} />
      <Card>
        <CardHeader>
          <CardTitle>Medals & Commendations</CardTitle>
        </CardHeader>
        <CardContent>
          <MedalGrid earnedMedals={userMedals} showAll={true} />
        </CardContent>
      </Card>
    </div>
  )
}
