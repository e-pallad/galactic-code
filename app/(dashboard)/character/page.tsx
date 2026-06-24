export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { db } from "@/lib/db"
import { medals } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { PilotSheet } from "@/components/character/pilot-sheet"
import { MedalGrid } from "@/components/character/medal-grid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShareRankButton } from "@/components/gamification/share-rank-button"
import { ReferralWidget } from "@/components/gamification/referral-widget"
import { getRankProgress } from "@/lib/xp"

export const metadata = { title: "Character" }

export default async function CharacterPage() {
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const userMedals = await db.select().from(medals).where(eq(medals.userId, user.id))
  const rankInfo = getRankProgress(user.totalXp)

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Pilot Dossier</h1>
        <ShareRankButton
          rank={user.rank}
          rankLabel={rankInfo.label}
          totalXp={user.totalXp}
          name={user.name}
          appUrl={process.env.NEXT_PUBLIC_APP_URL}
        />
      </div>
      <PilotSheet user={user} />
      <Card>
        <CardHeader>
          <CardTitle>Medals & Commendations</CardTitle>
        </CardHeader>
        <CardContent>
          <MedalGrid earnedMedals={userMedals} showAll={true} />
        </CardContent>
      </Card>
      <ReferralWidget />
    </div>
  )
}
